#define _GNU_SOURCE 1
#include <dlfcn.h>
#include <link.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <sys/time.h>
#include <fcntl.h>
#include <unistd.h>

/* ==================== Minimal Wayland Client ABI ==================== */
typedef int32_t wl_fixed_t;
static inline double wl_fixed_to_double(wl_fixed_t f) { return (double)f / 256.0; }

struct wl_proxy;
struct wl_display;
struct wl_registry;
struct wl_compositor;
struct wl_subcompositor;
struct wl_shm;
struct wl_shm_pool;
struct wl_buffer;
struct wl_surface;
struct wl_subsurface;
struct wl_region;
struct wl_touch;
struct wl_pointer;
struct wl_egl_window;
struct xdg_toplevel;
struct wl_array;

struct wl_interface {
    const char *name;
    int version;
    int method_count;
    const void *methods;
    int event_count;
    const void *events;
};

union wl_argument {
    int32_t i;
    uint32_t u;
    wl_fixed_t f;
    const char *s;
    void *o;
    uint32_t n;
    struct wl_array *a;
    int32_t h;
};

extern const struct wl_interface wl_registry_interface;
extern const struct wl_interface wl_compositor_interface;
extern const struct wl_interface wl_subcompositor_interface;
extern const struct wl_interface wl_shm_interface;
extern const struct wl_interface wl_shm_pool_interface;
extern const struct wl_interface wl_buffer_interface;
extern const struct wl_interface wl_surface_interface;
extern const struct wl_interface wl_subsurface_interface;
extern const struct wl_interface wl_region_interface;

extern int wl_display_roundtrip(struct wl_display *display);
extern int wl_display_flush(struct wl_display *display);
extern const char *wl_proxy_get_class(struct wl_proxy *proxy);
extern uint32_t wl_proxy_get_version(struct wl_proxy *proxy);
extern struct wl_proxy *wl_proxy_marshal_flags(struct wl_proxy *proxy, uint32_t opcode,
                                               const struct wl_interface *interface,
                                               uint32_t version, uint32_t flags, ...);

#define WL_MARSHAL_FLAG_DESTROY (1 << 0)
#define WL_SHM_FORMAT_ARGB8888 0
#define WL_SHM_FORMAT_XRGB8888 1

struct wl_registry_listener {
    void (*global)(void *data, struct wl_registry *reg, uint32_t name, const char *iface, uint32_t version);
    void (*global_remove)(void *data, struct wl_registry *reg, uint32_t name);
};

struct wl_touch_listener {
    void (*down)(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time,
                 struct wl_surface *surface, int32_t id, wl_fixed_t x, wl_fixed_t y);
    void (*up)(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time, int32_t id);
    void (*motion)(void *data, struct wl_touch *touch, uint32_t time, int32_t id, wl_fixed_t x, wl_fixed_t y);
    void (*frame)(void *data, struct wl_touch *touch);
    void (*cancel)(void *data, struct wl_touch *touch);
    void (*shape)(void *data, struct wl_touch *touch, int32_t id, wl_fixed_t major, wl_fixed_t minor);
    void (*orientation)(void *data, struct wl_touch *touch, int32_t id, wl_fixed_t orientation);
};

struct wl_pointer_listener {
    void (*enter)(void *data, struct wl_pointer *pointer, uint32_t serial,
                  struct wl_surface *surface, wl_fixed_t sx, wl_fixed_t sy);
    void (*leave)(void *data, struct wl_pointer *pointer, uint32_t serial, struct wl_surface *surface);
    void (*motion)(void *data, struct wl_pointer *pointer, uint32_t time, wl_fixed_t sx, wl_fixed_t sy);
    void (*button)(void *data, struct wl_pointer *pointer, uint32_t serial, uint32_t time, uint32_t button, uint32_t state);
    void (*axis)(void *data, struct wl_pointer *pointer, uint32_t time, uint32_t axis, wl_fixed_t value);
    void (*frame)(void *data, struct wl_pointer *pointer);
    void (*axis_source)(void *data, struct wl_pointer *pointer, uint32_t axis_source);
    void (*axis_stop)(void *data, struct wl_pointer *pointer, uint32_t time, uint32_t axis);
    void (*axis_discrete)(void *data, struct wl_pointer *pointer, uint32_t axis, int32_t discrete);
};

struct xdg_toplevel_listener {
    void (*configure)(void *data, struct xdg_toplevel *toplevel, int32_t width, int32_t height, struct wl_array *states);
    void (*close)(void *data, struct xdg_toplevel *toplevel);
    void (*configure_bounds)(void *data, struct xdg_toplevel *toplevel, int32_t width, int32_t height);
    void (*wm_capabilities)(void *data, struct xdg_toplevel *toplevel, struct wl_array *capabilities);
};

/* Inline Wayland protocol helpers */
static inline struct wl_registry *my_display_get_registry(struct wl_display *dpy) {
    return (struct wl_registry *)wl_proxy_marshal_flags((struct wl_proxy *)dpy, 1, &wl_registry_interface, 1, 0, NULL);
}
static inline void *my_registry_bind(struct wl_registry *reg, uint32_t name, const struct wl_interface *iface, uint32_t ver) {
    return (void *)wl_proxy_marshal_flags((struct wl_proxy *)reg, 0, iface, ver, 0, name, iface->name, ver, NULL);
}
static inline struct wl_surface *my_compositor_create_surface(struct wl_compositor *c) {
    return (struct wl_surface *)wl_proxy_marshal_flags((struct wl_proxy *)c, 0, &wl_surface_interface, wl_proxy_get_version((struct wl_proxy *)c), 0, NULL);
}
static inline struct wl_region *my_compositor_create_region(struct wl_compositor *c) {
    return (struct wl_region *)wl_proxy_marshal_flags((struct wl_proxy *)c, 1, &wl_region_interface, wl_proxy_get_version((struct wl_proxy *)c), 0, NULL);
}
static inline void my_region_destroy(struct wl_region *r) {
    wl_proxy_marshal_flags((struct wl_proxy *)r, 0, NULL, wl_proxy_get_version((struct wl_proxy *)r), WL_MARSHAL_FLAG_DESTROY);
}
static inline struct wl_subsurface *my_subcompositor_get_subsurface(struct wl_subcompositor *sc, struct wl_surface *surf, struct wl_surface *parent) {
    return (struct wl_subsurface *)wl_proxy_marshal_flags((struct wl_proxy *)sc, 1, &wl_subsurface_interface, 1, 0, NULL, surf, parent);
}
static inline void my_subsurface_set_position(struct wl_subsurface *ss, int32_t x, int32_t y) {
    wl_proxy_marshal_flags((struct wl_proxy *)ss, 1, NULL, 1, 0, x, y);
}
static inline void my_subsurface_place_above(struct wl_subsurface *ss, struct wl_surface *sibling) {
    wl_proxy_marshal_flags((struct wl_proxy *)ss, 2, NULL, 1, 0, sibling);
}
static inline void my_subsurface_set_desync(struct wl_subsurface *ss) {
    wl_proxy_marshal_flags((struct wl_proxy *)ss, 5, NULL, 1, 0);
}
static inline void my_surface_attach(struct wl_surface *s, struct wl_buffer *b, int32_t x, int32_t y) {
    wl_proxy_marshal_flags((struct wl_proxy *)s, 1, NULL, wl_proxy_get_version((struct wl_proxy *)s), 0, b, x, y);
}
static inline void my_surface_damage(struct wl_surface *s, int32_t x, int32_t y, int32_t w, int32_t h) {
    wl_proxy_marshal_flags((struct wl_proxy *)s, 2, NULL, wl_proxy_get_version((struct wl_proxy *)s), 0, x, y, w, h);
}
static inline void my_surface_set_input_region(struct wl_surface *s, struct wl_region *r) {
    wl_proxy_marshal_flags((struct wl_proxy *)s, 5, NULL, wl_proxy_get_version((struct wl_proxy *)s), 0, r);
}
static inline void my_surface_commit(struct wl_surface *s) {
    wl_proxy_marshal_flags((struct wl_proxy *)s, 6, NULL, wl_proxy_get_version((struct wl_proxy *)s), 0);
}
static inline struct wl_shm_pool *my_shm_create_pool(struct wl_shm *shm, int32_t fd, int32_t size) {
    return (struct wl_shm_pool *)wl_proxy_marshal_flags((struct wl_proxy *)shm, 0, &wl_shm_pool_interface, 1, 0, NULL, fd, size);
}
static inline struct wl_buffer *my_shm_pool_create_buffer(struct wl_shm_pool *p, int32_t off, int32_t w, int32_t h, int32_t stride, uint32_t fmt) {
    return (struct wl_buffer *)wl_proxy_marshal_flags((struct wl_proxy *)p, 0, &wl_buffer_interface, 1, 0, NULL, off, w, h, stride, fmt);
}
static inline void my_shm_pool_destroy(struct wl_shm_pool *p) {
    wl_proxy_marshal_flags((struct wl_proxy *)p, 1, NULL, 1, WL_MARSHAL_FLAG_DESTROY);
}
static inline void my_xdg_toplevel_set_fullscreen(struct xdg_toplevel *tl) {
    wl_proxy_marshal_flags((struct wl_proxy *)tl, 11, NULL, wl_proxy_get_version((struct wl_proxy *)tl), 0, NULL);
}

/* ==================== uinput Virtual Keyboard ==================== */
#define UI_SET_EVBIT   0x40045564
#define UI_SET_KEYBIT  0x40045565
#define UI_DEV_CREATE  0x5501
#define UI_DEV_DESTROY 0x5502
#define EV_SYN   0x00
#define EV_KEY   0x01
#define KEY_ESC   1
#define KEY_ENTER 28
#define KEY_UP    103
#define KEY_LEFT  105
#define KEY_RIGHT 106
#define KEY_DOWN  108

struct uinput_user_dev {
    char name[80];
    uint16_t bustype, vendor, product, version;
    uint32_t ff_effects_max;
    int32_t absmax[64], absmin[64], absfuzz[64], absflat[64];
};

struct linux_input_event {
    struct timeval time;
    uint16_t type;
    uint16_t code;
    int32_t value;
};

static int g_uinput_fd = -1;
static int g_key_pipe[2] = { -1, -1 };

static void init_uinput(void) {
    int fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
    if (fd < 0) return;
    ioctl(fd, UI_SET_EVBIT, EV_KEY);
    const int keys[] = { KEY_ESC, KEY_ENTER, KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT };
    for (size_t i = 0; i < sizeof(keys)/sizeof(keys[0]); i++) {
        ioctl(fd, UI_SET_KEYBIT, keys[i]);
    }
    struct uinput_user_dev dev;
    memset(&dev, 0, sizeof(dev));
    snprintf(dev.name, sizeof(dev.name), "hl-menu-pad");
    dev.bustype = 0x03;
    dev.vendor = 0x1234;
    dev.product = 0x5678;
    dev.version = 1;
    if (write(fd, &dev, sizeof(dev)) < 0) { close(fd); return; }
    if (ioctl(fd, UI_DEV_CREATE) < 0) { close(fd); return; }
    g_uinput_fd = fd;
}

static void emit_key_sync(uint16_t code) {
    if (g_uinput_fd < 0) return;
    struct linux_input_event ev[2];
    memset(ev, 0, sizeof(ev));
    ev[0].type = EV_KEY; ev[0].code = code; ev[0].value = 1;
    ev[1].type = EV_SYN; ev[1].code = 0;    ev[1].value = 0;
    (void)write(g_uinput_fd, ev, sizeof(ev));
    usleep(35000);
    ev[0].value = 0;
    (void)write(g_uinput_fd, ev, sizeof(ev));
}

static void queue_menu_key(uint16_t code) {
    if (g_key_pipe[1] >= 0) {
        (void)write(g_key_pipe[1], &code, sizeof(code));
    }
}

/* ==================== Dynamic cls.key_dest Locator ==================== */
#define XASH_KEY_DEST_OFFSET 0x874770UL
static volatile uint32_t *g_key_dest_ptr = NULL;

static int find_libxash_cb(struct dl_phdr_info *info, size_t size, void *data) {
    (void)size; (void)data;
    if (info->dlpi_name && strstr(info->dlpi_name, "libxash.so")) {
        g_key_dest_ptr = (volatile uint32_t *)(info->dlpi_addr + XASH_KEY_DEST_OFFSET);
        return 1;
    }
    return 0;
}

static int is_in_pause_menu(void) {
    if (!g_key_dest_ptr) {
        dl_iterate_phdr(find_libxash_cb, NULL);
    }
    if (!g_key_dest_ptr) return 0;
    return (*g_key_dest_ptr == 2); /* key_menu == 2 */
}

/* ==================== Pause Menu Overlay Drawing ==================== */
#define MENU_PAD_X 548
#define MENU_PAD_Y 8
#define MENU_PAD_W 400
#define MENU_PAD_H 250

typedef struct {
    int x1, y1, x2, y2; /* in 960x266 screen coordinates */
    uint16_t keycode;
    uint32_t bg_color;
    uint32_t border_color;
    const char *label;
} menu_btn_t;

static const menu_btn_t g_menu_btns[] = {
    { 628,  16, 708,  88, KEY_UP,    0xCC243044u, 0xEE7AA2F7u, "UP"  },
    { 628, 176, 708, 248, KEY_DOWN,  0xCC243044u, 0xEE7AA2F7u, "DN"  },
    { 554,  96, 634, 168, KEY_LEFT,  0xCC243044u, 0xEE7AA2F7u, "LT"  },
    { 702,  96, 782, 168, KEY_RIGHT, 0xCC243044u, 0xEE7AA2F7u, "RT"  },
    { 808,  22, 936, 118, KEY_ESC,   0xDCE06C1Fu, 0xFFFFB86Cu, "ESC" },
    { 808, 144, 936, 240, KEY_ENTER, 0xDC228B44u, 0xFF7CF29Cu, "OK"  },
};
#define NUM_MENU_BTNS (sizeof(g_menu_btns) / sizeof(g_menu_btns[0]))

static void put_px(uint32_t *px, int x, int y, uint32_t c) {
    if (x >= 0 && x < MENU_PAD_W && y >= 0 && y < MENU_PAD_H) {
        px[y * MENU_PAD_W + x] = c;
    }
}

static void fill_rrect(uint32_t *px, int x0, int y0, int x1, int y1, int r, uint32_t fill, uint32_t border) {
    for (int y = y0; y < y1; y++) {
        for (int x = x0; x < x1; x++) {
            int dx = 0, dy = 0;
            if (x < x0 + r) dx = (x0 + r) - x;
            else if (x >= x1 - r) dx = x - (x1 - r - 1);
            if (y < y0 + r) dy = (y0 + r) - y;
            else if (y >= y1 - r) dy = y - (y1 - r - 1);
            int d2 = dx * dx + dy * dy;
            if (d2 <= r * r) {
                int is_border = (x < x0 + 3 || x >= x1 - 3 || y < y0 + 3 || y >= y1 - 3 || d2 >= (r - 3) * (r - 3));
                put_px(px, x, y, is_border ? border : fill);
            }
        }
    }
}

static void draw_triangle(uint32_t *px, int cx, int cy, int sz, int dir, uint32_t c) {
    /* dir: 0=UP, 1=DOWN, 2=LEFT, 3=RIGHT */
    for (int dy = -sz; dy <= sz; dy++) {
        for (int dx = -sz; dx <= sz; dx++) {
            int inside = 0;
            if (dir == 0) inside = (dy >= -sz && dy <= sz / 2 && abs(dx) <= (dy + sz) * 3 / 4);
            else if (dir == 1) inside = (dy <= sz && dy >= -sz / 2 && abs(dx) <= (sz - dy) * 3 / 4);
            else if (dir == 2) inside = (dx >= -sz && dx <= sz / 2 && abs(dy) <= (dx + sz) * 3 / 4);
            else if (dir == 3) inside = (dx <= sz && dx >= -sz / 2 && abs(dy) <= (sz - dx) * 3 / 4);
            if (inside) put_px(px, cx + dx, cy + dy, c);
        }
    }
}

/* Crisp 5x7 bitmap glyphs scaled up 4x for ESC / OK */
static const uint8_t glyph_E[7] = {0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F};
static const uint8_t glyph_S[7] = {0x0F,0x10,0x10,0x0E,0x01,0x01,0x1E};
static const uint8_t glyph_C[7] = {0x0E,0x11,0x10,0x10,0x10,0x11,0x0E};
static const uint8_t glyph_O[7] = {0x0E,0x11,0x11,0x11,0x11,0x11,0x0E};
static const uint8_t glyph_K[7] = {0x11,0x12,0x14,0x18,0x14,0x12,0x11};

static void draw_glyph(uint32_t *px, int ox, int oy, int scale, const uint8_t g[7], uint32_t c) {
    for (int r = 0; r < 7; r++) {
        for (int col = 0; col < 5; col++) {
            if (g[r] & (1 << (4 - col))) {
                for (int sy = 0; sy < scale; sy++)
                    for (int sx = 0; sx < scale; sx++)
                        put_px(px, ox + col * scale + sx, oy + r * scale + sy, c);
            }
        }
    }
}

static void render_menu_pad_pixels(uint32_t *px) {
    /* Subtle translucent backdrop */
    fill_rrect(px, 0, 0, MENU_PAD_W, MENU_PAD_H, 16, 0x90121620u, 0xAA3A445Cu);

    for (size_t i = 0; i < NUM_MENU_BTNS; i++) {
        int lx0 = g_menu_btns[i].x1 - MENU_PAD_X;
        int ly0 = g_menu_btns[i].y1 - MENU_PAD_Y;
        int lx1 = g_menu_btns[i].x2 - MENU_PAD_X;
        int ly1 = g_menu_btns[i].y2 - MENU_PAD_Y;
        fill_rrect(px, lx0, ly0, lx1, ly1, 14, g_menu_btns[i].bg_color, g_menu_btns[i].border_color);
        int cx = (lx0 + lx1) / 2;
        int cy = (ly0 + ly1) / 2;
        if (i < 4) {
            draw_triangle(px, cx, cy, 18, (int)i, 0xFFFFFFFFu);
        } else if (g_menu_btns[i].keycode == KEY_ESC) {
            /* Draw "ESC" centered, scale=4 (3*24 = 72w x 28h) */
            int sx = cx - 38, sy = cy - 14;
            draw_glyph(px, sx,      sy, 4, glyph_E, 0xFFFFFFFFu);
            draw_glyph(px, sx + 26, sy, 4, glyph_S, 0xFFFFFFFFu);
            draw_glyph(px, sx + 52, sy, 4, glyph_C, 0xFFFFFFFFu);
        } else if (g_menu_btns[i].keycode == KEY_ENTER) {
            /* Draw "OK" centered, scale=5 (2*30 = 60w x 35h) */
            int sx = cx - 28, sy = cy - 17;
            draw_glyph(px, sx,      sy, 5, glyph_O, 0xFFFFFFFFu);
            draw_glyph(px, sx + 32, sy, 5, glyph_K, 0xFFFFFFFFu);
        }
    }
}

/* ==================== Global Wayland Hooks State ==================== */
static void *(*real_dlsym)(void *handle, const char *symbol) = NULL;
static void *init_real_dlsym(void) {
    if (!real_dlsym) {
        real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.17");
        if (!real_dlsym) real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.34");
        if (!real_dlsym) real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.2.5");
    }
    return (void *)real_dlsym;
}

static struct wl_display *(*real_wl_display_connect)(const char *name) = NULL;
static struct wl_egl_window *(*real_wl_egl_window_create)(struct wl_surface *surface, int width, int height) = NULL;
static void (*real_wl_egl_window_resize)(struct wl_egl_window *egl_window, int width, int height, int dx, int dy) = NULL;
static int (*real_wl_proxy_add_listener)(struct wl_proxy *proxy, void (**implementation)(void), void *data) = NULL;

static struct wl_display *g_dpy = NULL;
static struct wl_compositor *g_comp = NULL;
static struct wl_subcompositor *g_subcomp = NULL;
static struct wl_shm *g_shm = NULL;

static struct wl_surface *g_sdl_surface = NULL;
static struct wl_surface *g_child_surface = NULL;
static struct wl_subsurface *g_subsurface = NULL;
static struct wl_surface *g_menu_surface = NULL;
static struct wl_subsurface *g_menu_subsurface = NULL;
static struct wl_buffer *g_menu_buf = NULL;
static struct wl_buffer *g_bg_buf = NULL;
static struct xdg_toplevel *g_toplevel = NULL;

static int g_configured = 0;
static int g_bg_attached = 0;
static volatile int g_menu_visible = 0;
static volatile int g_swallowed_finger = -1;
static int g_watcher_started = 0;
static pthread_mutex_t g_wl_mtx = PTHREAD_MUTEX_INITIALIZER;

static void reg_global(void *data, struct wl_registry *reg, uint32_t name, const char *iface, uint32_t ver) {
    (void)data;
    if (strcmp(iface, "wl_compositor") == 0) {
        g_comp = my_registry_bind(reg, name, &wl_compositor_interface, ver < 4 ? ver : 4);
    } else if (strcmp(iface, "wl_subcompositor") == 0) {
        g_subcomp = my_registry_bind(reg, name, &wl_subcompositor_interface, 1);
    } else if (strcmp(iface, "wl_shm") == 0) {
        g_shm = my_registry_bind(reg, name, &wl_shm_interface, 1);
    }
}
static void reg_remove(void *data, struct wl_registry *reg, uint32_t name) {
    (void)data; (void)reg; (void)name;
}
static const struct wl_registry_listener reg_listener = { reg_global, reg_remove };

static void attach_black_480_bg(struct wl_surface *surf) {
    if (!g_shm || !surf) return;
    int w = 960, h = 480, stride = w * 4;
    if (!g_bg_buf) {
        size_t size = (size_t)stride * h;
        int fd = shm_open("/hl_bg_shm", O_RDWR | O_CREAT | O_TRUNC, 0600);
        if (fd < 0) return;
        shm_unlink("/hl_bg_shm");
        if (ftruncate(fd, (off_t)size) < 0) { close(fd); return; }
        uint32_t *px = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
        if (px != MAP_FAILED) {
            for (size_t i = 0; i < (size_t)w * h; i++) px[i] = 0xFF000000u;
            munmap(px, size);
        }
        struct wl_shm_pool *pool = my_shm_create_pool(g_shm, fd, (int32_t)size);
        g_bg_buf = my_shm_pool_create_buffer(pool, 0, w, h, stride, WL_SHM_FORMAT_XRGB8888);
        my_shm_pool_destroy(pool);
        close(fd);
    }
    if (g_bg_buf) {
        my_surface_attach(surf, g_bg_buf, 0, 0);
        my_surface_damage(surf, 0, 0, w, h);
        my_surface_commit(surf);
    }
}

static void ensure_menu_buffer(void) {
    if (g_menu_buf || !g_shm) return;
    int stride = MENU_PAD_W * 4;
    size_t size = (size_t)stride * MENU_PAD_H;
    int fd = shm_open("/hl_menupad_shm", O_RDWR | O_CREAT | O_TRUNC, 0600);
    if (fd < 0) return;
    shm_unlink("/hl_menupad_shm");
    if (ftruncate(fd, (off_t)size) < 0) { close(fd); return; }
    uint32_t *px = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (px != MAP_FAILED) {
        memset(px, 0, size);
        render_menu_pad_pixels(px);
        munmap(px, size);
    }
    struct wl_shm_pool *pool = my_shm_create_pool(g_shm, fd, (int32_t)size);
    g_menu_buf = my_shm_pool_create_buffer(pool, 0, MENU_PAD_W, MENU_PAD_H, stride, WL_SHM_FORMAT_ARGB8888);
    my_shm_pool_destroy(pool);
    close(fd);
}

static void *menu_key_sender_thread(void *arg) {
    (void)arg;
    init_uinput();
    uint16_t code = 0;
    while (g_key_pipe[0] >= 0 && read(g_key_pipe[0], &code, sizeof(code)) == (ssize_t)sizeof(code)) {
        emit_key_sync(code);
    }
    return NULL;
}

static void *menu_watcher_thread(void *arg) {
    (void)arg;
    int last_vis = -1;
    while (1) {
        usleep(60000);
        if (!g_menu_surface || !g_dpy) continue;
        int want = is_in_pause_menu();
        if (want != last_vis) {
            pthread_mutex_lock(&g_wl_mtx);
            if (want) {
                ensure_menu_buffer();
                if (g_menu_buf) {
                    my_surface_attach(g_menu_surface, g_menu_buf, 0, 0);
                    my_surface_damage(g_menu_surface, 0, 0, MENU_PAD_W, MENU_PAD_H);
                    my_surface_commit(g_menu_surface);
                    wl_display_flush(g_dpy);
                    g_menu_visible = 1;
                }
            } else {
                my_surface_attach(g_menu_surface, NULL, 0, 0);
                my_surface_commit(g_menu_surface);
                wl_display_flush(g_dpy);
                g_menu_visible = 0;
                g_swallowed_finger = -1;
            }
            pthread_mutex_unlock(&g_wl_mtx);
            last_vis = want;
        }
    }
    return NULL;
}

/* ==================== Touch & Pointer Hooks (1:1 pass-through + menu pad intercept) ==================== */
static struct wl_touch_listener real_touch_listener = { 0 };
static struct wl_pointer_listener real_pointer_listener = { 0 };
static struct xdg_toplevel_listener real_toplevel_listener = { 0 };

static void hook_touch_down(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time,
                            struct wl_surface *surface, int32_t id, wl_fixed_t x, wl_fixed_t y) {
    if (g_menu_visible) {
        int tx = (int)wl_fixed_to_double(x);
        int ty = (int)wl_fixed_to_double(y);
        for (size_t i = 0; i < NUM_MENU_BTNS; i++) {
            if (tx >= g_menu_btns[i].x1 && tx <= g_menu_btns[i].x2 &&
                ty >= g_menu_btns[i].y1 && ty <= g_menu_btns[i].y2) {
                g_swallowed_finger = id;
                queue_menu_key(g_menu_btns[i].keycode);
                return;
            }
        }
    }
    if (real_touch_listener.down)
        real_touch_listener.down(data, touch, serial, time, surface, id, x, y);
}

static void hook_touch_up(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time, int32_t id) {
    if (g_swallowed_finger == id) {
        g_swallowed_finger = -1;
        return;
    }
    if (real_touch_listener.up)
        real_touch_listener.up(data, touch, serial, time, id);
}

static void hook_touch_motion(void *data, struct wl_touch *touch, uint32_t time, int32_t id, wl_fixed_t x, wl_fixed_t y) {
    if (g_swallowed_finger == id) return;
    if (real_touch_listener.motion)
        real_touch_listener.motion(data, touch, time, id, x, y);
}

static void hook_touch_frame(void *data, struct wl_touch *touch) {
    if (real_touch_listener.frame) real_touch_listener.frame(data, touch);
}
static void hook_touch_cancel(void *data, struct wl_touch *touch) {
    g_swallowed_finger = -1;
    if (real_touch_listener.cancel) real_touch_listener.cancel(data, touch);
}
static void hook_touch_shape(void *data, struct wl_touch *touch, int32_t id, wl_fixed_t major, wl_fixed_t minor) {
    if (real_touch_listener.shape) real_touch_listener.shape(data, touch, id, major, minor);
}
static void hook_touch_orientation(void *data, struct wl_touch *touch, int32_t id, wl_fixed_t orientation) {
    if (real_touch_listener.orientation) real_touch_listener.orientation(data, touch, id, orientation);
}

static const struct wl_touch_listener hook_touch_listener_impl = {
    .down = hook_touch_down,
    .up = hook_touch_up,
    .motion = hook_touch_motion,
    .frame = hook_touch_frame,
    .cancel = hook_touch_cancel,
    .shape = hook_touch_shape,
    .orientation = hook_touch_orientation,
};

static void hook_pointer_enter(void *data, struct wl_pointer *pointer, uint32_t serial,
                               struct wl_surface *surface, wl_fixed_t sx, wl_fixed_t sy) {
    if (real_pointer_listener.enter) real_pointer_listener.enter(data, pointer, serial, surface, sx, sy);
}
static void hook_pointer_leave(void *data, struct wl_pointer *pointer, uint32_t serial, struct wl_surface *surface) {
    if (real_pointer_listener.leave) real_pointer_listener.leave(data, pointer, serial, surface);
}
static void hook_pointer_motion(void *data, struct wl_pointer *pointer, uint32_t time, wl_fixed_t sx, wl_fixed_t sy) {
    if (real_pointer_listener.motion) real_pointer_listener.motion(data, pointer, time, sx, sy);
}
static void hook_pointer_button(void *data, struct wl_pointer *pointer, uint32_t serial, uint32_t time, uint32_t button, uint32_t state) {
    if (real_pointer_listener.button) real_pointer_listener.button(data, pointer, serial, time, button, state);
}
static void hook_pointer_axis(void *data, struct wl_pointer *pointer, uint32_t time, uint32_t axis, wl_fixed_t value) {
    if (real_pointer_listener.axis) real_pointer_listener.axis(data, pointer, time, axis, value);
}
static void hook_pointer_frame(void *data, struct wl_pointer *pointer) {
    if (real_pointer_listener.frame) real_pointer_listener.frame(data, pointer);
}
static void hook_pointer_axis_source(void *data, struct wl_pointer *pointer, uint32_t axis_source) {
    if (real_pointer_listener.axis_source) real_pointer_listener.axis_source(data, pointer, axis_source);
}
static void hook_pointer_axis_stop(void *data, struct wl_pointer *pointer, uint32_t time, uint32_t axis) {
    if (real_pointer_listener.axis_stop) real_pointer_listener.axis_stop(data, pointer, time, axis);
}
static void hook_pointer_axis_discrete(void *data, struct wl_pointer *pointer, uint32_t axis, int32_t discrete) {
    if (real_pointer_listener.axis_discrete) real_pointer_listener.axis_discrete(data, pointer, axis, discrete);
}

static const struct wl_pointer_listener hook_pointer_listener_impl = {
    .enter = hook_pointer_enter,
    .leave = hook_pointer_leave,
    .motion = hook_pointer_motion,
    .button = hook_pointer_button,
    .axis = hook_pointer_axis,
    .frame = hook_pointer_frame,
    .axis_source = hook_pointer_axis_source,
    .axis_stop = hook_pointer_axis_stop,
    .axis_discrete = hook_pointer_axis_discrete,
};

static void hook_toplevel_configure(void *data, struct xdg_toplevel *toplevel,
                                    int32_t width, int32_t height, struct wl_array *states) {
    (void)width; (void)height;
    if (real_toplevel_listener.configure) {
        real_toplevel_listener.configure(data, toplevel, 960, 266, states);
    }
}
static void hook_toplevel_close(void *data, struct xdg_toplevel *toplevel) {
    if (real_toplevel_listener.close) real_toplevel_listener.close(data, toplevel);
}
static void hook_toplevel_configure_bounds(void *data, struct xdg_toplevel *toplevel, int32_t width, int32_t height) {
    if (real_toplevel_listener.configure_bounds) real_toplevel_listener.configure_bounds(data, toplevel, width, height);
}
static void hook_toplevel_wm_capabilities(void *data, struct xdg_toplevel *toplevel, struct wl_array *capabilities) {
    if (real_toplevel_listener.wm_capabilities) real_toplevel_listener.wm_capabilities(data, toplevel, capabilities);
}

static const struct xdg_toplevel_listener hook_toplevel_listener_impl = {
    .configure = hook_toplevel_configure,
    .close = hook_toplevel_close,
    .configure_bounds = hook_toplevel_configure_bounds,
    .wm_capabilities = hook_toplevel_wm_capabilities,
};

/* ==================== Intercepted Wayland Entry Points ==================== */
struct wl_display *wl_display_connect(const char *name) {
    if (!real_wl_display_connect) {
        void *h = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-client.so", RTLD_LAZY | RTLD_GLOBAL);
        init_real_dlsym();
        real_wl_display_connect = real_dlsym ? real_dlsym(h ? h : RTLD_NEXT, "wl_display_connect") : NULL;
    }
    g_dpy = real_wl_display_connect(name);
    if (g_dpy) {
        struct wl_registry *reg = my_display_get_registry(g_dpy);
        if (!real_wl_proxy_add_listener) {
            void *h = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_GLOBAL);
            real_wl_proxy_add_listener = real_dlsym ? real_dlsym(h ? h : RTLD_NEXT, "wl_proxy_add_listener") : NULL;
        }
        if (real_wl_proxy_add_listener) {
            real_wl_proxy_add_listener((struct wl_proxy *)reg, (void (**)(void))&reg_listener, NULL);
        }
        wl_display_roundtrip(g_dpy);
    }
    return g_dpy;
}

struct wl_egl_window *wl_egl_window_create(struct wl_surface *surface, int width, int height) {
    if (!real_wl_egl_window_create) {
        void *h = dlopen("libwayland-egl.so.1", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-egl.so", RTLD_LAZY | RTLD_GLOBAL);
        init_real_dlsym();
        real_wl_egl_window_create = real_dlsym ? real_dlsym(h ? h : RTLD_NEXT, "wl_egl_window_create") : NULL;
    }
    g_sdl_surface = surface;
    if (g_comp && g_subcomp && surface) {
        if (g_configured && !g_bg_attached) {
            attach_black_480_bg(surface);
            g_bg_attached = 1;
        }
        g_child_surface = my_compositor_create_surface(g_comp);
        g_subsurface = my_subcompositor_get_subsurface(g_subcomp, g_child_surface, surface);
        /* Weston already centers 960x266 surface at y=107, so subsurface offset is (0, 0) */
        my_subsurface_set_position(g_subsurface, 0, 0);
        my_subsurface_set_desync(g_subsurface);

        struct wl_region *empty_region = my_compositor_create_region(g_comp);
        my_surface_set_input_region(g_child_surface, empty_region);
        my_region_destroy(empty_region);
        my_surface_commit(g_child_surface);

        /* Create pause-menu navigation overlay subsurface above child surface */
        g_menu_surface = my_compositor_create_surface(g_comp);
        g_menu_subsurface = my_subcompositor_get_subsurface(g_subcomp, g_menu_surface, surface);
        my_subsurface_set_position(g_menu_subsurface, MENU_PAD_X, MENU_PAD_Y);
        my_subsurface_place_above(g_menu_subsurface, g_child_surface);
        my_subsurface_set_desync(g_menu_subsurface);

        struct wl_region *empty_menu = my_compositor_create_region(g_comp);
        my_surface_set_input_region(g_menu_surface, empty_menu);
        my_region_destroy(empty_menu);
        my_surface_commit(g_menu_surface);

        if (!g_watcher_started) {
            g_watcher_started = 1;
            if (pipe(g_key_pipe) == 0) {
                pthread_t tid1, tid2;
                pthread_create(&tid1, NULL, menu_key_sender_thread, NULL);
                pthread_detach(tid1);
                pthread_create(&tid2, NULL, menu_watcher_thread, NULL);
                pthread_detach(tid2);
            }
        }
        return real_wl_egl_window_create(g_child_surface, 960, 266);
    }
    return real_wl_egl_window_create(surface, width, height);
}

void wl_egl_window_resize(struct wl_egl_window *egl_window, int width, int height, int dx, int dy) {
    if (!real_wl_egl_window_resize) {
        void *h = dlopen("libwayland-egl.so.1", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-egl.so", RTLD_LAZY | RTLD_GLOBAL);
        init_real_dlsym();
        real_wl_egl_window_resize = real_dlsym ? real_dlsym(h ? h : RTLD_NEXT, "wl_egl_window_resize") : NULL;
    }
    if (g_child_surface) {
        if (g_configured && g_sdl_surface && !g_bg_attached) {
            attach_black_480_bg(g_sdl_surface);
            g_bg_attached = 1;
        }
        real_wl_egl_window_resize(egl_window, 960, 266, dx, dy);
        return;
    }
    real_wl_egl_window_resize(egl_window, width, height, dx, dy);
}

int wl_proxy_add_listener(struct wl_proxy *proxy, void (**implementation)(void), void *data) {
    if (!real_wl_proxy_add_listener) {
        void *h = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-client.so", RTLD_LAZY | RTLD_GLOBAL);
        init_real_dlsym();
        real_wl_proxy_add_listener = real_dlsym ? real_dlsym(h ? h : RTLD_NEXT, "wl_proxy_add_listener") : NULL;
    }
    const char *cls = wl_proxy_get_class(proxy);
    if (cls) {
        if (strcmp(cls, "wl_touch") == 0 && implementation) {
            memcpy(&real_touch_listener, implementation, sizeof(real_touch_listener));
            return real_wl_proxy_add_listener(proxy, (void (**)(void))&hook_touch_listener_impl, data);
        }
        if (strcmp(cls, "wl_pointer") == 0 && implementation) {
            memcpy(&real_pointer_listener, implementation, sizeof(real_pointer_listener));
            return real_wl_proxy_add_listener(proxy, (void (**)(void))&hook_pointer_listener_impl, data);
        }
        if (strcmp(cls, "xdg_toplevel") == 0 && implementation) {
            memcpy(&real_toplevel_listener, implementation, sizeof(real_toplevel_listener));
            g_toplevel = (struct xdg_toplevel *)proxy;
            int r = real_wl_proxy_add_listener(proxy, (void (**)(void))&hook_toplevel_listener_impl, data);
            my_xdg_toplevel_set_fullscreen(g_toplevel);
            return r;
        }
    }
    return real_wl_proxy_add_listener(proxy, implementation, data);
}

static struct wl_proxy *(*real_wl_proxy_marshal_array_flags)(struct wl_proxy *proxy, uint32_t opcode,
                                                             const struct wl_interface *interface,
                                                             uint32_t version, uint32_t flags,
                                                             union wl_argument *args) = NULL;
static void (*real_wl_proxy_marshal_array)(struct wl_proxy *p, uint32_t opcode, union wl_argument *args) = NULL;

static void init_real_marshals(void) {
    if (!real_wl_proxy_marshal_array_flags) {
        void *h = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-client.so", RTLD_LAZY | RTLD_GLOBAL);
        init_real_dlsym();
        if (real_dlsym) {
            real_wl_proxy_marshal_array_flags = real_dlsym(h ? h : RTLD_NEXT, "wl_proxy_marshal_array_flags");
            real_wl_proxy_marshal_array = real_dlsym(h ? h : RTLD_NEXT, "wl_proxy_marshal_array");
        }
    }
}

static int should_block_toplevel_opcode(struct wl_proxy *proxy, uint32_t opcode) {
    const char *cls = wl_proxy_get_class(proxy);
    if (cls && strcmp(cls, "xdg_toplevel") == 0) {
        if (opcode == 12 || opcode == 10 || opcode == 5 || opcode == 6) return 1;
    }
    return 0;
}

static void maybe_attach_bg_on_ack(struct wl_proxy *proxy, uint32_t opcode) {
    if (!g_bg_attached && g_sdl_surface && opcode == 4) {
        const char *cls = wl_proxy_get_class(proxy);
        if (cls && strcmp(cls, "xdg_surface") == 0) {
            g_configured = 1;
            g_bg_attached = 1;
            attach_black_480_bg(g_sdl_surface);
        }
    }
}

struct wl_proxy *wl_proxy_marshal_array_flags(struct wl_proxy *proxy, uint32_t opcode,
                                             const struct wl_interface *interface,
                                             uint32_t version, uint32_t flags,
                                             union wl_argument *args) {
    init_real_marshals();
    if (should_block_toplevel_opcode(proxy, opcode)) return NULL;
    struct wl_proxy *ret = real_wl_proxy_marshal_array_flags
        ? real_wl_proxy_marshal_array_flags(proxy, opcode, interface, version, flags, args)
        : NULL;
    maybe_attach_bg_on_ack(proxy, opcode);
    return ret;
}

void wl_proxy_marshal_array(struct wl_proxy *p, uint32_t opcode, union wl_argument *args) {
    init_real_marshals();
    if (should_block_toplevel_opcode(p, opcode)) return;
    if (real_wl_proxy_marshal_array) real_wl_proxy_marshal_array(p, opcode, args);
    maybe_attach_bg_on_ack(p, opcode);
}

void *SDL_LoadFunction(void *handle, const char *name) {
    init_real_dlsym();
    void *(*real_sdl_load)(void *, const char *) = real_dlsym ? real_dlsym(RTLD_NEXT, "SDL_LoadFunction") : NULL;
    if (name) {
        if (strcmp(name, "wl_display_connect") == 0) return (void *)wl_display_connect;
        if (strcmp(name, "wl_egl_window_create") == 0) return (void *)wl_egl_window_create;
        if (strcmp(name, "wl_egl_window_resize") == 0) return (void *)wl_egl_window_resize;
        if (strcmp(name, "wl_proxy_add_listener") == 0) return (void *)wl_proxy_add_listener;
        if (strcmp(name, "wl_proxy_marshal_array_flags") == 0) return (void *)wl_proxy_marshal_array_flags;
        if (strcmp(name, "wl_proxy_marshal_array") == 0) return (void *)wl_proxy_marshal_array;
    }
    if (real_sdl_load) return real_sdl_load(handle, name);
    return real_dlsym ? real_dlsym(handle, name) : NULL;
}

void *dlsym(void *handle, const char *symbol) {
    init_real_dlsym();
    if (strcmp(symbol, "wl_display_connect") == 0) return (void *)wl_display_connect;
    if (strcmp(symbol, "wl_egl_window_create") == 0) return (void *)wl_egl_window_create;
    if (strcmp(symbol, "wl_egl_window_resize") == 0) return (void *)wl_egl_window_resize;
    if (strcmp(symbol, "wl_proxy_add_listener") == 0) return (void *)wl_proxy_add_listener;
    if (strcmp(symbol, "wl_proxy_marshal_array_flags") == 0) return (void *)wl_proxy_marshal_array_flags;
    if (strcmp(symbol, "wl_proxy_marshal_array") == 0) return (void *)wl_proxy_marshal_array;
    if (strcmp(symbol, "SDL_LoadFunction") == 0) return (void *)SDL_LoadFunction;
    return real_dlsym ? real_dlsym(handle, symbol) : NULL;
}
