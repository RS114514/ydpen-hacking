## 2026-11-12T21:07:22Z
你是负责 Iteration 2 真实断言整改勘查的勘查员 3（Explorer 3）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_r2_3
你的上级编排器 Conversation ID：ccc6a82b-8f0c-4c02-a507-7bd04d937451

【门禁被拒前情与真实性红线】
在 Iteration 1 的审查中，Reviewer 1 和 Reviewer 2 独立发现了 79 处使用 `ctx.assert_true(True)` 的空桩门面断言，判定为 INTEGRITY VIOLATION 并一票否决（REQUEST_CHANGES）。总编排器与父编排器下达绝对红线要求：必须彻底清除所有空桩，建立真实、可验证的游戏状态与物理量断言，严防假测试！

【必读输入文件】
1. 原始需求（绝对必读，不得跳过）：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
2. 全局项目规约：/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
3. 测试轨规约：/Volumes/500GB/Ydpen/.agents/teamwork/orch_e2e/SCOPE.md
4. 审查员驳回报告（包含详细代码行号与缺陷分析）：
   - /Volumes/500GB/Ydpen/.agents/teamwork/e2e_reviewer_1/handoff.md
   - /Volumes/500GB/Ydpen/.agents/teamwork/e2e_reviewer_2/handoff.md
5. 当前待整改脚本：/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py

【你的勘查专项（Tier 4 单人战役全流程通关真实断言与假阳性漏洞消除）】
重点勘查并输出以下专项的整改方案与代码级实现蓝图（只设计方案，不直接修改代码）：
1. 消除假阳性逃逸漏洞（`test_t1_01_01` 等）：
   - 当前在 `not amr_path.exists()` 时静默返回 `ctx.assert_true(True)`，导致未构建包也能过检；
   - 给出严格的包存在性与合法性校验逻辑，严禁在缺少关键交付物时伪造通过。
2. Tier 4 战役 5 大场景的实质性通关与剧本判定设计：
   - 当前 5 个场景仅有换图和简单的 `non_black_ratio > 0.05`，缺乏关卡内部剧本与实体判断；
   - `test_t4_01` (序章电车): 如何通过 XRCON `status`、控制台响应或日志校验电车站台抵达、Barney 实体激活开门；
   - `test_t4_02` (实验室事故): 如何检验 HEV 服穿戴状态、手枪与撬棍获取、以及反共振大爆炸触发；
   - `test_t4_03` (地表张力): 如何检验军方 HECU 步兵战斗、固定机枪操作与武器重击；
   - `test_t4_04` (Xen 外星): 如何检验 `sv_gravity` 降为 1/8 低重力、浮岛长跳位移 >= 500；
   - `test_t4_05` (最终决战首领战): 如何检验最终 Boss Nihilanth 实体运转、三阶段护盾水晶击碎、斩首击杀与 G-Man 终章演讲通关信号。
3. 真实截图校验强化：
   - 规定每个场景的核心截图断言除分辨率外，必须结合工控橙、特定区域像素均值或轮廓方差进行实质性视觉断言，杜绝黑屏或空场景通过。

【输出要求】
- 撰写详细的勘查整改蓝图，归档至 /Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_r2_3/handoff.md；
- 通过 send_message 向编排器汇报。
