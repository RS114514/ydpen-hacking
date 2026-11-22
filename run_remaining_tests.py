#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run_remaining_tests.py
自动化执行《DRACU-RIOT!》剩余黑盒测试：
1. 日后谈完整验证（卡片、角色、第0句剧情、立绘、退出返回路径）
2. 存档与读档（空槽存档、继续游戏恢复、跨场景读取日后谈）
3. 稳定性压测（快速切页、连续返回）
4. 音频硬件状态与日志捕获
"""
import subprocess
import time
import os
import sys

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", "")

SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"
os.makedirs(RESULTS_DIR, exist_ok=True)

def adb(cmd):
    full = f"adb -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap_phys(px, py, delay=0.7):
    adb(f"shell '/userdisk/doom/tap_mt /dev/input/event1 {px} {py}'")
    time.sleep(delay)

def tap_css(cx, cy, delay=0.7):
    px = int(round(107 + cy * 1.2))
    py = int(round(959 - cx * 1.2))
    tap_phys(px, py, delay)

def tap_960(lx, ly, delay=0.7):
    tap_css(lx / 1.2, ly / 1.2, delay)

def swipe_css(cx1, cy1, cx2, cy2, dur_ms=300, delay=0.8):
    px1 = int(round(107 + cy1 * 1.2))
    py1 = int(round(959 - cx1 * 1.2))
    px2 = int(round(107 + cy2 * 1.2))
    py2 = int(round(959 - cx2 * 1.2))
    adb(f"shell '/bin/swipe /dev/input/event1 {px1} {py1} {px2} {py2} {dur_ms}'")
    time.sleep(delay)

def cap(name):
    tmp_path = f"/tmp/{name}.png"
    local_path = f"{RESULTS_DIR}/{name}.png"
    adb(f"shell 'miniapp_cli capture {tmp_path}'")
    adb(f"pull {tmp_path} {local_path}")
    print(f"[CAP] {name} -> {local_path}")
    return local_path

def start_app():
    adb("shell 'miniapp_cli stop 8002026110100097 >/dev/null 2>&1'")
    time.sleep(1.0)
    adb("shell 'miniapp_cli start 8002026110100097'")
    time.sleep(2.5)

def check_sound():
    status = adb("shell 'cat /proc/asound/card1/pcm0p/sub0/status 2>/dev/null; cat /proc/asound/card0/pcm0p/sub0/status 2>/dev/null'")
    mixer = adb("shell 'tail -n 8 /tmp/gal_gs_mixer.log 2>/dev/null'")
    applog = adb("shell 'tail -n 10 /userdata/applog/DictPen_20261101_*.log 2>/dev/null'")
    return status, mixer, applog

print("=== 开始执行测试 ===")
# 确保回到标题页
start_app()
cap("after_00_title_home")

# ----------------- 模块 5: 后日谈测试 -----------------
print("\n--- 5. 后日谈测试 ---")
# 1. 点击“日后谈” AFTER (885, 149) in 960 space
tap_960(885, 149, delay=1.5)
cap("after_01_cards_list")

# 测试卡片选择：日后谈卡片列表
# 默认可能选中第一个角色（矢来美羽），点击第二个角色（布良梓）卡片
# 在 800x220 space 中，卡片横向排列。尝试点击卡片
tap_css(300, 110, delay=1.0)
cap("after_02_card_selected")
s_status, s_mixer, _ = check_sound()
print(f"Sound status after card click: {s_status.strip() if s_status else 'CLOSED'}")

# 点击“进入后日谈物语”按钮（通常在右侧或底部，如 (700, 190)）
# 让我们先在卡片页寻找开始按钮，通常右下角有“进入物语”或点击卡片详情
tap_css(700, 190, delay=2.0)
cap("after_03_story_entry")

# 台词推进测试：点击屏幕中央
tap_css(400, 150, delay=1.0)
cap("after_04_story_line1")
tap_css(400, 150, delay=1.0)
cap("after_05_story_line2")

# 测试后日谈退出游戏/返回：
# 打开菜单 (756, 190)
tap_css(756, 190, delay=1.0)
cap("after_06_in_game_menu")
# 点击返回/退出：menu 中返回标题/退出的按钮 (630, 80)
tap_css(630, 80, delay=1.5)
cap("after_07_after_exit_scene")
# 检查此时是否返回了后日谈卡片页还是直接跑回了标题页！

# ----------------- 模块 6: 存档与读档测试 -----------------
print("\n--- 6. 存档与读档测试 ---")
# 确保在标题页
start_app()
cap("save_00_title")

# 点击“读取存档” (760, 191) in 960 space
tap_960(760, 191, delay=1.2)
cap("save_01_load_modal")

# 查看已有存档：检查 userdisk 存档文件
saves = adb("shell 'ls -la /userdisk/gal_data/dracu_riot_save/ 2>/dev/null; ls -la /userdisk/gal_data/dracu_riot/save/ 2>/dev/null; ls -la /userdisk/gal_data/*.json 2>/dev/null'")
print("Current saves on disk:\n", saves)

# 关闭读档弹窗 (744, 15)
tap_css(744, 15, delay=1.0)
cap("save_02_load_modal_closed")

# 进入新游戏
tap_960(760, 107, delay=2.0)
cap("save_03_new_game_start")
# 推进 2 句台词
tap_css(400, 150, delay=0.8)
tap_css(400, 150, delay=0.8)
cap("save_04_dialogue_advanced")

# 打开游戏内菜单 (756, 190)
tap_css(756, 190, delay=1.0)
cap("save_05_ingame_menu")

# 在菜单中寻找 SAVE 按钮（通常在第1行或第2行，例如 row 1 col 1 (130, 30)）
# 点击存档按钮
tap_css(130, 30, delay=1.2)
cap("save_06_save_modal")

# 在存档面板中选择空槽位（如 slot 5 或 6，注意不覆盖已有存档 1-3）
# 点击 slot 5 (例如在第2页或右侧/下方的卡槽)
# 让我们先观察 save_06_save_modal.png
tap_css(744, 15, delay=1.0) # 先关掉弹窗避免误触
# 返回标题
tap_css(756, 190, delay=0.8)
tap_css(630, 80, delay=1.2)
cap("save_07_back_to_title")

# ----------------- 模块 7: 页面流转与稳定性压测 -----------------
print("\n--- 7. 全页面流转与稳定性测试 ---")
# 连续 3 次进出鉴赏、流程图、日后谈
for i in range(3):
    print(f"Stress cycle {i+1}...")
    # 进鉴赏 -> 返回
    tap_960(885, 107, delay=0.8)
    tap_css(754, 19, delay=0.6)
    # 进流程图 -> 返回
    tap_960(760, 233, delay=0.8)
    tap_css(750, 14, delay=0.6)
    # 进日后谈 -> 返回
    tap_960(885, 149, delay=0.8)
    tap_css(740, 15, delay=0.6)

time.sleep(1.0)
cap("stress_01_after_rapid_nav")

print("=== 测试执行完毕 ===")
