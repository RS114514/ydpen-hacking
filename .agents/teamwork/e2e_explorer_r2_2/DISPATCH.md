## 2026-11-12T21:06:52Z

[Message] timestamp=2026-11-12T21:06:52Z sender=ccc6a82b-8f0c-4c02-a507-7bd04d937451 priority=MESSAGE_PRIORITY_HIGH content=你是负责 Iteration 2 真实断言整改勘查的勘查员 2（Explorer 2）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_r2_2
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

【你的勘查专项（Tier 2 边界异常真实防御与 PNG RFC 2083 滤波反变换算法）】
重点勘查并输出以下专项的整改方案与代码级实现蓝图（只设计方案，不直接修改代码）：
1. PNG RFC 2083 标准 5 种行滤波逆运算算法：
   - 当前 `ArtifactVerifier.parse_png` 直接忽略行首 Filter 字节，无法处理真机截屏差分滤波；
   - 给出纯 Python 实现的 5 种滤波逆运算（Filter 0: None, 1: Sub, 2: Up, 3: Average, 4: Paeth）具体公式与代码实现逻辑，确保能够无损还原任何合规 PNG。
2. Tier 2 的 38 个空桩用例整改方案：
   - 特性 1 拦截库异常（`test_t2_01_01`, `01_02`, `01_05`）：如何通过模拟文件缺失、权限 000 与 OOM 验证 JS 异常抛出与主锁平稳释放；
   - 特性 2 启动边界（`test_t2_02_02` ~ `02_05`）：如何验证非法 basedir 抛出 TypeError、二进制不可执行时返回 127；
   - 特性 3 图标边界（`test_t2_03_01`, `03_02`, `03_04`, `03_05`）：0字节打包拦截、超大分辨率防OOM、损坏IHDR解析抛出异常；
   - 特性 4 触控边界（`test_t2_04_02` ~ `04_05`）：相邻按键盲区过滤、连击队列消化、悬垂释放停止奔跑判定；
   - 特性 5 大跳边界（`test_t2_05_01` ~ `05_05`）：后退误触大跳平滑过渡、空中无二次跃升、低矮管道碰撞箱约束；
   - 特性 6 多指与 特性 7 NPC 边界（`test_t2_06_01` ~ `06_05`, `test_t2_07_01` ~ `07_05`）：5点触控压力注入、斜坡行进贴合、受击倒地静止；
   - 特性 8 菜单穿透与 特性 9 存档边界（`test_t2_08_02` ~ `08_05`, `test_t2_09_01` ~ `09_05`）：0字节损坏存档报错、只读存档写入被拒；
   - 特性 11 套件看门狗熔断（`test_t2_11_05`）：如何构造一个真正的超时模拟测试，验证 `TestRunner` 能够将其判定为 `status == 'TIMEOUT'`，而不是用 `assert_true(True)` 敷衍。

【输出要求】
- 撰写详细的勘查整改蓝图，归档至 /Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_r2_2/handoff.md；
- 通过 send_message 向编排器汇报。
