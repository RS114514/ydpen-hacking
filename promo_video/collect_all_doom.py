#!/usr/bin/env python3
import subprocess
import time
import os
import sys

SERIAL = "9DA2200007506350"
AUTH_PASS = "ydpen2026"
BASE_DIR = "/Volumes/500GB/Ydpen/promo_video/doom_assets"
SHOTS_DIR = os.path.join(BASE_DIR, "shots")
FRAMES_DIR = os.path.join(BASE_DIR, "frames")
os.makedirs(SHOTS_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)

def wait_dev():
    for _ in range(20):
        p = subprocess.run("adb devices", shell=True, capture_output=True, text=True)
        if SERIAL in p.stdout and "device" in p.stdout:
            subprocess.run(f"printf '{AUTH_PASS}\\n' | adb -s {SERIAL} shell auth",
                           shell=True, capture_output=True, text=True)
            return True
        time.sleep(1.5)
    return False

def run_adb(cmd):
    for attempt in range(3):
        if not wait_dev():
            time.sleep(2)
            continue
        full_cmd = f"adb -s {SERIAL} {cmd}"
        res = subprocess.run(full_cmd, shell=True, capture_output=True, text=True)
        if res.returncode == 0:
            return res.stdout.strip()
        time.sleep(1.5)
    return ""

def tap(rx, ry, wait_s=0.3):
    run_adb(f"shell 'cd /userdisk/doom && ./tap_mt /dev/input/event1 {rx} {ry}'")
    time.sleep(wait_s)

def cap_shot(name):
    run_adb("shell 'cd /tmp && export XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0 && rm -f wayland-screenshot-*.png && weston-screenshooter'")
    time.sleep(0.3)
    latest = run_adb("shell 'ls -t /tmp/wayland-screenshot-*.png 2>/dev/null | head -1'")
    if latest and "wayland-screenshot" in latest:
        local_raw = f"/tmp/{name}_raw.png"
        run_adb(f"pull {latest} {local_raw}")
        out_png = os.path.join(SHOTS_DIR, f"{name}.png")
        crop_cmd = f"ffmpeg -y -loglevel error -i '{local_raw}' -vf 'crop=266:960:107:0,transpose=1' '{out_png}'"
        subprocess.run(crop_cmd, shell=True)
        if os.path.exists(out_png) and os.path.getsize(out_png) > 1000:
            print(f"[Captured OK] {name}.png ({os.path.getsize(out_png)} bytes)")
            return True
    print(f"[Capture Failed] {name}")
    return False

print(">>> 检查 DOOM 状态并采集剩余关键动作画面...")
# 动作 4: 连续开火并抓拍枪火瞬间
tap(304, 80, 0.1)
cap_shot("04_fire_pistol")

# 动作 5: 转向走廊左侧遭遇敌人
tap(176, 909, 0.4)
tap(176, 819, 0.3)
tap(176, 819, 0.3)
cap_shot("05_left_corridor")

# 动作 6: 开火击退敌人
tap(304, 80, 0.05)
cap_shot("06_corridor_combat")

# 动作 7: 走入柱廊
tap(176, 819, 0.3)
tap(176, 729, 0.3)
cap_shot("07_pillar_hall")

# 动作 8: 经典红字骷髅菜单
tap(143, 50, 0.5)
cap_shot("08_skull_menu")

# 动作 9: 退出菜单返回
tap(143, 50, 0.5)
cap_shot("09_resume_combat")

print(">>> 静态关键画面采集完成！")
