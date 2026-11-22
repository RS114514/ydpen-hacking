#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run_full_blackbox_test.py
DRACU-RIOT 有道词典笔移植版黑盒自动化测试套件
严格按照黑盒测试原则与 7 大模块要求进行自动化验证与数据采集
"""

import subprocess
import time
import os
import sys
import json

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", "")

SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"
os.makedirs(RESULTS_DIR, exist_ok=True)

test_records = []

def adb(cmd):
    full = f"adb -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap_phys(px, py, delay=0.7):
    adb(f"shell '/userdisk/doom/tap_mt /dev/input/event1 {px} {py}'")
    time.sleep(delay)

def tap_css(cx, cy, delay=0.7):
    px = int(round(107 + cy * 1.2))
    py = int(round(959 - cx * 1.2))
    tap_phys(px, py, delay)

def tap_960(lx, ly, delay=0.7):
    tap_css(lx / 1.2, ly / 1.2, delay)

def swipe_css(cx1, cy1, cx2, cy2, dur_ms=300, delay=0.8):
    px1 = int(round(107 + cy1 * 1.2))
    py1 = int(round(959 - cx1 * 1.2))
    px2 = int(round(107 + cy2 * 1.2))
    py2 = int(round(959 - cx2 * 1.2))
    adb(f"shell '/bin/swipe /dev/input/event1 {px1} {py1} {px2} {py2} {dur_ms}'")
    time.sleep(delay)

def cap(name):
    tmp_path = f"/tmp/{name}.png"
    local_path = f"{RESULTS_DIR}/{name}.png"
    adb(f"shell 'miniapp_cli capture {tmp_path}'")
    adb(f"pull {tmp_path} {local_path}")
    print(f"  [CAP] {name} -> {local_path}")
    return local_path

def cap_physical(name):
    local_path = f"{RESULTS_DIR}/{name}_physical.png"
    adb(f"shell 'cd /tmp && XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0 weston-screenshooter'")
    time.sleep(0.3)
    latest = adb("shell 'ls -t /tmp/wayland-screenshot-*.png | head -1'")
    if latest:
        adb(f"pull {latest} {local_path}")
    return local_path

def start_app():
    adb("shell 'miniapp_cli stop 8002026110100097 >/dev/null 2>&1'")
    time.sleep(0.8)
    adb("shell 'miniapp_cli start 8002026110100097'")
    time.sleep(2.0)

def record_case(case_id, page, steps, expected, actual, reproduced, shot_path, severity="Normal", passed=True):
    rec = {
        "id": case_id,
        "page": page,
        "steps": steps,
        "expected": expected,
        "actual": actual,
        "reproduced": reproduced,
        "shot": shot_path,
        "severity": severity,
        "passed": passed
    }
    test_records.append(rec)
    status = "PASS" if passed else f"FAIL [{severity}]"
    print(f"[{status}] {case_id}: {page} - {expected}")

def check_sound_output():
    status = adb("shell 'cat /proc/asound/card1/pcm0p/sub0/status 2>/dev/null; cat /proc/asound/card0/pcm0p/sub0/status 2>/dev/null'")
    mixer = adb("shell 'tail -n 10 /tmp/gal_gs_mixer.log 2>/dev/null'")
    is_running = "state: RUNNING" in status
    return is_running, mixer, status

print("Test harness ready.")
