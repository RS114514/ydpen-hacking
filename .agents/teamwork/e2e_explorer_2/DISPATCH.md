## 2026-11-12T16:11:49Z
你被指派为端到端测试轨的 Tier 1 与 Tier 2 测试用例规范勘查员（teamwork_explorer）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_2

【必须完整阅读的规范文件】
- 原始需求：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md （必须首先完整阅读）
- 项目全局规约：/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
- 测试轨规约：/Volumes/500GB/Ydpen/.agents/teamwork/orch_e2e/SCOPE.md

【勘查目标与任务】
1. 对照 ORIGINAL_REQUEST.md（R1-R6 及追加指令）和 PROJECT.md 中的全部 11 项核心特性：
   1. 启动死锁修复与动态库隔离
   2. 全屏直启与纯原生 mini APP
   3. 官方原版高清 Lambda 图标
   4. 全套触控按键完整覆盖
   5. 向前大跳无向后异常
   6. 多点触控并发防冲突
   7. NPC 身体前倾趴地姿态修复
   8. 黑橙工控风居中暂停菜单
   9. Save/Load 存读档可靠性
   10. 全流程 105 个关卡完整性
   11. 真机端到端自动化测试链路
2. 逐一设计并规约详细的测试用例：
   - Tier 1（功能覆盖）：每一项特性至少设计 5 个独立测试用例（共计 >= 55 个用例），覆盖隔离验证、正常路径、最简验证通道。
   - Tier 2（边界与异常）：每一项特性至少设计 5 个边界/极端测试用例（共计 >= 55 个用例），覆盖空输入、极限坐标、越界点击、快速高频连击、重复锁存切换、超大/零字节存档、快速关卡切换等。
3. 针对每一个测试用例明确：用例编号、用例名称、前置条件、输入操作/参数、预期结果、断言方式与判定标准。
4. 产出交付物：在你的状态目录 `/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_2/handoff.md` 输出结构化勘查交接报告，严格包含 Observation、Logic Chain、Caveats、Conclusion 与 Verification Method 五大章节。
