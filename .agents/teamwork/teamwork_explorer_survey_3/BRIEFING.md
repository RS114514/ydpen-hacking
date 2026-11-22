# BRIEFING — 2026-11-15T15:03:00Z

## Mission
深入勘测有道词典笔 6 代 Half-Life 原生小应用的 NPC 姿态、游戏生命周期管理与自动化测试构建体系。

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, code analysis, synthesis, structured reporting
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/teamwork_explorer_survey_3
- Original parent: d011f44e-2c2e-4435-82f1-65560d28e80c
- Milestone: survey_3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify any source code/configuration files
- Strictly avoid prohibited words/phrases per user global instructions
- 严禁对非 6 代设备（特别是 3 代笔）执行任何操作
- 必须基于代码真实证据进行推理，标注具体文件和行号
- All responses in Chinese

## Current Parent
- Conversation ID: d011f44e-2c2e-4435-82f1-65560d28e80c
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `native/libjsapi_hl.c` (XRCON socket, start/stop/save/load, auto_exec.cfg, save_game_locked)
  - `src/root.js`, `src/app.js` (Falcon backpressed intercept, handleBack, onShow/onHide/onUnload)
  - `assets/valve/touch.cfg` (quicksave, quickload, menu cancelselect, button layout)
  - `tools/build_amr.py` (Zig toolchain, qjsc compiler, /tmp/ exFAT workaround, ELF check, AMR isolation)
  - `tools/install_amr.py` (ADB exit code wrap, config backup, DLL deploy, miniapp install receipt)
  - `tools/test_controls.py`, `tools/test_lifecycle.mjs`, `tools/test_xrcon.py` (100% verified locally)
  - `tools/test_e2e_verification.py` & `TEST_INFRA.md` (127 test cases across Tier 1..4, ArtifactVerifier, touch mapping)
  - `hlsdk/cl_dll/StudioModelRenderer.cpp` & `hlsdk/dlls/monsters.cpp` (NPC Pitch 0.0f clamping logic)
- **Key findings**:
  - NPC 趴地成因：服务端仅维护 yaw 轴，碰撞后 pitch 未重置；客户端怪兽走 StudioDrawModel 未做俯仰清零保护，绕横轴旋转 90 度导致模型贴地。
  - NPC 修复机制：双层防御。服务端 `monsters.cpp` 在 MOVETYPE_STEP 时强制 angles.x/z 置 0；客户端 `StudioModelRenderer.cpp` 在 MOVETYPE_STEP 或人形怪兽匹配时强制 angles[PITCH]=0.0f, angles[ROLL]=0.0f。
  - 存档与生命周期：Falcon 端通过 `$npage.setSupportBack(false)` 拦截返回按键；原生端 `save_game_locked` 通过 XRCON 发送 `save quick` 并 stat 校验时间戳递增；退出时确认存档落盘后再发送 quit；重启时检测 quick.sav 动态生成 `auto_exec.cfg` 执行 `load quick`。
  - 构建部署：Zig 交叉编译由于 exFAT 限制先在 `/tmp/` 生成 ELF 再复制；AMR 严禁包含 libwl_center.so，保证动态库物理隔离；install_amr.py 具备配置时间戳备份与回执解析。
  - 测试套件：本地测试三套全部通过；端到端自动化测试套件共 127 个用例（Tier 1: 55, Tier 2: 55, Tier 3: 12, Tier 4: 5），支持纯 Python 图像直方图分析与 15s 看门狗熔断。
- **Unexplored areas**: None (勘测目标全部完成)

## Key Decisions Made
- 勘测数据搜集完毕，开始编写 analysis.md 与 handoff.md

## Artifact Index
- DISPATCH.md — 任务指派记录
- BRIEFING.md — 运行状态与上下文索引
- progress.md — 执行进度与心跳
- analysis.md — 详细勘测分析报告
- handoff.md — 5-Component 交付交接报告
