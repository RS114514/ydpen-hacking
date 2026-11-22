# Reviewer 1 Dispatch Task — M3 打包部署与本地回归审查

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- Worker 交付报告：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`

## 约束条件
- 工作目录：`/Volumes/500GB/Ydpen/halflife_app`
- 状态目录：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1`
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

## 审查重点
1. 编译打包与动态库隔离：
   - 检查 `dist/half-life-1.0.0.amr` 结构，核验包内绝对不包含 `libwl_center.so`，确保动态库物理隔离规约得到执行。
2. 真机部署与独立注入：
   - 检查 6 代真机（`9DA2200007506350`）上的部署状态，核查 `/userdisk/halflife/libwl_center.so` 独立推送、文件尺寸与 MD5 校验；核查小应用安装状态。
3. 本地回归测试套件审查：
   - 核查 `test_controls.py`、`test_lifecycle.mjs`、`test_xrcon.py` 的执行日志、退出码与断言真实性。
4. 产出交付报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/handoff.md` 中给出明确裁决（`APPROVE` 或 `REQUEST_CHANGES`），并通过 send_message 向 sub_orch_m3 发送通知。


## 2026-11-15T20:24:59Z
你是 M3 里程碑的审查员（reviewer_m3_1）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1
你的任务指派文件已写入：/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/DISPATCH.md。

【前置必读】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/DISPATCH.md

【审查范围】
1. AMR 打包结构（dist/half-life-1.0.0.amr）与动态库物理隔离（严禁包含 libwl_center.so）；
2. 6 代真机（9DA2200007506350）部署状态与 /userdisk/halflife/libwl_center.so 独立注入核查；
3. 3 项本地回归测试（test_controls.py、test_lifecycle.mjs、test_xrcon.py）结果与真实性审查；
4. 输出 handoff.md 给出裁决（APPROVE 或 REQUEST_CHANGES），并通过 send_message 向 sub_orch_m3 汇报。
