/* ydpen_touch_server.c
 * 有道词典笔极速输入控制服务端
 * 监听 TCP 端口 19999，接收控制端指令，转换为 Linux evdev 物理触摸与按键事件
 *
 * 协议说明（换行分隔的文本指令）：
 *   D <x> <y>             : 按下（逻辑坐标 0..960, 0..266）
 *   M <x> <y>             : 移动（逻辑坐标）
 *   U                     : 抬起
 *   T <x> <y> [dur_ms]    : 点击（逻辑坐标，默认 60ms）
 *   S <x1> <y1> <x2> <y2> [dur_ms] : 滑动手势
 *   K <key_name>          : 按键触发 (power, back, home, volup, voldn)
 *   P                     : Ping 测试，返回 PONG
 *
 * 坐标映射（经 Weston-debug Wayland 协议现场实测校准）：
 *   phys_x = logical_y + 107
 *   phys_y = 959 - logical_x
 *
 * 校验点实测：
 *   UI 坐标 (650, 133) -> 物理 (240, 309) -> Weston 交付 Wayland 客户端精确坐标 (651.3, 239.5)，减去边距 107 为 132.5。误差 < 0.5px。
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <linux/input.h>

#define DEFAULT_PORT 19999
#define TOUCH_DEV "/dev/input/event1"
#define POWER_DEV "/dev/input/event0"
#define APP_OFFSET 107

static int g_touch_fd = -1;
static int g_power_fd = -1;
static int g_tid = 100;
static int g_is_down = 0;

static void emit(int fd, int type, int code, int val) {
    if (fd < 0) return;
    struct input_event ev;
    memset(&ev, 0, sizeof(ev));
    ev.type = type;
    ev.code = code;
    ev.value = val;
    if (write(fd, &ev, sizeof(ev)) < 0) {
        /* ignore write error */
    }
}

static void syn(int fd) {
    emit(fd, EV_SYN, SYN_REPORT, 0);
}

static void to_phys(int lx, int ly, int *px, int *py) {
    *px = ly + APP_OFFSET;
    *py = 959 - lx;
    if (*px < 0) *px = 0;
    if (*px > 480) *px = 480;
    if (*py < 0) *py = 0;
    if (*py > 959) *py = 959;
}

static void do_down(int lx, int ly) {
    int px, py;
    to_phys(lx, ly, &px, &py);
    g_tid++;
    if (g_tid > 60000) g_tid = 100;

    emit(g_touch_fd, EV_ABS, ABS_MT_SLOT, 0);
    emit(g_touch_fd, EV_ABS, ABS_MT_TRACKING_ID, g_tid);
    emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_X, px);
    emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_Y, py);
    emit(g_touch_fd, EV_ABS, ABS_MT_TOUCH_MAJOR, 8);
    emit(g_touch_fd, EV_KEY, BTN_TOUCH, 1);
    syn(g_touch_fd);
    g_is_down = 1;
}

static void do_move(int lx, int ly) {
    if (!g_is_down) {
        do_down(lx, ly);
        return;
    }
    int px, py;
    to_phys(lx, ly, &px, &py);
    emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_X, px);
    emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_Y, py);
    syn(g_touch_fd);
}

static void do_up(void) {
    if (!g_is_down) return;
    emit(g_touch_fd, EV_ABS, ABS_MT_TRACKING_ID, -1);
    emit(g_touch_fd, EV_KEY, BTN_TOUCH, 0);
    syn(g_touch_fd);
    g_is_down = 0;
}

static void do_tap(int lx, int ly, int dur_ms) {
    if (dur_ms <= 0) dur_ms = 60;
    do_down(lx, ly);
    usleep(dur_ms * 1000);
    do_up();
}

static void do_swipe(int lx1, int ly1, int lx2, int ly2, int dur_ms) {
    if (dur_ms < 20) dur_ms = 20;
    int px1, py1, px2, py2;
    to_phys(lx1, ly1, &px1, &py1);
    to_phys(lx2, ly2, &px2, &py2);

    int steps = dur_ms / 10;
    if (steps < 3) steps = 3;
    long step_us = (long)dur_ms * 1000 / steps;

    g_tid++;
    if (g_tid > 60000) g_tid = 100;

    emit(g_touch_fd, EV_ABS, ABS_MT_SLOT, 0);
    emit(g_touch_fd, EV_ABS, ABS_MT_TRACKING_ID, g_tid);
    emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_X, px1);
    emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_Y, py1);
    emit(g_touch_fd, EV_ABS, ABS_MT_TOUCH_MAJOR, 8);
    emit(g_touch_fd, EV_KEY, BTN_TOUCH, 1);
    syn(g_touch_fd);

    for (int i = 1; i <= steps; i++) {
        int cx = px1 + (px2 - px1) * i / steps;
        int cy = py1 + (py2 - py1) * i / steps;
        emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_X, cx);
        emit(g_touch_fd, EV_ABS, ABS_MT_POSITION_Y, cy);
        syn(g_touch_fd);
        usleep(step_us);
    }

    emit(g_touch_fd, EV_ABS, ABS_MT_TRACKING_ID, -1);
    emit(g_touch_fd, EV_KEY, BTN_TOUCH, 0);
    syn(g_touch_fd);
    g_is_down = 0;
}

static void do_key(const char *key) {
    if (strcasecmp(key, "power") == 0) {
        if (g_power_fd >= 0) {
            emit(g_power_fd, EV_KEY, KEY_POWER, 1);
            syn(g_power_fd);
            usleep(60000);
            emit(g_power_fd, EV_KEY, KEY_POWER, 0);
            syn(g_power_fd);
        }
    } else if (strcasecmp(key, "back") == 0) {
        /* 返回手势：从屏幕左边缘向右滑 */
        do_swipe(15, 133, 450, 133, 200);
    } else if (strcasecmp(key, "home") == 0) {
        /* 返回主界面手势：向右长滑 */
        do_swipe(15, 133, 600, 133, 250);
    }
}

static void handle_client(int cfd) {
    char buf[1024];
    int pos = 0;
    while (1) {
        int n = read(cfd, buf + pos, sizeof(buf) - pos - 1);
        if (n <= 0) break;
        pos += n;
        buf[pos] = '\0';

        char *line_start = buf;
        char *nl;
        while ((nl = strchr(line_start, '\n')) != NULL) {
            *nl = '\0';
            char cmd = line_start[0];
            if (cmd == 'P') {
                write(cfd, "PONG\n", 5);
            } else if (cmd == 'D') {
                int x, y;
                if (sscanf(line_start + 1, "%d %d", &x, &y) == 2) {
                    do_down(x, y);
                }
            } else if (cmd == 'M') {
                int x, y;
                if (sscanf(line_start + 1, "%d %d", &x, &y) == 2) {
                    do_move(x, y);
                }
            } else if (cmd == 'U') {
                do_up();
            } else if (cmd == 'T') {
                int x, y, dur = 60;
                int count = sscanf(line_start + 1, "%d %d %d", &x, &y, &dur);
                if (count >= 2) {
                    do_tap(x, y, dur);
                }
            } else if (cmd == 'S') {
                int x1, y1, x2, y2, dur = 250;
                int count = sscanf(line_start + 1, "%d %d %d %d %d", &x1, &y1, &x2, &y2, &dur);
                if (count >= 4) {
                    do_swipe(x1, y1, x2, y2, dur);
                }
            } else if (cmd == 'K') {
                char key[64] = {0};
                if (sscanf(line_start + 1, "%63s", key) == 1) {
                    do_key(key);
                }
            }
            line_start = nl + 1;
        }

        int remain = (buf + pos) - line_start;
        if (remain > 0) {
            memmove(buf, line_start, remain);
        }
        pos = remain;
    }
    do_up();
    close(cfd);
}

int main(int argc, char **argv) {
    int port = DEFAULT_PORT;
    if (argc > 1) port = atoi(argv[1]);

    g_touch_fd = open(TOUCH_DEV, O_RDWR);
    if (g_touch_fd < 0) {
        perror("open touch device");
        return 1;
    }
    g_power_fd = open(POWER_DEV, O_RDWR);

    int sfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sfd < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    setsockopt(sfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in sin;
    memset(&sin, 0, sizeof(sin));
    sin.sin_family = AF_INET;
    sin.sin_addr.s_addr = htonl(INADDR_ANY);
    sin.sin_port = htons(port);

    if (bind(sfd, (struct sockaddr *)&sin, sizeof(sin)) < 0) {
        perror("bind");
        return 1;
    }

    if (listen(sfd, 5) < 0) {
        perror("listen");
        return 1;
    }

    printf("ydpen_touch_server listening on port %d...\n", port);
    fflush(stdout);

    while (1) {
        int cfd = accept(sfd, NULL, NULL);
        if (cfd < 0) {
            if (errno == EINTR) continue;
            break;
        }
        handle_client(cfd);
    }

    close(sfd);
    if (g_touch_fd >= 0) close(g_touch_fd);
    if (g_power_fd >= 0) close(g_power_fd);
    return 0;
}
