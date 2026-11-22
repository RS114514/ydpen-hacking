#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
playtest_paced.py
带节奏控制的完整试玩脚本，确保 USB 传输稳定不掉线：
1. 鉴赏页与 CG 缩略图/全屏检查
2. 序章游玩、立绘完整性检查、AUTO/SKIP/BACKLOG功能
3. 双分支选项验证（美羽线与梓线分支进入）
4. 保存至 Slot 6
"""
import subprocess
import time
import os
import sys

ADB = "/opt/homebrew/bin/adb"
SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"
os.makedirs(RESULTS_DIR, exist_ok=True)

def adb(cmd):
    full = f"{ADB} -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap_phys(px, py, delay=0.8):
    adb(f"shell '/userdisk/doom/tap_mt /dev/input/event1 {px} {py}'")
    time.sleep(delay)

def tap_css(cx, cy, delay=0.8):
    px = int(round(107 + cy * 1.2))
    py = int(round(959 - cx * 1.2))
    tap_phys(px, py, delay)

def tap_960(lx, ly, delay=0.8):
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
    time.sleep(0.3)
    adb(f"shell 'miniapp_cli capture {tmp_path}'")
    time.sleep(0.3)
    adb(f"pull {tmp_path} {local_path}")
    time.sleep(0.3)
    print(f"[CAP] {name} -> {local_path}")
    return local_path

print("=== 开始带节奏的完整试玩流程 ===")

# ----------------- Phase 1: 鉴赏页与图片显示检查 -----------------
print("\n--- 1. 检查鉴赏页与图片显示 ---")
cap("v2_01_title_home")

# 点击鉴赏 EXTRA: 960 (890, 125)
print("进入鉴赏页...")
tap_960(890, 125, delay=1.5)
cap("v2_02_gallery_home")

# 点击第 1 个分组卡片 (矢来美羽 960: 80, 160)
print("进入矢来美羽 CG 列表...")
tap_960(80, 160, delay=1.5)
cap("v2_03_gallery_miu_grid")

# 点击第 1 张 CG (960: 150, 140) 进入全屏
print("查看第 1 张全屏 CG...")
tap_960(150, 140, delay=1.5)
cap("v2_04_cg_fullscreen")

# 退出全屏特写: 物理 (266, 911)
print("退出全屏 CG...")
tap_phys(266, 911, delay=1.2)
cap("v2_05_cg_grid_returned")

# 返回鉴赏分类: CSS (740, 20)
tap_css(740, 20, delay=1.2)
cap("v2_06_gallery_categories")

# 返回标题页: 960 (930, 25)
tap_960(930, 25, delay=1.5)
cap("v2_07_back_to_title")

# ----------------- Phase 2: 序章全新游玩与功能排查 -----------------
print("\n--- 2. 序章全新试玩与功能排查 ---")
# 点击“开始游戏 START”: 960 (760, 125)
print("开始全新游戏...")
tap_960(760, 125, delay=2.5)
cap("v2_08_prologue_line0")

# 推进台词并截屏检查人物与背景
print("单步推进台词，检查角色立绘与背景...")
for i in range(1, 9):
    tap_phys(250, 400, delay=1.0)
    if i in (2, 5, 8):
        cap(f"v2_09_prologue_step_{i}")

# 测试 AUTO 自动播放功能
print("测试 AUTO 自动播放...")
tap_css(760, 75, delay=0.5) # 点击 AUTO 按钮
cap("v2_10_auto_started")
time.sleep(5.0) # 等待自动推进
cap("v2_11_auto_advancing")
tap_phys(250, 400, delay=1.0) # 点击屏幕停止 AUTO
cap("v2_12_auto_stopped")

# 测试 SKIP 快进功能
print("测试 SKIP 快进...")
tap_css(760, 125, delay=0.5) # 点击 SKIP 按钮
cap("v2_13_skip_started")
time.sleep(3.5) # 快速推进
cap("v2_14_skip_running")
tap_css(760, 125, delay=1.0) # 停止 SKIP
cap("v2_15_skip_stopped")

# 测试历史对话 BACKLOG
print("测试历史对话 BACKLOG...")
tap_css(760, 185, delay=1.2) # 打开菜单
cap("v2_16_menu_opened")
tap_css(600, 75, delay=1.5)  # 点击历史对话 BACKLOG
cap("v2_17_backlog_open")
swipe_css(400, 180, 400, 50, dur_ms=300, delay=1.0) # 向上滑动
cap("v2_18_backlog_scrolled")
tap_css(740, 20, delay=1.2)  # 关闭历史对话
cap("v2_19_backlog_closed")

# ----------------- Phase 3: 选项分支与女主线路验证 -----------------
print("\n--- 3. 验证选项分支与女主路线 ---")
# 打开菜单，跳至选项
tap_css(760, 185, delay=1.0)
tap_css(400, 75, delay=2.0)  # NEXT CHOICE
cap("v2_20_choice_dialog")

# 验证 Option 1 (美羽分支)
print("选择 Option 1 并确认...")
tap_960(300, 100, delay=0.8) # 选中 Option 1
cap("v2_21_opt1_selected")
tap_960(800, 150, delay=1.8) # 确定选择
cap("v2_22_opt1_confirmed")
# 推进台词查看美羽后续剧情与立绘
tap_phys(250, 400, delay=1.0)
cap("v2_23_miu_route_dialogue1")
tap_phys(250, 400, delay=1.0)
cap("v2_24_miu_route_dialogue2")

# 回退并验证 Option 2 (梓分支)
print("回退至选项点并测试 Option 2...")
tap_css(760, 185, delay=1.0)
tap_css(200, 75, delay=1.5) # PREV LINE 回退
cap("v2_25_back_before_choice")
tap_css(760, 185, delay=1.0)
tap_css(400, 75, delay=1.8) # 重新跳至选项
cap("v2_26_choice_dialog_reopened")

tap_960(300, 200, delay=0.8) # 选中 Option 2
cap("v2_27_opt2_selected")
tap_960(800, 150, delay=1.8) # 确定选择
cap("v2_28_opt2_confirmed")
# 推进台词查看梓后续剧情与立绘
tap_phys(250, 400, delay=1.0)
cap("v2_29_azusa_route_dialogue1")
tap_phys(250, 400, delay=1.0)
cap("v2_30_azusa_route_dialogue2")

# ----------------- Phase 4: 保存进度与完成 -----------------
print("\n--- 4. 保存进度至空槽位 Slot 6 ---")
tap_css(760, 185, delay=1.0)
tap_css(200, 145, delay=1.2) # SAVE GAME
cap("v2_31_save_modal")
tap_css(740, 140, delay=1.5) # Slot 6
cap("v2_32_slot6_saved")

tap_css(740, 20, delay=1.0)  # 返回游戏
tap_css(760, 185, delay=0.8)
tap_css(600, 145, delay=1.5) # 返回标题
cap("v2_33_final_title")

print("=== 完整试玩执行完成 ===")
