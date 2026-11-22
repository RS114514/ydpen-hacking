#define _GNU_SOURCE 1
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <fcntl.h>
#include <unistd.h>
#include <wayland-client.h>
#include "xdg-shell-client-protocol.h"

static void *(*real_dlsym)(void *handle, const char *symbol) = NULL;
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
static struct xdg_toplevel *g_toplevel = NULL;

/* Registry listener to bind compositor, subcompositor and shm */
static void reg_global(void *data, struct wl_registry *reg, uint32_t name, const char *iface, uint32_t ver) {
    (void)data;
    if (strcmp(iface, "wl_compositor") == 0) {
        g_comp = wl_registry_bind(reg, name, &wl_compositor_interface, ver < 4 ? ver : 4);
    } else if (strcmp(iface, "wl_subcompositor") == 0) {
        g_subcomp = wl_registry_bind(reg, name, &wl_subcompositor_interface, 1);
    } else if (strcmp(iface, "wl_shm") == 0) {
        g_shm = wl_registry_bind(reg, name, &wl_shm_interface, 1);
    }
}
static void reg_remove(void *data, struct wl_registry *reg, uint32_t name) {
    (void)data; (void)reg; (void)name;
}
static const struct wl_registry_listener reg_listener = { reg_global, reg_remove };

static void attach_black_480_bg(struct wl_surface *surf) {
    if (!g_shm || !surf) return;
    int w = 960, h = 480, stride = w * 4;
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
    struct wl_shm_pool *pool = wl_shm_create_pool(g_shm, fd, (int32_t)size);
    struct wl_buffer *buf = wl_shm_pool_create_buffer(pool, 0, w, h, stride, WL_SHM_FORMAT_XRGB8888);
    wl_shm_pool_destroy(pool);
    close(fd);
    wl_surface_attach(surf, buf, 0, 0);
    wl_surface_damage(surf, 0, 0, w, h);
    wl_surface_commit(surf);
}

/* Touch listener wrapper: adjust sy from 107..372 to 0..265 */
static struct wl_touch_listener real_touch_listener = { 0 };
static int have_real_touch_listener = 0;

static void hook_touch_down(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time,
                            struct wl_surface *surface, int32_t id, wl_fixed_t x, wl_fixed_t y) {
    wl_fixed_t off = wl_fixed_from_int(107);
    wl_fixed_t max_y = wl_fixed_from_int(265);
    wl_fixed_t adj_y = y - off;
    if (adj_y < 0) adj_y = 0;
    if (adj_y > max_y) adj_y = max_y;
    if (real_touch_listener.down)
        real_touch_listener.down(data, touch, serial, time, surface, id, x, adj_y);
}

static void hook_touch_up(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time, int32_t id) {
    if (real_touch_listener.up)
        real_touch_listener.up(data, touch, serial, time, id);
}

static void hook_touch_motion(void *data, struct wl_touch *touch, uint32_t time, int32_t id, wl_fixed_t x, wl_fixed_t y) {
    wl_fixed_t off = wl_fixed_from_int(107);
    wl_fixed_t max_y = wl_fixed_from_int(265);
    wl_fixed_t adj_y = y - off;
    if (adj_y < 0) adj_y = 0;
    if (adj_y > max_y) adj_y = max_y;
    if (real_touch_listener.motion)
        real_touch_listener.motion(data, touch, time, id, x, adj_y);
}

static void hook_touch_frame(void *data, struct wl_touch *touch) {
    if (real_touch_listener.frame)
        real_touch_listener.frame(data, touch);
}

static void hook_touch_cancel(void *data, struct wl_touch *touch) {
    if (real_touch_listener.cancel)
        real_touch_listener.cancel(data, touch);
}

static void hook_touch_shape(void *data, struct wl_touch *touch, int32_t id, wl_fixed_t major, wl_fixed_t minor) {
    if (real_touch_listener.shape)
        real_touch_listener.shape(data, touch, id, major, minor);
}

static void hook_touch_orientation(void *data, struct wl_touch *touch, int32_t id, wl_fixed_t orientation) {
    if (real_touch_listener.orientation)
        real_touch_listener.orientation(data, touch, id, orientation);
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

/* Pointer listener wrapper: adjust sy from 107..372 to 0..265 */
static struct wl_pointer_listener real_pointer_listener = { 0 };
static int have_real_pointer_listener = 0;

static void hook_pointer_enter(void *data, struct wl_pointer *pointer, uint32_t serial,
                               struct wl_surface *surface, wl_fixed_t sx, wl_fixed_t sy) {
    wl_fixed_t off = wl_fixed_from_int(107);
    wl_fixed_t max_y = wl_fixed_from_int(265);
    wl_fixed_t adj_y = sy - off;
    if (adj_y < 0) adj_y = 0;
    if (adj_y > max_y) adj_y = max_y;
    if (real_pointer_listener.enter)
        real_pointer_listener.enter(data, pointer, serial, surface, sx, adj_y);
}

static void hook_pointer_leave(void *data, struct wl_pointer *pointer, uint32_t serial, struct wl_surface *surface) {
    if (real_pointer_listener.leave)
        real_pointer_listener.leave(data, pointer, serial, surface);
}

static void hook_pointer_motion(void *data, struct wl_pointer *pointer, uint32_t time, wl_fixed_t sx, wl_fixed_t sy) {
    wl_fixed_t off = wl_fixed_from_int(107);
    wl_fixed_t max_y = wl_fixed_from_int(265);
    wl_fixed_t adj_y = sy - off;
    if (adj_y < 0) adj_y = 0;
    if (adj_y > max_y) adj_y = max_y;
    if (real_pointer_listener.motion)
        real_pointer_listener.motion(data, pointer, time, sx, adj_y);
}

static void hook_pointer_button(void *data, struct wl_pointer *pointer, uint32_t serial, uint32_t time, uint32_t button, uint32_t state) {
    if (real_pointer_listener.button)
        real_pointer_listener.button(data, pointer, serial, time, button, state);
}

static void hook_pointer_axis(void *data, struct wl_pointer *pointer, uint32_t time, uint32_t axis, wl_fixed_t value) {
    if (real_pointer_listener.axis)
        real_pointer_listener.axis(data, pointer, time, axis, value);
}

static void hook_pointer_frame(void *data, struct wl_pointer *pointer) {
    if (real_pointer_listener.frame)
        real_pointer_listener.frame(data, pointer);
}

static void hook_pointer_axis_source(void *data, struct wl_pointer *pointer, uint32_t axis_source) {
    if (real_pointer_listener.axis_source)
        real_pointer_listener.axis_source(data, pointer, axis_source);
}

static void hook_pointer_axis_stop(void *data, struct wl_pointer *pointer, uint32_t time, uint32_t axis) {
    if (real_pointer_listener.axis_stop)
        real_pointer_listener.axis_stop(data, pointer, time, axis);
}

static void hook_pointer_axis_discrete(void *data, struct wl_pointer *pointer, uint32_t axis, int32_t discrete) {
    if (real_pointer_listener.axis_discrete)
        real_pointer_listener.axis_discrete(data, pointer, axis, discrete);
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

/* xdg_toplevel listener wrapper: force 960x266 to client and filter fullscreen state */
static struct xdg_toplevel_listener real_toplevel_listener = { 0 };
static int have_real_toplevel_listener = 0;

static void hook_toplevel_configure(void *data, struct xdg_toplevel *toplevel,
                                    int32_t width, int32_t height, struct wl_array *states) {
    (void)width; (void)height;
    /* Create a filtered copy of states without FULLSCREEN */
    struct wl_array filtered_states;
    wl_array_init(&filtered_states);
    if (states) {
        uint32_t *state;
        wl_array_for_each(state, states) {
            if (*state != XDG_TOPLEVEL_STATE_FULLSCREEN) {
                uint32_t *dest = wl_array_add(&filtered_states, sizeof(uint32_t));
                if (dest) *dest = *state;
            }
        }
    }
    if (real_toplevel_listener.configure) {
        real_toplevel_listener.configure(data, toplevel, 960, 266, &filtered_states);
    }
    wl_array_release(&filtered_states);
}

static void hook_toplevel_close(void *data, struct xdg_toplevel *toplevel) {
    if (real_toplevel_listener.close)
        real_toplevel_listener.close(data, toplevel);
}

static void hook_toplevel_configure_bounds(void *data, struct xdg_toplevel *toplevel, int32_t width, int32_t height) {
    if (real_toplevel_listener.configure_bounds)
        real_toplevel_listener.configure_bounds(data, toplevel, width, height);
}

static void hook_toplevel_wm_capabilities(void *data, struct xdg_toplevel *toplevel, struct wl_array *capabilities) {
    if (real_toplevel_listener.wm_capabilities)
        real_toplevel_listener.wm_capabilities(data, toplevel, capabilities);
}

static const struct xdg_toplevel_listener hook_toplevel_listener_impl = {
    .configure = hook_toplevel_configure,
    .close = hook_toplevel_close,
    .configure_bounds = hook_toplevel_configure_bounds,
    .wm_capabilities = hook_toplevel_wm_capabilities,
};

/* Hook wl_display_connect */
struct wl_display *wl_display_connect(const char *name) {
    if (!real_wl_display_connect) {
        void *h = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-client.so", RTLD_LAZY | RTLD_GLOBAL);
        real_wl_display_connect = dlsym(h ? h : RTLD_NEXT, "wl_display_connect");
    }
    g_dpy = real_wl_display_connect(name);
    if (g_dpy) {
        struct wl_registry *reg = wl_display_get_registry(g_dpy);
        wl_registry_add_listener(reg, &reg_listener, NULL);
        wl_display_roundtrip(g_dpy);
    }
    return g_dpy;
}

/* Hook wl_egl_window_create */
struct wl_egl_window *wl_egl_window_create(struct wl_surface *surface, int width, int height) {
    if (!real_wl_egl_window_create) {
        void *h = dlopen("libwayland-egl.so.1", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-egl.so", RTLD_LAZY | RTLD_GLOBAL);
        real_wl_egl_window_create = dlsym(h ? h : RTLD_NEXT, "wl_egl_window_create");
    }
    g_sdl_surface = surface;
    if (g_comp && g_subcomp && surface) {
        attach_black_480_bg(surface);
        g_child_surface = wl_compositor_create_surface(g_comp);
        g_subsurface = wl_subcompositor_get_subsurface(g_subcomp, g_child_surface, surface);
        wl_subsurface_set_position(g_subsurface, 0, 107);
        wl_subsurface_set_desync(g_subsurface);

        /* Pass empty input region on child surface so all touch/pointer events go to parent surface */
        struct wl_region *empty_region = wl_compositor_create_region(g_comp);
        wl_surface_set_input_region(g_child_surface, empty_region);
        wl_region_destroy(empty_region);

        wl_surface_commit(g_child_surface);
        wl_surface_commit(surface);
        fprintf(stderr, "[wl_center] Subsurface placed strictly at (0, 107) size 960x266\n");
        return real_wl_egl_window_create(g_child_surface, 960, 266);
    }
    return real_wl_egl_window_create(surface, width, height);
}

/* Hook wl_egl_window_resize */
void wl_egl_window_resize(struct wl_egl_window *egl_window, int width, int height, int dx, int dy) {
    if (!real_wl_egl_window_resize) {
        void *h = dlopen("libwayland-egl.so.1", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-egl.so", RTLD_LAZY | RTLD_GLOBAL);
        real_wl_egl_window_resize = dlsym(h ? h : RTLD_NEXT, "wl_egl_window_resize");
    }
    if (g_child_surface) {
        if (g_sdl_surface) attach_black_480_bg(g_sdl_surface);
        real_wl_egl_window_resize(egl_window, 960, 266, dx, dy);
        return;
    }
    real_wl_egl_window_resize(egl_window, width, height, dx, dy);
}

/* Hook wl_proxy_add_listener to intercept touch, pointer and toplevel */
int wl_proxy_add_listener(struct wl_proxy *proxy, void (**implementation)(void), void *data) {
    if (!real_wl_proxy_add_listener) {
        void *h = dlopen("libwayland-client.so.0", RTLD_LAZY | RTLD_GLOBAL);
        if (!h) h = dlopen("libwayland-client.so", RTLD_LAZY | RTLD_GLOBAL);
        real_wl_proxy_add_listener = dlsym(h ? h : RTLD_NEXT, "wl_proxy_add_listener");
    }
    const char *cls = wl_proxy_get_class(proxy);
    if (cls) {
        if (strcmp(cls, "wl_touch") == 0 && implementation) {
            memcpy(&real_touch_listener, implementation, sizeof(real_touch_listener));
            have_real_touch_listener = 1;
            return real_wl_proxy_add_listener(proxy, (void (**)(void))&hook_touch_listener_impl, data);
        }
        if (strcmp(cls, "wl_pointer") == 0 && implementation) {
            memcpy(&real_pointer_listener, implementation, sizeof(real_pointer_listener));
            have_real_pointer_listener = 1;
            return real_wl_proxy_add_listener(proxy, (void (**)(void))&hook_pointer_listener_impl, data);
        }
        if (strcmp(cls, "xdg_toplevel") == 0 && implementation) {
            memcpy(&real_toplevel_listener, implementation, sizeof(real_toplevel_listener));
            have_real_toplevel_listener = 1;
            g_toplevel = (struct xdg_toplevel *)proxy;
            xdg_toplevel_set_fullscreen(g_toplevel, NULL);
            fprintf(stderr, "[wl_center] Locked toplevel to fullscreen (0, 0)\n");
            return real_wl_proxy_add_listener(proxy, (void (**)(void))&hook_toplevel_listener_impl, data);
        }
    }
    return real_wl_proxy_add_listener(proxy, implementation, data);
}

/* Intercept SDL_LoadFunction if SDL calls it internally */
void *SDL_LoadFunction(void *handle, const char *name) {
    if (!real_dlsym) real_dlsym = dlsym(RTLD_NEXT, "dlsym");
    void *(*real_sdl_load)(void *, const char *) = dlsym(RTLD_NEXT, "SDL_LoadFunction");
    if (name) {
        if (strcmp(name, "wl_display_connect") == 0) return (void *)wl_display_connect;
        if (strcmp(name, "wl_egl_window_create") == 0) return (void *)wl_egl_window_create;
        if (strcmp(name, "wl_egl_window_resize") == 0) return (void *)wl_egl_window_resize;
        if (strcmp(name, "wl_proxy_add_listener") == 0) return (void *)wl_proxy_add_listener;
    }
    if (real_sdl_load) return real_sdl_load(handle, name);
    return dlsym(handle, name);
}

/* Intercept dlsym */
void *dlsym(void *handle, const char *symbol) {
    if (!real_dlsym) {
        real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.17");
        if (!real_dlsym) real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.34");
        if (!real_dlsym) real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.2.5");
        if (!real_dlsym) real_dlsym = __builtin_extract_return_addr(__builtin_return_address(0)); // fallback
    }
    if (symbol) {
        if (strcmp(symbol, "wl_display_connect") == 0) return (void *)wl_display_connect;
        if (strcmp(symbol, "wl_egl_window_create") == 0) return (void *)wl_egl_window_create;
        if (strcmp(symbol, "wl_egl_window_resize") == 0) return (void *)wl_egl_window_resize;
        if (strcmp(symbol, "wl_proxy_add_listener") == 0) return (void *)wl_proxy_add_listener;
        if (strcmp(symbol, "SDL_LoadFunction") == 0) return (void *)SDL_LoadFunction;
    }
    return real_dlsym(handle, symbol);
}
