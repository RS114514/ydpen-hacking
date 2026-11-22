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

def swipe_phys(x1, y1, x2, y2, dur_ms=300, delay=0.6):
    adb(f"shell '/bin/swipe /dev/input/event1 {x1} {y1} {x2} {y2} {dur_ms}'")
    time.sleep(delay)

def swipe_css(cx1, cy1, cx2, cy2, dur_ms=300, delay=0.6):
    # CSS X maps to phys Y (reversed): phys_y = 959 - cx * 1.2
    # CSS Y maps to phys X: phys_x = 107 + cy * 1.2
    px1 = int(round(107 + cy1 * 1.2))
    py1 = int(round(959 - cx1 * 1.2))
    px2 = int(round(107 + cy2 * 1.2))
    py2 = int(round(959 - cx2 * 1.2))
    swipe_phys(px1, py1, px2, py2, dur_ms, delay)

def cap(name):
    tmp_path = f"/tmp/{name}.png"
    local_path = f"{RESULTS_DIR}/{name}.png"
    adb(f"shell 'miniapp_cli capture {tmp_path}'")
    adb(f"pull {tmp_path} {local_path}")
    print(f"[CAP] {local_path}")
    return local_path

def cap_physical(name):
    local_path = f"{RESULTS_DIR}/{name}_physical.png"
    adb(f"shell 'cd /tmp && XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0 weston-screenshooter'")
    time.sleep(0.3)
    latest = adb("shell 'ls -t /tmp/wayland-screenshot-*.png | head -1'")
    if latest:
        adb(f"pull {latest} {local_path}")
        print(f"[CAP_PHYS] {local_path}")
    return local_path

def start_app():
    adb("shell 'miniapp_cli start 8002026110100097'")
    time.sleep(2.0)

def stop_app():
    # miniapp_cli stop or kill miniapp or exit
    pass

def read_settings_json():
    out = adb("shell 'cat /userdisk/gal_data/dracu_riot_settings.json 2>/dev/null || cat /userdisk/gal_data/dracu_riot/settings.json 2>/dev/null'")
    return out

def get_recent_log(lines=40):
    return adb(f"shell 'tail -n {lines} /userdata/applog/DictPen_20261101_095241.log'")

def get_audio_log(lines=30):
    return adb(f"shell 'tail -n {lines} /tmp/gal_gs_mixer.log 2>/dev/null'")

def get_alsa_status():
    return adb("shell 'cat /proc/asound/card1/pcm0p/sub0/status 2>/dev/null; cat /proc/asound/card0/pcm0p/sub0/status 2>/dev/null'")
