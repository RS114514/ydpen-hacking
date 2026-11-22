#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = "/opt/homebrew/bin:/usr/local/bin:" + os.environ.get("PATH", "")

SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"
os.makedirs(RESULTS_DIR, exist_ok=True)

ADB_BIN = "/opt/homebrew/bin/adb" if os.path.exists("/opt/homebrew/bin/adb") else "adb"

def adb(cmd):
    full = f"{ADB_BIN} -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    if res.returncode != 0 and "offline" in res.stderr:
        print(f"[ADB ERROR] {res.stderr.strip()}")
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
    adb("shell 'killall -9 doom_ydpen 2>/dev/null'")
    adb("shell 'miniapp_cli stop 8002026110100097 >/dev/null 2>&1'")
    time.sleep(1.0)
    adb("shell 'miniapp_cli start 8002026110100097'")
    time.sleep(2.5)

print("=== 启动完整试玩测试流程 ===")
start_app()

# ==================== Phase 1: 标题与鉴赏页图片检查 ====================
print("\n--- Phase 1: 标题与鉴赏页图片检查 ---")
cap("play_01_title_home")

# 1. 鉴赏页
print("1. 点击鉴赏 EXTRA...")
tap_960(890, 125, delay=1.5)
cap("play_02_gallery_home")

# 2. 点击矢来美羽 CG 分组卡片 (80, 160)
print("2. 点击矢来美羽 CG 分组...")
tap_960(80, 160, delay=1.5)
cap("play_03_gallery_miu_grid")

# 3. 点击第 1 张 CG 进入全屏查看
print("3. 点击第 1 张 CG 进入全屏...")
tap_960(150, 140, delay=1.5)
cap("play_04_cg_fullscreen")

# 4. 测试放大/缩小
print("4. 测试特写放大缩小...")
tap_css(755, 30, delay=0.8) # + 放大
cap("play_05_cg_zoomed")
tap_css(755, 130, delay=0.8) # - 缩小
cap("play_06_cg_shrunk")

# 5. 退出全屏特写 (266, 911 in phys)
print("5. 退出全屏特写...")
tap_phys(266, 911, delay=1.2)
cap("play_07_cg_grid_returned")

# 6. 返回鉴赏分类
tap_css(740, 20, delay=1.2)
cap("play_08_gallery_categories_returned")

# 7. 切换到音乐盒标签 (810, 25 in 960)
print("7. 切换到音乐盒...")
tap_960(810, 25, delay=1.2)
cap("play_09_music_box_tab")

# 8. 点击返回标题 (930, 25 in 960)
print("8. 返回标题页...")
tap_960(930, 25, delay=1.5)
cap("play_10_back_to_title")

# ==================== Phase 2: 序章全新试玩与核心功能 ====================
print("\n--- Phase 2: 序章全新试玩与核心功能 ---")
# 1. 点击“开始游戏 START” (760, 125) in 960 space
print("1. 点击开始游戏 START...")
tap_960(760, 125, delay=2.5)
cap("play_11_prologue_line0")

# 2. 单步推进台词 6 句，观察角色立绘与背景
for i in range(1, 7):
    print(f"推进台词 {i}...")
    tap_phys(250, 400, delay=1.0) # 点击文本区推进
    if i in (2, 4, 6):
        cap(f"play_12_dialogue_step_{i}")

# 3. 测试 AUTO 自动播放功能
print("3. 测试 AUTO 自动播放...")
tap_css(760, 75, delay=0.5) # 点击 AUTO
cap("play_13_auto_started")
time.sleep(5.0) # 等待自动推进
cap("play_14_auto_advancing")
tap_phys(250, 400, delay=0.8) # 点击停止 AUTO
cap("play_15_auto_stopped")

# 4. 测试 SKIP 快进功能
print("4. 测试 SKIP 快进...")
tap_css(760, 125, delay=0.5) # 点击 SKIP
cap("play_16_skip_started")
time.sleep(3.5) # 快进 3.5 秒
cap("play_17_skip_running")
tap_css(760, 125, delay=1.0) # 点击停止 SKIP
cap("play_18_skip_stopped")

# 5. 测试“历史对话 BACKLOG”功能
print("5. 测试历史对话 BACKLOG...")
tap_css(760, 185, delay=1.2) # 打开菜单
cap("play_19_menu_for_backlog")
tap_css(600, 75, delay=1.5)  # 点击历史对话 BACKLOG
cap("play_20_backlog_open")
swipe_css(400, 180, 400, 50, dur_ms=300, delay=1.0) # 向上滚动
cap("play_21_backlog_scrolled")
tap_css(740, 20, delay=1.2)  # 关闭历史对话
cap("play_22_backlog_closed")

# ==================== Phase 3: 各选项分支测试与女主路线验证 ====================
print("\n--- Phase 3: 各选项分支测试与女主路线验证 ---")
# 1. 打开菜单，使用“跳至选项 NEXT CHOICE” (400, 75)
print("1. 跳至关键剧情选项点...")
tap_css(760, 185, delay=1.0) # 打开菜单
tap_css(400, 75, delay=2.0)  # 跳至选项
cap("play_23_choice_screen_appeared")

# 2. 测试 Option 1 (美羽分支: 尽量多注意一下周围)
print("2. 选中并进入 Option 1 (美羽分支)...")
tap_960(300, 100, delay=0.8) # 选中 Option 1
cap("play_24_opt1_selected")
tap_960(800, 150, delay=1.8) # 点击确定选择
cap("play_25_opt1_confirmed_miu")
# 推进台词，观察美羽专属剧情与立绘
tap_phys(250, 400, delay=1.0)
cap("play_26_miu_route_dialogue1")
tap_phys(250, 400, delay=1.0)
cap("play_27_miu_route_dialogue2")

# 3. 测试 Option 2 (梓分支: 重点防备正面)
print("3. 回退并测试 Option 2 (梓分支)...")
# 打开菜单回退
tap_css(760, 185, delay=1.0)
tap_css(200, 75, delay=1.5) # PREV LINE
cap("play_28_stepped_back_to_choice")
# 如果回退后在选项前，点击跳至选项或点击推进
tap_css(760, 185, delay=1.0)
tap_css(400, 75, delay=1.8) # 再次跳至选项
cap("play_29_choice_screen_reopened")

tap_960(300, 200, delay=0.8) # 选中 Option 2
cap("play_30_opt2_selected")
tap_960(800, 150, delay=1.8) # 点击确定选择
cap("play_31_opt2_confirmed_azusa")
# 推进台词，观察不同女主专属剧情与立绘
tap_phys(250, 400, delay=1.0)
cap("play_32_azusa_route_dialogue1")
tap_phys(250, 400, delay=1.0)
cap("play_33_azusa_route_dialogue2")

# ==================== Phase 4: 保存与流程图状态核验 ====================
print("\n--- Phase 4: 保存与状态核验 ---")
# 1. 打开菜单保存到空槽位 Slot 6 (740, 140)
print("1. 保存至空槽位 Slot 6...")
tap_css(760, 185, delay=1.0)
tap_css(200, 145, delay=1.2) # SAVE GAME
cap("play_34_save_modal_open")
tap_css(740, 140, delay=1.5) # 点击 Slot 6
cap("play_35_slot6_saved")

# 2. 返回游戏并返回标题
tap_css(740, 20, delay=1.0) # 返回游戏
tap_css(760, 185, delay=0.8)
tap_css(600, 145, delay=1.5) # 返回标题
cap("play_36_returned_title")

# 3. 检查流程图分支解锁状态
print("3. 检查流程图状态...")
tap_960(760, 230, delay=1.8) # 流程图 CHART
cap("play_37_flowchart_after_play")

# 4. 返回标题
tap_css(740, 20, delay=1.0)
cap("play_38_final_title")

print("=== 完整试玩流程顺利完成 ===")
