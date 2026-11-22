#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_blackbox_tests.py —— 《魔女的夜宴》有道词典笔 X6 Pro 黑盒测试套件
严格遵循黑盒测试原则：
- 只测试，不修改源码、不重新构建、不卸载应用、不删除用户存档。
- 使用空存档槽测试，不覆盖已有存档（已有 slot1 严格保护保留）。
- 每次测试记录：页面、操作步骤、预期、实际、是否复现、截图路径、严重度（Critical / Important / Minor）。
- 真实检测音频状态（声卡状态与播放输出）。
"""
import os, sys, time, json, subprocess, tempfile, struct

SERIAL = os.environ.get("PEN_SERIAL", "9DA2200007506350")
BASE_DIR = "/Users/fuzihao/.gemini/antigravity/brain/cac4e07b-8895-4245-9f59-541f80fa0563/blackbox_test_results"
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

ISSUES = []
PASSED = []
UNTESTED = []

def adb(cmd, timeout=30):
    full = f"/opt/homebrew/bin/adb -s {SERIAL} {cmd}"
    p = subprocess.run(full, shell=True, capture_output=True, text=True, timeout=timeout)
    return p.stdout.strip()

def tap(x, y, desc=""):
    print(f"  [TAP] ({x:>3}, {y:>3}) {desc}")
    adb(f'shell "input tap {x} {y}"')
    time.sleep(1.2)

def swipe(x1, y1, x2, y2, dur=300, desc=""):
    print(f"  [SWIPE] ({x1},{y1}) -> ({x2},{y2}) in {dur}ms {desc}")
    adb(f'shell "input swipe {x1} {y1} {x2} {y2} {dur}"')
    time.sleep(1.2)

def capture(name):
    dev_path = f"/tmp/{name}.png"
    local_path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    bmp_path = f"/tmp/{name}.bmp"
    adb(f'shell "miniapp_cli capture {dev_path}"')
    adb(f'pull {dev_path} "{local_path}"')
    sz = os.path.getsize(local_path) if os.path.exists(local_path) else 0
    subprocess.run(f"sips -s format bmp \"{local_path}\" --out \"{bmp_path}\" >/dev/null 2>&1", shell=True)
    non_zero = 0
    tot = 0
    if os.path.exists(bmp_path):
        with open(bmp_path, 'rb') as f:
            data = f.read()
        pixel_offset = struct.unpack('<I', data[10:14])[0]
        width, height = struct.unpack('<ii', data[18:26])
        bpp = struct.unpack('<H', data[28:30])[0]
        h = abs(height)
        row_size = ((width * bpp + 31) // 32) * 4
        pixels = data[pixel_offset:]
        tot = width * h
        bytes_per_px = bpp // 8
        for y in range(h):
            row = pixels[y * row_size : (y + 1) * row_size]
            for x in range(width):
                px = row[x * bytes_per_px : (x + 1) * bytes_per_px]
                if any(b > 15 for b in px[:3]):
                    non_zero += 1
    ratio = (non_zero / tot * 100) if tot else 0
    print(f"  [CAP] {name}.png ({sz:,} B, 有效率={ratio:.2f}%)")
    return local_path, ratio

def start_title():
    adb('shell "miniapp_cli start 8002026102400098 title"')
    time.sleep(2)

def get_settings():
    txt = adb('shell "cat /userdisk/gal_data/sanoba_witch/settings.json 2>/dev/null"')
    try: return json.loads(txt)
    except: return {}

def get_saves():
    txt = adb('shell "cat /userdisk/gal_data/sanoba_witch/saves.json 2>/dev/null"')
    try: return json.loads(txt)
    except: return {}

def check_sound_active():
    out = adb('shell "cat /proc/asound/card*/pcm*p/*/status 2>/dev/null"')
    is_running = "state: RUNNING" in out or "RUNNING" in out
    # 辅助检查 SoundPlayer.log 与 DictPen log
    dp_log = adb('shell "ls -t /userdata/applog/DictPen_*.log 2>/dev/null | head -n 1"')
    lines = adb(f'shell "tail -n 20 {dp_log} 2>/dev/null"') if dp_log else ""
    has_gal_audio = "playVoice" in lines or "playBgm" in lines or "alsasink" in lines
    return is_running, has_gal_audio, out

print("Blackbox test helper initialized.")
