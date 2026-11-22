#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import time
import os
import json

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", "")

SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"
os.makedirs(RESULTS_DIR, exist_ok=True)

def adb(cmd):
    full = f"adb -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap_phys(px, py, delay=0.6):
    adb(f"shell '/userdisk/doom/tap_mt /dev/input/event1 {px} {py}'")
    time.sleep(delay)

def tap_css(cx, cy, delay=0.6):
    px = int(round(107 + cy * 1.2))
    py = int(round(959 - cx * 1.2))
    tap_phys(px, py, delay)

def tap_960(lx, ly, delay=0.6):
    cx = lx / 1.2
    cy = ly / 1.2
    tap_css(cx, cy, delay)

def swipe_css(cx1, cy1, cx2, cy2, dur_ms=300, delay=0.6):
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
    print(f"[CAP] {name}: {local_path}")
    return local_path

def start_clean_app():
    adb("shell 'miniapp_cli stop 8002026110100097'")
    time.sleep(1.0)
    adb("shell 'miniapp_cli start 8002026110100097'")
    time.sleep(2.0)

print("Starting test execution...")
