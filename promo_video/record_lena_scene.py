import subprocess
import time
import os
import glob

RECORD_DIR = "/Volumes/500GB/Ydpen/promo_video/recordings"
os.makedirs(RECORD_DIR, exist_ok=True)
NAME = "05_sb_heroine_lena_play"
SEQ_DIR = os.path.join(RECORD_DIR, NAME)
os.makedirs(SEQ_DIR, exist_ok=True)

IP = "192.168.31.31:5555"

def adb(cmd):
    return subprocess.run(f"adb -s {IP} {cmd}", shell=True, capture_output=True, text=True).stdout.strip()

print(f">>> 开始录制女主角实机演出连续操作 [{NAME}]...")
adb('shell "rm -rf /tmp/rec && mkdir -p /tmp/rec"')

# 启动录制后台进程
proc = subprocess.Popen(f'adb -s {IP} shell "sh /tmp/rec.sh"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.5)

# 连续推进 8 句对话，每步等待 1.0 秒
for i in range(8):
    adb('shell "input tap 600 130"')
    time.sleep(1.0)

time.sleep(1.0)
adb('shell "rm -f /tmp/rec/running"')
try:
    proc.wait(timeout=2.0)
except Exception:
    proc.terminate()

time.sleep(0.5)
print("正在拉取录屏帧到本地...")
subprocess.run(f'adb -s {IP} pull /tmp/rec/. "{SEQ_DIR}" >/dev/null 2>&1', shell=True)

frames = sorted(glob.glob(os.path.join(SEQ_DIR, "f_*.png")))
valid_frames = [f for f in frames if os.path.getsize(f) > 1000]
print(f"成功捕获有效帧数: {len(valid_frames)}")

for idx, fpath in enumerate(valid_frames):
    target = os.path.join(SEQ_DIR, f"frame_{idx:04d}.png")
    if fpath != target:
        os.rename(fpath, target)

mp4_path = os.path.join(RECORD_DIR, f"{NAME}.mp4")
ff_cmd = f'ffmpeg -y -framerate 6 -i "{SEQ_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p "{mp4_path}"'
subprocess.run(ff_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"-> 成功生成女主实机操作视频: {mp4_path} ({os.path.getsize(mp4_path):,} bytes)")

