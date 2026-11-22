#define _GNU_SOURCE 1
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <signal.h>
#include <time.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <poll.h>
#include <wayland-client.h>
#include "xdg-shell-client-protocol.h"

static struct wl_display *dpy;
static struct wl_compositor *compositor;
static struct wl_shm *shm;
static struct xdg_wm_base *wm_base;
static struct wl_seat *seat;
static struct wl_touch *touch;
static struct wl_surface *surface;
static struct xdg_surface *xdg_surface;
static struct xdg_toplevel *toplevel;

static int win_w = 960, win_h = 266;
static int buf_w = 960, buf_h = 266;
static int fullscreen = 0;
static int configured = 0;
static int quit = 0;

struct buffer {
    struct wl_buffer *wl;
    uint32_t *px;
    size_t size;
    int busy;
};
static struct buffer bufs[2];
static int cur_buf = 0;

static uint32_t *active_px;

static uint32_t rgb(uint8_t r, uint8_t g, uint8_t b) {
    return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
}

static void fill_rect(uint32_t *px, int w, int h, int x0, int y0, int rw, int rh, uint32_t c) {
    if (x0 < 0) { rw += x0; x0 = 0; }
    if (y0 < 0) { rh += y0; y0 = 0; }
    if (x0 + rw > w) rw = w - x0;
    if (y0 + rh > h) rh = h - y0;
    for (int y = y0; y < y0 + rh; y++) {
        uint32_t *row = px + (size_t)y * w;
        for (int x = x0; x < x0 + rw; x++) row[x] = c;
    }
}

static const uint8_t font5x7[][7] = {
    /* 0 */ {0x0e,0x11,0x13,0x15,0x19,0x11,0x0e},
    /* 1 */ {0x04,0x0c,0x04,0x04,0x04,0x04,0x0e},
    /* 2 */ {0x0e,0x11,0x01,0x02,0x04,0x08,0x1f},
    /* 3 */ {0x1f,0x02,0x04,0x02,0x01,0x11,0x0e},
    /* 4 */ {0x02,0x06,0x0a,0x12,0x1f,0x02,0x02},
    /* 5 */ {0x1f,0x10,0x1e,0x01,0x01,0x11,0x0e},
    /* 6 */ {0x06,0x08,0x10,0x1e,0x11,0x11,0x0e},
    /* 7 */ {0x1f,0x01,0x02,0x04,0x08,0x08,0x08},
    /* 8 */ {0x0e,0x11,0x11,0x0e,0x11,0x11,0x0e},
    /* 9 */ {0x0e,0x11,0x11,0x0f,0x01,0x02,0x0c},
    /* A */ {0x0e,0x11,0x11,0x1f,0x11,0x11,0x11},
    /* B */ {0x1e,0x11,0x11,0x1e,0x11,0x11,0x1e},
    /* C */ {0x0e,0x11,0x10,0x10,0x10,0x11,0x0e},
    /* D */ {0x1c,0x12,0x11,0x11,0x11,0x12,0x1c},
    /* E */ {0x1f,0x10,0x10,0x1e,0x10,0x10,0x1f},
    /* F */ {0x1f,0x10,0x10,0x1e,0x10,0x10,0x10},
    /* G */ {0x0e,0x11,0x10,0x17,0x11,0x11,0x0e},
    /* H */ {0x11,0x11,0x11,0x1f,0x11,0x11,0x11},
    /* I */ {0x0e,0x04,0x04,0x04,0x04,0x04,0x0e},
    /* J */ {0x07,0x02,0x02,0x02,0x02,0x12,0x0c},
    /* K */ {0x11,0x12,0x14,0x18,0x14,0x12,0x11},
    /* L */ {0x10,0x10,0x10,0x10,0x10,0x10,0x1f},
    /* M */ {0x11,0x1b,0x15,0x15,0x11,0x11,0x11},
    /* N */ {0x11,0x19,0x15,0x13,0x11,0x11,0x11},
    /* O */ {0x0e,0x11,0x11,0x11,0x11,0x11,0x0e},
    /* P */ {0x1e,0x11,0x11,0x1e,0x10,0x10,0x10},
    /* Q */ {0x0e,0x11,0x11,0x11,0x15,0x12,0x0d},
    /* R */ {0x1e,0x11,0x11,0x1e,0x14,0x12,0x11},
    /* S */ {0x0f,0x10,0x10,0x0e,0x01,0x01,0x1e},
    /* T */ {0x1f,0x04,0x04,0x04,0x04,0x04,0x04},
    /* U */ {0x11,0x11,0x11,0x11,0x11,0x11,0x0e},
    /* V */ {0x11,0x11,0x11,0x11,0x11,0x0a,0x04},
    /* W */ {0x11,0x11,0x11,0x15,0x15,0x15,0x0a},
    /* X */ {0x11,0x11,0x0a,0x04,0x0a,0x11,0x11},
    /* Y */ {0x11,0x11,0x0a,0x04,0x04,0x04,0x04},
    /* Z */ {0x1f,0x01,0x02,0x04,0x08,0x10,0x1f},
    /* : */ {0x00,0x04,0x00,0x00,0x04,0x00,0x00},
    /* - */ {0x00,0x00,0x00,0x1f,0x00,0x00,0x00},
    /* . */ {0x00,0x00,0x00,0x00,0x00,0x0c,0x0c},
    /* space */ {0,0,0,0,0,0,0},
};

static void draw_text(uint32_t *px, int w, int h, int x, int y, int scale, const char *s, uint32_t c) {
    for (; *s; s++) {
        int idx = -1;
        if (*s >= '0' && *s <= '9') idx = *s - '0';
        else if (*s >= 'A' && *s <= 'Z') idx = 10 + (*s - 'A');
        else if (*s == ':') idx = 10 + 26;
        else if (*s == '-') idx = 10 + 26 + 1;
        else if (*s == '.') idx = 10 + 26 + 2;
        else idx = 10 + 26 + 3;

        for (int row = 0; row < 7; row++) {
            for (int col = 0; col < 5; col++) {
                if (font5x7[idx][row] & (0x10 >> col)) {
                    fill_rect(px, w, h, x + col * scale, y + row * scale, scale, scale, c);
                }
            }
        }
        x += 6 * scale;
    }
}

static void draw_pattern(uint32_t *px, int w, int h, const char *mode) {
    fill_rect(px, w, h, 0, 0, w, h, rgb(10, 16, 24));
    for (int y = 0; y < h; y += 40)
        fill_rect(px, w, h, 0, y, w, 1, rgb(30, 45, 60));
    for (int x = 0; x < w; x += 40)
        fill_rect(px, w, h, x, 0, 1, h, rgb(30, 45, 60));

    fill_rect(px, w, h, 0, 0, w, 3, rgb(0, 255, 120));
    fill_rect(px, w, h, 0, h - 3, w, 3, rgb(0, 255, 120));
    fill_rect(px, w, h, 0, 0, 3, h, rgb(0, 255, 120));
    fill_rect(px, w, h, w - 3, 0, 3, h, rgb(0, 255, 120));

    /* corner markers reveal orientation and crops */
    fill_rect(px, w, h, 0, 0, 24, 24, rgb(255, 255, 255));
    fill_rect(px, w, h, w - 24, 0, 24, 24, rgb(255, 255, 0));
    fill_rect(px, w, h, 0, h - 24, 24, 24, rgb(0, 255, 255));
    fill_rect(px, w, h, w - 24, h - 24, 24, 24, rgb(255, 0, 255));

    /* coordinate ticks along top */
    for (int x = 100; x < w; x += 100) {
        int len = (x % 500 == 0) ? 18 : 10;
        fill_rect(px, w, h, x, 0, 2, len, rgb(255, 60, 60));
    }

    if (h > 300) {
        /* 960x480 calibration: bands + boundary line at y=266 */
        for (int y = 0; y < h; y += 30) {
            uint8_t r = (uint8_t)(y * 255 / h);
            uint32_t c = rgb(r, 40, 255 - r);
            fill_rect(px, w, h, 0, y, 60, 28, c);
        }
        fill_rect(px, w, h, 0, 266, w, 2, rgb(255, 255, 255));
        fill_rect(px, w, h, 0, 0, w, 2, rgb(255, 0, 0));
    }

    char info[64];
    snprintf(info, sizeof(info), "%s %dX%d", mode, w, h);
    draw_text(px, w, h, 30, 30, 3, info, rgb(255, 255, 255));
    draw_text(px, w, h, 30, h - 60, 3, "DOOM", rgb(255, 210, 0));
    draw_text(px, w, h, w - 260, 30, 3, "PROBE", rgb(0, 255, 120));
    draw_text(px, w, h, w / 2 - 90, h / 2 - 10, 3, "CENTER", rgb(255, 255, 255));
}

static void buffer_release(void *data, struct wl_buffer *wl_buffer) {
    struct buffer *b = data;
    (void)wl_buffer;
    b->busy = 0;
}

static const struct wl_buffer_listener buffer_listener = {
    .release = buffer_release,
};

static int create_shm_buffer(struct buffer *b, int w, int h) {
    int stride = w * 4;
    size_t size = (size_t)stride * h;
    char name[64];
    snprintf(name, sizeof(name), "/doom-probe-%d-%d", (int)getpid(), (int)(b - bufs));
    int fd = shm_open(name, O_RDWR | O_CREAT | O_EXCL, 0600);
    if (fd < 0) {
        perror("shm_open");
        return -1;
    }
    shm_unlink(name);
    if (ftruncate(fd, size) < 0) {
        perror("ftruncate");
        close(fd);
        return -1;
    }
    void *p = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (p == MAP_FAILED) {
        perror("mmap");
        close(fd);
        return -1;
    }
    struct wl_shm_pool *pool = wl_shm_create_pool(shm, fd, size);
    b->wl = wl_shm_pool_create_buffer(pool, 0, w, h, stride, WL_SHM_FORMAT_XRGB8888);
    wl_buffer_add_listener(b->wl, &buffer_listener, b);
    wl_shm_pool_destroy(pool);
    close(fd);
    b->px = p;
    b->size = size;
    b->busy = 0;
    return 0;
}

static void touch_down(void *data, struct wl_touch *t, uint32_t serial, uint32_t time,
                       struct wl_surface *surf, int32_t id, wl_fixed_t x, wl_fixed_t y) {
    (void)data; (void)t; (void)serial; (void)time;
    printf("TOUCH down id=%d surf=%p (%.2f, %.2f)\n", id, (void *)surf,
           wl_fixed_to_double(x), wl_fixed_to_double(y));
    fflush(stdout);
}
static void touch_up(void *data, struct wl_touch *t, uint32_t serial, uint32_t time, int32_t id) {
    (void)data; (void)t; (void)serial; (void)time;
    printf("TOUCH up id=%d\n", id);
    fflush(stdout);
}
static void touch_motion(void *data, struct wl_touch *t, uint32_t time, int32_t id, wl_fixed_t x, wl_fixed_t y) {
    (void)data; (void)t; (void)time;
    printf("TOUCH motion id=%d (%.2f, %.2f)\n", id, wl_fixed_to_double(x), wl_fixed_to_double(y));
    fflush(stdout);
}
static void touch_frame(void *data, struct wl_touch *t) { (void)data; (void)t; }
static void touch_cancel(void *data, struct wl_touch *t) {
    (void)data; (void)t;
    printf("TOUCH cancel\n");
    fflush(stdout);
}
static void touch_shape(void *data, struct wl_touch *t, int32_t id, wl_fixed_t major, wl_fixed_t minor) {
    (void)data; (void)t; (void)id; (void)major; (void)minor;
}
static void touch_orientation(void *data, struct wl_touch *t, int32_t id, wl_fixed_t orientation) {
    (void)data; (void)t; (void)id; (void)orientation;
}
static const struct wl_touch_listener touch_listener = {
    .down = touch_down,
    .up = touch_up,
    .motion = touch_motion,
    .frame = touch_frame,
    .cancel = touch_cancel,
    .shape = touch_shape,
    .orientation = touch_orientation,
};

static void seat_capabilities(void *data, struct wl_seat *s, uint32_t caps) {
    (void)data;
    printf("SEAT caps=0x%x\n", caps);
    fflush(stdout);
    if ((caps & WL_SEAT_CAPABILITY_TOUCH) && !touch) {
        touch = wl_seat_get_touch(s);
        wl_touch_add_listener(touch, &touch_listener, NULL);
    }
}
static void seat_name(void *data, struct wl_seat *s, const char *name) {
    (void)data; (void)s;
    printf("SEAT name=%s\n", name);
    fflush(stdout);
}
static const struct wl_seat_listener seat_listener = {
    .capabilities = seat_capabilities,
    .name = seat_name,
};

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
    configured = 1;
    printf("XDG configure serial=%u\n", serial);
    fflush(stdout);
}
static const struct xdg_surface_listener xdg_surface_listener = {
    .configure = xdg_surface_configure,
};

static void toplevel_configure(void *data, struct xdg_toplevel *tl, int32_t w, int32_t h,
                               struct wl_array *states) {
    (void)data; (void)tl;
    printf("TOPLEVEL configure %dx%d states:", w, h);
    uint32_t *st;
    wl_array_for_each(st, states) printf(" %u", *st);
    printf("\n");
    fflush(stdout);
    (void)states;
}
static void toplevel_close(void *data, struct xdg_toplevel *tl) {
    (void)data; (void)tl;
    quit = 1;
}
static void toplevel_configure_bounds(void *data, struct xdg_toplevel *tl, int32_t w, int32_t h) {
    (void)data; (void)tl;
    printf("TOPLEVEL bounds %dx%d\n", w, h);
    fflush(stdout);
}
static void toplevel_wm_capabilities(void *data, struct xdg_toplevel *tl, struct wl_array *caps) {
    (void)data; (void)tl; (void)caps;
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
        compositor = wl_registry_bind(reg, name, &wl_compositor_interface, version < 4 ? version : 4);
    } else if (strcmp(iface, wl_shm_interface.name) == 0) {
        shm = wl_registry_bind(reg, name, &wl_shm_interface, 1);
    } else if (strcmp(iface, xdg_wm_base_interface.name) == 0) {
        wm_base = wl_registry_bind(reg, name, &xdg_wm_base_interface, 1);
        xdg_wm_base_add_listener(wm_base, &wm_listener, NULL);
    } else if (strcmp(iface, wl_seat_interface.name) == 0) {
        seat = wl_registry_bind(reg, name, &wl_seat_interface, version < 7 ? version : 7);
        wl_seat_add_listener(seat, &seat_listener, NULL);
    }
}
static void registry_global_remove(void *data, struct wl_registry *reg, uint32_t name) {
    (void)data; (void)reg; (void)name;
}
static const struct wl_registry_listener registry_listener = {
    .global = registry_global,
    .global_remove = registry_global_remove,
};

static uint32_t now_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint32_t)(ts.tv_sec * 1000 + ts.tv_nsec / 1000000);
}

static void draw_and_commit(void) {
    struct buffer *b = &bufs[cur_buf];
    if (b->busy)
        return;
    draw_pattern(b->px, buf_w, buf_h, fullscreen ? "FS" : "WIN");
    active_px = b->px;
    wl_surface_attach(surface, b->wl, 0, 0);
    wl_surface_damage_buffer(surface, 0, 0, buf_w, buf_h);
    wl_surface_commit(surface);
    b->busy = 1;
    cur_buf ^= 1;
}

static void sig_handler(int sig) {
    (void)sig;
    quit = 1;
}

int main(int argc, char **argv) {
    const char *mode = argc > 1 ? argv[1] : "window";
    fullscreen = strstr(mode, "fullscreen") != NULL;
    if (strstr(mode, "480")) {
        buf_w = win_w = 960;
        buf_h = win_h = 480;
    }
    setvbuf(stdout, NULL, _IOLBF, 0);
    printf("PROBE start mode=%s buffer=%dx%d\n", mode, buf_w, buf_h);
    fflush(stdout);

    signal(SIGINT, sig_handler);
    signal(SIGTERM, sig_handler);

    dpy = wl_display_connect(NULL);
    if (!dpy) {
        fprintf(stderr, "cannot connect to Wayland (WAYLAND_DISPLAY=%s XDG_RUNTIME_DIR=%s)\n",
                getenv("WAYLAND_DISPLAY"), getenv("XDG_RUNTIME_DIR"));
        return 1;
    }
    struct wl_registry *reg = wl_display_get_registry(dpy);
    wl_registry_add_listener(reg, &registry_listener, NULL);
    wl_display_roundtrip(dpy);
    if (!compositor || !shm || !wm_base) {
        fprintf(stderr, "missing globals compositor=%p shm=%p wm=%p\n",
                (void *)compositor, (void *)shm, (void *)wm_base);
        return 1;
    }

    if (create_shm_buffer(&bufs[0], buf_w, buf_h) < 0 ||
        create_shm_buffer(&bufs[1], buf_w, buf_h) < 0)
        return 1;

    surface = wl_compositor_create_surface(compositor);
    xdg_surface = xdg_wm_base_get_xdg_surface(wm_base, surface);
    xdg_surface_add_listener(xdg_surface, &xdg_surface_listener, NULL);
    toplevel = xdg_surface_get_toplevel(xdg_surface);
    xdg_toplevel_add_listener(toplevel, &toplevel_listener, NULL);
    xdg_toplevel_set_title(toplevel, "DOOM Wayland Probe");
    xdg_toplevel_set_app_id(toplevel, "doom.probe");
    xdg_toplevel_set_min_size(toplevel, win_w, win_h);
    xdg_toplevel_set_max_size(toplevel, win_w, win_h);
    if (fullscreen) {
        xdg_toplevel_set_fullscreen(toplevel, NULL);
        printf("PROBE requesting fullscreen\n");
    }
    wl_surface_commit(surface);

    uint32_t last_draw = 0;
    int disp_fd = wl_display_get_fd(dpy);
    while (!quit) {
        while (wl_display_prepare_read(dpy) != 0) {
            if (wl_display_dispatch_pending(dpy) < 0)
                goto out;
        }
        wl_display_flush(dpy);
        struct pollfd pfd = { .fd = disp_fd, .events = POLLIN, .revents = 0 };
        int pr = poll(&pfd, 1, 20);
        if (pr > 0 && (pfd.revents & POLLIN)) {
            if (wl_display_read_events(dpy) < 0) {
                fprintf(stderr, "display read failed: %s\n", strerror(errno));
                goto out;
            }
        } else {
            wl_display_cancel_read(dpy);
        }
        if (wl_display_dispatch_pending(dpy) < 0) {
            fprintf(stderr, "display dispatch failed: %s\n", strerror(errno));
            break;
        }
        if (configured && now_ms() - last_draw >= 500) {
            draw_and_commit();
            last_draw = now_ms();
        }
    }
out:

    printf("PROBE exit\n");
    fflush(stdout);
    if (touch) wl_touch_destroy(touch);
    if (toplevel) xdg_toplevel_destroy(toplevel);
    if (xdg_surface) xdg_surface_destroy(xdg_surface);
    if (surface) wl_surface_destroy(surface);
    if (seat) wl_seat_destroy(seat);
    if (wm_base) xdg_wm_base_destroy(wm_base);
    if (compositor) wl_compositor_destroy(compositor);
    if (shm) wl_shm_destroy(shm);
    wl_display_disconnect(dpy);
    return 0;
}
