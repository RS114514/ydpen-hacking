# Project: Half-Life YDPX6-2 Native MiniApp Remediation

## Architecture
- Module boundaries:
  1. Touch System & Controls: `in_touch.c`, `touch.cfg`, virtual joystick (`_joy`), break on button press.
  2. Display & Centering: `wl_center.c` -> `libwl_center.so`, Wayland xdg_surface protocol, 960x266 viewport centered at y=107 in 960x480 fullscreen.
  3. Game Logic, Posture & Lifecycle: `StudioModelRenderer.cpp`, `monsters.cpp` -> `hl.so`, `root.js`, `libjsapi_hl.c`.
  4. Build, Packaging & E2E Testing: `build_amr.py`, `install_amr.py`, `test_controls.py`, `test_lifecycle.mjs`, `test_xrcon.py`, `test_e2e_verification.py`.

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Continuous Proportional Virtual Joystick | 替换左侧十字键为连续比例模拟摇杆，消除50%死区 | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Touch Button Contention & Look Break Fix | 修复 Touch_ButtonPress 遍历无 break 导致底层 _look 区域被右侧按钮抢占 | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Touch Layout & Config Synchronization | 调整 touch.cfg 布局与 test_controls.py 断言同步 | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Wayland y=107 Viewport Centering & Stability | 验证 libwl_center.so 在 SDL2 下的 dlsym 拦截与 ack_configure 居中缓冲挂载 | M2 | ORIGINAL_REQUEST §R2 |
| 5 | NPC Standing Posture Stabilization | 验证科学家与保安 NPC 行走与待机姿态稳定直立，无前倾或倒立 | M2 | ORIGINAL_REQUEST §R3 |
| 6 | Touch Pause Menu & Lifecycle Auto-Save/Resume | 验证触控暂停菜单、快速存读档及 Falcon 退出时自动保存重启自动恢复 | M2 | ORIGINAL_REQUEST §R3 |
| 7 | Native AMR Build & Device Deployment | 使用 build_amr.py 编译打包并经 install_amr.py 部署至 6 代真机 9DA2200007506350 | M3 | ORIGINAL_REQUEST §R4 |
| 8 | Local & Device E2E Verification Full Pass | 本地回归脚本全部通过，真机端到端全量 127 项测试退出码 0 | M3 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: 触控系统虚拟摇杆与防抢占重构 | 重构左侧为虚拟摇杆，修复 Touch_ButtonPress break 阻断，更新 touch.cfg 与 test_controls.py | none | DONE |
| 2 | M2: 居中显示与生命周期/NPC姿态集成验证 | 验证 libwl_center.so 居中逻辑，验证 NPC 立姿与生命周期存读档/自动恢复 | M1 | DONE |
| 3 | M3: 原生小应用打包部署与真机全量端到端验收 | build_amr.py 打包，install_amr.py 部署真机，执行本地与真机 127 项 E2E 测试验收 | M2 | IN_PROGRESS |

## Interface Contracts
### Touch Control ↔ Game Client
- `Touch_StickVector` -> `cmd->forwardmove` & `cmd->sidemove` 模拟量输入 $[-1.0, 1.0]$。
- `Touch_ButtonPress` 命中 `touch_command` / `touch_wheel` 时立即 `break`，防止下渗至 `touch_look`。

### Display Interceptor ↔ SDL2 / Wayland
- `libwl_center.so` 拦截 `wl_egl_window_create` 创建 `g_child_surface`，定位在 $(0, 107)$ 并启用 `wl_subsurface_set_desync`。
- 父表面全屏 960x480，在 `xdg_surface.ack_configure` 后挂载 960x480 纯黑 SHM 缓冲。

### Lifecycle ↔ Engine XRCON
- 前端 `root.js` 在返回事件调用 `hl.stop()` -> `libjsapi_hl.c` 下发 `save quick` 并轮询 `stat` 纳秒级更新确认后下发 `quit`。
- 启动时检测 `quick.sav` 存在则写入 `load quick` 到 `auto_exec.cfg`。

## Code Layout
- `native/wl_center.c`: Wayland 居中拦截器源码
- `native/libjsapi_hl.c`: Falcon 小应用原生生命周期与 XRCON 胶水层
- `assets/valve/touch.cfg`: 触控按键与摇杆布局配置
- `dist_assets/valve/dlls/hl.so`: 修复 NPC 姿态后的客户端/服务端引擎库
- `tools/build_amr.py`: AMR 打包脚本
- `tools/install_amr.py`: 真机部署脚本
- `tools/test_controls.py`: 本地按键布局静态与动态验证
- `tools/test_lifecycle.mjs`: 本地生命周期与退出逻辑测试
- `tools/test_xrcon.py`: XRCON 通信回归测试
- `tools/test_e2e_verification.py`: 127 项分层端到端自动化测试套件
