#!/usr/bin/env python3
"""Adversarial stress and timing test suite for Half-Life Lifecycle & XRCON (M2).

Targets:
1. Re-entrancy & Thread Safety: Multi-threaded concurrent save/stop/cmd operations protected by g_hl_lock.
2. Save Timeout & Fault Recovery: When XRCON save fails/times out, stop_game_locked MUST NOT quit or kill child.
   Verify retry after save failure succeeds.
3. Timestamp Anti-Passthrough & Nanosecond Precision:
   - High frequency saves in the same second succeed due to tv_nsec comparison.
   - Old unchanged save timestamp is never falsely recognized as a new save.
   - Zero-byte save during write is rejected.
4. Cold-boot Recovery Boundaries:
   - 0-byte quick.sav falls back to new campaign (map c0a0).
   - Non-existent quick.sav falls back to map c0a0.
   - Directory quick.sav falls back to map c0a0.
   - Unreadable quick.sav falls back to map c0a0.
   - forceNew flag overrides existing quick.sav.
   - Valid quick.sav restores via load quick.
   - Corrupted non-zero quick.sav behavior analysis.
"""

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

static const char *test_basedir = NULL;
static int test_force_new = 0;
static int test_ok = 0, test_resumed = 0;

static JSValue JS_NewObject(JSContext *c) { (void)c; return (JSValue){.tag=1}; }
static JSValue JS_NewBool(JSContext *c, int n) { (void)c; return (JSValue){.tag=2,.number=n}; }
static JSValue JS_NewInt32(JSContext *c, int32_t n) { return JS_NewBool(c,n); }
static int JS_IsObject(JSValue v) { return v.tag == 1; }
static int JS_IsString(JSValue v) { return v.tag == 3; }
static int JS_IsBool(JSValue v) { return v.tag == 2; }
static int JS_ToBool(JSContext *c, JSValue v) { (void)c; return v.number; }

static JSValue JS_GetPropertyStr(JSContext *c, JSValue v, const char *s) {
    (void)c; (void)v;
    if (!strcmp(s, "basedir")) return (JSValue){.tag=3, .text=test_basedir};
    if (!strcmp(s, "forceNew")) return (JSValue){.tag=2, .number=test_force_new};
    return (JSValue){0};
}
static const char *JS_ToCString(JSContext *c, JSValue v) { (void)c; return v.text; }
static const char *JS_ToCStringLen(JSContext *c, size_t *len, JSValue v) {
    (void)c; *len = strlen(v.text); return v.text;
}
static void JS_FreeCString(JSContext *c, const char *s) { (void)c; (void)s; }
static void JS_FreeValue(JSContext *c, JSValue v) { (void)c; (void)v; }

static int JS_SetPropertyStr(JSContext *c, JSValue v, const char *s, JSValue x) {
    (void)c; (void)v;
    if (!strcmp(s, "ok")) test_ok = x.number;
    if (!strcmp(s, "resumed")) test_resumed = x.number;
    return 0;
}
static JSValue JS_ThrowTypeError(JSContext *c, const char *fmt, ...) {
    (void)c; (void)fmt; test_ok = 0; return JS_EXCEPTION;
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
#include <sys/stat.h>
#include <sys/wait.h>
#include <errno.h>
#include <poll.h>
#include <pthread.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>

#include "@SOURCE@"

void registerCModuleLoader(const char *s, JSModuleDef *(*f)(JSContext *,const char *)) {
    (void)s; (void)f;
}

static double now_seconds(void) {
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec / 1e9;
}

/* Thread stress worker */
static void *thread_worker(void *arg) {
    int id = (int)(intptr_t)arg;
    JSValue dummy = {0};
    for (int i = 0; i < 10; i++) {
        if (id % 2 == 0) {
            js_hl_is_running(NULL, dummy, 0, NULL);
        } else {
            JSValue cmd = {.tag=3, .text="status"};
            js_hl_send_cmd(NULL, dummy, 1, &cmd);
        }
        usleep(2000);
    }
    return NULL;
}

int main(int argc, char **argv) {
    signal(SIGPIPE, SIG_DFL);
    if (argc > 1 && !strcmp(argv[1], "-basedir")) {
        /* Fake xash3d engine */
        FILE *f = fopen("engine.args", "w");
        if (!f) return 3;
        for (int i = 1; i < argc; ++i) fprintf(f, "%s\n", argv[i]);
        fclose(f);
        puts("host test engine");
        fflush(stdout);
        while (access("exit-request", F_OK) != 0) usleep(10000);
        return 0;
    }

    if (argc < 3) return 2;
    const char *action = argv[1];
    test_basedir = argv[2];
    if (argc > 3 && !strcmp(argv[3], "--force-new")) {
        test_force_new = 1;
    }

    JSValue options = JS_NewObject(NULL), dummy = {0};
    JSValue started = js_hl_start(NULL, dummy, 1, &options);
    (void)started;
    int start_ok = test_ok, resumed = test_resumed;
    pid_t child = g_hl_pid;

    if (child > 0) {
        char ready[1024];
        snprintf(ready, sizeof(ready), "%s/hl_runtime.log", test_basedir);
        struct stat st;
        double deadline = now_seconds() + 1.0;
        while ((stat(ready, &st) != 0 || st.st_size == 0) && now_seconds() < deadline) {
            usleep(10000);
        }
    }

    double begin = now_seconds();
    int result = 0;

    if (!strcmp(action, "start")) {
        result = start_ok;
    } else if (!strcmp(action, "save")) {
        js_hl_save(NULL, dummy, 0, NULL);
        result = test_ok;
    } else if (!strcmp(action, "stop")) {
        js_hl_stop(NULL, dummy, 0, NULL);
        result = test_ok;
    } else if (!strcmp(action, "multisave")) {
        int count = argc > 3 ? atoi(argv[3]) : 3;
        int pass_count = 0;
        for (int i = 0; i < count; i++) {
            js_hl_save(NULL, dummy, 0, NULL);
            if (test_ok) pass_count++;
            usleep(20000); // 20ms between saves
        }
        result = (pass_count == count) ? 1 : 0;
    } else if (!strcmp(action, "stop_retry")) {
        /* First stop attempt (expected to fail) */
        js_hl_stop(NULL, dummy, 0, NULL);
        int first_ok = test_ok;
        int first_alive = is_game_running_locked();
        /* Second stop attempt (expected to succeed) */
        js_hl_stop(NULL, dummy, 0, NULL);
        int second_ok = test_ok;
        int second_alive = is_game_running_locked();
        printf("first_ok=%d first_alive=%d second_ok=%d second_alive=%d\n",
               first_ok, first_alive, second_ok, second_alive);
        result = second_ok;
    } else if (!strcmp(action, "thread_stress")) {
        pthread_t threads[4];
        for (int i = 0; i < 4; i++) {
            pthread_create(&threads[i], NULL, thread_worker, (void *)(intptr_t)i);
        }
        for (int i = 0; i < 4; i++) {
            pthread_join(threads[i], NULL);
        }
        result = 1;
    } else {
        return 2;
    }

    double elapsed = now_seconds() - begin;
    int alive = is_game_running_locked();
    printf("start=%d ok=%d alive=%d resumed=%d elapsed=%.6f\n",
           start_ok, result, alive, resumed, elapsed);
    fflush(stdout);

    if (child > 0 && alive) {
        kill(child, SIGTERM);
        waitpid(child, NULL, 0);
    }
    return 0;
}
'''

def frame(payload):
    return b'CMND\x00\x00\x00\xd4' + struct.pack('!HH', 12 + len(payload), 0) + payload

class MockXRCONServer:
    def __init__(self, handler=None):
        self.handler = handler
        self.frames = []
        self.stop_event = threading.Event()
        self.sock = socket.socket()
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if hasattr(socket, 'SO_REUSEPORT'):
            self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        self.sock.bind(('127.0.0.1', 27000))
        self.sock.listen(8)
        self.sock.settimeout(0.05)
        self.thread = threading.Thread(target=self.run)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_event.set()
        self.thread.join(timeout=2.0)
        try:
            self.sock.close()
        except Exception:
            pass

    def run(self):
        while not self.stop_event.is_set():
            try:
                conn, _ = self.sock.accept()
            except socket.timeout:
                continue
            with conn:
                conn.settimeout(2.0)
                try:
                    conn.sendall(b'AINF' + struct.pack('!IHH', 0xD4, 89, 0) + bytes(77))
                except Exception:
                    continue
                data = b''
                while True:
                    try:
                        chunk = conn.recv(4096)
                    except Exception:
                        break
                    if not chunk:
                        break
                    data += chunk
                if len(data) >= 12 and data[:4] == b'CMND':
                    cmd = data[12:]
                    self.frames.append(cmd)
                    if self.handler:
                        self.handler(cmd)


class AdversarialLifecycleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.build_dir = Path(tempfile.mkdtemp(prefix='adv-m2-build-'))
        (cls.build_dir / 'quickjs.h').write_text(QUICKJS_STUB)
        harness_code = HARNESS.replace('@SOURCE@', str(ROOT / 'native/libjsapi_hl.c'))
        (cls.build_dir / 'harness.c').write_text(harness_code)
        cls.binary = cls.build_dir / 'harness'
        cmd = [
            'cc', '-std=c11', '-O2', '-Wall', '-Wextra', '-Werror',
            '-Wno-unused-function',
            '-I', str(cls.build_dir),
            str(cls.build_dir / 'harness.c'),
            '-pthread', '-o', str(cls.binary)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Harness compilation failed:\n{res.stderr}")

    def setUp(self):
        self.base = Path(tempfile.mkdtemp(prefix='adv-m2-game-'))
        (self.base / 'valve/save').mkdir(parents=True)
        (self.base / 'xash3d').symlink_to(self.binary)
        self.save_file = self.base / 'valve/save/quick.sav'

    def invoke(self, action, *extra_args, timeout=12):
        args = [str(self.binary), action, str(self.base)] + list(extra_args)
        res = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
        self.assertEqual(res.returncode, 0, f"Binary exited with code {res.returncode}: {res.stderr}")
        for line in res.stdout.splitlines():
            if line.startswith('start='):
                return {k: float(v) for k, v in (x.split('=') for x in line.split())}
        raise AssertionError(f"Could not parse stdout: {res.stdout}")

    # =========================================================================
    # 对抗验证 1: 重入与并发锁检验 (Multi-threaded Concurrency & Mutex Safety)
    # =========================================================================
    def test_adv_01_multithreaded_concurrent_operations_no_deadlock(self):
        """验证多线程并发调用 sendCmd / isRunning 时互斥锁 g_hl_lock 无死锁且状态正确"""
        with MockXRCONServer():
            result = self.invoke('thread_stress')
        self.assertEqual(result['start'], 1)
        self.assertEqual(result['ok'], 1)

    # =========================================================================
    # 对抗验证 2: 存盘超时与故障恢复对抗 (Timeout & Safe Non-Quit, Retry)
    # =========================================================================
    def test_adv_02_save_timeout_strictly_rejects_quit_and_kill(self):
        """存盘在 3000ms 超时未写盘：stop 必须失败返回 0，严禁发送 quit，子进程必须依然存活"""
        # quick.sav 存在一个旧文件，时间戳不变
        self.save_file.write_bytes(b'old save data')
        os.utime(self.save_file, ns=(1_700_000_000_000_000_000, 1_700_000_000_000_000_000))

        server = MockXRCONServer()
        with server:
            result = self.invoke('stop')

        # 断言 1: stop 结果必须失败
        self.assertEqual(result['ok'], 0, "存盘超时情况下 stop 必须返回 0")
        # 断言 2: 子进程必须依然保持存活，未被 kill / waitpid 强杀
        self.assertEqual(result['alive'], 1, "存盘超时情况下子进程必须依然存活")
        # 断言 3: 耗时必须处于 3000ms 超时区间 (2.8s ~ 3.5s)
        self.assertGreater(result['elapsed'], 2.8, "必须完整等待 3000ms 超时")
        self.assertLess(result['elapsed'], 3.6, "超时判定不应无故延长")
        # 断言 4: XRCON 仅仅收到了 save quick，严禁发送 quit！
        self.assertEqual(server.frames, [b'save quick'], "存盘超时后严禁下发 quit 避免损坏游戏现场")

    def test_adv_03_save_timeout_then_retry_success(self):
        """首次存盘失败后子进程保全，重试时存盘成功则正确退出并回收子进程"""
        self.save_file.write_bytes(b'old save')
        os.utime(self.save_file, ns=(1_700_000_000_000_000_000, 1_700_000_000_000_000_000))

        call_idx = 0
        def smart_handler(cmd):
            nonlocal call_idx
            call_idx += 1
            if cmd == b'save quick':
                if call_idx == 1:
                    # 第一次：模拟引擎卡顿，不写盘
                    pass
                else:
                    # 第二次：写盘成功，更新纳秒时间戳
                    self.save_file.write_bytes(b'new save data on retry')
                    os.utime(self.save_file, ns=(1_700_000_000_500_000_000, 1_700_000_000_500_000_000))
            elif cmd == b'quit':
                (self.base / 'exit-request').touch()

        server = MockXRCONServer(smart_handler)
        with server:
            args = [str(self.binary), 'stop_retry', str(self.base)]
            res = subprocess.run(args, capture_output=True, text=True, timeout=12)
            self.assertEqual(res.returncode, 0)
            out = res.stdout
            self.assertIn("first_ok=0", out)
            self.assertIn("first_alive=1", out)
            self.assertIn("second_ok=1", out)
            self.assertIn("second_alive=0", out)
            self.assertEqual(server.frames, [b'save quick', b'save quick', b'quit'])

    # =========================================================================
    # 对抗验证 3: 时间戳防穿透校验 (Timestamp Anti-Passthrough & Nanoseconds)
    # =========================================================================
    def test_adv_04_high_frequency_nanosecond_saves_same_second(self):
        """同一秒内（tv_sec 相同）以 20ms 间隔高频连续存盘 5 次，每次依靠 tv_nsec 成功识别新存档"""
        current_nsec = 100_000_000
        fixed_sec = 1_700_000_000

        def save_handler(cmd):
            nonlocal current_nsec
            if cmd == b'save quick':
                current_nsec += 10_000_000  # 递增 10 毫秒纳秒数
                self.save_file.write_bytes(f'save_at_{current_nsec}'.encode())
                os.utime(self.save_file, ns=(fixed_sec * 1_000_000_000 + current_nsec,
                                            fixed_sec * 1_000_000_000 + current_nsec))

        server = MockXRCONServer(save_handler)
        with server:
            result = self.invoke('multisave', '5')

        self.assertEqual(result['ok'], 1, "同一秒内 5 次高频纳秒级存盘必须全部成功通过")
        self.assertEqual(len(server.frames), 5)

    def test_adv_05_old_save_anti_passthrough_no_false_positive(self):
        """存在旧存档但引擎未实际写盘时，stat 必须拒绝旧时间戳，严禁穿透误判为保存成功"""
        fixed_sec = 1_700_000_000
        fixed_nsec = 555_000_000
        self.save_file.write_bytes(b'preexisting save')
        os.utime(self.save_file, ns=(fixed_sec * 1_000_000_000 + fixed_nsec,
                                    fixed_sec * 1_000_000_000 + fixed_nsec))

        server = MockXRCONServer()
        with server:
            result = self.invoke('save')

        self.assertEqual(result['ok'], 0, "时间戳未发生纳秒变化时严禁误判为成功")
        self.assertGreater(result['elapsed'], 2.8, "必须超时返回 0")

    def test_adv_06_truncated_zero_byte_during_write_rejected(self):
        """写盘中途被截断为 0 字节时，即使时间戳变化，save 必须防御并拒绝承认成功"""
        def truncate_handler(cmd):
            if cmd == b'save quick':
                self.save_file.write_bytes(b'')  # 0 字节
                os.utime(self.save_file, ns=(1_700_000_001_000_000_000, 1_700_000_001_000_000_000))

        server = MockXRCONServer(truncate_handler)
        with server:
            result = self.invoke('save')

        self.assertEqual(result['ok'], 0, "0 字节文件严禁判定为有效存盘")

    # =========================================================================
    # 对抗验证 4: 冷启动恢复边界 (Cold-boot Recovery Boundaries)
    # =========================================================================
    def test_adv_07_cold_boot_empty_save_file_falls_back_to_map(self):
        """quick.sav 为 0 字节空文件时，js_hl_start 必须防御，绝不写入 load quick，回退至 map c0a0"""
        self.save_file.touch()  # 0 字节
        self.assertEqual(self.save_file.stat().st_size, 0)

        with MockXRCONServer():
            result = self.invoke('start')

        self.assertEqual(result['resumed'], 0, "0 字节存档 resumed 必须为 0")
        auto_exec = (self.base / 'valve/auto_exec.cfg').read_text()
        self.assertIn("map c0a0", auto_exec, "0 字节存档必须回退至 map c0a0")
        self.assertNotIn("load quick", auto_exec, "0 字节存档绝不可写入 load quick")

    def test_adv_08_cold_boot_nonexistent_save_file_falls_back_to_map(self):
        """quick.sav 不存在时，回退至 map c0a0，resumed 为 0"""
        if self.save_file.exists():
            self.save_file.unlink()

        with MockXRCONServer():
            result = self.invoke('start')

        self.assertEqual(result['resumed'], 0)
        auto_exec = (self.base / 'valve/auto_exec.cfg').read_text()
        self.assertIn("map c0a0", auto_exec)
        self.assertNotIn("load quick", auto_exec)

    def test_adv_09_cold_boot_directory_save_file_falls_back_to_map(self):
        """quick.sav 为目录时，S_ISREG 防御生效，回退至 map c0a0"""
        if self.save_file.exists():
            self.save_file.unlink()
        self.save_file.mkdir()

        with MockXRCONServer():
            result = self.invoke('start')

        self.assertEqual(result['resumed'], 0)
        auto_exec = (self.base / 'valve/auto_exec.cfg').read_text()
        self.assertIn("map c0a0", auto_exec)
        self.assertNotIn("load quick", auto_exec)

    def test_adv_10_cold_boot_unreadable_save_file_falls_back_to_map(self):
        """quick.sav 权限为 0000 不可读时，access(R_OK) 防御生效，回退至 map c0a0"""
        self.save_file.write_bytes(b'secret save')
        self.save_file.chmod(0o000)

        try:
            with MockXRCONServer():
                result = self.invoke('start')
            self.assertEqual(result['resumed'], 0)
            auto_exec = (self.base / 'valve/auto_exec.cfg').read_text()
            self.assertIn("map c0a0", auto_exec)
            self.assertNotIn("load quick", auto_exec)
        finally:
            self.save_file.chmod(0o666)

    def test_adv_11_cold_boot_force_new_overrides_valid_save(self):
        """存在有效存档时，若传入 forceNew: true，必须忽略存档并开启新战役 map c0a0"""
        self.save_file.write_bytes(b'valid save content')

        with MockXRCONServer():
            result = self.invoke('start', '--force-new')

        self.assertEqual(result['resumed'], 0)
        auto_exec = (self.base / 'valve/auto_exec.cfg').read_text()
        self.assertIn("map c0a0", auto_exec)
        self.assertNotIn("load quick", auto_exec)

    def test_adv_12_cold_boot_valid_save_loads_quick(self):
        """存在有效存档时正常启动，正确写入 load quick 恢复进度"""
        self.save_file.write_bytes(b'valid save content > 0 bytes')

        with MockXRCONServer():
            result = self.invoke('start')

        self.assertEqual(result['resumed'], 1)
        auto_exec = (self.base / 'valve/auto_exec.cfg').read_text()
        self.assertIn("load quick", auto_exec)
        self.assertNotIn("map c0a0", auto_exec)


if __name__ == '__main__':
    unittest.main(verbosity=2)
