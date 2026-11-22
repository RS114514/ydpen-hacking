# Explorer 2 Dispatch Task — 空断言用例整改与真实端到端断言方案探索

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- 失败尝试记录：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/DEAD_ENDS.md`
- **法证审计员完整报告（必读全文）**：`/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/handoff.md`
- 审查员 1 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/handoff.md`
- 审查员 2 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/handoff.md`

## 探索任务与技术要求
1. 梳理全部 89 处空测试桩：
   - 全面排查 `tools/test_e2e_verification.py` 中所有的 `ctx.assert_true(True)`，分类归纳其对应的测试意图（物理位移、按键高亮、多指并发、异常边界防御等）。
2. 设计真实的端到端检验方案：
   - 针对每一类测试桩，提出基于真实设备交互的断言方案：
     - 身法移动/跳跃：通过 XRCON 查询 `viewpos` 坐标变化，进行真实的前后位移与方向断言（如起跳前后 z 轴或 xy 轴真实位移计算）；
     - 多指触控/按键：利用触控注入并检查客户端变量或状态机；
     - 边界防御：真实注入异常输入并检查进程存活或错误日志退避；
     - Tier 4 战役场景：制定真实关卡载入、实体状态检查与多阶段流程断言方案，杜绝单图灰色截图冒充通关。
3. 产出调研报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_2/handoff.md` 中输出详尽的用例整改映射表与实施方案，并通过 send_message 向 sub_orch_m3 汇报。


## 2026-11-15T20:55:13Z
你是 M3 里程碑的探索者（explorer_m3_2），负责空断言用例整改与真实端到端断言方案探索。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_2
你的任务指派文件：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_2/DISPATCH.md

【前置必读（务必完整阅读）】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/DEAD_ENDS.md
- /Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/handoff.md （法证审计员一票否决完整证据）
- /Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_2/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_2/DISPATCH.md

【核心任务】
1. 梳理 tools/test_e2e_verification.py 中全部 89 处 ctx.assert_true(True) 空断言用例，按类别归纳；
2. 针对位移计算、按键状态、多指并发、边界防御及 Tier 4 战役流程，制定可真实落地的设备端交互与断言方案（如通过 XRCON viewpos 计算真实坐标偏移，真实多阶段关卡断言等），杜绝任何假桩；
3. 输出调研报告至 /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_2/handoff.md（只提方案，不修改源码），并通过 send_message 汇报。
