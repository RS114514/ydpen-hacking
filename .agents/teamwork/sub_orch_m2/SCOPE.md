# Scope: M2 - 居中显示与生命周期/NPC姿态集成验证

## Architecture
- Module boundaries:
  1. Wayland Viewport Interceptor: `native/wl_center.c` -> `libs/libwl_center.so`，实现 `wl_egl_window_create` 拦截创建 `g_child_surface`，设定位置在 (0, 107)，配置 `wl_subsurface_set_desync`，并在 `xdg_surface.ack_configure` 挂载 960x480 黑色背景缓冲。
  2. NPC Posture & Physics Angles: `cl_dll/StudioModelRenderer.cpp` 与 `dlls/monsters.cpp` 俯仰角归零机制，编译产物为 `dist_assets/valve/dlls/hl.so`。
  3. Touch Menu & Lifecycle: `assets/valve/touch.cfg` 顶部居中 `menu` 按钮（`cancelselect`），`src/root.js` 拦截返回键调用 `hl.stop()`，`native/libjsapi_hl.c` 下发 `save quick` 并通过纳秒级 `stat` 确认存盘后退出，再次进入时动态注入 `load quick` 自动恢复。
  4. Local Automated Suites: `test_lifecycle.mjs`, `test_xrcon.py`, `test_e2e_verification.py --self-test`。

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 4 | Wayland y=107 Viewport Centering & Stability | 验证 libwl_center.so 在 SDL2 下的 dlsym 拦截与 ack_configure 居中缓冲挂载 | M2 | ORIGINAL_REQUEST §R2 |
| 5 | NPC Standing Posture Stabilization | 验证科学家与保安 NPC 行走与待机姿态稳定直立，无前倾或倒立 | M2 | ORIGINAL_REQUEST §R3 |
| 6 | Touch Pause Menu & Lifecycle Auto-Save/Resume | 验证触控暂停菜单、快速存读档及 Falcon 退出时自动保存重启自动恢复 | M2 | ORIGINAL_REQUEST §R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 2.1 | Worker 验证与自动化测试 | 验证居中机制源码与产物、NPC姿态逻辑与hl.so、生命周期与触控菜单，执行全部本地测试 | none | IN_PROGRESS |
| 2.2 | Reviewer 独立协议与代码审查 | 审查 Wayland 协议交互时序、坐标变换数学正确性、生命周期信号与文件时序 | 2.1 | PLANNED |
| 2.3 | Challenger 对抗性验证 | 居中几何偏移抗扰性、冷启动重进稳定性、高频存盘并发对抗测试 | 2.1 | PLANNED |
| 2.4 | Auditor 独立真实性审计 | 检查是否存在作弊、伪造输出、硬编码断言等违规行为 | 2.1 | PLANNED |
| 2.5 | 门禁决策与交付报告 | 综合所有评审意见与审计结论，形成最终裁决并向主编排器汇报 | 2.2, 2.3, 2.4 | PLANNED |

## Interface Contracts
### Display Interceptor ↔ SDL2 / Wayland
- `libwl_center.so` 拦截 `wl_egl_window_create` 创建 `g_child_surface`，设定位置在 (0, 107)，配置 `wl_subsurface_set_desync`。
- 父表面全屏 960x480，在收到 `xdg_surface.ack_configure` 后挂载 960x480 纯黑 SHM 缓冲。
- 输入区域在子表面清空，触控事件由父表面接收，Y 坐标减 107 像素并限制在 [0, 265] 视口区间内。
- 动态库处于包外独立部署，由 `LD_PRELOAD` 在引擎子进程注入，Falcon 主框架不加载。

### Lifecycle ↔ Engine XRCON
- 前端 `root.js` 在返回事件调用 `hl.stop()` -> `libjsapi_hl.c` 下发 `save quick` 并轮询 `stat` 纳秒级更新确认后下发 `quit`。
- 启动时检测 `quick.sav` 存在则写入 `load quick` 到 `auto_exec.cfg`。
