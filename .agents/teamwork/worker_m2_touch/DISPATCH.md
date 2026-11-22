## 2026-11-12T20:58:09Z
You are the Touch GUI & Concurrency Worker.

## Mission
实现网易有道词典笔 6 代（YDPX6-2）《半条命》（Half-Life 1 / Xash3D）的全功能触控 GUI 与多点触控并发支持：
1. 废除旧版虚拟摇杆（_move），改用四方向键（D-Pad：前进 +forward、后退 +back、左平移 +moveleft、右平移 +moveright）。
2. 完善身法按键：下蹲切换锁存（+duck 71，锁存 4096）、普通跳跃（+jump 73）、修正向前大跳（+cjump 宏：+forward; +jump 72; wait; +duck 72，确保前进初速度注入，无向后跳跃异常）。
3. 补齐战斗与交互全套按键：主开火（+attack）、次要开火/特殊功能（+attack2）、使用/互动开关/开门（+use）、换弹夹（+reload）、手电筒开关（impulse 100）、上一武器/下一武器快速切换按键（invprev / invnext）、快速存读档按键（quicksave `save quick`, quickload `load quick`，贴图 `gfx/touch/save` 与 `gfx/touch/load`）、主菜单/暂停按键。
4. 保证多点触控并发防冲突：左半屏（0..0.26）物理隔离 D-Pad 四向移动与身法键；右半屏（0.26..1.0）负责滑动视角与战斗操作按键。视角指针独占，操作按键享有倒序扫描优先权。
5. 更新 `halflife_app/tools/test_controls.py` 中的断言以适配纯正 D-Pad 四向键配置，并执行自测通过。
6. 同步更新至真机设备 `/userdisk/halflife/valve/touch.cfg`（通过 `adb -s 9DA2200007506350 push`）。

## Strict Boundaries & Write Ownership
- 独占修改范围：
  - `halflife_app/assets/valve/touch.cfg`
  - `halflife_app/assets/valve/userconfig.cfg`
  - `halflife_app/tools/test_controls.py`
- 严禁修改其他战线的文件（严禁修改 `build_amr.py`、`install_amr.py`、`src/` 或 `hlsdk/`）。

## Input Documents
你必须在开始工作前阅读以下输入文件：
- `/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md` (用户原始需求)
- `/Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md` (全局设计与接口契约)
- `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_2/handoff.md` (Step 0 触控方案与坐标映射详尽报告)

## Working Directory & State Folder
- Working Directory: `/Volumes/500GB/Ydpen/halflife_app`
- State Folder: `/Volumes/500GB/Ydpen/.agents/teamwork/worker_m2_touch`
（请在状态目录中维护 BRIEFING.md、progress.md，完成后输出 handoff.md）

## Verification
- 执行 `python3 tools/test_controls.py` 必须全部通过，退出码为 0。
- 通过 `adb -s 9DA2200007506350 push assets/valve/touch.cfg /userdisk/halflife/valve/touch.cfg` 同步真机。

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-11-12T21:24:19Z
**Context**: 触控按键与多指并发进度督促
**Content**: 获悉您已完成 touch.cfg 编写并通过 test_controls.py 本地几何测试，表现优秀！请加速推进 userconfig.cfg（+cjump 等宏时序）、touch_numbers.cfg 及真机多指并发验证，完成后提交 handoff.md 并推送到真机 /userdisk/halflife/valve/touch.cfg。
**Action**: 加速收尾并交付 handoff.md。

## 2026-11-12T21:34:55Z
**Context**: M2 真实真机验收红线要求
**Content**: 严正通知：
1. `--self-test` 仅为本地离线 Mock 测试，绝对不可作为 M2 的验收交付证据；
2. 请等待 M1 释放真机后，必须将修改后的 `assets/valve/touch.cfg`、`touch_numbers.cfg`、`userconfig.cfg` 真实推送到真机 `9DA2200007506350`（`/userdisk/halflife/valve/` 对应路径）；
3. 在真机上实测按键响应、四向移动、向前大跳及多点触控并发，抓取真实测试凭证，生成完整的真实验收 handoff.md。
**Action**: 严格按真机实测标准执行验收并提交报告。
