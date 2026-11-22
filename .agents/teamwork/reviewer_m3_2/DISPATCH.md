# Reviewer 2 Dispatch Task — M3 真机 E2E 验收与日志审查

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- Worker 交付报告：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`

## 约束条件
- 工作目录：`/Volumes/500GB/Ydpen/halflife_app`
- 状态目录：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2`
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

## 审查重点
1. 127 项全量端到端测试覆盖与通过性审查：
   - 审查测试产物目录 `/Volumes/500GB/Ydpen/halflife_app/test_artifacts/run_20261116_042025/` 下的 `summary.json`、`REPORT.md`。
   - 逐项核验 Tier 1 (55项)、Tier 2 (55项)、Tier 3 (12项)、Tier 4 (5项) 的执行结果、退出码（必须为 0）与通过率（100.0%）。
2. 断言与截图证据审查：
   - 审查 `test_artifacts/run_20261116_042025/` 下留存的真机图像证据与色彩指标（纯黑比例、工控橙比例、非黑有效画面比率）。
   - 验证测试断言真实有效，核验是否存在断言被降级、软化或绕过。
3. 产出交付报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/handoff.md` 中给出明确裁决（`APPROVE` 或 `REQUEST_CHANGES`），并通过 send_message 向 sub_orch_m3 发送通知。


## 2026-11-15T20:25:07Z
你是 M3 里程碑的审查员（reviewer_m3_2）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2
你的任务指派文件已写入：/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/DISPATCH.md。

【前置必读】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/DISPATCH.md

【审查范围】
1. 真机全量 127 项 E2E 测试产物（/Volumes/500GB/Ydpen/halflife_app/test_artifacts/run_20261116_042025/ 下 summary.json, REPORT.md 及截图）；
2. 逐层核验 Tier 1 到 Tier 4 测试覆盖、真实真机执行与退出码 0，核验是否有断言被跳过或降级；
3. 输出 handoff.md 给出裁决（APPROVE 或 REQUEST_CHANGES），并通过 send_message 向 sub_orch_m3 汇报。
