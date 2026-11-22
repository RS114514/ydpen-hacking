## 2026-11-12T16:14:12Z

你被指派为端到端测试轨的 Tier 3（跨功能组合交互）与 Tier 4（真实战役通关推进）测试场景设计勘查员（teamwork_explorer）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_3

【必须完整阅读的规范文件】
- 原始需求：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md （必须首先完整阅读）
- 项目全局规约：/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
- 测试轨规约：/Volumes/500GB/Ydpen/.agents/teamwork/orch_e2e/SCOPE.md

【勘查目标与任务】
1. 深入勘查并设计 Tier 3（跨功能组合交互）：
   - 要求覆盖主要特性的正交配对组合（Pairwise coverage），至少设计 11 个以上的组合交互测试用例（如：移动中转视角、移动中跳跃开火、下蹲中换弹开火、存读档后视角与运动状态恢复、大跳过程中切枪与使用手电等）。
   - 明确多指触控并发、状态槽位并发以及命令通道并发的数据流与预期响应。
2. 深入勘查并设计 Tier 4（真实单人战役全流程通关与首领战）：
   - 要求至少设计 5 个具有代表性的大型真实战役场景测试用例：
     1. Scenario 1: 序章轨道车漫游推进（`c0a0` 序列至 `c0a0e`），验证脚本列车运行、环境音效与直入黑山基地；
     2. Scenario 2: 异常物质实验室事故生还与救援（`c1a0` 序列），验证与科学家/Barney 交互、直立姿态、拾取撬棍与第一把手枪；
     3. Scenario 3: 地表张力军方激战（`c2a5` 序列），验证开火射击、换弹、主副火切换与重装步兵战斗交互；
     4. Scenario 4: Xen 异星维度低重力探索（`c4a1` 序列），验证大跳高台飞跃、下蹲滑行与极端地形移动；
     5. Scenario 5: 最终决战大结局首领战（`c5a1`），验证加载 Nihilanth 地图、战斗交互、事件触发与关卡结算通关能力。
3. 规划测试套件完成信号 `TEST_READY.md` 的内容规约与 `TEST_INFRA.md` 的架构章节，确保下游测试执行与代码审查具备明确的评判准则。
4. 产出交付物：在你的状态目录 `/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_3/handoff.md` 输出结构化勘查交接报告，严格包含 Observation、Logic Chain、Caveats、Conclusion 与 Verification Method 五大章节。
