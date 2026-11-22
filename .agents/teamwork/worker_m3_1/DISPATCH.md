# Worker Dispatch Task — M3 打包部署与真机测试执行

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`

## 诚信守则（MANDATORY INTEGRITY WARNING）
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 约束条件
- 工作目录：`/Volumes/500GB/Ydpen/halflife_app`
- 状态目录：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1`
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

## 任务内容
1. 编译打包：执行 `python3 tools/build_amr.py`，产出 `dist/half-life-1.0.0.amr`。确认产物中严禁包含 `libs/{arch}/libwl_center.so`。
2. 真机部署：执行 `python3 tools/install_amr.py`，部署至 6 代真机（序列号 `9DA2200007506350`），并确认 `/userdisk/halflife/libwl_center.so` 独立推送成功。
3. 本地回归测试：
   - `python3 tools/test_controls.py`
   - `node tools/test_lifecycle.mjs`
   - `python3 tools/test_xrcon.py`
4. 真机端到端验收：
   - `python3 tools/test_e2e_verification.py --serial 9DA2200007506350`
   确保全部 127 项端到端测试均真实在真机运行并返回退出码 0。
5. 结果交付：
   将全部执行日志、命令输出、校验情况与结论写入 `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`，并通过 send_message 向 sub_orch_m3 汇报。


## 2026-11-15T19:10:52Z
你是 M3 里程碑的打包部署与测试执行 Worker（worker_m3_1）。
你的工作目录是 /Volumes/500GB/Ydpen/halflife_app。
你的状态目录是 /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1。
你的任务指派文件已写入：/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/DISPATCH.md。

【前置必读】
请首先完整阅读以下文件：
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/DISPATCH.md

【诚信守则（MANDATORY INTEGRITY WARNING）】
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

【约束条件】
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 9DA2200007506350），若连接 3 代笔严禁操作。

【执行步骤】
1. 编译打包：执行 `python3 tools/build_amr.py`，产出 `dist/half-life-1.0.0.amr`。确认产物中严禁包含 `libs/{arch}/libwl_center.so`。
2. 真机部署：执行 `python3 tools/install_amr.py`，全量部署至 6 代真机（序列号 9DA2200007506350），确认 `/userdisk/halflife/libwl_center.so` 独立推送并成功配置。
3. 本地回归测试：
   - `python3 tools/test_controls.py`
   - `node tools/test_lifecycle.mjs`
   - `python3 tools/test_xrcon.py`
4. 真机端到端全量验收：
   - `python3 tools/test_e2e_verification.py --serial 9DA2200007506350`
   全部 127 项用例必须在真机真实执行通过。
5. 输出交付报告：
   将详细执行日志、各项命令退出代码和测试总结写入 `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`。完成后通过 send_message 向父代理（sub_orch_m3）发送通知。


## 2026-11-15T19:33:04Z
**Context**: M3 Worker 状态检查与协助
**Content**: 探测到你之前执行的 `miniapp_cli start 8080252464522508...` ADB 后台任务因连接挂起已终止。请检查当前端到端测试状态（上轮执行：116通过/10失败/1超时），分析原因并继续推进测试执行与结果输出。
**Action**: 请继续推进 127 项 E2E 测试全量通过，将结果写入 handoff.md 并汇报。


## 2026-11-15T19:44:09Z
**Context**: M3 Worker 状态唤醒与命令提示
**Content**: 你刚才执行的 `adb shell "miniapp_cli start ...; sleep 2; pidof xash3d"` 由于 `miniapp_cli` 保持标准输出未闭合导致 ADB 管道阻塞已终止。若需在真机启动小应用并查询 pid，请在 adb shell 中使用 `miniapp_cli start 8002026110400001 >/dev/null 2>&1 &` 重定向输出，或使用测试套件中的 `DeviceEnv.run_cmd()` 接口。
**Action**: 请检查当前进程状态，推进端到端测试，并将最终结果写入 handoff.md 汇报。
