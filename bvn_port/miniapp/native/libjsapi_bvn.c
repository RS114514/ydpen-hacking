#define _GNU_SOURCE 1
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include "quickjs.h"

extern void registerCModuleLoader(const char *name,
                                 JSModuleDef *(*loader)(JSContext *ctx, const char *module_name));

static pid_t g_bvn_pid = 0;

static void reap_child(void)
{
    if (g_bvn_pid <= 0)
        return;
    int status = 0;
    pid_t r = waitpid(g_bvn_pid, &status, WNOHANG);
    if (r == g_bvn_pid || (r < 0 && errno == ECHILD))
        g_bvn_pid = 0;
}

static JSValue js_bvn_start(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)ctx;
    (void)this_val;
    (void)argc;
    (void)argv;

    reap_child();
    if (g_bvn_pid > 0)
        return JS_NewBool(ctx, 1);

    pid_t pid = fork();
    if (pid < 0)
        return JS_NewBool(ctx, 0);

    if (pid == 0) {
        setsid();
        int devnull = open("/dev/null", O_RDWR);
        if (devnull >= 0) {
            dup2(devnull, STDIN_FILENO);
            if (devnull > 2) close(devnull);
        }
        execl("/bin/sh", "sh", "/userdisk/bvn/run.sh", (char *)NULL);
        _exit(127);
    }

    g_bvn_pid = pid;
    return JS_NewBool(ctx, 1);
}

static JSValue js_bvn_stop(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    (void)argc;
    (void)argv;

    reap_child();
    if (g_bvn_pid > 0) {
        kill(-g_bvn_pid, SIGTERM);
        kill(g_bvn_pid, SIGTERM);
        for (int i = 0; i < 20; i++) {
            int status = 0;
            pid_t r = waitpid(g_bvn_pid, &status, WNOHANG);
            if (r == g_bvn_pid || (r < 0 && errno == ECHILD)) {
                g_bvn_pid = 0;
                return JS_NewBool(ctx, 1);
            }
            usleep(50000);
        }
        kill(-g_bvn_pid, SIGKILL);
        kill(g_bvn_pid, SIGKILL);
        waitpid(g_bvn_pid, NULL, 0);
        g_bvn_pid = 0;
    }
    return JS_NewBool(ctx, 1);
}

static JSValue js_bvn_is_running(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    (void)this_val;
    (void)argc;
    (void)argv;
    reap_child();
    return JS_NewBool(ctx, g_bvn_pid > 0 ? 1 : 0);
}

struct method_entry {
    const char *name;
    JSCFunction *fn;
    int nargs;
};

static const struct method_entry g_methods[] = {
    {"start", js_bvn_start, 0},
    {"stop", js_bvn_stop, 0},
    {"isRunning", js_bvn_is_running, 0},
};
#define NMETHODS ((int)(sizeof(g_methods) / sizeof(g_methods[0])))

static int bvn_module_init(JSContext *ctx, JSModuleDef *m)
{
    JSValue o = JS_NewObject(ctx);
    for (int i = 0; i < NMETHODS; i++) {
        JSValue f = JS_NewCFunction(ctx, g_methods[i].fn, g_methods[i].name, g_methods[i].nargs);
        JS_SetPropertyStr(ctx, o, g_methods[i].name, JS_DupValue(ctx, f));
        JS_SetModuleExport(ctx, m, g_methods[i].name, f);
    }
    JS_SetModuleExport(ctx, m, "default", JS_DupValue(ctx, o));
    JS_SetModuleExport(ctx, m, "bvn", o);
    return 0;
}

static JSModuleDef *loader(JSContext *ctx, const char *module_name)
{
    if (strcmp(module_name, "bvn") != 0)
        return NULL;
    JSModuleDef *m = JS_NewCModule(ctx, module_name, bvn_module_init);
    if (!m)
        return NULL;
    JS_AddModuleExport(ctx, m, "default");
    JS_AddModuleExport(ctx, m, "bvn");
    for (int i = 0; i < NMETHODS; i++) {
        JS_AddModuleExport(ctx, m, g_methods[i].name);
    }
    return m;
}

__attribute__((visibility("default"))) void custom_init_jsapis(void)
{
    registerCModuleLoader("bvn", loader);
}
