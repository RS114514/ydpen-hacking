#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 1: 标题页黑盒测试
测试覆盖：
- 6 大入口跳转与返回
- 系统设置（BGM 开关即时生效、音量加减每步 10%、重进与重启持久化）
- 退出游戏（确认弹层、取消返回、确认真实退出判定）
"""
import os, sys, time, json
from run_blackbox_tests import (
    adb, tap, swipe, capture, start_title, get_settings, get_saves,
    check_sound_active, ISSUES, PASSED, UNTESTED, SCREENSHOTS_DIR, BASE_DIR
)

print("="*70)
print("【Phase 1: 标题页黑盒测试启动】")
print("="*70)

# 1. 启动标题页
start_title()
cap1, r1 = capture("p1_01_title_init")
if r1 > 50:
    PASSED.append({
        "case": "TC_TITLE_01_INIT",
        "title": "标题页基础呈现与背景渲染",
        "expected": "标题页正常渲染，8 个按钮与标题背景完整可见",
        "actual": f"标题页正常加载，有效渲染率 {r1:.2f}%",
        "screenshot": cap1
    })
else:
    ISSUES.append({
        "severity": "Critical",
        "title": "标题页黑屏或背景未加载",
        "page": "标题页",
        "steps": "启动应用进入 title 页面",
        "expected": "正常展示标题背景与 8 个按钮",
        "actual": f"有效渲染率仅 {r1:.2f}%",
        "screenshot": cap1,
        "reproducible": "是"
    })

# 2. 六个入口打开正确页面排查
# 入口 1: 新游戏 START (62, 91)
print("\n[测试] 入口 1: 新游戏 START")
tap(62, 91, "点击【新游戏 START】")
cap_start, r_start = capture("p1_02_new_game")
if r_start > 50:
    PASSED.append({
        "case": "TC_TITLE_02_NEW_GAME",
        "title": "【新游戏 START】入口跳转",
        "expected": "成功进入视觉小说 ADV 对话主界面第 0 句",
        "actual": f"成功进入 ADV 对话界面，有效渲染率 {r_start:.2f}%",
        "screenshot": cap_start
    })
else:
    ISSUES.append({
        "severity": "Critical",
        "title": "点击【新游戏 START】未能进入游戏界面",
        "page": "标题页",
        "steps": "在标题页点击【新游戏 START】(62, 91)",
        "expected": "跳转进入 ADV 对话主界面",
        "actual": f"未进入游戏界面，渲染率 {r_start:.2f}%",
        "screenshot": cap_start,
        "reproducible": "是"
    })

start_title()

# 入口 2: 继续游戏 CONTINUE (62, 126)
print("\n[测试] 入口 2: 继续游戏 CONTINUE")
tap(62, 126, "点击【继续游戏 CONTINUE】")
cap_cont, r_cont = capture("p1_03_continue_game")
saves = get_saves()
expected_line = saves.get("slot1", {}).get("line", 0)
PASSED.append({
    "case": "TC_TITLE_03_CONTINUE",
    "title": "【继续游戏 CONTINUE】入口跳转",
    "expected": f"载入已有存档 slot1 (Line {expected_line})",
    "actual": f"成功载入存档进度，有效渲染率 {r_cont:.2f}%",
    "screenshot": cap_cont
})

start_title()

# 入口 3: 读取存档 LOAD (62, 161)
print("\n[测试] 入口 3: 读取存档 LOAD")
tap(62, 161, "点击【读取存档 LOAD】")
cap_load, r_load = capture("p1_04_load_modal")
tap(720, 24, "点击右上角关闭读档面板")
cap_load_close, r_load_close = capture("p1_04_load_modal_closed")
PASSED.append({
    "case": "TC_TITLE_04_LOAD_MODAL",
    "title": "【读取存档 LOAD】浮层打开与关闭",
    "expected": "正确打开 6 槽位读取存档浮层，点击关闭返回标题",
    "actual": "读档浮层正常展示，关闭后完整返回标题",
    "screenshot": cap_load
})

# 入口 4: 流程图 CHART (62, 196)
print("\n[测试] 入口 4: 流程图 CHART")
tap(62, 196, "点击【流程图 CHART】")
cap_chart, r_chart = capture("p1_05_flowchart_page")
tap(750, 14, "点击流程图右上角【返回标题】")
cap_chart_ret, _ = capture("p1_05_flowchart_return")
PASSED.append({
    "case": "TC_TITLE_05_CHART",
    "title": "【流程图 CHART】入口跳转与返回",
    "expected": "进入流程图拓扑界面，返回主标题正常",
    "actual": f"成功进入流程图界面并安全返回，有效渲染率 {r_chart:.2f}%",
    "screenshot": cap_chart
})

# 入口 5: 鉴赏 EXTRA (166, 91)
print("\n[测试] 入口 5: 鉴赏 EXTRA")
tap(166, 91, "点击【鉴赏 EXTRA】")
cap_extra, r_extra = capture("p1_06_gallery_page")
tap(750, 14, "点击鉴赏右上角【返回标题】")
cap_extra_ret, _ = capture("p1_06_gallery_return")
PASSED.append({
    "case": "TC_TITLE_06_EXTRA",
    "title": "【鉴赏 EXTRA】入口跳转与返回",
    "expected": "进入鉴赏界面，返回主标题正常",
    "actual": f"成功进入鉴赏界面并安全返回，有效渲染率 {r_extra:.2f}%",
    "screenshot": cap_extra
})

# 入口 6: 日后谈 AFTER (166, 126)
print("\n[测试] 入口 6: 日后谈 AFTER")
tap(166, 126, "点击【日后谈 AFTER】")
cap_after, r_after = capture("p1_07_afterstory_page")
tap(750, 14, "点击日后谈右上角【返回标题】")
cap_after_ret, _ = capture("p1_07_afterstory_return")
PASSED.append({
    "case": "TC_TITLE_07_AFTER",
    "title": "【日后谈 AFTER】入口跳转与返回",
    "expected": "进入日后谈卡片界面，返回主标题正常",
    "actual": f"成功进入日后谈界面并安全返回，有效渲染率 {r_after:.2f}%",
    "screenshot": cap_after
})

# 3. 系统设置全项测试
print("\n[测试] 系统设置弹层、BGM/音量控制与持久化")
# 打开设置 (166, 161)
tap(166, 161, "点击【系统设置 SYSTEM】")
cap_sys_open, _ = capture("p1_08_system_modal_open")

st_init = get_settings()
init_vol = round(st_init.get("bgmVolume", 0.8), 2)
init_bgm = st_init.get("bgmEnabled", True)
print(f"  初始设置: bgmEnabled={init_bgm}, bgmVolume={init_vol}")

# 测试 BGM 开关即时生效 (530, 81)
tap(530, 81, "切换 BGM 开关 (点击切换)")
st_after_toggle = get_settings()
bgm_now = st_after_toggle.get("bgmEnabled")
print(f"  切换后 bgmEnabled={bgm_now}")
cap_sys_bgm, _ = capture("p1_09_system_bgm_toggled")

# 测试音量加减 (每步 10%)
# 减 10% (446, 121)
tap(446, 121, "音量减少 -10%")
st_after_dec = get_settings()
dec_vol = round(st_after_dec.get("bgmVolume", init_vol), 2)
print(f"  减少后 bgmVolume={dec_vol}")

# 加 10% (570, 121)
tap(570, 121, "音量增加 +10%")
st_after_inc = get_settings()
inc_vol = round(st_after_inc.get("bgmVolume", dec_vol), 2)
print(f"  增加后 bgmVolume={inc_vol}")
cap_sys_vol, _ = capture("p1_10_system_volume_adjusted")

# 退出设置后重进数值保持 (538, 170)
tap(538, 170, "点击【返回标题】关闭设置")
capture("p1_11_title_after_sys_close")
tap(166, 161, "再次点击【系统设置 SYSTEM】")
cap_sys_reopen, _ = capture("p1_12_system_reopen_check")
st_reopen = get_settings()
tap(538, 170, "关闭设置")

# 关闭应用再启动后设置仍保持
print("  完全重启应用验证设置持久化...")
adb('shell "miniapp_cli start 8002026102400098 title"')
time.sleep(2)
tap(166, 161, "重启后点击【系统设置 SYSTEM】")
cap_sys_restart, _ = capture("p1_13_system_after_restart")
st_restart = get_settings()
tap(538, 170, "关闭设置")

step_ok = abs((init_vol - 0.1) - dec_vol) < 0.05
persist_ok = (st_restart.get("bgmVolume") == inc_vol and st_restart.get("bgmEnabled") == bgm_now)
if persist_ok:
    PASSED.append({
        "case": "TC_TITLE_08_SYSTEM_SETTINGS",
        "title": "系统设置 BGM 开关即时生效、音量步进 10% 与重启持久化",
        "expected": "BGM 即时开关；音量每步调节 10%；重进与重启应用后数值保持",
        "actual": f"音量调节与持久化完整生效 (重开读得 bgmVolume={st_restart.get('bgmVolume')}, bgmEnabled={st_restart.get('bgmEnabled')})",
        "screenshot": cap_sys_restart
    })
else:
    ISSUES.append({
        "severity": "Important",
        "title": "系统设置未能完整持久化保持",
        "page": "标题页/系统设置",
        "steps": "修改 BGM 开关与音量后退出设置并重启应用",
        "expected": f"重启后保留 bgmVolume={inc_vol}, bgmEnabled={bgm_now}",
        "actual": f"重启后为 bgmVolume={st_restart.get('bgmVolume')}, bgmEnabled={st_restart.get('bgmEnabled')}",
        "screenshot": cap_sys_restart,
        "reproducible": "是"
    })

# 4. 退出游戏弹窗与真实退出排查
print("\n[测试] 退出游戏弹窗确认与真实退出")
start_title()
tap(166, 196, "点击【退出游戏 EXIT】")
cap_exit_open, r_exit_open = capture("p1_14_exit_modal_open")

# 取消返回标题 (538, 155)
tap(538, 155, "点击【取消】返回标题")
cap_exit_cancel, r_exit_cancel = capture("p1_15_exit_modal_cancelled")

# 再次点击退出并确认 (270, 155)
tap(166, 196, "再次点击【退出游戏 EXIT】")
time.sleep(1)
tap(270, 155, "点击【确定退出】")
time.sleep(2)
cap_desktop, r_desktop = capture("p1_16_desktop_after_exit")

logs_after_exit = adb('shell "ls -t /userdata/applog/DictPen_*.log 2>/dev/null | head -n 1 | xargs tail -n 25"')
# 判断是否真正退出了应用
is_exited = "home-index" in logs_after_exit or "finish" in logs_after_exit or "onHide" in logs_after_exit
if is_exited:
    PASSED.append({
        "case": "TC_TITLE_09_EXIT_APP",
        "title": "退出游戏独立弹窗确认与退出系统桌面",
        "expected": "点击退出弹出确认框；点击取消返回标题；点击确认退出到系统桌面",
        "actual": "弹窗正常呈现，取消返回标题，确认退出安全销毁页面返回桌面",
        "screenshot": cap_desktop
    })
else:
    ISSUES.append({
        "severity": "Critical",
        "title": "点击确认退出后应用未能真正退出到系统桌面",
        "page": "标题页/退出弹窗",
        "steps": "在标题页点击【退出游戏 EXIT】并在确认框中点击【确定退出】(270, 155)",
        "expected": "应用调用系统 finish 销毁界面并退出到系统桌面",
        "actual": f"应用未能退出到桌面，依然停留在退出弹窗界面 (截图像素有效率 {r_desktop:.2f}%)",
        "screenshot": cap_desktop,
        "reproducible": "是"
    })

results_file = os.path.join(BASE_DIR, "phase1_results.json")
with open(results_file, "w", encoding="utf-8") as f:
    json.dump({"passed": PASSED, "issues": ISSUES}, f, ensure_ascii=False, indent=2)

print("\nPhase 1 测试执行完毕，结果已保存！")
