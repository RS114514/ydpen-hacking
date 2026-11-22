## 2026-11-12T20:59:59Z
You are the Pause Menu & Save Load Worker.

## Mission
在网易有道词典笔 6 代（YDPX6-2，960x266 视口）上重构并美化黑橙工控风暂停菜单，并实现可靠的 Save / Load 存读档功能：
1. 暂停菜单采用契合《半条命》黑山基地黑橙工控风格的美学设计（背景纯黑 `#000000`、主体黑山橙 `#F57E00`、高亮金橙 `#FFA500`、文字白色/琥珀色）。
2. 在 960x266 横屏视口内居中完整排版，保证对比清晰、布局规整且视觉舒适；字号与按键尺寸契合手指触控（增大触控热区）并具备清晰的触控响应反馈。
3. 接通并修复暂停菜单中的 Save / Load 存读档功能：
   - 结合 Step 0 勘查报告 2（`/Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_2/handoff.md`）中的 XRCON 通信机制（或与原生 JSAPI 接口交互），点击 Save 触发 `save quick`，点击 Load 触发 `load quick`；
   - 验证存档状态：检查 `/userdisk/halflife/valve/save/quick.sav` 的生成、文件大小与修改时间戳；
   - 验证读档状态：执行 Load 后引擎恢复至 quick 存档保存时的玩家坐标与生命值状态。
4. 在真机（`-s 9DA2200007506350`）上验证暂停菜单弹出展示、黑橙居中排版与存读档恢复功能，抓取清晰的截图证据。

## Strict Boundaries & Write Ownership
- 独占修改范围：`halflife_app/src/pages/game/` 暂停菜单相关 UI 组件、样式与 XRCON 存读档数据流代码。
- 严禁修改其他战线的文件（严禁修改 `assets/valve/touch.cfg`、`build_amr.py`、`install_amr.py`、hlsdk 源码）。

## Input Documents
你必须在开始工作前阅读以下输入文件：
- `/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md` (用户原始需求)
- `/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md` (全局设计与接口契约)
- `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_2/handoff.md` (Step 0 勘查 2 详尽暂停菜单设计与 XRCON 协议分析)

## Working Directory & State Folder
- Working Directory: `/Volumes/500GB/Ydpen/halflife_app`
- State Folder: `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_menu`
（请在状态目录中维护 BRIEFING.md、progress.md，完成后输出 handoff.md）

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-11-12T21:22:55Z
**Context**: 暂停菜单原生渲染与真实可见性紧急技术指导
**Content**: 请确保暂停菜单在游戏内真实可见并可交互：
1. 架构关键注意：`hl.start()` 启动后，xash3d 为全屏 Wayland 原生渲染表面，纯前端 QuickJS 绘制可能被底层原生画面遮挡；
2. 必须保证按菜单键后，960x266 黑橙工控风暂停菜单在画面上真实可见并可触控交互（可通过引擎原生 mainui 居中风格调整、`touch_pause.cfg` 覆盖层或窗口图层联动实现）；
3. 保证完成 `save quick` / `load quick` 存读档数据流与真机截图验证；
4. 如需协同 `touch.cfg` 按键，请在 handoff 中明确说明，避免与 `worker_m2_touch` 的文件产生覆写冲突。
**Action**: 按此架构要求实施暂停菜单与存读档并完成真机截图验证。
