#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.path.append('/Volumes/500GB/Ydpen')
from dracu_test_runner import *
import time

print("1. Advance dialogue 2 lines...")
tap_css(400, 150, delay=0.8)
tap_css(400, 150, delay=0.8)
cap("test_save_04_dialogue_advanced")

print("2. Open menu and Return to Title...")
tap_css(760, 185, delay=1.0) # Tap 菜单 MENU
cap("test_save_05_menu_open")
tap_css(600, 145, delay=1.5) # Tap 返回标题 RETURN TITLE
cap("test_save_06_returned_to_title")

print("3. Test 继续游戏 CONTINUE from Title...")
# CONTINUE is left column row 2: (760, 160) in 960 space
tap_960(760, 160, delay=2.0)
cap("test_save_07_continue_restored")

print("4. Return to title again...")
tap_css(760, 185, delay=1.0)
tap_css(600, 145, delay=1.5)
cap("test_save_08_title_again")

print("5. Test 日后谈 AFTER from Title...")
# AFTER is right column row 2: (890, 160) in 960 space
tap_960(890, 160, delay=2.0)
cap("test_after_01_page_opened")
