# Scope: M1 触控系统虚拟摇杆与防抢占重构

## Architecture
- Module: Touch System & Controls
- Affected Files & Components:
  - `upstream/engine/client/input/in_touch.c`: `Touch_ButtonPress` break logic on `event_down` and `event_up` for `touch_command` and `touch_wheel`. [DONE]
  - `assets/valve/touch.cfg` and `dist_assets/valve/touch.cfg`: replaced `_dpad` with `_joy`, flag 2048 (`TOUCH_FL_STICK`), texture `gfx/touch/stick_ring`, square aspect ratio, $x_2 \le 0.26$, $y_2 \times 266 \le 216$. [DONE]
  - `tools/test_controls.py`: synchronized assertion sets for `_joy` / `joy`. [DONE]

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | Continuous Proportional Virtual Joystick | 替换左侧十字键为连续比例模拟摇杆，消除50%死区 | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 2 | Touch Button Contention & Look Break Fix | 修复 Touch_ButtonPress 遍历无 break 导致底层 _look 区域被右侧按钮抢占 | M1 | DONE | ORIGINAL_REQUEST §R1 |
| 3 | Touch Layout & Config Synchronization | 调整 touch.cfg 布局与 test_controls.py 断言同步 | M1 | DONE | ORIGINAL_REQUEST §R1 |

## Interface Contracts
- `Touch_StickVector` -> `cmd->forwardmove` & `cmd->sidemove` 模拟量输入 $[-1.0, 1.0]$。
- `Touch_ButtonPress` 命中 `touch_command` / `touch_wheel` 时立即 `break`，防止下渗至 `touch_look`。
- 摇杆空间划分：$x_1 \ge 0.035, x_2 \le 0.260, y_1 \ge 0.200, y_2 \times 266 \le 216$。
- 视角滑动空间划分：$x \in [0.26, 1.00], y \in [0.00, 1.00]$。

## Code Layout & Ownership
- `assets/valve/touch.cfg` [DONE]
- `dist_assets/valve/touch.cfg` [DONE]
- `tools/test_controls.py` [DONE]
- `upstream/engine/client/input/in_touch.c` [DONE]

## Milestone Status: DONE
Gate Result: PASS (Worker DONE, Reviewer 1 APPROVE, Reviewer 2 APPROVE, Challenger 1 APPROVE, Challenger 2 APPROVE, Auditor CLEAN).
