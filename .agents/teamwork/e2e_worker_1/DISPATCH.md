## 2026-11-12T17:54:29Z
你被指派为端到端测试轨的自动化测试套件编写专家（teamwork_test_writer）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_worker_1

【必须完整阅读的规范与勘查输入文件】
- 原始需求：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md （必须首先完整阅读）
- 项目全局规约：/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
- 测试轨规约：/Volumes/500GB/Ydpen/.agents/teamwork/orch_e2e/SCOPE.md
- 勘查交接报告：
  - 测试架构报告：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_1/handoff.md
  - Tier 1 & 2 用例规约报告：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_2/handoff.md
  - Tier 3 & 4 场景规约报告：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_3/handoff.md

【独占文件写入权限（Write Ownership）】
你独占以下文件的创建与修改权限，其他代理不得写入：
1. /Volumes/500GB/Ydpen/halflife_app/TEST_INFRA.md （并在 /Volumes/500GB/Ydpen/TEST_INFRA.md 同步镜像一份）
2. /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py
3. /Volumes/500GB/Ydpen/TEST_READY.md

【强制诚信警告（MANDATORY INTEGRITY WARNING）】
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

【核心实现与交付任务】
1. **编写 TEST_INFRA.md**：
   - 严格按照 Explorer 1、2、3 的设计成果，建立完整的端到端自动化测试基础设施规约。
   - 详细规划并列出 4 层共计 127 个测试用例：
     - Tier 1 功能覆盖用例 55 个（TC-E2E-T1-01-01 至 TC-E2E-T1-11-05，覆盖全部 11 项特性）；
     - Tier 2 边界与异常用例 55 个（TC-E2E-T2-01-01 至 TC-E2E-T2-11-05，覆盖全部 11 项特性）；
     - Tier 3 跨功能正交组合交互用例 12 个（TC-E2E-T3-01 至 TC-E2E-T3-12）；
     - Tier 4 真实单人战役全流程 5 大场景（TC-E2E-T4-01 至 TC-E2E-T4-05：序章列车、灾难救援、地表激战、Xen低重力长跳、终极大结局Boss首领战）。
   - 规范设备准入（-s 9DA2200007506350）、通信通道（TCP 27000 XRCON、Wayland 居中校准触控、无损 PNG 截屏）与断言引擎。

2. **实现端到端自动化测试运行套件 `halflife_app/tools/test_e2e_verification.py`**：
   - 必须采用真实、高内聚、模块化的代码实现（包含 DeviceEnv, TouchController, XRCONClient, ArtifactVerifier, TestRunner, ReportGenerator 模块）。
   - 内置纯 Python 零依赖的 PNG 格式分析与直方图比对工具。
   - 实现全套 127 个测试用例的驱动逻辑与断言判断。
   - 提供丰富的命令行参数：`--serial`（默认 9DA2200007506350）、`--tier`（1/2/3/4/all）、`--feature`（1..11）、`--self-test`（离线自检模式，验证测试用例调度与解析逻辑）、`--dry-run`、`--output`。
   - 严格遵守退出码规范：全绿退出码 0，任一断言失败退出码 1，杜绝静默吞错。

3. **执行自检与语法验证**：
   - 运行 `python3 -m py_compile /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py` 验证语法无误。
   - 运行 `python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test` 确保自测通过，退出码为 0。

4. **发布 TEST_READY.md**：
   - 在 `/Volumes/500GB/Ydpen/TEST_READY.md` 发布正式就绪声明，汇总 4 层测试用例数量、测试运行命令及各特性覆盖状态。

5. **产出交付报告**：
   - 在你的状态目录 `/Volumes/500GB/Ydpen/.agents/teamwork/e2e_worker_1/handoff.md` 输出结构化交付报告，严格包含 Observation、Logic Chain、Caveats、Conclusion 与 Verification Method。
   - 完成后使用 `send_message` 向父编排器发送完成通知。
