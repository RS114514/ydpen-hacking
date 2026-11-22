# BRIEFING — 2026-11-12T14:53:00Z

## Mission
深入勘查 Half-Life 触控 GUI、按键映射、多点触控并发机制，以及暂停菜单（960x266 黑橙工控排版与存读档流程）。

## 🔒 My Identity
- Archetype: explorer
- Roles: 触控输入与界面交互勘查
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_2
- Original parent: 3976846c-1776-4937-a653-9cf69d968e47
- Milestone: survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- 只能使用中文回复，遵守严禁虚构、如实汇报原则
- 严禁修改任何业务代码或构建产物
- 必须基于代码真实实现进行论证，严禁套用虚假或臆测逻辑

## Current Parent
- Conversation ID: 3976846c-1776-4937-a653-9cf69d968e47
- Updated: 2026-11-12T14:24:29Z

## Investigation State
- **Explored paths**:
  - `/Volumes/500GB/Ydpen/test_runner_core.py`
  - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`
  - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/userconfig.cfg`
  - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/autoexec.cfg`
  - `/Volumes/500GB/Ydpen/halflife_app/native/wl_center.c`
  - `/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`
  - `/Volumes/500GB/Ydpen/halflife_app/src/root.js`
  - `/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/touch_probe.c`
  - `/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/device_probe.py`
  - `/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
  - `/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/input.cpp`
  - `/Volumes/500GB/qoder_cache/fwgs_official/extracted/xash3d-fwgs-linux-arm64/libmenu.so`
- **Key findings**:
  1. 触控坐标映射体系彻底明确：真机 `/dev/input/event1` 物理坐标为竖屏，通过 `px = ly + 107`, `py = 959 - lx` 映射至 960x266 横屏视口；`wl_center.c` 在 Wayland 协议层通过 `adj_y = y - 107` 拦截校准并传递至 SDL2/Xash3D。
  2. 多点触控并发无冲突机制已查明：左半屏 (0..0.26) 专属 D-Pad 与身法键，右半屏 (0.26..1.0) 挂载 `_look` 滑屏视角；战斗按键后置注册获得优先判定，且 `touch.look_finger` 独占锁定，移动、转动视角、射击开火与跳跃四指并发无锁死冲突。
  3. 身法指令逻辑验证：下蹲切换通过 `TOUCH_FL_COMMAND_LATCH (4096)` 标记与 `+duck 71` 槽位实现；大跳通过 `alias +cjump "+forward; +jump 72; wait; +duck 72"` 与独立键码 72 彻底消除向后跳跃与冲突。
  4. 现有缺失按键：`touch.cfg` 缺少快速存读档按键（`save quick` / `load quick`）；`test_controls.py` 因断言写死 `_move` 导致 D-Pad 测试失败。
  5. 暂停菜单与存读档数据流：双重菜单路径清晰（`cancelselect` 调出 Xash3D 原生 `libmenu.so` 或轻量级黑橙工控 touch overlay 菜单）；Save/Load 前后端数据流通过 XRCON 与 `quick.sav` mtime 确认机制确保安全落盘与还原。
- **Unexplored areas**: 无（所有勘查重点均已闭环分析完毕）

## Key Decisions Made
- 汇总 5 大核心模块形成自包含交接报告：物理到引擎触控协议、全按键身法与战斗映射方案、多点并发无冲突理论、960x266 黑橙工控暂停菜单与存读档方案、独立验证手段。

## Artifact Index
- progress.md — 进度与心跳记录
- handoff.md — 最终勘查与交接报告
- DISPATCH.md — 任务派发记录
