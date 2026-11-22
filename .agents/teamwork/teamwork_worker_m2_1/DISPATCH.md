## 2026-11-15T15:51:06Z
你是有道词典笔 6 代 Half-Life 原生小应用集成验证 Worker（teamwork_worker）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_worker_m2_1

## 强制诚信警告 (MANDATORY INTEGRITY WARNING)
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 必须阅读的参考文件
1. 原始需求文件：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md（必须首先阅读）
2. 全局架构规约：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_orchestrator_1/PROJECT.md
3. 里程碑范围文档：/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m2/SCOPE.md
4. 勘测参考报告：
   - 居中显示报告：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_explorer_survey_2/handoff.md
   - NPC与生命周期报告：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_explorer_survey_3/handoff.md

## 任务目标与执行内容
1. **核验 y=107 居中显示与画面稳定性（对应需求 R2）**：
   - 检查 `native/wl_center.c` 中 `dlsym`、`SDL_LoadFunction` 拦截，`wl_egl_window_create` 子表面挂载在 $(0, 107)$ 并启用 `wl_subsurface_set_desync`，子表面输入区域清空，父表面触控 Y 坐标平移 107 像素；
   - 检查在 `xdg_surface.ack_configure` 发生后才挂载 960x480 纯黑 SHM 缓冲的时序逻辑；
   - 检查编译产物 `libs/libwl_center.so` 存在且符号完整（使用 `nm -D` 检查关键符号）；
   - 检查 `tools/build_amr.py`、`tools/install_amr.py` 与 `native/libjsapi_hl.c`，确认 `libwl_center.so` 严格隔离在 AMR 安装包外，仅通过 `install_amr.py` 单独推送到设备 `/userdisk/halflife/libwl_center.so`，并在引擎子进程启动时通过 `LD_PRELOAD` 独立注入，不污染 Falcon 主框架。

2. **核验 NPC 姿态与游戏生命周期管理（对应需求 R3）**：
   - 验证场景内科学家与保安 NPC 保持正常立姿：核对 `dist_assets/valve/dlls/hl.so` 二进制库存在，并核实源码中 `MOVETYPE_STEP` 地面人形怪物的俯仰角（Pitch）和横滚角（Roll）归零逻辑；
   - 验证触控暂停菜单：检查 `assets/valve/touch.cfg` 中的 `menu` 虚拟按键（绑定 `cancelselect` 指令，位于顶部居中）及 `quicksave`/`quickload` 配置；
   - 验证返回退出存盘与自动恢复：检查 `src/root.js` 的 `backpressed` 处理与 `hl.stop()`，检查 `native/libjsapi_hl.c` 中 `save_game_locked`（发送 `save quick` 并轮询 `stat` 确认 `quick.sav` 纳秒级更新）、`stop_game_locked` 流程，以及启动时检测 `quick.sav` 动态写入 `load quick` 到 `auto_exec.cfg` 的自动恢复机制。

3. **运行本地自动化回归测试套件**：
   在 `/Volumes/500GB/Ydpen/halflife_app` 下执行以下测试，记录完整的执行命令、输出日志和退出码：
   - `node tools/test_lifecycle.mjs`
   - `python3 tools/test_xrcon.py --output /tmp/xrcon_test`（若不需要参数可直接运行 `python3 tools/test_xrcon.py`，确认测试全部通过）
   - `python3 tools/test_e2e_verification.py --self-test`（确认 127 项测试自检全部通过，退出码为 0）

4. **输出交付报告**：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_worker_m2_1/handoff.md` 输出结构化交付报告，包含：
   - 观察事实（各文件检查情况、符号核验、测试命令与完整输出）
   - 推导逻辑链
   - 局限与注意事项
   - 结论
   - 验证方法（可供独立复现的命令与判定准则）
   完成报告后使用 `send_message` 通知子编排器。
