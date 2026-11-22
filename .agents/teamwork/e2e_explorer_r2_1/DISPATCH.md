## 2026-11-12T21:06:37Z
你是负责 Iteration 2 真实断言整改勘查的勘查员 1（Explorer 1）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_r2_1
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

【你的勘查专项（Tier 1 与 Tier 3 的真实断言重构方案）】
重点勘查并输出以下 28 个空桩用例的具体整改方案与代码级实现蓝图（只设计方案，不直接修改代码）：
1. Tier 1 的 18 个空桩：
   - 特性 3 图标采样（`test_t1_03_03`, `test_t1_03_04`）：如何使用解析后的像素矩阵对四角 Alpha（须为 0）与中心橙黄（RGB 范围）进行确定性采样校验；
   - 特性 4 布局（`test_t1_04_05`）：如何解析 `touch.cfg` 计算按键宽高比（在 0.85~1.15）并核验 Y 坐标避让底部 HUD（高度 216 内）；
   - 特性 5 大跳（`test_t1_05_03`, `test_t1_05_04`, `test_t1_05_05`）：如何计算 `pos_after['x'] - pos_before['x']` 确认正向位移，以及长按大跳姿态检测；
   - 特性 6 多指并发（`test_t1_06_02` ~ `06_05`）：如何通过弹药消耗、视角旋转角度、位移矢量判定并发动作生效；
   - 特性 7 NPC 姿态（`test_t1_07_02` ~ `07_05`）：如何通过 XRCON 获取 NPC 姿态、Pitch 轴角度或模型边界框比例；
   - 特性 8 菜单与 特性 9 存读档（`test_t1_08_03` ~ `08_05`, `test_t1_09_03`, `test_t1_09_05`, `test_t1_11_05`）：如何对生命值/弹药完全还原、几何居中与看门狗全绿进行硬性断言。
2. Tier 3 跨功能正交并发（10 个空桩用例）：
   - `test_t3_02` ~ `test_t3_04`, `test_t3_06` ~ `test_t3_12`：为每一个正交用例设计“操作前状态读取 -> 操作注入 -> 操作后状态读取 -> 差值/特征断言”的具体断言链条。

【输出要求】
- 撰写详细的勘查整改蓝图，归档至 /Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_r2_1/handoff.md；
- 通过 send_message 向编排器汇报。
