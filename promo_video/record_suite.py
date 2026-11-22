import subprocess
import time
import os
import glob

RECORD_DIR = "/Volumes/500GB/Ydpen/promo_video/recordings"
os.makedirs(RECORD_DIR, exist_ok=True)

rec_proc = None

def adb(cmd):
    return subprocess.run(f"adb {cmd}", shell=True, capture_output=True, text=True).stdout.strip()

def start_recorder():
    global rec_proc
    adb('shell "rm -rf /tmp/rec && mkdir -p /tmp/rec"')
    rec_proc = subprocess.Popen('adb shell "sh /tmp/rec.sh"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.4)

def stop_recorder(name, fps=8):
    global rec_proc
    adb('shell "rm -f /tmp/rec/running"')
    if rec_proc:
        try:
            rec_proc.wait(timeout=2.0)
        except Exception:
            rec_proc.terminate()
        rec_proc = None
        
    time.sleep(0.3)
    seq_dir = os.path.join(RECORD_DIR, name)
    os.makedirs(seq_dir, exist_ok=True)
    print(f"[{name}] 正在传输实机录制帧...")
    subprocess.run(f'adb pull /tmp/rec/. "{seq_dir}" >/dev/null 2>&1', shell=True)
    
    frames = sorted(glob.glob(os.path.join(seq_dir, "f_*.png")))
    valid_frames = [f for f in frames if os.path.getsize(f) > 1000]
    print(f"[{name}] 成功捕获有效帧数: {len(valid_frames)}")
    
    if not valid_frames:
        print(f"[{name}] 警告: 未捕获到帧")
        return None
        
    for idx, fpath in enumerate(valid_frames):
        target = os.path.join(seq_dir, f"frame_{idx:04d}.png")
        if fpath != target:
            os.rename(fpath, target)
            
    mp4_path = os.path.join(RECORD_DIR, f"{name}.mp4")
    ff_cmd = f'ffmpeg -y -framerate {fps} -i "{seq_dir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p "{mp4_path}"'
    subprocess.run(ff_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(mp4_path):
        print(f"-> 生成实机录屏视频: {mp4_path} ({os.path.getsize(mp4_path):,} bytes)")
    return mp4_path

# ==========================================================
# 场景 1: 千恋万花主标题启动与点击 START 进入主线
# ==========================================================
print("\n>>> [录制 1/4] 《千恋＊万花》主菜单 -> 启动新游戏")
adb('shell "miniapp_cli start 8002026102400099 title"')
time.sleep(3)

start_recorder()
time.sleep(1.5) # 展现主菜单静态
adb('shell "input tap 62 91"') # 点击新游戏 START
time.sleep(2.5) # 展现进入序章的过程
stop_recorder("01_sb_title_to_game", fps=6)

# ==========================================================
# 场景 2: 千恋万花主线剧情对话连续推进（打字机与立绘）
# ==========================================================
print("\n>>> [录制 2/4] 《千恋＊万花》主线对话推进实操")
start_recorder()
for i in range(12):
    adb('shell "input tap 600 130"')
    time.sleep(0.7)
time.sleep(1.0)
stop_recorder("02_sb_dialogue_play", fps=6)

# ==========================================================
# 场景 3: 千恋万花系统功能与后日谈浏览
# ==========================================================
print("\n>>> [录制 3/4] 《千恋＊万花》后日谈与系统界面浏览")
adb('shell "miniapp_cli start 8002026102400099 title"')
time.sleep(2.5)

start_recorder()
adb('shell "input tap 200 149"') # 点击日后谈 AFTER
time.sleep(1.5)
adb('shell "input swipe 600 130 200 130 400"') # 滑动浏览更多女主
time.sleep(1.2)
adb('shell "input tap 50 18"') # 返回主标题
time.sleep(1.0)
adb('shell "input tap 200 185"') # 打开系统设置
time.sleep(1.5)
stop_recorder("03_sb_features_explore", fps=6)

# ==========================================================
# 场景 4: 魔女的夜宴主界面与鉴赏全景
# ==========================================================
print("\n>>> [录制 4/4] 《魔女的夜宴》主标题与流程图实机操作")
adb('shell "miniapp_cli start 8002026102400098 title"')
time.sleep(3.0)

start_recorder()
time.sleep(1.5)
adb('shell "input tap 62 196"') # 流程图
time.sleep(2.0)
adb('shell "input tap 50 18"') # 返回
time.sleep(1.0)
adb('shell "input tap 166 91"') # 鉴赏 EXTRA
time.sleep(2.0)
stop_recorder("04_sw_title_and_chart", fps=6)

print("\n>>> 全部实机录屏任务已顺利完成！")
