#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""合并所有 Phase 的黑盒测试结果，生成完整汇总 JSON"""
import os, sys, json

BASE_DIR = "/Users/fuzihao/.gemini/antigravity/brain/cac4e07b-8895-4245-9f59-541f80fa0563/blackbox_test_results"

all_passed = []
all_issues = []

for i in range(1, 8):
    p_file = os.path.join(BASE_DIR, f"phase{i}_results.json")
    if os.path.exists(p_file):
        with open(p_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            all_passed.extend(data.get("passed", []))
            all_issues.extend(data.get("issues", []))

# 分组问题
critical_issues = [it for it in all_issues if it.get("severity") == "Critical"]
important_issues = [it for it in all_issues if it.get("severity") == "Important"]
minor_issues = [it for it in all_issues if it.get("severity") == "Minor"]

summary = {
    "total_cases": len(all_passed) + len(all_issues),
    "passed_count": len(all_passed),
    "issues_count": len(all_issues),
    "critical_count": len(critical_issues),
    "important_count": len(important_issues),
    "minor_count": len(minor_issues),
    "passed": all_passed,
    "issues": {
        "Critical": critical_issues,
        "Important": important_issues,
        "Minor": minor_issues
    }
}

summary_file = os.path.join(BASE_DIR, "overall_test_summary.json")
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print(f"汇总完成: 通过 {len(all_passed)} 项, 发现问题 {len(all_issues)} 项 (Critical: {len(critical_issues)}, Important: {len(important_issues)}, Minor: {len(minor_issues)})")
