/* PvZ Falcon bridge: fork the native PvZ-Portable binary with pen layout. */
#define _GNU_SOURCE 1
#include <errno.h>
#include <fcntl.h>
#include <pthread.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include "quickjs.h"

extern void registerCModuleLoader(const char *name,
                                 JSModuleDef *(*loader)(JSContext *ctx, const char *module_name));

static pid_t g_pid = 0;
static pthread_mutex_t g_lock = PTHREAD_MUTEX_INITIALIZER;
#define BASEDIR "/userdisk/pvz"

static int running_locked(void)
{
    if (g_pid <= 0) return 0;
    int st = 0;
    pid_t r = waitpid(g_pid, &st, WNOHANG);
    if (r == g_pid) { g_pid = 0; return 0; }
    return r == 0;
}

static JSValue js_start(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val; (void)argc; (void)argv;
    pthread_mutex_lock(&g_lock);
    if (running_locked()) { pthread_mutex_unlock(&g_lock); return JS_NewBool(ctx, 1); }
    char logpath[512];
    snprintf(logpath, sizeof logpath, "%s/pvz_runtime.log", BASEDIR);
    pid_t pid = fork();
    if (pid < 0) { pthread_mutex_unlock(&g_lock); return JS_ThrowTypeError(ctx, "fork failed: %s", strerror(errno)); }
    if (pid == 0) {
        int fd = open(logpath, O_CREAT | O_WRONLY | O_TRUNC, 0666);
        if (fd >= 0) { dup2(fd, STDOUT_FILENO); dup2(fd, STDERR_FILENO); close(fd); }
        setenv("XDG_RUNTIME_DIR", "/var/run", 1);
        setenv("WAYLAND_DISPLAY", "wayland-0", 1);
        setenv("LD_LIBRARY_PATH", BASEDIR "/libs:/usr/lib:/lib", 1);
        setenv("HOME", BASEDIR, 1);
        setenv("PVZ_PEN", "1", 1);
        if (chdir(BASEDIR) != 0) _exit(126);
        execl("./pvz-portable", "./pvz-portable",
              "-resdir", BASEDIR "/assets",
              "-savedir", BASEDIR "/save",
              NULL);
        _exit(127);
    }
    g_pid = pid;
    pthread_mutex_unlock(&g_lock);
    return JS_NewBool(ctx, 1);
}

static JSValue js_stop(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val; (void)argc; (void)argv;
    pthread_mutex_lock(&g_lock);
    int ok = 1;
    if (running_locked()) {
        kill(g_pid, SIGTERM);
        for (int i = 0; i < 50 && running_locked(); ++i) usleep(100000);
        if (running_locked()) { kill(g_pid, SIGKILL); waitpid(g_pid, NULL, 0); g_pid = 0; }
    }
    pthread_mutex_unlock(&g_lock);
    return JS_NewBool(ctx, ok);
}

static JSValue js_running(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val; (void)argc; (void)argv;
    pthread_mutex_lock(&g_lock);
    int r = running_locked();
    pthread_mutex_unlock(&g_lock);
    return JS_NewBool(ctx, r);
}

struct method_entry { const char *name; JSCFunction *fn; int nargs; };
static const struct method_entry g_methods[] = {
    {"start", js_start, 0},
    {"stop", js_stop, 0},
    {"isRunning", js_running, 0},
};
#define NMETHODS ((int)(sizeof(g_methods) / sizeof(g_methods[0])))

static int pvz_module_init(JSContext *ctx, JSModuleDef *m)
{
    JSValue o = JS_NewObject(ctx);
    for (int i = 0; i < NMETHODS; i++) {
        JSValue f = JS_NewCFunction(ctx, g_methods[i].fn, g_methods[i].name, g_methods[i].nargs);
        JS_SetPropertyStr(ctx, o, g_methods[i].name, JS_DupValue(ctx, f));
        JS_SetModuleExport(ctx, m, g_methods[i].name, f);
    }
    JS_SetModuleExport(ctx, m, "default", JS_DupValue(ctx, o));
    JS_SetModuleExport(ctx, m, "pvz", o);
    return 0;
}

static JSModuleDef *loader(JSContext *ctx, const char *module_name)
{
    if (strcmp(module_name, "pvz") != 0) return NULL;
    JSModuleDef *m = JS_NewCModule(ctx, module_name, pvz_module_init);
    if (!m) return NULL;
    JS_AddModuleExport(ctx, m, "default");
    JS_AddModuleExport(ctx, m, "pvz");
    for (int i = 0; i < NMETHODS; i++) JS_AddModuleExport(ctx, m, g_methods[i].name);
    return m;
}

__attribute__((visibility("default"))) void custom_init_jsapis(void)
{
    registerCModuleLoader("pvz", loader);
}
