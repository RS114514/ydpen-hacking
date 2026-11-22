import subprocess
import time
import os

OUT_DIR = "/Volumes/500GB/Ydpen/promo_video/shots"

def tap_and_cap(step, tap_x=600, tap_y=130):
    subprocess.run(f'adb shell "input tap {tap_x} {tap_y}"', shell=True)
    time.sleep(1.2)
    dev_path = f"/tmp/sb_scene_{step:02d}.png"
    local_path = os.path.join(OUT_DIR, f"sb_scene_{step:02d}.png")
    subprocess.run(f'adb shell "miniapp_cli capture {dev_path}"', shell=True)
    subprocess.run(f'adb pull {dev_path} "{local_path}"', shell=True, stdout=subprocess.DEVNULL)
    print(f"Step {step} captured -> {local_path}")

print("正在连续推进《千恋＊万花》台词以获取精彩立绘画面...")
# 连续推进并抓取 18 张不同场景对话截图
for i in range(1, 19):
    tap_and_cap(i)

