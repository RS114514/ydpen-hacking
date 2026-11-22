#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.append('/Volumes/500GB/Ydpen')
from dracu_test_runner import *

print("=== 开始执行测试套件 3: 流程图功能深度测试 ===")
# 1. 切换到【矢来美羽】路线 (Right bar button 2: center around x=930 in 960x266, y around 60)
# Right bar in 800x220: left: 692, top: 32..216, width: 104. In 960x266: x ~ 880..950.
# Button 1 (共通): y ~ 45
# Button 2 (矢来美羽): y ~ 70
# Button 3 (布良梓): y ~ 95
# Button 4 (稻丛莉音): y ~ 120
# Button 5 (艾莉娜): y ~ 145
# Button 6 (尼古拉): y ~ 170
# Button 7 (重复共通): y ~ 240

print("Testing Route switch to Miu...")
tap_960(930, 70)
time.sleep(1.0)
cap("fc_02_miu_route")

print("Testing Route switch to Azusa...")
tap_960(930, 95)
time.sleep(1.0)
cap("fc_03_azusa_route")

print("Testing Route switch to Rio...")
tap_960(930, 120)
time.sleep(1.0)
cap("fc_04_rio_route")

print("Testing Route switch to Elina...")
tap_960(930, 145)
time.sleep(1.0)
cap("fc_05_elina_route")

print("Testing Route switch to Nicola...")
tap_960(930, 170)
time.sleep(1.0)
cap("fc_06_nicola_route")

# 切回共通 (Button 1: y ~ 45)
print("Testing Route switch back to Common...")
tap_960(930, 45)
time.sleep(1.0)
cap("fc_07_common_route_reselected")

# 2. 测试方向键移动与复位
# 底部控制区: ←, →, ↑, ↓, 复位
# 在 960x266 空间:
# ← : (590*1.2, 204*1.2) = (708, 245)
# → : (626*1.2, 204*1.2) = (751, 245)
# ↑ : (662*1.2, 204*1.2) = (794, 245)
# ↓ : (698*1.2, 204*1.2) = (838, 245)
# 复位 : (746*1.2, 204*1.2) = (895, 245)
# (wait, 底部按钮是在右侧栏左边: CSS x ~ 580..740)
print("Testing Direction button Down...")
tap_css(670, 204) # ↓
time.sleep(0.8)
cap("fc_08_after_pan_down")

print("Testing Direction button Right...")
tap_css(600, 204) # →
time.sleep(0.8)
cap("fc_09_after_pan_right")

print("Testing Reset view...")
tap_css(746, 204) # 复位
time.sleep(0.8)
cap("fc_10_after_reset")

# 3. 测试二维拖动（Drag / Swipe）防误触
print("Testing 2D Drag...")
swipe_css(400, 120, 200, 80, dur_ms=400)
time.sleep(1.0)
cap("fc_11_after_drag")
# 点击空白处看是否误触发跳转
tap_css(300, 100)
time.sleep(0.8)
cap("fc_12_after_drag_tap_check")

# 复位
tap_css(746, 204)
time.sleep(0.8)

# 4. 节点跳转测试：点击第一个节点 (开始之夜 0句, CSS x ≈ 100, y ≈ 60)
print("Testing node jump to line 0...")
tap_css(100, 60)
time.sleep(2.0)
cap("fc_13_jump_to_line_0")

# 从游戏中打开菜单返回流程图
tap_css(756, 190) # 菜单
time.sleep(1.0)
# 点击返回标题
tap_css(630, 80)
time.sleep(1.0)
# 重新进入流程图
tap_960(760, 233)
time.sleep(1.5)

# 5. 特别测试：点击选择节点 (3112句 和美羽一起, CSS x ≈ 630, y ≈ 60)
print("Testing node jump to choice node (3112)...")
tap_css(630, 60)
time.sleep(2.0)
cap("fc_14_jump_to_choice_node")

# 打开菜单并返回标题
tap_css(756, 190)
time.sleep(1.0)
tap_css(630, 80)
time.sleep(1.0)
cap("fc_15_returned_to_title")

print("=== 测试套件 3 完成 ===")
