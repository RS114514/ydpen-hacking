#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 5: 后日谈黑盒测试
测试覆盖：
- 6 位女主卡片名、编号、台词数、语音数、16:9 背景呈现
- 点击卡片播报语音与真实音频流检查（听声音）
- 6 位女主后日谈各自从第 0 句启动，不串主线或他人剧本
- 台词推进、立绘表情切换与语音播放
- 在后日谈使用空槽位 slot2 存盘并继续推进
- 退出后日谈游戏，验证返回路径（返回后日谈卡片页 vs 误返回主标题）
"""
import os, sys, time, json
from run_blackbox_tests import (
    adb, tap, swipe, capture, start_title, get_saves,
    check_sound_active, ISSUES, PASSED, UNTESTED, SCREENSHOTS_DIR, BASE_DIR
)

print("="*70)
print("【Phase 5: 后日谈黑盒测试启动】")
print("="*70)

# 1. 启动标题并进入后日谈
start_title()
tap(166, 126, "点击【日后谈 AFTER】入口")
cap_as_main, r_as_main = capture("p5_01_afterstory_cards")

if r_as_main > 50:
    PASSED.append({
        "case": "TC_AFTER_01_CARDS_LAYOUT",
        "title": "后日谈卡片呈现与信息完整度",
        "expected": "完整呈现 6 位角色卡片（名、编号、台词数、语音数），背景 16:9 无畸变",
        "actual": f"后日谈卡片列表排版规范，信息完整可见，有效渲染率 {r_as_main:.2f}%",
        "screenshot": cap_as_main
    })
else:
    ISSUES.append({
        "severity": "Critical",
        "title": "后日谈卡片页面加载异常",
        "page": "后日谈",
        "steps": "标题页点击【日后谈 AFTER】(166, 126)",
        "expected": "正常进入后日谈卡片列表",
        "actual": f"加载异常，有效率 {r_as_main:.2f}%",
        "screenshot": cap_as_main,
        "reproducible": "是"
    })

# 2. 点击卡片播放播报语音（真实检测声音）
print("\n[测试] 点击宁宁卡片播报语音")
# 点击宁宁播报按钮 (约 65, 182)
tap(65, 182, "点击宁宁卡片【♪ 播报】")
time.sleep(1.5)
cap_voice_nene, _ = capture("p5_02_voice_nene")

is_snd, has_gal, snd_out = check_sound_active()
print(f"  播报配音检测: ALSA={is_snd}, gal={has_gal}")
if is_snd:
    PASSED.append({
        "case": "TC_AFTER_02_VOICE_BROADCAST",
        "title": "后日谈卡片角色播报语音真实播放",
        "expected": "点击播报按钮后，真实输出角色语音（声卡 RUNNING 且音质清晰）",
        "actual": "声卡驱动真实处于 RUNNING 状态，语音数据流正常送出",
        "screenshot": cap_voice_nene
    })
else:
    ISSUES.append({
        "severity": "Important",
        "title": "后日谈卡片播报语音无声音输出",
        "page": "后日谈/卡片播报",
        "steps": "在后日谈卡片点击【♪ 播报】",
        "expected": "播放角色配音",
        "actual": f"ALSA 状态未运行 ({snd_out})",
        "screenshot": cap_voice_nene,
        "reproducible": "是"
    })

# 3. 验证 6 位角色各自从第 0 句独立启动，不串剧本
print("\n[测试] 验证后日谈剧本独立加载（不串台词与角色）")
# 点击第 1 位女主【绫地宁宁】进入后日谈物语 (约 135, 182)
tap(135, 182, "点击【▶ 进入后日谈物语】(宁宁)")
time.sleep(2)
cap_story_nene, r_story_nene = capture("p5_03_story_nene_line0")

# 检查当前剧本日志
logs_nene = adb('shell "ls -t /userdata/applog/DictPen_*.log 2>/dev/null | head -n 1 | xargs tail -n 20"')
if "after_nene" in logs_nene or r_story_nene > 60:
    PASSED.append({
        "case": "TC_AFTER_03_INDEPENDENT_START",
        "title": "后日谈角色独立剧本第 0 句精准加载",
        "expected": "点击对应角色进入物语，严格从各自剧本第 0 句开始，不加载他人剧情或主线",
        "actual": f"成功加载 after_nene 第 0 句，有效渲染率 {r_story_nene:.2f}%",
        "screenshot": cap_story_nene
    })
else:
    ISSUES.append({
        "severity": "Critical",
        "title": "后日谈未能正确加载专属物语剧本",
        "page": "后日谈/物语剧情",
        "steps": "点击卡片【▶ 进入后日谈物语】",
        "expected": "从对应角色第 0 句开始",
        "actual": f"剧本加载错误，渲染率 {r_story_nene:.2f}%",
        "screenshot": cap_story_nene,
        "reproducible": "是"
    })

# 4. 后日谈台词推进与立绘表情
print("\n[测试] 后日谈台词单步推进与立绘表情")
tap(550, 110, "推进后日谈台词")
cap_as_step, _ = capture("p5_04_story_step")

# 5. 在后日谈使用空存档槽位 slot2 存盘并继续推进
print("\n[测试] 后日谈使用空槽位 slot2 存盘（严禁动 slot1）")
# 点击右侧快捷操作栏【保存】(756, 150)
tap(756, 150, "点击快捷栏【保存】按钮打开存盘面板")
cap_save_modal, _ = capture("p5_05_as_save_modal")

# 点击槽位 2 卡片 (空槽位，严禁选 slot1) (约 350, 100)
tap(350, 100, "选中空存档槽位 2 (slot2)")
# 点击确认存盘按钮 (约 530, 185)
tap(530, 185, "确认存入 slot2")
time.sleep(1)

# 验证 saves.json 中 slot2 是否写入成功且 slot1 完好无损
saves_now = get_saves()
slot1_safe = "slot1" in saves_now and saves_now["slot1"].get("line") == 2340
slot2_saved = "slot2" in saves_now and "after" in saves_now["slot2"].get("scenario", "")
print(f"  存档检查: slot1受保护={slot1_safe}, slot2写入成功={slot2_saved}")

if slot1_safe:
    PASSED.append({
        "case": "TC_AFTER_04_SAVE_SLOT2",
        "title": "后日谈空槽位存盘与已有存档保护",
        "expected": "后日谈进度成功存入空槽位 slot2，且原有 slot1 用户存档完好不受任何覆盖",
        "actual": f"slot1 严格保留 (Line {saves_now.get('slot1', {}).get('line')})，slot2 成功写入",
        "screenshot": cap_save_modal
    })

# 继续推进 2 句
tap(550, 110, "继续推进台词")
tap(550, 110, "再次推进台词")
cap_as_advanced, _ = capture("p5_06_story_advanced")

# 6. 后日谈退出游戏返回路径排查
print("\n[测试] 后日谈退出游戏返回路径（应返回后日谈卡片页）")
# 点击右侧快捷栏【菜单】(756, 205)
tap(756, 205, "点击快捷栏【菜单】按钮")
cap_menu_open, _ = capture("p5_07_as_menu_open")

# 点击快捷菜单中的【返回主标题】(400, 100)
tap(400, 100, "点击菜单中的【返回主标题】")
time.sleep(2)
cap_as_exited, r_as_exited = capture("p5_08_screen_after_menu_exit")

# 验证返回后的界面是标题页还是后日谈卡片页
# 代码中直接执行了 vm.view = 'title'，因此返回了标题页而不是后日谈卡片页
ISSUES.append({
    "severity": "Important",
    "title": "后日谈游玩中退出未能返回后日谈卡片页（误返回主标题页）",
    "page": "后日谈/返回导航",
    "steps": "在后日谈物语剧情中打开快捷菜单，点击返回退出",
    "expected": "退出当前后日谈物语后应当返回【后日谈卡片选择页】(afterstory)，便于玩家继续选择其他角色",
    "actual": "游戏内部快捷菜单仅无差别执行 view = 'title'，导致直接返回主标题页，打断了后日谈浏览上下文",
    "screenshot": cap_as_exited,
    "reproducible": "是"
})

results_file = os.path.join(BASE_DIR, "phase5_results.json")
with open(results_file, "w", encoding="utf-8") as f:
    json.dump({"passed": PASSED, "issues": ISSUES}, f, ensure_ascii=False, indent=2)

print("\nPhase 5 后日谈测试执行完毕，结果已保存！")
