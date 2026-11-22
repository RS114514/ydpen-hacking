#!/usr/bin/env python3
"""Host-only native XRCON regression tests; all generated files stay in --output.

QuickJS is stubbed only at the value boundary. The included production C runs
its real start/send/save/stop, sockets, stat, fork and waitpid. No device tools.
"""
import argparse
import os
from pathlib import Path
import socket
import struct
import subprocess
import tempfile
import threading
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = Path('/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi')

QUICKJS_STUB = r'''
#ifndef TEST_QUICKJS_H
#define TEST_QUICKJS_H
#include <stddef.h>
#include <stdint.h>
#include <stdarg.h>
#include <string.h>
typedef struct { int tag, number, ok, resumed; const char *text; } JSValue;
typedef JSValue JSValueConst;
typedef struct JSContext JSContext;
typedef struct JSModuleDef JSModuleDef;
typedef JSValue JSCFunction(JSContext *, JSValueConst, int, JSValueConst *);
#define JS_EXCEPTION ((JSValue){ .tag = -1 })
static const char *test_basedir;
static JSValue JS_NewObject(JSContext *c) { (void)c; return (JSValue){.tag=1}; }
static JSValue JS_NewBool(JSContext *c, int n) { (void)c; return (JSValue){.tag=2,.number=n}; }
static JSValue JS_NewInt32(JSContext *c, int32_t n) { return JS_NewBool(c,n); }
static int JS_IsObject(JSValue v) { return v.tag == 1; }
static int JS_IsString(JSValue v) { return v.tag == 3; }
static int JS_IsBool(JSValue v) { return v.tag == 2; }
static int JS_ToBool(JSContext *c, JSValue v) { (void)c; return v.number; }
static JSValue JS_GetPropertyStr(JSContext *c, JSValue v, const char *s) {
    (void)c; (void)v;
    if (!strcmp(s,"basedir")) return (JSValue){.tag=3,.text=test_basedir};
    return (JSValue){0};
}
static const char *JS_ToCString(JSContext *c, JSValue v) { (void)c; return v.text; }
static const char *JS_ToCStringLen(JSContext *c, size_t *len, JSValue v) {
    (void)c; *len = strlen(v.text); return v.text;
}
static void JS_FreeCString(JSContext *c, const char *s) { (void)c; (void)s; }
static void JS_FreeValue(JSContext *c, JSValue v) { (void)c; (void)v; }
static int test_ok, test_resumed;
static int JS_SetPropertyStr(JSContext *c, JSValue v, const char *s, JSValue x) {
    (void)c; (void)v;
    if (!strcmp(s,"ok")) test_ok=x.number;
    if (!strcmp(s,"resumed")) test_resumed=x.number;
    return 0;
}
static JSValue JS_ThrowTypeError(JSContext *c, const char *fmt, ...) {
    (void)c; (void)fmt; test_ok=0; return JS_EXCEPTION;
}
static JSValue JS_DupValue(JSContext *c, JSValue v) { (void)c; return v; }
static JSValue JS_NewCFunction(JSContext *c, JSCFunction *f, const char *s, int n) {
    (void)f; (void)s; (void)n; return JS_NewObject(c);
}
static int JS_SetModuleExport(JSContext *c, JSModuleDef *m, const char *s, JSValue v) {
    (void)c; (void)m; (void)s; (void)v; return 0;
}
static int JS_AddModuleExport(JSContext *c, JSModuleDef *m, const char *s) {
    (void)c; (void)m; (void)s; return 0;
}
static JSModuleDef *JS_NewCModule(JSContext *c, const char *s, int (*f)(JSContext *,JSModuleDef *)) {
    (void)c; (void)s; (void)f; return (JSModuleDef *)1;
}
#endif
'''

HARNESS = r'''
#define _GNU_SOURCE 1
#include <sys/socket.h>
#include <sys/wait.h>
#include <errno.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
static int send_calls;
static ssize_t test_send(int fd, const void *buf, size_t len, int flags) {
    const char *fault = getenv("XRCON_TEST_FAULT");
    ++send_calls;
    if (fault && !strcmp(fault,"short")) {
        if (send_calls == 1) { errno=EINTR; return -1; }
        if (send_calls == 2) { errno=EAGAIN; return -1; }
        if (len > 3) len=3;
    }
    if (fault && !strcmp(fault,"blocked")) { errno=EAGAIN; return -1; }
    if (fault && !strcmp(fault,"reset") && send_calls == 1) {
        /* Wait until the real TCP peer sends RST, then call real send(). */
        struct pollfd p = {fd, POLLIN, 0};
        poll(&p, 1, 500);
    }
    return send(fd,buf,len,flags);
}
#define send test_send
#include "@SOURCE@"
#undef send
void registerCModuleLoader(const char *s, JSModuleDef *(*f)(JSContext *,const char *)) {
    (void)s; (void)f;
}
static double now_seconds(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC,&t);
    return t.tv_sec + t.tv_nsec / 1e9;
}
int main(int argc, char **argv) {
    signal(SIGPIPE,SIG_DFL); /* Native transport must protect itself. */
    if (argc > 1 && !strcmp(argv[1],"-basedir")) {
        FILE *f=fopen("engine.args","w");
        if (!f) return 3;
        for (int i=1; i<argc; ++i) fprintf(f,"%s\n",argv[i]);
        fclose(f);
        puts("host test engine"); fflush(stdout);
        while (access("exit-request",F_OK) != 0) usleep(10000);
        return 0;
    }
    if (argc < 3) return 2;
    test_basedir=argv[2];
    JSValue options=JS_NewObject(NULL), dummy={0};
    JSValue started=js_hl_start(NULL,dummy,1,&options);
    int start_ok=test_ok, resumed=test_resumed;
    pid_t child=g_hl_pid;
    if (child > 0) {
        char ready[1024]; snprintf(ready,sizeof(ready),"%s/engine.args",test_basedir);
        double deadline=now_seconds()+1;
        while (access(ready,F_OK) != 0 && now_seconds()<deadline) usleep(10000);
    }
    double begin=now_seconds();
    if (started.tag != -1 && strcmp(argv[1],"start")) {
        if (!strcmp(argv[1],"send")) {
            JSValue cmd={.tag=3,.text=argv[3]};
            js_hl_send_cmd(NULL,dummy,1,&cmd);
        } else if (!strcmp(argv[1],"save")) js_hl_save(NULL,dummy,0,NULL);
        else if (!strcmp(argv[1],"stop")) js_hl_stop(NULL,dummy,0,NULL);
        else if (!strcmp(argv[1],"load")) js_hl_load(NULL,dummy,0,NULL);
        else return 2;
    }
    int result=test_ok;
    double elapsed=now_seconds()-begin;
    int alive=is_game_running_locked();
    printf("start=%d ok=%d alive=%d resumed=%d elapsed=%.6f calls=%d\n",
           start_ok,result,alive,resumed,elapsed,send_calls);
    fflush(stdout);
    /* Test-owned fake engine only, never a real Xash/device process. */
    if (child > 0 && alive) { kill(child,SIGTERM); waitpid(child,NULL,0); }
    return 0;
}
'''


def frame(payload):
    return b'CMND\x00\x00\x00\xd4' + struct.pack('!HH', 12 + len(payload), 0) + payload


class Server:
    def __init__(self, action=None, reset=False, allow_reset=False):
        self.action, self.reset = action, reset
        self.allow_reset = allow_reset
        self.frames, self.errors = [], []
        self.stop_event = threading.Event()
        self.sock = socket.socket()
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        # Deliberately never connect to an existing local service.
        self.sock.bind(('127.0.0.1', 27000))
        self.sock.listen(4)
        self.sock.settimeout(0.05)
        self.thread = threading.Thread(target=self.run)

    def __enter__(self):
        self.thread.start()
        return self

    def run(self):
        try:
            while not self.stop_event.is_set():
                try:
                    conn, _ = self.sock.accept()
                except socket.timeout:
                    continue
                with conn:
                    if self.reset:
                        conn.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack('ii', 1, 0))
                        continue
                    conn.settimeout(2)
                    # Upstream sends greetings before reading any command.
                    conn.sendall(b'AINF' + struct.pack('!IHH', 0xD4, 89, 0) + bytes(77))
                    data = b''
                    while True:
                        try:
                            chunk = conn.recv(8192)
                        except ConnectionResetError:
                            if not self.allow_reset:
                                raise
                            break
                        if not chunk:
                            break
                        data += chunk
                    if data:
                        self.frames.append(data)
                        if self.action:
                            self.action(data[12:])
        except Exception as exc:
            self.errors.append(exc)

    def __exit__(self, *_):
        self.stop_event.set()
        self.thread.join(3)
        self.sock.close()
        if self.thread.is_alive():
            raise AssertionError('test server did not finish')
        if self.errors:
            raise AssertionError(self.errors)


class XRCONTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build = Path(tempfile.mkdtemp(prefix='xrcon-host-', dir=OUTPUT))
        (cls.build / 'quickjs.h').write_text(QUICKJS_STUB)
        (cls.build / 'harness.c').write_text(HARNESS.replace('@SOURCE@', str(ROOT / 'native/libjsapi_hl.c')))
        cls.binary = cls.build / 'harness'
        command = ['cc', '-std=c11', '-O2', '-Wall', '-Wextra', '-Werror',
                   '-Wno-unused-function', '-I', str(cls.build), str(cls.build / 'harness.c'),
                   '-pthread', '-o', str(cls.binary)]
        result = subprocess.run(command, text=True, capture_output=True)
        (cls.build / 'compile.log').write_text(' '.join(command) + '\n' + result.stdout + result.stderr)
        if result.returncode:
            raise AssertionError(result.stderr)
        print(f'Host artifacts: {cls.build}', flush=True)

    def setUp(self):
        self.base = Path(tempfile.mkdtemp(prefix='game-', dir=self.build))
        (self.base / 'valve/save').mkdir(parents=True)
        (self.base / 'xash3d').symlink_to(self.binary)
        self.save = self.base / 'valve/save/quick.sav'

    def invoke(self, mode, cmd=None, fault=None):
        args = [str(self.binary), mode, str(self.base)]
        if cmd is not None:
            args.append(cmd)
        env = os.environ.copy()
        if fault:
            env['XRCON_TEST_FAULT'] = fault
        result = subprocess.run(args, env=env, capture_output=True, text=True, timeout=12)
        (self.base / 'client.log').write_text(result.stdout + result.stderr)
        self.assertEqual(result.returncode, 0, result.stderr)
        line = next(s for s in result.stdout.splitlines() if s.startswith('start='))
        return {k: float(v) for k, v in (x.split('=') for x in line.split())}

    def old_save(self):
        self.save.write_bytes(b'old save')
        os.utime(self.save, ns=(1_700_000_000_100_000_000,) * 2)

    def test_command_wire_and_disconnect(self):
        with Server() as server:
            result = self.invoke('send', 'save quick')
        self.assertEqual(server.frames, [b'CMND\x00\x00\x00\xd4\x00\x16\x00\x00save quick'])
        self.assertEqual(result['ok'], 1)

    def test_utf8_short_send_eintr_eagain(self):
        with Server() as server:
            result = self.invoke('send', 'echo 存档', 'short')
        self.assertEqual(server.frames, [frame('echo 存档'.encode())])
        self.assertEqual(result['ok'], 1)
        self.assertGreater(result['calls'], 3)

    def test_max_command_not_truncated(self):
        with Server() as server:
            result = self.invoke('send', 'x' * 4095)
        self.assertEqual(server.frames, [b'CMND\x00\x00\x00\xd4\x10\x0b\x00\x00' + b'x' * 4095])
        self.assertEqual(result['ok'], 1)

    def test_empty_and_overlong_rejected(self):
        for cmd in ('', 'x' * 4096, '档' * 1366):
            with self.subTest(length=len(cmd)), Server() as server:
                result = self.invoke('send', cmd)
            self.assertEqual(result['ok'], 0)
            self.assertEqual(server.frames, [])

    def test_connection_refused(self):
        # Keep the port reserved but not listening.
        with socket.socket() as reserved:
            reserved.bind(('127.0.0.1', 27000))
            result = self.invoke('send', 'save quick')
        self.assertEqual(result['ok'], 0)
        self.assertLess(result['elapsed'], 1.5)

    def test_reset_does_not_raise_sigpipe(self):
        with Server(reset=True):
            result = self.invoke('send', 'save quick', 'reset')
        self.assertEqual(result['ok'], 0)

    def test_send_wait_is_bounded(self):
        with Server() as server:
            result = self.invoke('send', 'save quick', 'blocked')
        self.assertEqual(result['ok'], 0)
        self.assertLess(result['elapsed'], 1.5)
        self.assertEqual(server.frames, [])

    def test_load_reports_transmission(self):
        with Server() as server:
            result = self.invoke('load')
        self.assertEqual(result['ok'], 1)
        self.assertEqual(server.frames, [frame(b'load quick')])

    def test_save_unchanged_fails_after_wait(self):
        self.old_save()
        with Server() as server:
            result = self.invoke('save')
        self.assertEqual(server.frames, [frame(b'save quick')])
        self.assertEqual(result['ok'], 0)
        self.assertGreater(result['elapsed'], 2.8)
        self.assertLess(result['elapsed'], 3.3)

    def test_save_accepts_nanosecond_change_in_same_second(self):
        self.old_save()
        def write(_):
            time.sleep(0.15)
            self.save.write_bytes(b'new save')
            os.utime(self.save, ns=(1_700_000_000_200_000_000,) * 2)
        with Server(write):
            result = self.invoke('save')
        self.assertEqual(result['ok'], 1)
        self.assertGreaterEqual(result['elapsed'], 0.14)

    def test_save_new_file(self):
        with Server(lambda _: self.save.write_bytes(b'new save')):
            result = self.invoke('save')
        self.assertEqual(result['ok'], 1)
        self.assertTrue(self.save.is_file(), 'save command must create quick.sav')
        self.assertGreater(self.save.stat().st_size, 0)

    def test_empty_changed_save_fails(self):
        self.old_save()
        with Server(lambda _: self.save.write_bytes(b'')):
            result = self.invoke('save')
        self.assertEqual(result['ok'], 0)
        self.assertLess(result['elapsed'], 3.3)

    def test_failed_save_keeps_engine_and_does_not_quit(self):
        self.old_save()
        with Server() as server:
            result = self.invoke('stop')
        self.assertEqual(result['ok'], 0)
        self.assertEqual(result['alive'], 1)
        self.assertEqual(server.frames, [frame(b'save quick')])

    def test_stop_saves_then_waits_for_actual_exit(self):
        def action(cmd):
            if cmd == b'save quick':
                self.save.write_bytes(b'complete save')
            elif cmd == b'quit':
                self.assertGreater(self.save.stat().st_size, 0)
                time.sleep(0.65)  # A 350ms kill chain would fail this test.
                (self.base / 'exit-request').touch()
        with Server(action) as server:
            result = self.invoke('stop')
        self.assertEqual(server.frames, [frame(b'save quick'), frame(b'quit')])
        self.assertEqual(result['ok'], 1)
        self.assertEqual(result['alive'], 0)
        self.assertGreater(result['elapsed'], 0.6)

    def test_stop_timeout_keeps_engine_alive(self):
        def action(cmd):
            if cmd == b'save quick':
                self.save.write_bytes(b'complete save')
        with Server(action) as server:
            result = self.invoke('stop')
        self.assertEqual(server.frames, [frame(b'save quick'), frame(b'quit')])
        self.assertEqual(result['ok'], 0)
        self.assertEqual(result['alive'], 1)
        self.assertLess(result['elapsed'], 7)

    def test_start_dynamic_config_and_loopback_arguments(self):
        with Server():
            self.invoke('send', 'echo ready')  # Give fake exec time to write argv/log.
        self.assertIn('map c0a0\n', (self.base / 'valve/auto_exec.cfg').read_text())
        self.assertTrue((self.base / 'hl_runtime.log').is_file(), 'log must use basedir')
        self.assertIn('host test engine', (self.base / 'hl_runtime.log').read_text())
        args = (self.base / 'engine.args').read_text().splitlines()
        self.assertEqual(args[args.index('+xrcon_address') + 1], '127.0.0.1:27000')
        self.assertEqual(args[args.index('+xrcon_enable') + 1], '1')
        self.old_save()
        result = self.invoke('start')
        self.assertEqual(result['resumed'], 1)
        text = (self.base / 'valve/auto_exec.cfg').read_text()
        self.assertIn('load quick\n', text)
        self.assertNotIn('map ', text)

    def test_config_open_failure_prevents_start(self):
        (self.base / 'valve/auto_exec.cfg').mkdir()
        result = self.invoke('start')
        self.assertEqual(result['start'], 0)
        self.assertEqual(result['alive'], 0)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args, remaining = parser.parse_known_args()
    OUTPUT = args.output.resolve()
    if not OUTPUT.is_dir():
        parser.error('--output must be an existing external cache directory')
    unittest.main(argv=[__file__] + remaining, verbosity=2)
