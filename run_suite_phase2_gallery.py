#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.append('/Volumes/500GB/Ydpen')
from dracu_test_suite import *

print("=== 开始执行测试套件 2: 鉴赏页功能深度测试 ===")
# 确保在鉴赏页
start_app()
time.sleep(1.0)
tap_960(885, 107) # 点鉴赏
time.sleep(1.2)
cap("t2_01_gallery_groups")

# 1. 点击美羽分组卡片进入 CG 缩略图列表 (x=80, y=140 in 960x266)
print("Entering Miu CG list...")
tap_960(80, 140)
time.sleep(1.5)
cap("t2_02_miu_cg_grid_page1")

# 2. 测试横向滑动（向左滑动看后面的卡片）
print("Testing horizontal swipe...")
swipe_css(600, 120, 200, 120, dur_ms=300)
time.sleep(1.2)
cap("t2_03_miu_cg_grid_swiped")

# 滑回第一页
swipe_css(200, 120, 600, 120, dur_ms=300)
time.sleep(1.0)
cap("t2_04_miu_cg_grid_returned")

# 3. 点击第一个 CG 卡片进入全屏看图 (first card around x=100, y=100 in CSS -> 120, 120 in 960x266)
print("Clicking first CG card to enter fullscreen...")
tap_960(120, 120)
time.sleep(1.5)
cap("t2_05_cg_fullscreen_1x")

# 4. 全屏放大一档 (放大按钮在底部或右上角，或者点击图片)
# 检查全屏控件: 看 gallery.js / gallery.css 中的全屏控制按钮
# 让我们先截取全屏查看控件
time.sleep(0.5)

# 退出全屏（点击返回或关闭按钮）
# 在全屏模式下点击退出全屏
tap_css(750, 18)
time.sleep(1.0)
cap("t2_06_after_exit_fullscreen")

# 返回分组列表（左上角返回按钮）
tap_css(754, 19)
time.sleep(1.0)
cap("t2_07_back_to_groups")

# 5. 切换到【音乐盒】标签 (Music Box Tab)
# Tab 4: 音乐盒. Header tabs in gallery.css:
# let's check tab coordinates in gallery.css
print("Switching to Music Box Tab...")
tap_css(610, 19) # 音乐盒 tab
time.sleep(1.2)
cap("t2_08_music_box_tab")

# 6. 点曲目播放/暂停
print("Clicking track 1 in Music Box...")
tap_css(200, 70)
time.sleep(1.5)
cap("t2_09_music_playing")
is_running, mixer, status = check_sound_output()
print(f"Audio status: running={is_running}")
print(f"Mixer log tail:\n{mixer}")

print("=== 测试套件 2 完成 ===")
