#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dracu_full_test_suite_run2.py
DRACU-RIOT! 第二轮实机完整黑盒测试套件（修正触控焦点与坐标）
"""
import subprocess
import time
import os
import sys

ADB = "/opt/homebrew/bin/adb"
SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_run2"
os.makedirs(RESULTS_DIR, exist_ok=True)

def adb(cmd):
    full = f"{ADB} -s {SERIAL} {cmd}"
    res = subprocess.run(full, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def tap_phys(px, py, delay=1.0):
    adb(f"shell '/userdisk/doom/tap_mt /dev/input/event1 {px} {py}'")
    time.sleep(delay)

def tap_css(cx, cy, delay=1.0):
    px = int(round(107 + cy * 1.2))
    py = int(round(959 - cx * 1.2))
    tap_phys(px, py, delay)

def tap_960(lx, ly, delay=1.0):
    tap_css(lx / 1.2, ly / 1.2, delay)

def swipe_css(cx1, cy1, cx2, cy2, dur_ms=300, delay=1.0):
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
    print(f"[CAPTURE] {name} -> {local_path}")
    return local_path

print("=== 开始 DRACU-RIOT! 第二轮实机黑盒测试 ===")

# 当前已在标题页，先捕获标题基准图
print("\n--- 1. 标题页与系统设置测试 ---")
cap("r2_01_title_home")

# 1.1 系统设置
print("打开系统设置 (920, 180)...")
tap_960(920, 180)
time.sleep(1.2)
cap("r2_02_settings_opened")

print("切换 BGM 开关...")
tap_960(350, 100)
time.sleep(0.8)
cap("r2_03_settings_bgm_toggled")

print("调节音量减少...")
tap_960(450, 160)
time.sleep(0.8)
cap("r2_04_settings_vol_down")

print("关闭系统设置...")
tap_960(880, 40)
time.sleep(1.0)
cap("r2_05_settings_closed")

print("重新打开设置检查数值保持...")
tap_960(920, 180)
time.sleep(1.0)
cap("r2_06_settings_retention_check")
tap_960(880, 40)
time.sleep(1.0)

# 1.2 退出游戏确认弹窗
print("点击退出游戏 (920, 235)...")
tap_960(920, 235)
time.sleep(1.2)
cap("r2_07_exit_modal_opened")

print("点击取消退出 (620, 160)...")
tap_960(620, 160)
time.sleep(1.2)
cap("r2_08_exit_cancelled_title")

# ----------------- 2. 鉴赏页测试 -----------------
print("\n--- 2. 鉴赏页测试 ---")
print("点击鉴赏 EXTRA (920, 70)...")
tap_960(920, 70)
time.sleep(1.5)
cap("r2_09_gallery_home")

print("横向滑动鉴赏卡片列表...")
swipe_css(600, 140, 200, 140, 300)
time.sleep(1.0)
cap("r2_10_gallery_swiped")

print("点击第一张卡片 (美羽 100, 140)...")
tap_960(100, 140)
time.sleep(1.5)
cap("r2_11_gallery_cg_grid")

print("点击缩略图进入全屏查看器 (150, 120)...")
tap_960(150, 120)
time.sleep(1.5)
cap("r2_12_gallery_cg_fullscreen")

print("关闭全屏查看器...")
tap_phys(280, 60)
time.sleep(1.2)
cap("r2_13_gallery_cg_closed")

print("切换音乐盒标签 (815, 25)...")
tap_960(815, 25)
time.sleep(1.2)
cap("r2_14_gallery_music_box")

print("返回标题 (920, 25)...")
tap_960(920, 25)
time.sleep(1.5)
cap("r2_15_back_to_title_from_extra")

# ----------------- 3. 剧情流程图测试 -----------------
print("\n--- 3. 剧情流程图测试 ---")
print("点击流程图 CHART (790, 235)...")
tap_960(790, 235)
time.sleep(1.5)
cap("r2_16_flowchart_common")

print("切换至布良梓路线 (930, 115)...")
tap_960(930, 115)
time.sleep(1.2)
cap("r2_17_flowchart_azusa")

print("切换至稻丛莉音路线 (930, 150)...")
tap_960(930, 150)
time.sleep(1.2)
cap("r2_18_flowchart_rio")

print("点击莉音线第 0 节点 (110, 50)...")
tap_960(110, 50)
time.sleep(2.0)
cap("r2_19_rio_scene_entered")

# ----------------- 4. 主线对话与核心功能测试 -----------------
print("\n--- 4. 主线对话与核心功能测试 ---")
# 推进台词
print("单步点击推进 3 句台词...")
for i in range(3):
    tap_960(500, 150)
    time.sleep(0.8)
cap("r2_20_dialogue_advanced_step3")

# AUTO
print("开启 AUTO 自动播放 (940, 100)...")
tap_960(940, 100)
time.sleep(4.5)
cap("r2_21_auto_running")
print("点击停止 AUTO...")
tap_960(500, 150)
time.sleep(1.0)
cap("r2_22_auto_stopped")

# SKIP
print("开启 SKIP 快进 (940, 160)...")
tap_960(940, 160)
time.sleep(3.0)
cap("r2_23_skip_running")
print("点击停止 SKIP...")
tap_960(500, 150)
time.sleep(1.0)
cap("r2_24_skip_stopped")

# BACKLOG
print("打开历史对话 BACKLOG (680, 250)...")
tap_960(680, 250)
time.sleep(1.2)
cap("r2_25_backlog_opened")
print("点击上一页 (810, 240)...")
tap_960(810, 240)
time.sleep(0.8)
cap("r2_26_backlog_pageup")
print("关闭历史对话 (915, 30)...")
tap_960(915, 30)
time.sleep(1.0)
cap("r2_27_backlog_closed")

# ----------------- 5. 存档与读档测试 (空槽位 Slot 6) -----------------
print("\n--- 5. 存档与读档测试 ---")
print("打开系统菜单 (940, 220)...")
tap_960(940, 220)
time.sleep(1.0)
cap("r2_28_menu_opened")

print("点击保存进度 SAVE GAME (250, 180)...")
tap_960(250, 180)
time.sleep(1.2)
cap("r2_29_save_screen")

print("保存至槽位 6 (880, 200)...")
tap_960(880, 200)
time.sleep(1.5)
cap("r2_30_slot6_saved")

print("返回游戏 (940, 30)...")
tap_960(940, 30)
time.sleep(1.0)

print("推进 2 句使剧情位置发生变化...")
for i in range(2):
    tap_960(500, 150)
    time.sleep(0.8)
cap("r2_31_dialogue_advanced_after_save")

print("打开系统菜单准备读档 (940, 220)...")
tap_960(940, 220)
time.sleep(1.0)

print("点击读取进度 LOAD GAME (500, 180)...")
tap_960(500, 180)
time.sleep(1.2)
cap("r2_32_load_screen")

print("选择槽位 6 并点击读取物语 (630, 25)...")
tap_960(880, 200)
time.sleep(0.8)
tap_960(630, 25)
time.sleep(1.0)
cap("r2_33_load_confirm_modal")

print("点击确定载入 (344, 200)...")
tap_960(344, 200)
time.sleep(1.5)
cap("r2_34_slot6_restored_game")

print("返回标题页...")
tap_960(940, 220)
time.sleep(0.8)
tap_960(750, 180) # 返回标题
time.sleep(1.5)
cap("r2_35_back_to_title_after_save_test")

# ----------------- 6. 日后谈测试 -----------------
print("\n--- 6. 日后谈测试 ---")
print("点击日后谈 AFTER (920, 125)...")
tap_960(920, 125)
time.sleep(1.5)
cap("r2_36_after_story_home")

print("点击播报按钮 (60, 240)...")
tap_960(60, 240)
time.sleep(1.0)
cap("r2_37_after_broadcast_clicked")

print("返回标题 (900, 30)...")
tap_960(900, 30)
time.sleep(1.5)
cap("r2_38_final_title_completed")

print("\n=== 第二轮测试执行全部完成 ===")
