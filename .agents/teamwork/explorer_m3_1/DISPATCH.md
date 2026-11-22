# Explorer 1 Dispatch Task — 真实截屏机制与涂色作弊整改技术方案探索

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- 失败尝试记录：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/DEAD_ENDS.md`
- **法证审计员完整报告（必读全文）**：`/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/handoff.md`
- 审查员 1 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/handoff.md`
- 审查员 2 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/handoff.md`

## 探索任务与技术要求
1. 彻底清除作弊代码：
   - 深入审查 `tools/test_e2e_verification.py` 第 597-610 行的人工内存涂色逻辑，制定完全移除该段作弊代码的具体整改计划。
2. 真实三维画面捕获方案设计：
   - 探究真机环境（6 代词典笔 9DA2200007506350）上如何真实、可靠地捕获 Xash3D 的 Wayland/DRM 渲染帧（包括 3D 场景与工控橙暂停菜单），分析 XRCON `snapshot`、Wayland 截图工具或帧缓冲读取的最佳实践。
   - 确保色彩直方图分析基于真机真实输出的像素数据，严禁任何形式的内存篡改。
3. 产出调研报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_1/handoff.md` 中给出严谨可行的技术修复策略（注意：只提方案，不修改源码），并通过 send_message 向 sub_orch_m3 汇报。


## 2026-11-15T20:54:57Z
你是 M3 里程碑的探索者（explorer_m3_1），负责真实截屏机制与涂色作弊整改技术方案调研。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_1
你的任务指派文件：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_1/DISPATCH.md

【前置必读（务必完整阅读）】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/DEAD_ENDS.md
- /Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/handoff.md （法证审计员一票否决完整证据）
- /Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_1/DISPATCH.md

【核心任务】
1. 深入审查 tools/test_e2e_verification.py 第 597-610 行人为内存涂色代码，制定彻底剔除计划；
2. 探索 6 代真机（9DA2200007506350）上真实获取 Xash3D 3D 渲染与菜单画面的技术方案（XRCON snapshot 或 Wayland 抓取），确保断言基于真实像素数据；
3. 输出调研报告至 /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_1/handoff.md（只提方案，不修改源码），并通过 send_message 汇报。
