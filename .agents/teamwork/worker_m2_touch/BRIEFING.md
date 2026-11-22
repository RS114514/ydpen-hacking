# BRIEFING — 2026-11-13T05:24:00Z

## Mission
实现网易有道词典笔 6 代（YDPX6-2）《半条命》（Half-Life 1 / Xash3D）的全功能触控 GUI 与多点触控并发支持：
1. 废除旧版虚拟摇杆（_move），改用四方向键（D-Pad：前进 +forward、后退 +back、左平移 +moveleft、右平移 +moveright）。
2. 完善身法按键：下蹲切换锁存（+duck 71，锁存 4096）、普通跳跃（+jump 73）、修正向前大跳（+cjump 宏：+forward; +jump 72; wait; +duck 72，确保前进初速度注入，无向后跳跃异常）。
3. 补齐战斗与交互全套按键：主开火（+attack）、次要开火/特殊功能（+attack2）、使用/互动开关/开门（+use）、换弹夹（+reload）、手电筒开关（impulse 100）、上一武器/下一武器快速切换按键（invprev / invnext）、快速存读档按键（quicksave `save quick`, quickload `load quick`，贴图 `gfx/touch/save` 与 `gfx/touch/load`）、主菜单/暂停按键。
4. 保证多点触控并发防冲突：左半屏（0..0.26）物理隔离 D-Pad 四向移动与身法键；右半屏（0.26..1.0）负责滑动视角与战斗操作按键。视角指针独占，操作按键享有倒序扫描优先权。
5. 更新 `halflife_app/tools/test_controls.py` 中的断言以适配纯正 D-Pad 四向键配置，并执行自测通过。
6. 同步更新至真机设备 `/userdisk/halflife/valve/touch.cfg`（通过 `adb -s 9DA2200007506350 push`）。

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/worker_m2_touch
- Original parent: 3976846c-1776-4937-a653-9cf69d968e47
- Milestone: M2 (全功能触控 GUI 与多点并发)

## 🔒 Key Constraints
- 独占修改范围：
  - `halflife_app/assets/valve/touch.cfg`
  - `halflife_app/assets/valve/userconfig.cfg`
  - `halflife_app/tools/test_controls.py`
- 严禁修改其他战线的文件（严禁修改 `build_amr.py`、`install_amr.py`、`src/` 或 `hlsdk/`）。
- 遵守用户全局规则，包括中文沟通、无虚构、无掩盖、验证先行、严禁违禁词。

## Current Parent
- Conversation ID: 3976846c-1776-4937-a653-9cf69d968e47
- Updated: 2026-11-13T05:24:00Z

## Task Summary
- **What to build**: 完整的 Half-Life 1 触控 GUI 布局（D-Pad四向键、身法槽位隔离、快存快读等全套按键）与并发保障，更新单元测试并通过，同步到真机。
- **Success criteria**:
  - `python3 tools/test_controls.py` 退出码为 0，全部 5 项单元测试通过。
  - 真机 push 成功，MD5 校验一致。
- **Interface contracts**: `/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md`
- **Code layout**: `/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md § Code Layout`

## Key Decisions Made
- 采用像素基准计算归一化浮点坐标，保证所有带贴图按键在 960x266 屏幕上呈现完全正方形（差异小于 0.001 像素）且不超出底部 HUD 界限（y2_px <= 216）。
- 左半屏（0..0.26）物理隔离 D-Pad 四向十字键与身法键，右半屏（0.26..1.0）分配视角控制及各功能按键；`look` 在操作键之前定义，使操作键在倒序遍历时获得扫描优先权。
- 完善 `userconfig.cfg` 与 `touch.cfg` 的按键槽位隔离（下蹲槽位 71 锁存 4096，跳跃槽位 73，大跳宏槽位 72）。

## Artifact Index
- `halflife_app/assets/valve/touch.cfg` — 触控按键配置文件
- `halflife_app/assets/valve/userconfig.cfg` — 别名与快捷配置
- `halflife_app/tools/test_controls.py` — 触控按键测试用例

## Change Tracker
- **Files modified**:
  - `halflife_app/assets/valve/touch.cfg`: 重构为纯正 D-Pad 四向键、添加快存/快读按键、精确调整尺寸与分区
  - `halflife_app/tools/test_controls.py`: 更新操作断言为 D-Pad 体系，新增屏幕分区隔离与倒序扫描优先级断言
- **Build status**: PASS (5 tests in test_controls.py)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (Ran 5 tests in 0.698s, OK)
- **Lint status**: 0 violations
- **Tests added/modified**: `test_controls.py` 覆盖按键动作、尺寸、无重叠、分区隔离与优先级断言

## Loaded Skills
- None
