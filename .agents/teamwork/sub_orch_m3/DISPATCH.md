## 2026-11-15T19:08:48Z

你被指派为里程碑 3（M3: 原生小应用打包部署与真机 9DA2200007506350 全量端到端验收）的子编排器（sub_orch_m3）。

【前置必读】
请首先完整阅读原始需求文档：
`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
全局项目架构规约：
`/Volumes/500GB/Ydpen/PROJECT.md`
M3 里程碑范围说明：
`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
M1 交付报告：
`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m1/handoff.md`
M2 交付报告：
`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m2/handoff.md`

【工作目录与状态目录】
- 工作目录：/Volumes/500GB/Ydpen/halflife_app
- 你的专属状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/
- 父代理 Conversation ID：b7028014-bc35-4ae4-ac33-23c85ff55243

【编排原则与铁律】
- 你是调度编排器（DISPATCH-ONLY orchestrator），严禁直接编写或修改源码，严禁直接执行构建与测试命令，严禁直接探索代码。
- 所有具体工作必须通过 invoke_subagent 派发给相应角色的子代理执行。
- 派发 Worker 时必须包含强制诚信警告（DO NOT CHEAT...）。
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

【工作流与执行闭环】
1. 派发 Worker（teamwork_worker）：
   - 执行 `tools/build_amr.py` 编译打包原生 `.amr`；
   - 执行 `tools/install_amr.py` 全量部署至 6 代真机（序列号 `9DA2200007506350`）；
   - 执行本地回归测试：`python3 tools/test_controls.py`、`node tools/test_lifecycle.mjs`、`python3 tools/test_xrcon.py`；
   - 在 6 代真机上执行全量端到端测试：`python3 tools/test_e2e_verification.py --serial 9DA2200007506350`；
   - 收集详细执行日志并输出 handoff.md。
2. 并行派发 2 位独立 Reviewer（teamwork_reviewer）：
   - 审查 AMR 打包产物结构、真机部署与 127 项 E2E 测试日志的合规性与真实性。
3. 并行派发 2 位独立 Challenger（teamwork_challenger）：
   - 对真机部署状态、双指并发触控注入稳定性及生命周期保存恢复进行对抗性验证。
4. 派发 1 位 Forensic Auditor（teamwork_auditor）：
   - 对真机测试日志、ADB 交互及本地脚本退出码进行司法级审计，核验绝对无硬编码断言或假 mock。
5. 门禁汇总（GATE_STATUS.md）：
   - 严格 AND 判定：构建与测试通过 + 2 位 Reviewer APPROVE + 2 位 Challenger APPROVE + Auditor CLEAN。
   - 门禁通过后，产出 `/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/handoff.md`，并通过 send_message 向父编排器汇报。
