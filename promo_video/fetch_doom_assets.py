#!/usr/bin/env python3
import subprocess
import time
import os
import glob
import sys

SERIAL = "9DA2200007506350"
AUTH_PASS = "ydpen2026"
BASE_DIR = "/Volumes/500GB/Ydpen/promo_video/doom_assets"
os.makedirs(BASE_DIR, exist_ok=True)

def adb_cmd(cmd, timeout=30):
    full_cmd = f"adb -s {SERIAL} {cmd}"
    res = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return res.returncode, res.stdout.strip(), res.stderr.strip()

def ensure_auth():
    for _ in range(10):
        # 检查设备是否在线
        p = subprocess.run("adb devices", shell=True, capture_output=True, text=True)
        if SERIAL in p.stdout and "device" in p.stdout:
            # 尝试 auth
            p_auth = subprocess.run(f"printf '{AUTH_PASS}\\n' | adb -s {SERIAL} shell auth", 
                                    shell=True, capture_output=True, text=True)
            if "success" in p_auth.stdout or "already" in p_auth.stdout or p_auth.returncode == 0:
                return True
        time.sleep(2)
    return False

print(">>> 正在连接并鉴权词典笔...")
if not ensure_auth():
    print("错误: 无法连接词典笔或鉴权失败")
    sys.exit(1)
print(">>> 鉴权成功！")

# 检查当前设备上的 collector 或 DOOM 进程
code, out, _ = adb_cmd("shell 'ps -ef | grep -E \"collector|doom_ydpen\" | grep -v grep'")
print(f"[设备进程]:\n{out}")

# 轮询直到 /tmp/doom_record.tar.gz 生成完毕
print(">>> 等待设备端素材收集完成...")
tar_ready = False
for i in range(40):
    code, out, _ = adb_cmd("shell 'ls -l /tmp/doom_record.tar.gz 2>/dev/null || true'")
    if "doom_record.tar.gz" in out:
        print(f"[完成] 发现打包文件: {out}")
        tar_ready = True
        break
    time.sleep(2)

if not tar_ready:
    print(">>> 重新在后台触发采集脚本...")
    ensure_auth()
    adb_cmd("shell 'chmod 755 /tmp/collector.sh && /tmp/collector.sh > /tmp/collector.log 2>&1 &'")
    for i in range(40):
        code, out, _ = adb_cmd("shell 'ls -l /tmp/doom_record.tar.gz 2>/dev/null || true'")
        if "doom_record.tar.gz" in out:
            print(f"[完成] 发现打包文件: {out}")
            tar_ready = True
            break
        time.sleep(2)

if not tar_ready:
    code, out, _ = adb_cmd("shell 'cat /tmp/collector.log 2>/dev/null || true'")
    print(f"[Collector Log]:\n{out}")
    sys.exit(1)

# 拉取 tar 包到本地
local_tar = os.path.join(BASE_DIR, "doom_record.tar.gz")
print(f">>> 正在拉取资产包至 {local_tar}...")
ensure_auth()
adb_cmd(f"pull /tmp/doom_record.tar.gz {local_tar}")

# 解压
print(">>> 解压资产...")
subprocess.run(f"tar -xzf {local_tar} -C {BASE_DIR}", shell=True, check=True)

raw_shots = sorted(glob.glob(os.path.join(BASE_DIR, "doom_record/shots/*.png")))
print(f">>> 找到 {len(raw_shots)} 张静态截屏，正在转为 960x266 标准带鱼屏格式...")
out_shots_dir = os.path.join(BASE_DIR, "shots")
os.makedirs(out_shots_dir, exist_ok=True)

for raw in raw_shots:
    base = os.path.basename(raw)
    out_png = os.path.join(out_shots_dir, base)
    cmd = f"ffmpeg -y -loglevel error -i '{raw}' -vf 'crop=266:960:107:0,transpose=1' '{out_png}'"
    subprocess.run(cmd, shell=True)
    size = os.path.getsize(out_png) if os.path.exists(out_png) else 0
    print(f"  [Shot] {base} -> {size} bytes")

raw_frames = sorted(glob.glob(os.path.join(BASE_DIR, "doom_record/frames/*.png")))
print(f">>> 找到 {len(raw_frames)} 帧录屏画面，正在转码合成动态视频...")
out_frames_dir = os.path.join(BASE_DIR, "frames")
os.makedirs(out_frames_dir, exist_ok=True)

# 批量转换录屏帧
for idx, rf in enumerate(raw_frames):
    out_f = os.path.join(out_frames_dir, f"frame_{idx:04d}.png")
    cmd = f"ffmpeg -y -loglevel error -i '{rf}' -vf 'crop=266:960:107:0,transpose=1' '{out_f}'"
    subprocess.run(cmd, shell=True)

# 合成 MP4
video_out = os.path.join(BASE_DIR, "doom_gameplay.mp4")
fps = 8
concat_cmd = f"ffmpeg -y -loglevel error -framerate {fps} -i '{out_frames_dir}/frame_%04d.png' -c:v libx264 -pix_fmt yuv420p -crf 18 '{video_out}'"
subprocess.run(concat_cmd, shell=True)
print(f">>> 录屏合成完成: {video_out} (体积: {os.path.getsize(video_out)} bytes)")
print(">>> DOOM 全部素材处理完成！")
