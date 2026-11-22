import subprocess
import time
import os

OUT_DIR = "/Volumes/500GB/Ydpen/promo_video/recordings"
os.makedirs(OUT_DIR, exist_ok=True)

def adb(cmd):
    return subprocess.run(f"adb {cmd}", shell=True, capture_output=True, text=True).stdout.strip()

def tap(x, y, wait=0.8):
    adb(f'shell "input tap {x} {y}"')
    time.sleep(wait)

def record_sequence(name, actions, fps=8):
    print(f"\n>>> 开始录制动作序列: {name}")
    seq_dir = os.path.join(OUT_DIR, name)
    os.makedirs(seq_dir, exist_ok=True)
    
    # 清理词典笔 /tmp/rec
    adb('shell "rm -rf /tmp/rec && mkdir -p /tmp/rec"')
    
    frame_idx = 0
    def snap():
        nonlocal frame_idx
        adb(f'shell "miniapp_cli capture /tmp/rec/f_{frame_idx:04d}.png"')
        frame_idx += 1

    for act in actions:
        if act['type'] == 'wait':
            steps = int(act['time'] * fps)
            for _ in range(steps):
                snap()
                time.sleep(1.0 / fps)
        elif act['type'] == 'tap':
            adb(f'shell "input tap {act[\"x\"]} {act[\"y\"]}"')
            steps = int(act.get('post_wait', 1.0) * fps)
            for _ in range(steps):
                snap()
                time.sleep(1.0 / fps)
        elif act['type'] == 'swipe':
            adb(f'shell "input swipe {act[\"x1\"]} {act[\"y1\"]} {act[\"x2\"]} {act[\"y2\"]} {act.get(\"dur\", 300)}"')
            steps = int(act.get('post_wait', 1.0) * fps)
            for _ in range(steps):
                snap()
                time.sleep(1.0 / fps)

    print(f"录制完成，总帧数: {frame_idx}，正在拉取到本地...")
    adb(f'pull /tmp/rec/. "{seq_dir}"')
    
    # 合成 mp4 视频
    mp4_path = os.path.join(OUT_DIR, f"{name}.mp4")
    cmd = f'ffmpeg -y -framerate {fps} -i "{seq_dir}/f_%04d.png" -c:v libx264 -pix_fmt yuv420p "{mp4_path}"'
    subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"生成实机录屏视频: {mp4_path}")

print("词典笔准备就绪...")
