#!/usr/bin/env python3
import subprocess
import time
import os
import glob
import sys

SERIAL = "9DA2200007506350"
AUTH_PASS = "ydpen2026"
BASE_DIR = "/Volumes/500GB/Ydpen/promo_video/doom_assets"
FRAMES_DIR = os.path.join(BASE_DIR, "video_frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

def run_adb(cmd):
    p = subprocess.run(f"adb -s {SERIAL} {cmd}", shell=True, capture_output=True, text=True)
    return p.stdout.strip()

print(">>> 准备在词典笔设备端录制 DOOM 动态操作...")
# 推送设备端录屏与操作脚本
device_script = """#!/bin/sh
REC_DIR=/tmp/rec_doom
rm -rf "$REC_DIR" /tmp/doom_video.tar.gz
mkdir -p "$REC_DIR"

export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0
TAP="/userdisk/doom/tap_mt /dev/input/event1"

tap_btn() {
    $TAP "$1" "$2" >/dev/null 2>&1
    usleep "$3"
}

# 确保离开菜单
tap_btn 143 50 200000
tap_btn 143 50 200000

# 启动录制循环
touch /tmp/doom_rec_run
(
    cd /tmp
    i=0
    while [ -f /tmp/doom_rec_run ] && [ $i -lt 45 ]; do
        rm -f wayland-screenshot-*.png
        weston-screenshooter >/dev/null 2>&1
        f=$(ls -t wayland-screenshot-*.png 2>/dev/null | head -1)
        if [ -n "$f" ] && [ -s "$f" ]; then
            mv "$f" "$REC_DIR/f_$(printf "%04d" $i).png"
            i=$((i+1))
        fi
        usleep 100000
    done
) &
REC_PID=$!

# 执行一套帅气的游玩操作:
# 前进 -> 开枪 -> 转身 -> 前进 -> 开枪
echo "Playing DOOM..."
for step in 1 2 3; do
    tap_btn 176 819 150000
done
tap_btn 304 80 100000
tap_btn 304 80 100000
for step in 1 2; do
    tap_btn 176 729 150000
done
for step in 1 2 3; do
    tap_btn 176 819 150000
done
tap_btn 304 80 100000
tap_btn 304 80 100000
tap_btn 304 80 100000

sleep 1
rm -f /tmp/doom_rec_run
wait $REC_PID 2>/dev/null || true

cd /tmp
tar -czf /tmp/doom_video.tar.gz rec_doom
echo "RECORD_DONE"
"""

run_adb("shell 'rm -f /tmp/rec_doom_runner.sh'")
subprocess.run(f"printf '{AUTH_PASS}\\n' | adb -s {SERIAL} shell auth", shell=True, capture_output=True)
p_push = subprocess.run(f"adb -s {SERIAL} shell 'cat << \\'EOF\\' > /tmp/rec_doom_runner.sh\n{device_script}\nEOF\nchmod 755 /tmp/rec_doom_runner.sh'", shell=True, capture_output=True, text=True)

print(">>> 执行录制并等待生成...")
res = subprocess.run(f"adb -s {SERIAL} shell '/tmp/rec_doom_runner.sh'", shell=True, capture_output=True, text=True, timeout=30)
print(f"[设备输出]: {res.stdout.strip()}")

# 拉取压缩包
local_tar = "/tmp/doom_video.tar.gz"
subprocess.run(f"adb -s {SERIAL} pull /tmp/doom_video.tar.gz {local_tar}", shell=True, check=True)

# 解压并批量转置
subprocess.run(f"rm -rf /tmp/rec_doom && tar -xzf {local_tar} -C /tmp", shell=True, check=True)
raw_frames = sorted(glob.glob("/tmp/rec_doom/*.png"))
print(f">>> 成功抓取 {len(raw_frames)} 帧真机画面，正在转码...")

for idx, rf in enumerate(raw_frames):
    out_f = os.path.join(FRAMES_DIR, f"frame_{idx:04d}.png")
    subprocess.run(f"ffmpeg -y -loglevel error -i '{rf}' -vf 'crop=266:960:107:0,transpose=1' '{out_f}'", shell=True)

# 生成 MP4
mp4_out = os.path.join(BASE_DIR, "doom_real_gameplay.mp4")
subprocess.run(f"ffmpeg -y -loglevel error -framerate 6 -i '{FRAMES_DIR}/frame_%04d.png' -c:v libx264 -pix_fmt yuv420p -crf 18 '{mp4_out}'", shell=True)
print(f">>> 动态录屏生成完成: {mp4_out} (大小: {os.path.getsize(mp4_out)} bytes)")
