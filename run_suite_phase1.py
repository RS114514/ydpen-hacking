#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.append('/Volumes/500GB/Ydpen')
from dracu_test_suite import *

print("=== 开始执行测试套件 1: 标题页 6 大入口导航与返回 ===")
start_app()
time.sleep(1.0)
cap("t1_00_title_home")

# 1. 鉴赏 EXTRA (885, 107) in 960x266 space
print("Testing 入口: 鉴赏 (EXTRA)...")
tap_960(885, 107)
time.sleep(1.2)
cap("t1_01_gallery_page")
# 返回标题: gallery 返回按钮 (754, 19) in CSS
tap_css(754, 19)
time.sleep(1.0)
cap("t1_02_back_from_gallery")

# 2. 日后谈 AFTER (885, 149)
print("Testing 入口: 日后谈 (AFTER)...")
tap_960(885, 149)
time.sleep(1.2)
cap("t1_03_afterstory_page")
# 返回标题: afterstory 返回按钮 (740, 15) in CSS
tap_css(740, 15)
time.sleep(1.0)
cap("t1_04_back_from_afterstory")

# 3. 流程图 CHART (760, 233)
print("Testing 入口: 流程图 (CHART)...")
tap_960(760, 233)
time.sleep(1.5)
cap("t1_05_flowchart_page")
# 返回标题: flowchart 返回按钮 (750, 14) in CSS
tap_css(750, 14)
time.sleep(1.0)
cap("t1_06_back_from_flowchart")

# 4. 读取存档 LOAD (760, 191)
print("Testing 入口: 读取存档 (LOAD)...")
tap_960(760, 191)
time.sleep(1.0)
cap("t1_07_title_load_modal")
# 关闭弹层: saveload-header-close-btn left: 780 - 72 = 708, top: 3, width: 72, height: 24 -> center (744, 15) in CSS
tap_css(744, 15)
time.sleep(1.0)
cap("t1_08_back_from_title_load")

# 5. 开始游戏 / 新游戏 START (760, 107)
print("Testing 入口: 开始游戏 (START)...")
tap_960(760, 107)
time.sleep(2.0)
cap("t1_09_game_new_game")
# 打开菜单 (756, 190) in CSS
tap_css(756, 190)
time.sleep(1.0)
cap("t1_10_game_menu_modal")
# 点击返回标题: menu row 2, col 3: left: 10 + 260*2 = 530, top: 80 in CSS
# Let's check menu grid in game.css or tap center of third button
tap_css(630, 80)
time.sleep(1.2)
cap("t1_11_back_from_game_to_title")

# 6. 继续游戏 CONTINUE (760, 149)
print("Testing 入口: 继续游戏 (CONTINUE)...")
tap_960(760, 149)
time.sleep(2.0)
cap("t1_12_game_continue")
# 打开菜单并返回
tap_css(756, 190)
time.sleep(1.0)
tap_css(630, 80)
time.sleep(1.0)
cap("t1_13_back_from_continue_to_title")

print("=== 测试套件 1 完成 ===")
