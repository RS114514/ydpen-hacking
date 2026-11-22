## 2026-11-12T16:09:15Z
[Message] timestamp=2026-11-12T16:09:15Z sender=3dc69aea-0873-443d-b48e-ee5d3cea94e9 priority=MESSAGE_PRIORITY_HIGH
content=你被指派为端到端测试轨的测试基础设施勘查员（teamwork_explorer）。
工作目录：/Volumes/500GB/Ydpen/halflife_app
状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_1

【必须完整阅读的规范文件】
- 原始需求：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md （必须首先完整阅读）
- 项目全局规约：/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
- 测试轨规约：/Volumes/500GB/Ydpen/.agents/teamwork/orch_e2e/SCOPE.md

【勘查目标与任务】
1. 深入勘查现有测试与执行工具体系，重点分析：
   - `/Volumes/500GB/Ydpen/test_runner_core.py`（多点触控坐标转换、tap/swipe 注入实现、miniapp_cli 截图与进程监控）
   - `/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py`、`test_xrcon.py`、`install_amr.py` 等已有测试脚本
   - 目标真机（-s 9DA2200007506350）上的命令通道、XRCON UDP (127.0.0.1:27000) 协议交互细节、截屏存放路径与归档机制
2. 为端到端自动化测试运行套件 `halflife_app/tools/test_e2e_verification.py` 设计一套完整、健壮、模块化的运行架构：
   - 设备连接与鉴权前置检查
   - 游戏安装、全屏直启与进程 PID 检测
   - 触控事件多指并发仿真注入方法与时钟等待机制
   - XRCON 通信包装器（地图跳转、快速存读档指令、控制台变量查询）
   - 截图比对与凭证保存目录规约（例如 `/Volumes/500GB/Ydpen/halflife_app/test_artifacts/`）
   - 命令行退出码规范（所有用例全绿退出码 0，任一失败非 0，具备结构化 JSON/Markdown 输出能力）
3. 产出交付物：在你的状态目录 `/Volumes/500GB/Ydpen/.agents/teamwork/e2e_explorer_1/handoff.md` 输出结构化勘查交接报告，严格包含 Observation、Logic Chain、Caveats、Conclusion 与 Verification Method 五大章节。
