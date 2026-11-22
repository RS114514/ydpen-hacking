#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify_heroines_and_features.py
自动化执行女主路线切入、立绘完整性验证、AUTO/SKIP/BACKLOG功能测试
"""
import subprocess
import time
import os

ADB = "/opt/homebrew/bin/adb"
SERIAL = "9DA2200007506350"
RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"

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

print("=== 1. 测试 AUTO 自动播放功能 ===")
# AUTO 按钮: CSS (760, 75)
tap_css(760, 75, delay=0.5)
cap("feat_01_auto_started")
time.sleep(4.5)
cap("feat_02_auto_advancing")
# 点击文本区停止 AUTO
tap_phys(250, 400, delay=0.8)
cap("feat_03_auto_stopped")

print("=== 2. 测试 SKIP 快进功能 ===")
# SKIP 按钮: CSS (760, 125)
tap_css(760, 125, delay=0.5)
cap("feat_04_skip_started")
time.sleep(3.5)
cap("feat_05_skip_running")
tap_css(760, 125, delay=1.0) # 停止 SKIP
cap("feat_06_skip_stopped")

print("=== 3. 测试 历史对话 BACKLOG ===")
# 对话框底部“历史对话”按钮: CSS (550, 205)
tap_css(550, 205, delay=1.2)
cap("feat_07_backlog_open")
# 关闭历史对话 (740, 20)
tap_css(740, 20, delay=1.0)
cap("feat_08_backlog_closed")

print("=== 4. 保存当前莉音剧情至 Slot 6 ===")
tap_css(760, 185, delay=1.0) # 打开菜单
tap_css(200, 145, delay=1.2) # SAVE GAME
cap("feat_09_save_modal")
tap_css(740, 140, delay=1.5) # Slot 6
cap("feat_10_slot6_saved")
tap_css(740, 20, delay=1.0)  # 返回游戏

print("=== 5. 流程图切入 艾莉娜 (Elina) 路线 ===")
# 菜单 -> 返回标题
tap_css(760, 185, delay=0.8)
tap_css(600, 145, delay=1.5) # 返回标题
# 标题 -> 流程图 (760, 230 in 960)
tap_960(760, 230, delay=1.8)
cap("feat_11_flowchart_home")
# 流程图右侧切换至 艾莉娜 (930, 145 in 960)
tap_960(930, 145, delay=1.2)
cap("feat_12_elina_flowchart")
# 点击 艾莉娜 第 1 个节点 (100, 70 in CSS)
tap_css(100, 70, delay=2.0)
cap("feat_13_elina_stage_entered")
# 退出特写 (240, 920 in phys)
tap_phys(240, 920, delay=1.2)
cap("feat_14_elina_dialogue_sprite")

print("=== 6. 流程图切入 布良梓 (Azusa) 路线 ===")
tap_css(760, 185, delay=0.8)
tap_css(600, 145, delay=1.5) # 返回标题
tap_960(760, 230, delay=1.8) # 流程图
# 切换至 布良梓 (930, 95 in 960)
tap_960(930, 95, delay=1.2)
cap("feat_15_azusa_flowchart")
# 点击 布良梓 第 1 个节点 (100, 70 in CSS)
tap_css(100, 70, delay=2.0)
cap("feat_16_azusa_stage_entered")
# 退出特写
tap_phys(240, 920, delay=1.2)
cap("feat_17_azusa_dialogue_sprite")

print("=== 7. 流程图切入 矢来美羽 (Miu) 路线 ===")
tap_css(760, 185, delay=0.8)
tap_css(600, 145, delay=1.5) # 返回标题
tap_960(760, 230, delay=1.8) # 流程图
# 切换至 矢来美羽 (930, 70 in 960)
tap_960(930, 70, delay=1.2)
cap("feat_18_miu_flowchart")
# 点击 矢来美羽 第 1 个节点 (100, 70 in CSS)
tap_css(100, 70, delay=2.0)
cap("feat_19_miu_stage_entered")
# 退出特写
tap_phys(240, 920, delay=1.2)
cap("feat_20_miu_dialogue_sprite")

print("=== 全部女主路线与立绘核验流程完成 ===")
