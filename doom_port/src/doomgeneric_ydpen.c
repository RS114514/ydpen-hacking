#define _GNU_SOURCE 1
#include <errno.h>
#include <fcntl.h>
#include <linux/input.h>
#include <math.h>
#include <poll.h>
#include <pthread.h>
#include <signal.h>
#include <stdatomic.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>
#include <wayland-client.h>

#include "xdg-shell-client-protocol.h"
#include "doomgeneric.h"
#include "i_sound.h"
#include "i_system.h"
#include "m_argv.h"
#include "g_game.h"
#include "doomstat.h"

extern void G_DoSaveGame(void);

#define DK_RIGHTARROW 0xae
#define DK_LEFTARROW  0xac
#define DK_UPARROW    0xad
#define DK_DOWNARROW  0xaf
#define DK_STRAFE_L   0xa0
#define DK_STRAFE_R   0xa1
#define DK_USE        0xa2
#define DK_FIRE       0xa3
#define DK_ESCAPE     27
#define DK_ENTER      13
#define DK_RSHIFT     (0x80 + 0x36)

#define UI_W 960
#define UI_H 266
#define GAME_X 280
#define GAME_Y 8
#define GAME_W 400
#define GAME_H 250
#define DOOM_SRC_W 320
#define DOOM_SRC_H 200
#define MAX_SLOTS 16
#define KEYQ_SIZE 128
#define TOUCH_X0 107
#define TOUCH_X1 372

enum { LAYOUT_SUBSURFACE = 0, LAYOUT_WINDOW, LAYOUT_FS480 };
enum { ACT_HOLD = 0, ACT_WEAPON, ACT_ESC, ACT_ENTER };
enum { ACCENT_CYAN = 0, ACCENT_GREEN, ACCENT_RED, ACCENT_BLUE, ACCENT_AMBER, ACCENT_GRAY };

typedef struct {
    const char *label;
    const char *sub;
    int x, y, w, h;
    unsigned char key;
    int action;
    int label_scale;
    int accent;
} ui_button;

static ui_button g_buttons[] = {
    { "TURN", "L",   8,   8,   84,  122, DK_LEFTARROW,  ACT_HOLD,   2, ACCENT_CYAN  },
    { "FWD",  NULL,  98,  8,   84,  122, DK_UPARROW,    ACT_HOLD,   3, ACCENT_CYAN  },
    { "TURN", "R",   188, 8,   84,  122, DK_RIGHTARROW, ACT_HOLD,   2, ACCENT_CYAN  },
    { "STRAFE", "L", 8,   136, 84,  122, DK_STRAFE_L,   ACT_HOLD,   2, ACCENT_CYAN  },
    { "BACK", NULL,  98,  136, 84,  122, DK_DOWNARROW,  ACT_HOLD,   3, ACCENT_CYAN  },
    { "STRAFE", "R", 188, 136, 84,  122, DK_STRAFE_R,   ACT_HOLD,   2, ACCENT_CYAN  },
    { "SPEED", NULL, 688, 8,   84,  122, DK_RSHIFT,     ACT_HOLD,   2, ACCENT_BLUE  },
    { "WEAPON", NULL, 778, 8,  84,  122, 0,              ACT_WEAPON, 2, ACCENT_AMBER },
    { "MENU", NULL,  868, 8,   82,  56,  0,              ACT_ESC,    2, ACCENT_GRAY  },
    { "OK",   NULL,  868, 72,  82,  58,  0,              ACT_ENTER,  3, ACCENT_GRAY  },
    { "USE",  NULL,  688, 136, 84,  122, DK_USE,        ACT_HOLD,   3, ACCENT_GREEN },
    { "FIRE", NULL,  778, 136, 174, 122, DK_FIRE,       ACT_HOLD,   4, ACCENT_RED   },
};
#define NUM_BUTTONS ((int)(sizeof(g_buttons) / sizeof(g_buttons[0])))

static const uint8_t g_font[40][7] = {
    { 0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e },
    { 0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e },
    { 0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f },
    { 0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e },
    { 0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02 },
    { 0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e },
    { 0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e },
    { 0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08 },
    { 0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e },
    { 0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c },
    { 0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11 },
    { 0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e },
    { 0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e },
    { 0x1c, 0x12, 0x11, 0x11, 0x11, 0x12, 0x1c },
    { 0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f },
    { 0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10 },
    { 0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0e },
    { 0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11 },
    { 0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e },
    { 0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c },
    { 0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11 },
    { 0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f },
    { 0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11 },
    { 0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11 },
    { 0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e },
    { 0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10 },
    { 0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d },
    { 0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11 },
    { 0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e },
    { 0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04 },
    { 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e },
    { 0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04 },
    { 0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a },
    { 0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11 },
    { 0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04 },
    { 0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f },
    { 0x00, 0x04, 0x00, 0x00, 0x04, 0x00, 0x00 },
    { 0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00 },
    { 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c },
    { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 },
};

struct buffer_state {
    struct wl_buffer *buffer;
    uint32_t *px;
    int w, h;
    int busy;
};

static struct wl_display *g_dpy;
static struct wl_compositor *g_comp;
static struct wl_subcompositor *g_subcomp;
static struct wl_shm *g_shm;
static struct xdg_wm_base *g_wm;
static struct wl_surface *g_main_surface;
static struct xdg_surface *g_main_xdg;
static struct xdg_toplevel *g_main_top;
static struct wl_surface *g_ui_surface;
static struct wl_subsurface *g_ui_sub;
static struct buffer_state g_main_buf;
static struct buffer_state g_ui_buf[2];
static int g_ui_cur;

/* 可选帧转储：DOOM_REC_DIR 存在时把每帧整屏写入 raw，供宣传素材采集 */
static int g_rec_on;
static int g_rec_frame;
static int g_rec_max;
static int g_rec_every = 1;
static int g_rec_skip;
static int g_rec_ts_fd = -1;
static uint32_t g_rec_t0;
static char g_rec_dir[256];

static void rec_init(void) {
    const char *dir = getenv("DOOM_REC_DIR");
    if (!dir || !*dir)
        return;
    snprintf(g_rec_dir, sizeof(g_rec_dir), "%s", dir);
    mkdir(g_rec_dir, 0755);
    g_rec_max = getenv("DOOM_REC_MAX") ? atoi(getenv("DOOM_REC_MAX")) : 600;
    if (getenv("DOOM_REC_EVERY"))
        g_rec_every = atoi(getenv("DOOM_REC_EVERY"));
    if (g_rec_every < 1)
        g_rec_every = 1;
    char p[512];
    snprintf(p, sizeof(p), "%s/times.txt", g_rec_dir);
    g_rec_ts_fd = open(p, O_CREAT | O_WRONLY | O_TRUNC, 0644);
    g_rec_t0 = DG_GetTicksMs();
    g_rec_on = 1;
    fprintf(stderr, "[rec] dir=%s max=%d every=%d\n", g_rec_dir, g_rec_max, g_rec_every);
}

static void rec_frame(struct buffer_state *b) {
    if (!g_rec_on)
        return;
    if (g_rec_skip > 0) {
        g_rec_skip--;
        return;
    }
    g_rec_skip = g_rec_every - 1;
    char p[512];
    snprintf(p, sizeof(p), "%s/f_%05d.raw", g_rec_dir, g_rec_frame++);
    int fd = open(p, O_CREAT | O_WRONLY | O_TRUNC, 0644);
    if (fd >= 0) {
        const char *ptr = (const char *)b->px;
        size_t left = (size_t)b->w * b->h * 4;
        while (left > 0) {
            ssize_t n = write(fd, ptr, left);
            if (n <= 0)
                break;
            ptr += n;
            left -= (size_t)n;
        }
        close(fd);
    }
    if (g_rec_ts_fd >= 0) {
        char line[32];
        int n = snprintf(line, sizeof(line), "%u\n", DG_GetTicksMs() - g_rec_t0);
        if (n > 0)
            (void)!write(g_rec_ts_fd, line, (size_t)n);
    }
    if (g_rec_frame >= g_rec_max) {
        g_rec_on = 0;
        if (g_rec_ts_fd >= 0)
            close(g_rec_ts_fd);
        g_rec_ts_fd = -1;
        fprintf(stderr, "[rec] done %d frames\n", g_rec_frame);
    }
}
static int g_layout = LAYOUT_SUBSURFACE;
static int g_out_w = 960, g_out_h = 480;
static int g_visible_y = 107;
static int g_ui_draw_y;
static int g_configured;
static int g_wl_ready;
static int g_closed;
static volatile sig_atomic_t g_sig_quit;
static atomic_int g_game_started;
static atomic_int g_autosave_request;
static uint32_t g_last_autosave_ms;

#define AUTOSAVE_SLOT 7
#define AUTOSAVE_DESC "AUTOSAVE"
#define AUTOSAVE_INTERVAL_MS 10000

static void autosave_now(void) {
    if (gamestate != GS_LEVEL || demoplayback)
        return;
    G_SaveGame(AUTOSAVE_SLOT, AUTOSAVE_DESC);
    fprintf(stderr, "[save] autosave slot %d queued\n", AUTOSAVE_SLOT);
    fflush(stderr);
}

static void autosave_tick(void) {
    if (gamestate != GS_LEVEL || demoplayback) {
        atomic_store(&g_autosave_request, 0);
        return;
    }
    uint32_t now = DG_GetTicksMs();
    int requested = atomic_exchange(&g_autosave_request, 0);
    if (requested || g_last_autosave_ms == 0 ||
        (uint32_t)(now - g_last_autosave_ms) >= AUTOSAVE_INTERVAL_MS) {
        autosave_now();
        g_last_autosave_ms = now;
    }
}

void DG_AutoSaveOnExit(void) {
    if (gamestate != GS_LEVEL || demoplayback)
        return;
    G_SaveGame(AUTOSAVE_SLOT, AUTOSAVE_DESC);
    G_DoSaveGame();
    fprintf(stderr, "[save] autosave on exit slot %d\n", AUTOSAVE_SLOT);
    fflush(stderr);
}
static atomic_int g_pressed[NUM_BUTTONS];
static atomic_int g_last_ui_x = -1, g_last_ui_y = -1;
static atomic_int g_touch_active;

static int g_keyq[KEYQ_SIZE];
static int g_keyq_head, g_keyq_tail;
static pthread_mutex_t g_keyq_lock = PTHREAD_MUTEX_INITIALIZER;
static int g_keyq_overflow;

static pthread_t g_input_thread;
static atomic_int g_input_stop;
static atomic_int g_home_quit;
static int g_fd_touch = -1, g_fd_adc = -1, g_fd_gpio = -1;
static int g_phys_keys_enabled;
static int g_raw_max_x = 479, g_raw_max_y = 959;
static int g_touch_debug;
static int g_weapon_slot = 2;
static int g_using_mt;
static int g_btn_touch;
static int g_cur_slot;

typedef struct {
    int active;
    int id;
    int x, y;
} touch_slot;
static touch_slot g_slots[MAX_SLOTS];

static uint32_t rgb(int r, int g, int b) {
    return ((uint32_t)(r & 255) << 16) | ((uint32_t)(g & 255) << 8) | (uint32_t)(b & 255);
}

static uint32_t shade(uint32_t c, double f) {
    int r = (int)(((c >> 16) & 255) * f);
    int g = (int)(((c >> 8) & 255) * f);
    int b = (int)((c & 255) * f);
    if (r > 255) r = 255;
    if (g > 255) g = 255;
    if (b > 255) b = 255;
    return rgb(r, g, b);
}

static uint32_t accent_color(int idx) {
    switch (idx) {
    case ACCENT_GREEN: return rgb(64, 255, 140);
    case ACCENT_RED: return rgb(255, 92, 48);
    case ACCENT_BLUE: return rgb(80, 170, 255);
    case ACCENT_AMBER: return rgb(255, 186, 48);
    case ACCENT_GRAY: return rgb(200, 208, 224);
    default: return rgb(64, 224, 255);
    }
}

static inline void put_px(uint32_t *px, int w, int h, int x, int y, uint32_t c) {
    if ((unsigned)x < (unsigned)w && (unsigned)y < (unsigned)h)
        px[(size_t)y * w + x] = c;
}

static void fill_rect(uint32_t *px, int w, int h, int x, int y, int rw, int rh, uint32_t c) {
    if (x < 0) { rw += x; x = 0; }
    if (y < 0) { rh += y; y = 0; }
    if (x + rw > w) rw = w - x;
    if (y + rh > h) rh = h - y;
    if (rw <= 0 || rh <= 0)
        return;
    for (int yy = 0; yy < rh; yy++) {
        uint32_t *row = px + (size_t)(y + yy) * w;
        for (int xx = 0; xx < rw; xx++)
            row[x + xx] = c;
    }
}

static inline uint32_t blend_px(uint32_t dst, uint32_t src, int alpha) {
    if (alpha <= 0) return dst;
    if (alpha >= 255) return src;
    int r = (((src >> 16) & 255) * alpha + ((dst >> 16) & 255) * (255 - alpha)) / 255;
    int g = (((src >> 8) & 255) * alpha + ((dst >> 8) & 255) * (255 - alpha)) / 255;
    int b = ((src & 255) * alpha + (dst & 255) * (255 - alpha)) / 255;
    return rgb(r, g, b);
}

static void blend_rect(uint32_t *px, int w, int h, int x, int y, int rw, int rh,
                       uint32_t c, int alpha) {
    if (x < 0) { rw += x; x = 0; }
    if (y < 0) { rh += y; y = 0; }
    if (x + rw > w) rw = w - x;
    if (y + rh > h) rh = h - y;
    if (rw <= 0 || rh <= 0)
        return;
    for (int yy = 0; yy < rh; yy++) {
        uint32_t *row = px + (size_t)(y + yy) * w;
        for (int xx = 0; xx < rw; xx++)
            row[x + xx] = blend_px(row[x + xx], c, alpha);
    }
}

static void fill_round_rect(uint32_t *px, int w, int h, int x, int y, int rw, int rh,
                            int radius, int alpha, uint32_t c) {
    if (rw <= 0 || rh <= 0)
        return;
    if (radius > rw / 2) radius = rw / 2;
    if (radius > rh / 2) radius = rh / 2;
    for (int yy = 0; yy < rh; yy++) {
        int inset = 0;
        if (yy < radius) {
            int dy = radius - 1 - yy;
            inset = radius - (int)lround(sqrt((double)(radius * radius - dy * dy)));
        } else if (yy >= rh - radius) {
            int dy = yy - (rh - radius);
            inset = radius - (int)lround(sqrt((double)(radius * radius - dy * dy)));
        }
        if (inset < 0) inset = 0;
        if (alpha >= 255)
            fill_rect(px, w, h, x + inset, y + yy, rw - 2 * inset, 1, c);
        else
            blend_rect(px, w, h, x + inset, y + yy, rw - 2 * inset, 1, c, alpha);
    }
}

static void draw_line(uint32_t *px, int w, int h, int x0, int y0, int x1, int y1,
                      int thickness, uint32_t c) {
    int dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    int dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    int err = dx + dy;
    int half = thickness / 2;
    for (;;) {
        fill_rect(px, w, h, x0 - half, y0 - half, thickness, thickness, c);
        if (x0 == x1 && y0 == y1) break;
        int e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}

static void draw_chevron(uint32_t *px, int w, int h, int cx, int cy, int size, int dir,
                         uint32_t c) {
    int t = 4;
    if (dir == 0) { /* up */
        draw_line(px, w, h, cx - size, cy + size, cx, cy - size, t, c);
        draw_line(px, w, h, cx, cy - size, cx + size, cy + size, t, c);
    } else if (dir == 1) { /* down */
        draw_line(px, w, h, cx - size, cy - size, cx, cy + size, t, c);
        draw_line(px, w, h, cx, cy + size, cx + size, cy - size, t, c);
    } else if (dir == 2) { /* left */
        draw_line(px, w, h, cx + size, cy - size, cx - size, cy, t, c);
        draw_line(px, w, h, cx - size, cy, cx + size, cy + size, t, c);
    } else { /* right */
        draw_line(px, w, h, cx - size, cy - size, cx + size, cy, t, c);
        draw_line(px, w, h, cx + size, cy, cx - size, cy + size, t, c);
    }
}

static void draw_crosshair(uint32_t *px, int w, int h, int cx, int cy, int r, uint32_t c) {
    for (int y = -r; y <= r; y++) {
        for (int x = -r; x <= r; x++) {
            int d = x * x + y * y;
            if (d >= (r - 2) * (r - 2) && d <= r * r)
                put_px(px, w, h, cx + x, cy + y, c);
        }
    }
    fill_rect(px, w, h, cx - r - 4, cy - 1, 2 * r + 9, 3, c);
    fill_rect(px, w, h, cx - 1, cy - r - 4, 3, 2 * r + 9, c);
}

static void draw_lightning(uint32_t *px, int w, int h, int cx, int cy, uint32_t c) {
    draw_line(px, w, h, cx + 6, cy - 16, cx - 6, cy + 2, 5, c);
    draw_line(px, w, h, cx - 6, cy + 2, cx + 2, cy + 2, 5, c);
    draw_line(px, w, h, cx + 2, cy + 2, cx - 6, cy + 18, 5, c);
}

static void draw_door(uint32_t *px, int w, int h, int cx, int cy, uint32_t c) {
    fill_rect(px, w, h, cx - 12, cy - 16, 24, 32, c);
    fill_rect(px, w, h, cx - 8, cy - 12, 16, 28, rgb(8, 26, 18));
    fill_rect(px, w, h, cx + 2, cy + 1, 4, 4, c);
}

static void draw_gun(uint32_t *px, int w, int h, int cx, int cy, uint32_t c) {
    fill_rect(px, w, h, cx - 18, cy - 3, 30, 7, c);
    fill_rect(px, w, h, cx - 12, cy + 3, 10, 12, c);
    fill_rect(px, w, h, cx + 12, cy - 1, 8, 4, c);
    fill_rect(px, w, h, cx - 20, cy - 7, 6, 10, c);
}

static int font_index(char ch) {
    if (ch >= '0' && ch <= '9') return ch - '0';
    if (ch >= 'A' && ch <= 'Z') return 10 + (ch - 'A');
    if (ch == ':') return 36;
    if (ch == '-') return 37;
    if (ch == '.') return 38;
    return 39;
}

static void draw_text(uint32_t *px, int w, int h, int x, int y, int scale,
                      const char *s, uint32_t c) {
    for (; *s; s++) {
        int idx = font_index(*s);
        for (int row = 0; row < 7; row++) {
            for (int col = 0; col < 5; col++) {
                if (g_font[idx][row] & (0x10 >> col))
                    fill_rect(px, w, h, x + col * scale, y + row * scale, scale, scale, c);
            }
        }
        x += 6 * scale;
    }
}

static int text_width(const char *s, int scale) {
    return (int)strlen(s) * 6 * scale - scale;
}

static void draw_text_center(uint32_t *px, int w, int h, int cx, int y, int scale,
                             const char *s, uint32_t c) {
    draw_text(px, w, h, cx - text_width(s, scale) / 2, y, scale, s, c);
}

static void draw_panel_base(uint32_t *px, int w, int h, int oy) {
    for (int y = 0; y < UI_H; y++) {
        int t = y * 255 / (UI_H - 1);
        uint32_t c = rgb(10 + t * 8 / 255, 14 + t * 12 / 255, 22 + t * 18 / 255);
        fill_rect(px, w, h, 0, oy + y, UI_W, 1, c);
    }
    for (int y = 0; y < UI_H; y += 4)
        blend_rect(px, w, h, 0, oy + y, UI_W, 1, rgb(0, 0, 0), 55);
    for (int x = 0; x < UI_W; x += 32)
        blend_rect(px, w, h, x, oy, 1, UI_H, rgb(45, 90, 115), 38);
    for (int y = 0; y < UI_H; y += 32)
        blend_rect(px, w, h, 0, oy + y, UI_W, 1, rgb(45, 90, 115), 32);

    for (int i = 0; i < 7; i++) {
        int x = 12 + i * 39;
        int y = 24 + (i * 53) % 190;
        draw_line(px, w, h, x, oy + y, x + 22, oy + y, 1, rgb(25, 62, 78));
        draw_line(px, w, h, x + 22, oy + y, x + 22, oy + y + 18, 1, rgb(25, 62, 78));
        fill_rect(px, w, h, x + 21, oy + y + 17, 3, 3, rgb(40, 110, 130));
        int x2 = 704 + i * 33;
        int y2 = 18 + (i * 71) % 210;
        draw_line(px, w, h, x2, oy + y2, x2 + 18, oy + y2, 1, rgb(25, 62, 78));
        draw_line(px, w, h, x2 + 18, oy + y2, x2 + 18, oy + y2 + 14, 1, rgb(25, 62, 78));
        fill_rect(px, w, h, x2 + 17, oy + y2 + 13, 3, 3, rgb(40, 110, 130));
    }

    fill_rect(px, w, h, 279, oy, 2, UI_H, rgb(92, 62, 22));
    fill_rect(px, w, h, 680, oy, 2, UI_H, rgb(92, 62, 22));
    fill_rect(px, w, h, 279, oy, 1, UI_H, rgb(180, 120, 40));
    fill_rect(px, w, h, 681, oy, 1, UI_H, rgb(180, 120, 40));
}

static void draw_button(uint32_t *px, int w, int h, int oy, int idx) {
    ui_button *b = &g_buttons[idx];
    int pressed = atomic_load(&g_pressed[idx]);
    uint32_t accent = accent_color(b->accent);
    int bx = b->x, by = oy + b->y;
    int alpha = pressed ? 250 : 218;
    uint32_t fill = pressed ? shade(accent, 0.55) : shade(accent, 0.20);
    uint32_t border = pressed ? rgb(255, 255, 255) : accent;

    fill_round_rect(px, w, h, bx, by, b->w, b->h, 12, 255, shade(accent, 0.10));
    fill_round_rect(px, w, h, bx + 3, by + 3, b->w - 6, b->h - 6, 9, alpha, fill);
    fill_round_rect(px, w, h, bx + 3, by + 3, b->w - 6, b->h - 6, 9, 255, border);
    fill_round_rect(px, w, h, bx + 6, by + 6, b->w - 12, b->h - 12, 7, alpha, fill);
    fill_rect(px, w, h, bx + 12, by + 10, b->w - 24, 3, pressed ? rgb(255, 255, 255) : accent);

    uint32_t fg = pressed ? rgb(255, 255, 255) : rgb(232, 240, 252);
    int cx = bx + b->w / 2;
    int icon_y = by + (b->h >= 100 ? 32 : 16);
    if (idx == 0) draw_chevron(px, w, h, cx, icon_y, 12, 2, accent);
    else if (idx == 2) draw_chevron(px, w, h, cx, icon_y, 12, 3, accent);
    else if (idx == 1) draw_chevron(px, w, h, cx, icon_y, 12, 0, accent);
    else if (idx == 4) draw_chevron(px, w, h, cx, icon_y, 12, 1, accent);
    else if (idx == 3) { draw_chevron(px, w, h, cx - 10, icon_y, 10, 2, accent);
                         draw_chevron(px, w, h, cx + 10, icon_y, 10, 2, accent); }
    else if (idx == 5) { draw_chevron(px, w, h, cx - 10, icon_y, 10, 3, accent);
                         draw_chevron(px, w, h, cx + 10, icon_y, 10, 3, accent); }
    else if (idx == 6) draw_lightning(px, w, h, cx, icon_y, accent);
    else if (idx == 7) draw_gun(px, w, h, cx, icon_y, accent);
    else if (idx == 8 || idx == 9) {
        fill_rect(px, w, h, cx - 12, icon_y - 8, 24, 3, accent);
        fill_rect(px, w, h, cx - 12, icon_y - 1, 24, 3, accent);
        fill_rect(px, w, h, cx - 12, icon_y + 6, 24, 3, accent);
    }
    else if (idx == 10) draw_door(px, w, h, cx, icon_y + 2, accent);
    else if (idx == 11) draw_crosshair(px, w, h, cx, icon_y, 13, accent);

    if (b->sub) {
        draw_text_center(px, w, h, cx, by + b->h / 2 - 2, b->label_scale, b->label, fg);
        draw_text_center(px, w, h, cx, by + b->h / 2 + 22, 3, b->sub, accent);
    } else {
        int ly = by + b->h / 2 + (b->h >= 100 ? 8 : 16);
        if (b->label_scale >= 4)
            ly = by + b->h / 2 + 16;
        draw_text_center(px, w, h, cx, ly, b->label_scale, b->label, fg);
    }
}

static void draw_game_border(uint32_t *px, int w, int h, int oy) {
    int x = GAME_X - 2, y = oy + GAME_Y - 2, rw = GAME_W + 4, rh = GAME_H + 4;
    fill_rect(px, w, h, x, y, rw, 2, rgb(255, 186, 48));
    fill_rect(px, w, h, x, y + rh - 2, rw, 2, rgb(255, 186, 48));
    fill_rect(px, w, h, x, y, 2, rh, rgb(255, 186, 48));
    fill_rect(px, w, h, x + rw - 2, y, 2, rh, rgb(255, 186, 48));
    uint32_t c = rgb(255, 220, 120);
    int L = 14;
    fill_rect(px, w, h, x - 2, y - 2, L, 3, c);
    fill_rect(px, w, h, x - 2, y - 2, 3, L, c);
    fill_rect(px, w, h, x + rw - L + 2, y - 2, L, 3, c);
    fill_rect(px, w, h, x + rw + 1, y - 2, 3, L, c);
    fill_rect(px, w, h, x - 2, y + rh - 1, L, 3, c);
    fill_rect(px, w, h, x - 2, y + rh - L + 2, 3, L, c);
    fill_rect(px, w, h, x + rw - L + 2, y + rh - 1, L, 3, c);
    fill_rect(px, w, h, x + rw + 1, y + rh - L + 2, 3, L, c);
}

static void blit_doom(uint32_t *px, int w, int h, int oy) {
    static int xmap[GAME_W], ymap[GAME_H];
    static int init;
    if (!init) {
        for (int i = 0; i < GAME_W; i++) xmap[i] = i * DOOM_SRC_W / GAME_W;
        for (int i = 0; i < GAME_H; i++) ymap[i] = i * DOOM_SRC_H / GAME_H;
        init = 1;
    }
    if (!DG_ScreenBuffer)
        return;
    const uint32_t *src = (const uint32_t *)DG_ScreenBuffer;
    for (int y = 0; y < GAME_H; y++) {
        uint32_t *dst = px + (size_t)(oy + GAME_Y + y) * w + GAME_X;
        const uint32_t *srow = src + (size_t)ymap[y] * DOOM_SRC_W;
        for (int x = 0; x < GAME_W; x++)
            dst[x] = 0xFF000000u | (srow[xmap[x]] & 0x00FFFFFFu);
    }
}

static void draw_loading_center(uint32_t *px, int w, int h, int oy, int audio_ok) {
    fill_rect(px, w, h, GAME_X, oy + GAME_Y, GAME_W, GAME_H, rgb(4, 6, 10));
    int cx = GAME_X + GAME_W / 2;
    draw_text_center(px, w, h, cx, oy + GAME_Y + 60, 9, "DOOM", rgb(255, 186, 48));
    draw_text_center(px, w, h, cx, oy + GAME_Y + 135, 4, "LOADING", rgb(255, 120, 48));
    draw_text_center(px, w, h, cx, oy + GAME_Y + 172, 3, "WAD", rgb(255, 120, 48));
    draw_text_center(px, w, h, cx, oy + GAME_Y + 212, 2, "YOUDAO X6 PRO", rgb(120, 210, 235));
    draw_text_center(px, w, h, cx, oy + GAME_Y + 232, 2,
                     audio_ok ? "AUDIO OK" : "AUDIO RETRY", audio_ok ? rgb(80, 220, 130) : rgb(220, 120, 80));
}

static void draw_uitest_center(uint32_t *px, int w, int h, int oy, uint32_t t) {
    for (int i = 0; i < 8; i++) {
        static const uint32_t bars[8] = {
            0xFFFFFFFF, 0xFFFFD000, 0xFF00E0FF, 0xFF20D060,
            0xFFFF3090, 0xFFA050FF, 0xFFFF6020, 0xFF2050FF,
        };
        fill_rect(px, w, h, GAME_X + i * (GAME_W / 8), oy + GAME_Y,
                  GAME_W / 8, GAME_H - 54, bars[i]);
    }
    fill_rect(px, w, h, GAME_X, oy + GAME_Y + GAME_H - 54, GAME_W, 54, rgb(8, 12, 18));
    draw_text_center(px, w, h, GAME_X + GAME_W / 2, oy + GAME_Y + GAME_H - 45, 3,
                     "TOUCH TEST", rgb(255, 186, 48));
    int marker = GAME_X + (int)((t / 4) % GAME_W);
    fill_rect(px, w, h, marker, oy + GAME_Y, 3, GAME_H - 54, rgb(255, 255, 255));
    int tx = atomic_load(&g_last_ui_x);
    int ty = atomic_load(&g_last_ui_y);
    if (atomic_load(&g_touch_active) && tx >= 0 && ty >= 0) {
        draw_crosshair(px, w, h, tx, oy + ty, 18, rgb(255, 255, 0));
        char pos[32];
        snprintf(pos, sizeof(pos), "X %d Y %d", tx, ty);
        draw_text(px, w, h, GAME_X + 8, oy + GAME_Y + 8, 2, pos, rgb(0, 0, 0));
        draw_text(px, w, h, GAME_X + 7, oy + GAME_Y + 7, 2, pos, rgb(255, 255, 255));
    }
}

static void wayland_pump(void);

static void draw_frame(int mode, int audio_ok) {
    if (!g_wl_ready || !g_configured)
        return;
    int idx = g_ui_cur;
    if (g_ui_buf[idx].busy) {
        wayland_pump();
        if (g_ui_buf[idx].busy)
            return;
    }
    struct buffer_state *b = &g_ui_buf[idx];
    memset(b->px, 0, (size_t)b->w * b->h * 4);
    int oy = g_ui_draw_y;
    draw_panel_base(b->px, b->w, b->h, oy);
    if (mode == 0)
        draw_loading_center(b->px, b->w, b->h, oy, audio_ok);
    else if (mode == 1)
        blit_doom(b->px, b->w, b->h, oy);
    else
        draw_uitest_center(b->px, b->w, b->h, oy, DG_GetTicksMs());
    for (int i = 0; i < NUM_BUTTONS; i++)
        draw_button(b->px, b->w, b->h, oy, i);
    draw_game_border(b->px, b->w, b->h, oy);
    rec_frame(b);

    wl_surface_attach(g_ui_surface, b->buffer, 0, 0);
    wl_surface_damage_buffer(g_ui_surface, 0, 0, b->w, b->h);
    wl_surface_commit(g_ui_surface);
    b->busy = 1;
    g_ui_cur ^= 1;
    wl_display_flush(g_dpy);
}

static void wayland_pump(void) {
    if (!g_dpy)
        return;
    wl_display_dispatch_pending(g_dpy);
    if (wl_display_prepare_read(g_dpy) != 0)
        return;
    wl_display_flush(g_dpy);
    struct pollfd p = { .fd = wl_display_get_fd(g_dpy), .events = POLLIN, .revents = 0 };
    int r = poll(&p, 1, 0);
    if (r > 0 && (p.revents & POLLIN)) {
        if (wl_display_read_events(g_dpy) < 0) {
            fprintf(stderr, "[wl] read failed: %s\n", strerror(errno));
            g_closed = 1;
        }
    } else {
        wl_display_cancel_read(g_dpy);
    }
    wl_display_dispatch_pending(g_dpy);
}

static void buffer_release(void *data, struct wl_buffer *buffer) {
    (void)buffer;
    ((struct buffer_state *)data)->busy = 0;
}

static const struct wl_buffer_listener buffer_listener = {
    .release = buffer_release,
};

static int shm_buffer_counter;

static int create_buffer(int w, int h, struct buffer_state *out) {
    int stride = w * 4;
    size_t size = (size_t)stride * h;
    char name[64];
    snprintf(name, sizeof(name), "/doom-shm-%d-%d", (int)getpid(), shm_buffer_counter++);
    int fd = shm_open(name, O_RDWR | O_CREAT | O_EXCL, 0600);
    if (fd < 0) {
        fprintf(stderr, "[wl] shm_open failed: %s\n", strerror(errno));
        return -1;
    }
    shm_unlink(name);
    if (ftruncate(fd, (off_t)size) < 0) {
        fprintf(stderr, "[wl] ftruncate failed: %s\n", strerror(errno));
        close(fd);
        return -1;
    }
    void *p = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (p == MAP_FAILED) {
        fprintf(stderr, "[wl] mmap failed: %s\n", strerror(errno));
        close(fd);
        return -1;
    }
    struct wl_shm_pool *pool = wl_shm_create_pool(g_shm, fd, (int32_t)size);
    out->buffer = wl_shm_pool_create_buffer(pool, 0, w, h, stride, WL_SHM_FORMAT_XRGB8888);
    wl_buffer_add_listener(out->buffer, &buffer_listener, out);
    wl_shm_pool_destroy(pool);
    close(fd);
    out->px = p;
    out->w = w;
    out->h = h;
    out->busy = 0;
    return 0;
}

static void wm_ping(void *data, struct xdg_wm_base *wm, uint32_t serial) {
    (void)data;
    xdg_wm_base_pong(wm, serial);
}

static const struct xdg_wm_base_listener wm_listener = {
    .ping = wm_ping,
};

static void xdg_surface_configure(void *data, struct xdg_surface *xs, uint32_t serial) {
    (void)data;
    xdg_surface_ack_configure(xs, serial);
    g_configured = 1;
    printf("[wl] surface configured serial=%u\n", serial);
    fflush(stdout);
}

static const struct xdg_surface_listener xdg_surface_listener = {
    .configure = xdg_surface_configure,
};

static int g_force_ui_y = -1;

static void toplevel_configure(void *data, struct xdg_toplevel *tl, int32_t w, int32_t h,
                               struct wl_array *states) {
    (void)data;
    (void)tl;
    printf("[wl] toplevel configure %dx%d states:", w, h);
    uint32_t *st;
    wl_array_for_each(st, states) printf(" %u", *st);
    printf("\n");
    fflush(stdout);
    if (w > 0 && h > 0) {
        g_out_w = w;
        g_out_h = h;
        int vy = (g_out_h - UI_H) / 2;
        if (vy < 0) vy = 0;
        if (g_force_ui_y >= 0) vy = g_force_ui_y;
        g_visible_y = vy;
    }
}

static void toplevel_close(void *data, struct xdg_toplevel *tl) {
    (void)data;
    (void)tl;
    printf("[wl] close requested\n");
    fflush(stdout);
    g_closed = 1;
}

static void toplevel_configure_bounds(void *data, struct xdg_toplevel *tl, int32_t w, int32_t h) {
    (void)data;
    (void)tl;
    printf("[wl] toplevel bounds %dx%d\n", w, h);
    fflush(stdout);
}

static void toplevel_wm_capabilities(void *data, struct xdg_toplevel *tl, struct wl_array *caps) {
    (void)data;
    (void)tl;
    (void)caps;
}

static const struct xdg_toplevel_listener toplevel_listener = {
    .configure = toplevel_configure,
    .close = toplevel_close,
    .configure_bounds = toplevel_configure_bounds,
    .wm_capabilities = toplevel_wm_capabilities,
};

static void registry_global(void *data, struct wl_registry *reg, uint32_t name,
                            const char *iface, uint32_t version) {
    (void)data;
    if (strcmp(iface, wl_compositor_interface.name) == 0) {
        g_comp = wl_registry_bind(reg, name, &wl_compositor_interface, version < 4 ? version : 4);
    } else if (strcmp(iface, wl_subcompositor_interface.name) == 0) {
        g_subcomp = wl_registry_bind(reg, name, &wl_subcompositor_interface, 1);
    } else if (strcmp(iface, wl_shm_interface.name) == 0) {
        g_shm = wl_registry_bind(reg, name, &wl_shm_interface, 1);
    } else if (strcmp(iface, xdg_wm_base_interface.name) == 0) {
        g_wm = wl_registry_bind(reg, name, &xdg_wm_base_interface, 1);
        xdg_wm_base_add_listener(g_wm, &wm_listener, NULL);
    }
}

static void registry_global_remove(void *data, struct wl_registry *reg, uint32_t name) {
    (void)data;
    (void)reg;
    (void)name;
}

static const struct wl_registry_listener registry_listener = {
    .global = registry_global,
    .global_remove = registry_global_remove,
};

static void draw_parent_background(void) {
    int w = g_main_buf.w, h = g_main_buf.h;
    uint32_t *px = g_main_buf.px;
    if (!px)
        return;
    for (int y = 0; y < h; y++) {
        int t = y * 255 / (h > 1 ? h - 1 : 1);
        uint32_t c = rgb(4 + t * 5 / 255, 6 + t * 7 / 255, 10 + t * 9 / 255);
        fill_rect(px, w, h, 0, y, w, 1, c);
    }
    for (int y = 0; y < h; y += 24)
        blend_rect(px, w, h, 0, y, w, 1, rgb(20, 40, 55), 70);
}

static int display_init(void) {
    const char *layout = getenv("DOOM_LAYOUT");
    if (layout) {
        if (strcmp(layout, "window") == 0) g_layout = LAYOUT_WINDOW;
        else if (strcmp(layout, "fs480") == 0) g_layout = LAYOUT_FS480;
        else g_layout = LAYOUT_SUBSURFACE;
    }
    const char *uy = getenv("DOOM_UI_Y");
    if (uy) g_force_ui_y = atoi(uy);
    g_touch_debug = getenv("DOOM_TOUCH_DEBUG") != NULL;

    g_dpy = wl_display_connect(NULL);
    if (!g_dpy) {
        fprintf(stderr, "[wl] cannot connect: WAYLAND_DISPLAY=%s XDG_RUNTIME_DIR=%s\n",
                getenv("WAYLAND_DISPLAY") ? getenv("WAYLAND_DISPLAY") : "(null)",
                getenv("XDG_RUNTIME_DIR") ? getenv("XDG_RUNTIME_DIR") : "(null)");
        return -1;
    }
    struct wl_registry *reg = wl_display_get_registry(g_dpy);
    wl_registry_add_listener(reg, &registry_listener, NULL);
    if (wl_display_roundtrip(g_dpy) < 0) {
        fprintf(stderr, "[wl] registry roundtrip failed: %s\n", strerror(errno));
        return -1;
    }
    if (!g_comp || !g_shm || !g_wm || (g_layout == LAYOUT_SUBSURFACE && !g_subcomp)) {
        fprintf(stderr, "[wl] missing globals: compositor=%p shm=%p xdg=%p subcompositor=%p\n",
                (void *)g_comp, (void *)g_shm, (void *)g_wm, (void *)g_subcomp);
        return -1;
    }

    g_main_surface = wl_compositor_create_surface(g_comp);
    g_main_xdg = xdg_wm_base_get_xdg_surface(g_wm, g_main_surface);
    xdg_surface_add_listener(g_main_xdg, &xdg_surface_listener, NULL);
    g_main_top = xdg_surface_get_toplevel(g_main_xdg);
    xdg_toplevel_add_listener(g_main_top, &toplevel_listener, NULL);
    xdg_toplevel_set_title(g_main_top, "DOOM - Youdao X6 Pro");
    xdg_toplevel_set_app_id(g_main_top, "com.rs114514.doom");
    if (g_layout == LAYOUT_WINDOW) {
        xdg_toplevel_set_min_size(g_main_top, UI_W, UI_H);
        xdg_toplevel_set_max_size(g_main_top, UI_W, UI_H);
    } else {
        xdg_toplevel_set_fullscreen(g_main_top, NULL);
    }
    wl_surface_commit(g_main_surface);

    for (int i = 0; i < 300 && !g_configured; i++) {
        if (wl_display_roundtrip(g_dpy) < 0) {
            fprintf(stderr, "[wl] configure wait failed: %s\n", strerror(errno));
            return -1;
        }
        if (!g_configured)
            usleep(10000);
    }
    if (!g_configured) {
        fprintf(stderr, "[wl] no configure received\n");
        return -1;
    }
    if (g_out_w <= 0) g_out_w = 960;
    if (g_out_h <= 0) g_out_h = 480;
    int vy = (g_out_h - UI_H) / 2;
    if (vy < 0) vy = 0;
    if (g_force_ui_y >= 0) vy = g_force_ui_y;
    g_visible_y = vy;
    printf("[wl] layout=%s output=%dx%d visible_y=%d\n",
           g_layout == LAYOUT_SUBSURFACE ? "subsurface" :
           (g_layout == LAYOUT_WINDOW ? "window" : "fs480"), g_out_w, g_out_h, g_visible_y);
    fflush(stdout);

    if (g_layout == LAYOUT_SUBSURFACE) {
        if (create_buffer(g_out_w, g_out_h, &g_main_buf) < 0)
            return -1;
        draw_parent_background();
        wl_surface_attach(g_main_surface, g_main_buf.buffer, 0, 0);
        wl_surface_damage_buffer(g_main_surface, 0, 0, g_main_buf.w, g_main_buf.h);
        wl_surface_commit(g_main_surface);

        g_ui_surface = wl_compositor_create_surface(g_comp);
        g_ui_sub = wl_subcompositor_get_subsurface(g_subcomp, g_ui_surface, g_main_surface);
        wl_subsurface_set_position(g_ui_sub, 0, g_visible_y);
        wl_subsurface_set_desync(g_ui_sub);
        if (create_buffer(UI_W, UI_H, &g_ui_buf[0]) < 0 ||
            create_buffer(UI_W, UI_H, &g_ui_buf[1]) < 0)
            return -1;
        g_ui_draw_y = 0;
    } else if (g_layout == LAYOUT_WINDOW) {
        g_ui_surface = g_main_surface;
        if (create_buffer(UI_W, UI_H, &g_ui_buf[0]) < 0 ||
            create_buffer(UI_W, UI_H, &g_ui_buf[1]) < 0)
            return -1;
        g_ui_draw_y = 0;
    } else {
        g_ui_surface = g_main_surface;
        if (create_buffer(g_out_w, g_out_h, &g_ui_buf[0]) < 0 ||
            create_buffer(g_out_w, g_out_h, &g_ui_buf[1]) < 0)
            return -1;
        g_ui_draw_y = g_visible_y;
    }
    wl_display_roundtrip(g_dpy);
    g_wl_ready = 1;
    return 0;
}

static void keyq_push(int pressed, unsigned char key) {
    if (!atomic_load(&g_game_started))
        return;
    pthread_mutex_lock(&g_keyq_lock);
    int next = (g_keyq_head + 1) % KEYQ_SIZE;
    if (next == g_keyq_tail) {
        if (!g_keyq_overflow) {
            fprintf(stderr, "[input] key queue overflow, dropping events\n");
            g_keyq_overflow = 1;
        }
    } else {
        g_keyq[g_keyq_head] = (pressed << 8) | key;
        g_keyq_head = next;
    }
    pthread_mutex_unlock(&g_keyq_lock);
}

static int keyq_pop(int *pressed, unsigned char *key) {
    pthread_mutex_lock(&g_keyq_lock);
    if (g_keyq_head == g_keyq_tail) {
        pthread_mutex_unlock(&g_keyq_lock);
        return 0;
    }
    int v = g_keyq[g_keyq_tail];
    g_keyq_tail = (g_keyq_tail + 1) % KEYQ_SIZE;
    pthread_mutex_unlock(&g_keyq_lock);
    *pressed = v >> 8;
    *key = v & 0xFF;
    return 1;
}

static int hit_button(int x, int y) {
    for (int i = 0; i < NUM_BUTTONS; i++) {
        ui_button *b = &g_buttons[i];
        if (x >= b->x && x < b->x + b->w && y >= b->y && y < b->y + b->h)
            return i;
    }
    return -1;
}

static int g_touch_x0 = TOUCH_X0, g_touch_x1 = TOUCH_X1;
static int g_dbg_raw_x = -1, g_dbg_raw_y = -1;

static int raw_to_ui(int rx, int ry, int *ux, int *uy) {
    if (rx < g_touch_x0 || rx > g_touch_x1)
        return 0;
    int maxy = g_raw_max_y > 0 ? g_raw_max_y : 959;
    int x = (maxy - ry) * (UI_W - 1) / maxy;
    int y = (rx - g_touch_x0) * (UI_H - 1) / (g_touch_x1 - g_touch_x0);
    if (x < 0) x = 0;
    if (x >= UI_W) x = UI_W - 1;
    if (y < 0) y = 0;
    if (y >= UI_H) y = UI_H - 1;
    *ux = x;
    *uy = y;
    return 1;
}

static void on_button_change(int idx, int pressed) {
    ui_button *b = &g_buttons[idx];
    if (pressed)
        printf("[input] button %s pressed\n", b->label);
    else
        printf("[input] button %s released\n", b->label);
    fflush(stdout);

    if (b->action == ACT_HOLD) {
        keyq_push(pressed ? 1 : 0, b->key);
    } else if (b->action == ACT_ESC) {
        if (pressed) {
            atomic_store(&g_autosave_request, 1);
            keyq_push(1, DK_ESCAPE);
            keyq_push(0, DK_ESCAPE);
        }
    } else if (b->action == ACT_ENTER) {
        if (pressed) {
            keyq_push(1, DK_ENTER);
            keyq_push(0, DK_ENTER);
            keyq_push(1, 'y');
            keyq_push(0, 'y');
        }
    } else if (b->action == ACT_WEAPON && pressed) {
        g_weapon_slot++;
        if (g_weapon_slot < 1 || g_weapon_slot > 8)
            g_weapon_slot = 1;
        unsigned char key = (unsigned char)('0' + g_weapon_slot);
        keyq_push(1, key);
        keyq_push(0, key);
        printf("[input] weapon slot -> %d\n", g_weapon_slot);
        fflush(stdout);
    }
}

static void update_from_slots(void) {
    int want[NUM_BUTTONS];
    memset(want, 0, sizeof(want));
    int any = 0;
    int lastx = -1, lasty = -1;
    for (int i = 0; i < MAX_SLOTS; i++) {
        touch_slot *s = &g_slots[i];
        if (!s->active)
            continue;
        int ux, uy;
        if (!raw_to_ui(s->x, s->y, &ux, &uy))
            continue;
        if (g_touch_debug && (s->x != g_dbg_raw_x || s->y != g_dbg_raw_y)) {
            int b = hit_button(ux, uy);
            fprintf(stderr, "[touch] raw=(%d,%d) ui=(%d,%d) btn=%d (%s)\n",
                    s->x, s->y, ux, uy, b, b >= 0 ? g_buttons[b].label : "-");
            fflush(stderr);
            g_dbg_raw_x = s->x;
            g_dbg_raw_y = s->y;
        }
        any = 1;
        lastx = ux;
        lasty = uy;
        int b = hit_button(ux, uy);
        if (b >= 0)
            want[b] = 1;
    }
    if (any) {
        atomic_store(&g_last_ui_x, lastx);
        atomic_store(&g_last_ui_y, lasty);
    }
    atomic_store(&g_touch_active, any);
    for (int i = 0; i < NUM_BUTTONS; i++) {
        int old = atomic_load(&g_pressed[i]);
        if (old != want[i]) {
            atomic_store(&g_pressed[i], want[i]);
            on_button_change(i, want[i]);
        }
    }
}

static void reset_slots(void) {
    for (int i = 0; i < MAX_SLOTS; i++)
        g_slots[i].active = 0;
}

static void handle_touch_abs(int code, int value) {
    if (code == ABS_MT_SLOT) {
        if (value >= 0 && value < MAX_SLOTS)
            g_cur_slot = value;
        return;
    }
    if (code >= ABS_MT_TOUCH_MAJOR)
        g_using_mt = 1;
    if (g_cur_slot < 0 || g_cur_slot >= MAX_SLOTS)
        g_cur_slot = 0;
    touch_slot *s = &g_slots[g_cur_slot];
    switch (code) {
    case ABS_MT_TRACKING_ID:
        if (value < 0)
            s->active = 0;
        else {
            s->id = value;
            s->active = 1;
        }
        break;
    case ABS_MT_POSITION_X:
        s->x = value;
        break;
    case ABS_MT_POSITION_Y:
        s->y = value;
        break;
    case ABS_X:
        if (!g_using_mt) {
            s->x = value;
            s->active = g_btn_touch;
        }
        break;
    case ABS_Y:
        if (!g_using_mt) {
            s->y = value;
            s->active = g_btn_touch;
        }
        break;
    }
}

static void handle_touch_key(int code, int value) {
    if (code != BTN_TOUCH)
        return;
    if (value > 0) {
        g_btn_touch = 1;
        if (!g_using_mt) {
            g_slots[0].active = 1;
            g_slots[0].id = 1;
        }
    } else {
        g_btn_touch = 0;
        reset_slots();
    }
}

static void handle_phys_key(int fd, int code, int value) {
    if (value != 1)
        return;
    unsigned char key = (fd == g_fd_adc) ? DK_ESCAPE : DK_ENTER;
    printf("[input] physical fd=%d code=%d -> doom key 0x%02x\n", fd, code, key);
    fflush(stdout);
    keyq_push(1, key);
    keyq_push(0, key);
}

static int open_evdev(const char *path) {
    int fd = open(path, O_RDONLY | O_NONBLOCK | O_CLOEXEC);
    if (fd < 0) {
        fprintf(stderr, "[input] open %s failed: %s\n", path, strerror(errno));
        return -1;
    }
    return fd;
}

static void *input_thread_main(void *arg) {
    (void)arg;
    struct input_absinfo ai;
    if (g_fd_touch >= 0) {
        if (ioctl(g_fd_touch, EVIOCGABS(ABS_MT_POSITION_X), &ai) == 0 && ai.maximum > 0)
            g_raw_max_x = ai.maximum;
        if (ioctl(g_fd_touch, EVIOCGABS(ABS_MT_POSITION_Y), &ai) == 0 && ai.maximum > 0)
            g_raw_max_y = ai.maximum;
        printf("[input] touch abs range x=0..%d y=0..%d, visible raw x=%d..%d\n",
               g_raw_max_x, g_raw_max_y, g_touch_x0, g_touch_x1);
        fflush(stdout);
    }
    while (!atomic_load(&g_input_stop)) {
        struct pollfd pfd[3];
        int nfd = 0;
        if (g_fd_touch >= 0) pfd[nfd++] = (struct pollfd){ g_fd_touch, POLLIN, 0 };
        if (g_fd_adc >= 0) pfd[nfd++] = (struct pollfd){ g_fd_adc, POLLIN, 0 };
        if (g_fd_gpio >= 0) pfd[nfd++] = (struct pollfd){ g_fd_gpio, POLLIN, 0 };
        if (nfd == 0) {
            usleep(100000);
            continue;
        }
        int pr = poll(pfd, (nfds_t)nfd, 100);
        if (pr <= 0)
            continue;
        for (int i = 0; i < nfd; i++) {
            if (!(pfd[i].revents & (POLLIN | POLLERR)))
                continue;
            int fd = pfd[i].fd;
            struct input_event ev;
            ssize_t n;
            while ((n = read(fd, &ev, sizeof(ev))) == (ssize_t)sizeof(ev)) {
                if (ev.type == EV_SYN && ev.code == SYN_DROPPED) {
                    reset_slots();
                    continue;
                }
                if (ev.type == EV_SYN && ev.code == SYN_REPORT) {
                    if (fd == g_fd_touch)
                        update_from_slots();
                    continue;
                }
                if (fd == g_fd_touch) {
                    if (ev.type == EV_ABS)
                        handle_touch_abs(ev.code, ev.value);
                    else if (ev.type == EV_KEY)
                        handle_touch_key(ev.code, ev.value);
                } else if (fd == g_fd_adc && ev.type == EV_KEY) {
                    /* read-only watch, never EVIOCGRAB: volume keys stay native */
                    if (ev.code == KEY_HOME && ev.value == 1) {
                        fprintf(stderr, "[input] HOME pressed: autosave and exit to launcher\n");
                        atomic_store(&g_home_quit, 1);
                    } else if (g_phys_keys_enabled) {
                        handle_phys_key(fd, ev.code, ev.value);
                    }
                } else if (ev.type == EV_KEY) {
                    handle_phys_key(fd, ev.code, ev.value);
                }
            }
            if (n < 0 && errno != EAGAIN && errno != EWOULDBLOCK) {
                fprintf(stderr, "[input] read fd %d failed: %s\n", fd, strerror(errno));
            }
        }
    }
    return NULL;
}

static int input_start(void) {
    const char *x0 = getenv("DOOM_TOUCH_X0");
    const char *x1 = getenv("DOOM_TOUCH_X1");
    if (x0) g_touch_x0 = atoi(x0);
    if (x1) g_touch_x1 = atoi(x1);
    g_fd_touch = open_evdev("/dev/input/event1");
    /* read-only KEY_HOME watch; no grab so the native launcher still gets it */
    g_fd_adc = open_evdev("/dev/input/event3");
    g_phys_keys_enabled = getenv("DOOM_PHYS_KEYS") != NULL;
    if (g_phys_keys_enabled) {
        g_fd_gpio = open_evdev("/dev/input/event6");
        fprintf(stderr, "[input] HOME watched read-only; event3/event6 extra keys opted in via DOOM_PHYS_KEYS\n");
    } else {
        fprintf(stderr, "[input] HOME watched read-only (save+exit); volume/screen/power untouched; event6 closed\n");
    }
    atomic_store(&g_input_stop, 0);
    if (pthread_create(&g_input_thread, NULL, input_thread_main, NULL) != 0) {
        fprintf(stderr, "[input] cannot create input thread\n");
        return -1;
    }
    return 0;
}

static void input_stop(void) {
    atomic_store(&g_input_stop, 1);
    pthread_join(g_input_thread, NULL);
    if (g_fd_touch >= 0) close(g_fd_touch);
    if (g_fd_adc >= 0) close(g_fd_adc);
    if (g_fd_gpio >= 0) close(g_fd_gpio);
    g_fd_touch = g_fd_adc = g_fd_gpio = -1;
}

static void signal_handler(int sig) {
    (void)sig;
    g_sig_quit = 1;
}

void DG_Init(void) {
    signal(SIGPIPE, SIG_IGN);
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    printf("[doom] initializing Youdao X6 Pro Wayland port\n");
    fflush(stdout);
    if (display_init() < 0) {
        fprintf(stderr, "[doom] display init failed\n");
        exit(1);
    }
    rec_init();
    input_start();
    int audio_ok = 0;
    if (M_CheckParm("-nosound") == 0 && M_CheckParm("-nosfx") == 0) {
        audio_ok = DG_sound_module.Init(true) ? 1 : 0;
    } else {
        fprintf(stderr, "[doom] early audio init skipped by -nosound/-nosfx\n");
    }
    draw_frame(0, audio_ok);
    wayland_pump();
    printf("[doom] DG_Init done: layout=%s output=%dx%d ui_y=%d touch_fd=%d audio=%d\n",
           g_layout == LAYOUT_SUBSURFACE ? "subsurface" :
           (g_layout == LAYOUT_WINDOW ? "window" : "fs480"),
           g_out_w, g_out_h, g_visible_y, g_fd_touch, audio_ok);
    fflush(stdout);
}

void DG_DrawFrame(void) {
    autosave_tick();
    if (g_closed || g_sig_quit || atomic_load(&g_home_quit)) {
        I_Quit();
        return;
    }
    atomic_store(&g_game_started, 1);
    wayland_pump();
    if (g_closed || g_sig_quit || atomic_load(&g_home_quit)) {
        I_Quit();
        return;
    }
    draw_frame(1, 1);
}

void DG_SleepMs(uint32_t ms) {
    if (g_closed || g_sig_quit || atomic_load(&g_home_quit))
        I_Quit();
    struct timespec ts;
    ts.tv_sec = ms / 1000;
    ts.tv_nsec = (long)(ms % 1000) * 1000000L;
    while (nanosleep(&ts, &ts) < 0 && errno == EINTR) {
        if (g_sig_quit || atomic_load(&g_home_quit))
            I_Quit();
    }
}

uint32_t DG_GetTicksMs(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint32_t)((uint64_t)ts.tv_sec * 1000ULL + (uint64_t)ts.tv_nsec / 1000000ULL);
}

int DG_GetKey(int *pressed, unsigned char *doomKey) {
    return keyq_pop(pressed, doomKey);
}

void DG_SetWindowTitle(const char *title) {
    (void)title;
}

static int ui_test_main(void) {
    setvbuf(stdout, NULL, _IOLBF, 0);
    setvbuf(stderr, NULL, _IOLBF, 0);
    signal(SIGPIPE, SIG_IGN);
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    printf("[uitest] starting\n");
    if (display_init() < 0)
        return 1;
    atomic_store(&g_game_started, 1);
    input_start();
    DG_sound_module.Init(true);
    while (!g_closed && !g_sig_quit && !atomic_load(&g_home_quit)) {
        wayland_pump();
        draw_frame(2, 1);
        usleep(33000);
    }
    printf("[uitest] exit\n");
    input_stop();
    DG_sound_module.Shutdown();
    return 0;
}

int main(int argc, char **argv) {
    setvbuf(stdout, NULL, _IOLBF, 0);
    setvbuf(stderr, NULL, _IOLBF, 0);
    printf("[doom] doomgeneric Youdao X6 Pro Wayland port\n");
    if (getenv("DOOM_UI_TEST"))
        return ui_test_main();
    doomgeneric_Create(argc, argv);
    for (;;)
        doomgeneric_Tick();
    return 0;
}
