import subprocess
import time
import os

SHOTS_DIR = "/Volumes/500GB/Ydpen/promo_video/shots"
os.makedirs(SHOTS_DIR, exist_ok=True)

def run_adb(cmd):
    p = subprocess.run(f"adb {cmd}", shell=True, capture_output=True, text=True)
    return p.stdout.strip()

def tap(x, y, wait=1.5):
    run_adb(f'shell "input tap {x} {y}"')
    time.sleep(wait)

def capture(filename):
    dev_path = f"/tmp/{filename}.png"
    local_path = os.path.join(SHOTS_DIR, f"{filename}.png")
    run_adb(f'shell "miniapp_cli capture {dev_path}"')
    run_adb(f'pull {dev_path} "{local_path}"')
    print(f"[Captured] {local_path}")
    return local_path

print(">>> 开始采集《千恋＊万花》真机素材...")
# 启动千恋万花标题
run_adb('shell "miniapp_cli start 8002026102400099 title"')
time.sleep(3.5)
capture("sb_01_title")

# 点击鉴赏 EXTRA (千恋万花标题坐标: 鉴赏 200, 108)
tap(200, 108, 2.5)
capture("sb_02_extra_menu")
# 鉴赏中点击第一类/CG
tap(280, 110, 2.0)
capture("sb_03_cg_list")
# 点击第一张CG看全屏
tap(200, 120, 2.0)
capture("sb_04_cg_view")
# 切换CG或下一张
tap(550, 110, 1.5)
capture("sb_05_cg_view2")

# 鉴赏切换音乐
tap(50, 18, 1.5) # 返回鉴赏主页
tap(530, 18, 2.0) # 音乐Tab
capture("sb_06_music")

# 返回标题，进入流程图
run_adb('shell "miniapp_cli start 8002026102400099 title"')
time.sleep(2.5)
tap(75, 231, 2.5) # 流程图
capture("sb_07_flowchart")

# 进入日后谈
run_adb('shell "miniapp_cli start 8002026102400099 title"')
time.sleep(2.5)
tap(200, 149, 2.5) # 日后谈
capture("sb_08_afterstory")

# 进入主线剧情 ADV
run_adb('shell "miniapp_cli start 8002026102400099 title"')
time.sleep(2.5)
tap(75, 108, 3.0) # START新游戏
capture("sb_09_adv_start")

for i in range(1, 11):
    tap(550, 110, 1.8) # 推进对话
    capture(f"sb_10_adv_{i:02d}")

print(">>> 开始采集《魔女的夜宴》真机素材...")
# 启动魔女的夜宴
run_adb('shell "miniapp_cli start 8002026102400098 title"')
time.sleep(3.5)
capture("sw_01_title")

# 魔女夜宴 鉴赏 EXTRA (166, 91)
tap(166, 91, 2.5)
capture("sw_02_extra_menu")
# 点击CG分类
tap(280, 110, 2.0)
capture("sw_03_cg_list")
tap(200, 120, 2.0)
capture("sw_04_cg_view")
tap(550, 110, 1.5)
capture("sw_05_cg_view2")

# 音乐鉴赏
tap(50, 18, 1.5)
tap(530, 18, 2.0)
capture("sw_06_music")

# 流程图 (62, 196)
run_adb('shell "miniapp_cli start 8002026102400098 title"')
time.sleep(2.5)
tap(62, 196, 2.5)
capture("sw_07_flowchart")

# 日后谈 (166, 126)
run_adb('shell "miniapp_cli start 8002026102400098 title"')
time.sleep(2.5)
tap(166, 126, 2.5)
capture("sw_08_afterstory")

# 主线 ADV (62, 91)
run_adb('shell "miniapp_cli start 8002026102400098 title"')
time.sleep(2.5)
tap(62, 91, 3.0)
capture("sw_09_adv_start")

for i in range(1, 11):
    tap(550, 110, 1.8)
    capture(f"sw_10_adv_{i:02d}")

print(">>> 全部真机素材抓取完成！")
