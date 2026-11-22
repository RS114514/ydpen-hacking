# Forensic Auditor Dispatch Task — M3 全栈真实性与完整性司法审计

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- Worker 交付报告：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`

## 约束条件
- 工作目录：`/Volumes/500GB/Ydpen/halflife_app`
- 状态目录：`/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1`
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

## 审计要求与司法级核验
1. 源码与测试代码防作弊审计：
   - 检查 `git status`、`git diff` 及新增/修改代码，核查是否存在为了跑通测试而硬编码预期返回值、硬编码色彩判定、或者将断言条件放水（例如将 `> 0.05` 改为 `>= 0`）等作弊手段；
   - 检查 `tools/test_e2e_verification.py` 中 127 项用例是否全部真实执行，绝不允许 mock 掉真机设备交互或跳过真实断言。
2. 真机环境与日志核验：
   - 核验 6 代真机（`9DA2200007506350`）上部署的 AMR 与动态库真实存在、哈希一致，不存在虚构部署。
   - 检查真机 `/userdisk/halflife/` 目录结构与 `/userdata/applog/` 运行日志，核验 ADB 通信记录的真实性。
3. 裁决规则（HARD VETO）：
   - 若发现任何硬编码断言、伪造测试日志、虚假 mock 或投机取巧行为，必须立即报告 `INTEGRITY VIOLATION`（一票否决）；
   - 若全部核验通过，确认代码与测试真实合规无作弊，报告 `CLEAN`。
4. 产出交付报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/handoff.md` 中给出终审裁决（`CLEAN` 或 `INTEGRITY VIOLATION`），并通过 send_message 向 sub_orch_m3 发送通知。

## 2026-11-15T20:25:43Z
你是 M3 里程碑的法证审计员（auditor_m3_1）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1
你的任务指派文件已写入：/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/DISPATCH.md。

【前置必读】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/DISPATCH.md

【司法级审计要求】
1. 全量代码变更与测试脚本审计：核验 git diff / 新增代码，严防硬编码断言、硬编码色彩值、软化测试阈值或 fake mock；
2. 真机环境与日志核验：核查 6 代真机（9DA2200007506350）上实际部署的 AMR 与动态库哈希，核查真机日志与 ADB 交互真实性；
3. 终审裁决（一票否决制）：无作弊则给出 CLEAN，任何作弊行为直接裁决 INTEGRITY VIOLATION；
4. 输出 handoff.md 并通过 send_message 向 sub_orch_m3 汇报。
