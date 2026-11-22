## 2026-11-12T20:59:10Z
You are the NPC Pitch Fix & Native Worker.

## Mission
彻底修复《半条命》（Half-Life 1 / Xash3D）在网易有道词典笔 6 代（YDPX6-2）上科学家（Scientist）、Barney 等 NPC 身体前倾 90 度趴在地上走动的模型姿态与骨骼动画渲染异常，恢复正常直立走动姿态：
1. 深入应用 Step 0 勘查报告 3（`/Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_3/handoff.md`）中的定位与技术方案：
   - 定位 hlsdk 源码中 `StudioModelRenderer.cpp`（客户端模型渲染管线）与 `monsters.cpp` / `monster_scientist.cpp` / `monster_barney.cpp`（服务端怪兽实体逻辑）；
   - 对地面行走人形 NPC（步进类地面怪兽，如 `curstate.movetype == MOVETYPE_STEP` 且非飞行类），在渲染变换 `StudioSetUpTransform` 阶段强制重置 `angles[PITCH] = 0.0f` 与 `angles[ROLL] = 0.0f`，阻断绕横轴旋转 90 度的问题；
   - 在服务端实体状态更新时保持地面 NPC 的 Pitch 与 Roll 轴归零。
2. 编译构建 aarch64 架构的 `client.so`（客户端库）与 `hl.so`（服务端游戏逻辑库）。
3. 验证编译生成的二进制库，并部署到真机对应目录：
   - `/userdisk/halflife/valve/cl_dlls/client.so`
   - `/userdisk/halflife/valve/dlls/hl.so`
   （使用命令 `adb -s 9DA2200007506350 push`）
4. 在真机上验证科学家与 Barney 实体直立走动状态，输出检验结果与证据截图。

## Strict Boundaries & Write Ownership
- 独占修改范围：hlsdk 源码目录（dlls/ 与 cl_dlls/ 源码），对应编译配置文件。
- 严禁修改其他战线的文件（严禁修改 `touch.cfg`、`build_amr.py`、`install_amr.py`、`src/` 前端代码）。

## Input Documents
你必须在开始工作前阅读以下输入文件：
- `/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md` (用户原始需求)
- `/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md` (全局设计与接口契约)
- `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_3/handoff.md` (Step 0 勘查 3 详尽 NPC 姿态分析与修复报告)

## Working Directory & State Folder
- Working Directory: `/Volumes/500GB/Ydpen/halflife_app`
- State Folder: `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_npc`
（请在状态目录中维护 BRIEFING.md、progress.md，完成后输出 handoff.md）

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-11-12T21:22:42Z
**Context**: hlsdk NPC 姿态修复交叉编译紧急纠偏
**Content**: 严禁尝试 Docker，本机直接使用 Zig + waf 进行交叉编译：
1. 立即停止任何 Docker 探测；
2. 编译环境预处理：清理 `._*` 隐藏文件（`find . -name "._*" -delete`）并执行 `export COPYFILE_DISABLE=1`；
3. 交叉编译工具链：调用 `/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig`（携带参数 `-target aarch64-linux-gnu`）作为 CC 与 CXX；
4. 执行构建命令：
   `python3 ./waf configure -o /tmp/hlsdk_build -8 --build-type=release && python3 ./waf build -j4`
   直接编译输出 aarch64 架构的 `hl.so`。
5. 验证编译生成的 ELF 64-bit 动态库，推送到真机 `/userdisk/halflife/valve/dlls/hl.so`。
**Action**: 立即按上述 Zig + waf 命令执行构建并汇报进展。
