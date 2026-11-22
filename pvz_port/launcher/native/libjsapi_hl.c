/* Half-Life Falcon bridge; game commands use the loopback XRCON endpoint. */

#define _GNU_SOURCE 1
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <poll.h>
#include <pthread.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#include "quickjs.h"

extern void registerCModuleLoader(const char *name,
                                 JSModuleDef *(*loader)(JSContext *ctx, const char *module_name));

static pid_t g_hl_pid = 0;
static char g_save_file[512];
static pthread_mutex_t g_hl_lock = PTHREAD_MUTEX_INITIALIZER;

/* XRCON reserves one byte of its 4096-byte command buffer for NUL. */
#define HL_XRCON_HEADER_SIZE 12
#define HL_XRCON_MAX_COMMAND 4095
#define HL_XRCON_TIMEOUT_MS 1000
#define HL_SAVE_TIMEOUT_MS 3000
#define HL_EXIT_TIMEOUT_MS 5000

static int64_t monotonic_ms(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (int64_t)ts.tv_sec * 1000 + ts.tv_nsec / 1000000;
}

static int wait_socket(int fd, short events, int64_t deadline)
{
    for (;;) {
        int64_t remaining = deadline - monotonic_ms();
        if (remaining <= 0) {
            errno = ETIMEDOUT;
            return 0;
        }
        struct pollfd pfd = { fd, events, 0 };
        int rc = poll(&pfd, 1, (int)remaining);
        if (rc > 0) {
            if (pfd.revents & POLLNVAL) {
                errno = EBADF;
                return 0;
            }
            return (pfd.revents & (events | POLLERR | POLLHUP)) != 0;
        }
        if (rc < 0 && errno != EINTR)
            return 0;
    }
}

/* Release the engine's single XRCON client slot after each transmission. */
static int send_xrcon(const char *cmd, size_t len)
{
    if (!cmd || len == 0 || len > HL_XRCON_MAX_COMMAND || memchr(cmd, '\0', len)) {
        errno = EINVAL;
        return 0;
    }

    unsigned char frame[HL_XRCON_HEADER_SIZE + HL_XRCON_MAX_COMMAND] =
        { 'C', 'M', 'N', 'D', 0, 0, 0, 0xD4, 0, 0, 0, 0 };
    size_t total = HL_XRCON_HEADER_SIZE + len;
    frame[8] = (unsigned char)(total >> 8);
    frame[9] = (unsigned char)total;
    memcpy(frame + HL_XRCON_HEADER_SIZE, cmd, len);

    int64_t deadline = monotonic_ms() + HL_XRCON_TIMEOUT_MS;
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0)
        return 0;
    int ok = 0;
    if (fcntl(fd, F_SETFD, FD_CLOEXEC) < 0 || fcntl(fd, F_SETFL, O_NONBLOCK) < 0)
        goto done;
#ifdef SO_NOSIGPIPE
    int no_sigpipe = 1;
    if (setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &no_sigpipe, sizeof(no_sigpipe)) < 0)
        goto done;
#endif
    struct sockaddr_in addr = { 0 };
    addr.sin_family = AF_INET;
    addr.sin_port = htons(27000);
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        if (errno != EINPROGRESS && errno != EINTR && errno != EALREADY)
            goto done;
        if (!wait_socket(fd, POLLOUT, deadline))
            goto done;
        int error = 0;
        socklen_t error_len = sizeof(error);
        if (getsockopt(fd, SOL_SOCKET, SO_ERROR, &error, &error_len) < 0)
            goto done;
        if (error) {
            errno = error;
            goto done;
        }
    }

    for (size_t sent = 0; sent < total;) {
        if (!wait_socket(fd, POLLOUT, deadline))
            goto done;
        int flags = 0;
#ifdef MSG_NOSIGNAL
        flags = MSG_NOSIGNAL;
#endif
        ssize_t n = send(fd, frame + sent, total - sent, flags);
        if (n > 0)
            sent += (size_t)n;
        else if (n == 0 || (errno != EINTR && errno != EAGAIN && errno != EWOULDBLOCK))
            goto done;
    }
    ok = 1;

    /* Drain the server handshake before close to avoid RST discarding CMND. */
    while (shutdown(fd, SHUT_WR) < 0) {
        if (errno != EINTR || monotonic_ms() >= deadline)
            goto done;
    }
    while (wait_socket(fd, POLLIN, deadline)) {
        unsigned char discard[1024];
        ssize_t n = recv(fd, discard, sizeof(discard), 0);
        if (n == 0)
            break;
        if (n < 0 && errno != EINTR && errno != EAGAIN && errno != EWOULDBLOCK) {
            ok = 0;
            break;
        }
    }
done:
    close(fd);
    return ok;
}

/* 检查并回收子进程；EINTR/未知错误不应丢失仍在运行的 PID。 */
static int is_game_running_locked(void)
{
    if (g_hl_pid <= 0)
        return 0;
    pid_t res = waitpid(g_hl_pid, NULL, WNOHANG);
    if (res == g_hl_pid || (res < 0 && errno == ECHILD)) {
        g_hl_pid = 0;
        return 0;
    }
    return 1;
}

static void poll_pause(int64_t deadline)
{
    int64_t remaining = deadline - monotonic_ms();
    if (remaining > 0)
        poll(NULL, 0, remaining < 20 ? (int)remaining : 20);
}

static int save_mtime_changed(const struct stat *before, const struct stat *after)
{
#ifdef __APPLE__
    return before->st_mtimespec.tv_sec != after->st_mtimespec.tv_sec ||
           before->st_mtimespec.tv_nsec != after->st_mtimespec.tv_nsec;
#else
    return before->st_mtim.tv_sec != after->st_mtim.tv_sec ||
           before->st_mtim.tv_nsec != after->st_mtim.tv_nsec;
#endif
}

/* A transmitted command is not proof that a new save reached the filesystem. */
static int save_game_locked(void)
{
    if (!is_game_running_locked() || !g_save_file[0])
        return 0;
    int64_t deadline = monotonic_ms() + HL_SAVE_TIMEOUT_MS;
    struct stat before, after;
    int existed = stat(g_save_file, &before) == 0;
    if (!existed && errno != ENOENT)
        return 0;
    if (!send_xrcon("save quick", sizeof("save quick") - 1))
        return 0;
    while (monotonic_ms() < deadline) {
        if (stat(g_save_file, &after) == 0 && S_ISREG(after.st_mode) && after.st_size > 0 &&
            (!existed || save_mtime_changed(&before, &after)))
            return 1;
        if (!is_game_running_locked())
            return 0;
        poll_pause(deadline);
    }
    return 0;
}

/* Only quit after confirmed save; timeout leaves the engine/PID intact. */
static int stop_game_locked(void)
{
    if (!is_game_running_locked())
        return 1;
    if (!save_game_locked())
        return 0;
    if (!is_game_running_locked())
        return 1;
    if (!send_xrcon("quit", sizeof("quit") - 1))
        return 0;
    int64_t deadline = monotonic_ms() + HL_EXIT_TIMEOUT_MS;
    while (is_game_running_locked()) {
        if (monotonic_ms() >= deadline)
            return 0;
        poll_pause(deadline);
    }
    return 1;
}

/* JS: hl.start(options) */
static JSValue js_hl_start(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    pthread_mutex_lock(&g_hl_lock);

    if (is_game_running_locked()) {
        pthread_mutex_unlock(&g_hl_lock);
        JSValue ret = JS_NewObject(ctx);
        JS_SetPropertyStr(ctx, ret, "ok", JS_NewBool(ctx, 1));
        JS_SetPropertyStr(ctx, ret, "alreadyRunning", JS_NewBool(ctx, 1));
        JS_SetPropertyStr(ctx, ret, "pid", JS_NewInt32(ctx, (int32_t)g_hl_pid));
        return ret;
    }

    const char *basedir = "/userdisk/halflife";
    const char *map = "c0a0";
    char map_buf[64] = "c0a0";
    char basedir_buf[256] = "/userdisk/halflife";
    int force_new = 0;

    if (argc > 0 && JS_IsObject(argv[0])) {
        JSValue b = JS_GetPropertyStr(ctx, argv[0], "basedir");
        if (JS_IsString(b)) {
            const char *s = JS_ToCString(ctx, b);
            if (s) {
                strncpy(basedir_buf, s, sizeof(basedir_buf) - 1);
                basedir = basedir_buf;
                JS_FreeCString(ctx, s);
            }
        }
        JS_FreeValue(ctx, b);

        JSValue m = JS_GetPropertyStr(ctx, argv[0], "map");
        if (JS_IsString(m)) {
            const char *s = JS_ToCString(ctx, m);
            if (s) {
                strncpy(map_buf, s, sizeof(map_buf) - 1);
                map = map_buf;
                force_new = 1;
                JS_FreeCString(ctx, s);
            }
        }
        JS_FreeValue(ctx, m);

        JSValue fn = JS_GetPropertyStr(ctx, argv[0], "forceNew");
        if (JS_IsBool(fn)) {
            force_new = JS_ToBool(ctx, fn);
        }
        JS_FreeValue(ctx, fn);
    }

    // 检查是否存在自动存档 quick.sav
    char save_file[512];
    snprintf(save_file, sizeof(save_file), "%s/valve/save/quick.sav", basedir);
    struct stat saved;
    int has_save = (!force_new && stat(save_file, &saved) == 0 &&
                    S_ISREG(saved.st_mode) && saved.st_size > 0 && access(save_file, R_OK) == 0);

    // 动态生成 auto_exec.cfg 供引擎在启动时直接执行，解决命令行 +map 偶现被吞的问题
    char auto_exec_path[512];
    snprintf(auto_exec_path, sizeof(auto_exec_path), "%s/valve/auto_exec.cfg", basedir);
    FILE *fcfg = fopen(auto_exec_path, "w");
    if (!fcfg) {
        int error = errno;
        pthread_mutex_unlock(&g_hl_lock);
        return JS_ThrowTypeError(ctx, "failed to open auto_exec.cfg: %s", strerror(error));
    }
    int written;
    if (has_save)
        written = fprintf(fcfg, "echo [AUTO] Resuming quick save...\nload quick\n");
    else
        written = fprintf(fcfg, "echo [AUTO] Starting new campaign...\nmap %s\n", map);
    int config_error = written < 0 ? (errno ? errno : EIO) : 0;
    if (fclose(fcfg) != 0 && !config_error)
        config_error = errno ? errno : EIO;
    if (config_error) {
        pthread_mutex_unlock(&g_hl_lock);
        return JS_ThrowTypeError(ctx, "failed to write auto_exec.cfg: %s", strerror(config_error));
    }

    char log_path[512];
    snprintf(log_path, sizeof(log_path), "%s/hl_runtime.log", basedir);
    pid_t pid = fork();
    if (pid < 0) {
        int error = errno;
        pthread_mutex_unlock(&g_hl_lock);
        return JS_ThrowTypeError(ctx, "failed to fork xash3d: %s", strerror(error));
    }

    if (pid == 0) {
        // 重定向输出到当前 basedir 的日志，不再把 stdin 当作引擎控制台。
        int log_fd = open(log_path, O_CREAT | O_WRONLY | O_TRUNC, 0666);
        if (log_fd >= 0) {
            dup2(log_fd, STDOUT_FILENO);
            dup2(log_fd, STDERR_FILENO);
            close(log_fd);
        }

        setenv("XDG_RUNTIME_DIR", "/var/run", 1);
        setenv("LD_LIBRARY_PATH", "/userdisk/halflife:/usr/lib:/lib", 1);
        setenv("WAYLAND_DISPLAY", "wayland-0", 1);
        setenv("SDL_TOUCH_MOUSE_EVENTS", "0", 1);
        setenv("SDL_MOUSE_TOUCH_EVENTS", "0", 1);
        if (access("/userdisk/halflife/libwl_center.so", R_OK) == 0) {
            setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1);
        } else if (access("/userdisk/app/8002026110400001/libs/libwl_center.so", R_OK) == 0) {
            setenv("LD_PRELOAD", "/userdisk/app/8002026110400001/libs/libwl_center.so", 1);
        }

        if (chdir(basedir) != 0) {
            _exit(126);
        }

        /* Wayland chooses placement; these dimensions only set the client viewport. */
        execl("./xash3d", "./xash3d",
              "-basedir", basedir,
              "-game", "valve",
              "-ref", "gles2",
              "-width", "960",
              "-height", "266",
              "+xrcon_address", "127.0.0.1:27000",
              "+xrcon_enable", "1",
              NULL);

        _exit(127);
    }

    // 父进程保存此次启动的实际存档路径。
    snprintf(g_save_file, sizeof(g_save_file), "%s", save_file);
    g_hl_pid = pid;

    pthread_mutex_unlock(&g_hl_lock);

    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "ok", JS_NewBool(ctx, 1));
    JS_SetPropertyStr(ctx, ret, "pid", JS_NewInt32(ctx, (int32_t)g_hl_pid));
    JS_SetPropertyStr(ctx, ret, "resumed", JS_NewBool(ctx, has_save));
    return ret;
}

/* JS: hl.sendCmd(cmdString) */
static JSValue js_hl_send_cmd(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    if (argc < 1)
        return JS_ThrowTypeError(ctx, "command string required");

    size_t len = 0;
    const char *cmd = JS_ToCStringLen(ctx, &len, argv[0]);
    if (!cmd)
        return JS_EXCEPTION;

    pthread_mutex_lock(&g_hl_lock);
    /* ok confirms a full CMND transmission, not execution by the engine. */
    int ok = is_game_running_locked() && send_xrcon(cmd, len);
    pthread_mutex_unlock(&g_hl_lock);

    JS_FreeCString(ctx, cmd);
    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "ok", JS_NewBool(ctx, ok));
    return ret;
}

/* JS: hl.isRunning() */
static JSValue js_hl_is_running(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    (void)argc;
    (void)argv;
    pthread_mutex_lock(&g_hl_lock);
    int running = is_game_running_locked();
    pthread_mutex_unlock(&g_hl_lock);
    return JS_NewBool(ctx, running);
}

/* JS: hl.stop() */
static JSValue js_hl_stop(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    (void)argc;
    (void)argv;
    pthread_mutex_lock(&g_hl_lock);
    int ok = stop_game_locked();
    pthread_mutex_unlock(&g_hl_lock);

    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "ok", JS_NewBool(ctx, ok));
    return ret;
}

/* JS: hl.save() */
static JSValue js_hl_save(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    (void)argc;
    (void)argv;
    pthread_mutex_lock(&g_hl_lock);
    int ok = save_game_locked();
    pthread_mutex_unlock(&g_hl_lock);
    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "ok", JS_NewBool(ctx, ok));
    return ret;
}

/* JS: hl.load() */
static JSValue js_hl_load(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    (void)argc;
    (void)argv;
    pthread_mutex_lock(&g_hl_lock);
    /* Like sendCmd, load only reports transmission, not completed loading. */
    int ok = is_game_running_locked() && send_xrcon("load quick", sizeof("load quick") - 1);
    pthread_mutex_unlock(&g_hl_lock);
    JSValue ret = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, ret, "ok", JS_NewBool(ctx, ok));
    return ret;
}

/* 导出函数列表 */
struct method_entry {
    const char *name;
    JSCFunction *fn;
    int nargs;
};

static const struct method_entry g_methods[] = {
    {"start", js_hl_start, 1},
    {"stop", js_hl_stop, 0},
    {"isRunning", js_hl_is_running, 0},
    {"sendCmd", js_hl_send_cmd, 1},
    {"save", js_hl_save, 0},
    {"load", js_hl_load, 0},
};
#define NMETHODS ((int)(sizeof(g_methods) / sizeof(g_methods[0])))

static int hl_module_init(JSContext *ctx, JSModuleDef *m)
{
    JSValue o = JS_NewObject(ctx);
    for (int i = 0; i < NMETHODS; i++) {
        JSValue f = JS_NewCFunction(ctx, g_methods[i].fn, g_methods[i].name, g_methods[i].nargs);
        JS_SetPropertyStr(ctx, o, g_methods[i].name, JS_DupValue(ctx, f));
        JS_SetModuleExport(ctx, m, g_methods[i].name, f);
    }
    JS_SetModuleExport(ctx, m, "default", JS_DupValue(ctx, o));
    JS_SetModuleExport(ctx, m, "hl", o);
    return 0;
}

static JSModuleDef *loader(JSContext *ctx, const char *module_name)
{
    if (strcmp(module_name, "hl") != 0)
        return NULL;
    JSModuleDef *m = JS_NewCModule(ctx, module_name, hl_module_init);
    if (!m)
        return NULL;
    JS_AddModuleExport(ctx, m, "default");
    JS_AddModuleExport(ctx, m, "hl");
    for (int i = 0; i < NMETHODS; i++) {
        JS_AddModuleExport(ctx, m, g_methods[i].name);
    }
    return m;
}

__attribute__((visibility("default"))) void custom_init_jsapis(void)
{
    registerCModuleLoader("hl", loader);
}
