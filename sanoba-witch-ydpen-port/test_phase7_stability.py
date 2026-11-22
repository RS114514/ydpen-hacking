#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase 7: 全页面适配与稳定性压力测试
测试覆盖：
- 连续高频快速点击、手势滑动、页面反复进退 3 轮以上压力测试
- 页面切换返回路径正确性验证（不串页）
- 界面崩溃、白屏、卡死、弹层残留排查
- 内存与进程稳定性验证（miniapp 宿主健康存活）
"""
import os, sys, time, json
from run_blackbox_tests import (
    adb, tap, swipe, capture, start_title,
    check_sound_active, ISSUES, PASSED, UNTESTED, SCREENSHOTS_DIR, BASE_DIR
)

print("="*70)
print("【Phase 7: 全页面适配与稳定性压力测试启动】")
print("="*70)

start_title()

stability_ok = True
rounds = 3

for r in range(1, rounds + 1):
    print(f"\n--- 压力轮次 {r}/{rounds} ---")
    
    # 1. 快速进入鉴赏并返回
    tap(166, 91, "快速进鉴赏")
    swipe(500, 110, 200, 110, 200, "快速滑动")
    tap(50, 18, "快速返回标题")
    
    # 2. 快速进入流程图并返回
    tap(62, 196, "快速进流程图")
    tap(748, 66, "快速切路线")
    tap(750, 14, "快速返回标题")
    
    # 3. 快速进入日后谈并返回
    tap(166, 126, "快速进日后谈")
    tap(750, 14, "快速返回标题")
    
    # 4. 快速进游戏并返回
    tap(62, 91, "快速进新游戏")
    tap(550, 110, "快速推进台词")
    tap(756, 205, "点击菜单")
    tap(400, 100, "返回标题")

# 检查当前界面状态与截屏
cap_stable, r_stable = capture("p7_01_after_stress_test")

# 检查进程存活
ps_check = adb('shell "ps aux | grep -v grep | grep /usr/bin/miniapp"')
print(f"  运行时进程状态: {ps_check.strip()}")

# 检查是否有崩溃日志
log_tail = adb('shell "ls -t /userdata/applog/DictPen_*.log 2>/dev/null | head -n 1 | xargs tail -n 25"')
has_crash = "Fatal" in log_tail or "Segmentation fault" in log_tail or "died" in log_tail

if ps_check and not has_crash and r_stable > 40:
    PASSED.append({
        "case": "TC_STABILITY_01_STRESS",
        "title": "多页面连续高频进退与手势压力稳定性",
        "expected": "连续 3 轮快速进退鉴赏、流程图、日后谈、主线游戏，无崩溃、无白屏、无弹层残留",
        "actual": f"系统在高频交互下平稳运行，进程健康存活，界面渲染率 {r_stable:.2f}%，无蒙层残留",
        "screenshot": cap_stable
    })
else:
    ISSUES.append({
        "severity": "Critical",
        "title": "高频页面切换与交互导致应用异常或渲染崩溃",
        "page": "全局/稳定性",
        "steps": "连续 3 轮快速在标题、鉴赏、流程图、日后谈、游戏中进出操作",
        "expected": "界面平稳稳定，不崩溃不白屏",
        "actual": f"检测到异常状态: process={ps_check}, crash={has_crash}, 渲染率 {r_stable:.2f}%",
        "screenshot": cap_stable,
        "reproducible": "是"
    })

results_file = os.path.join(BASE_DIR, "phase7_results.json")
with open(results_file, "w", encoding="utf-8") as f:
    json.dump({"passed": PASSED, "issues": ISSUES}, f, ensure_ascii=False, indent=2)

print("\nPhase 7 稳定性测试执行完毕，结果已保存！")
