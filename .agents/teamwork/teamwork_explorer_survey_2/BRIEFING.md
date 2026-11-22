# BRIEFING — 2026-11-15T15:08:00Z

## Mission
深入勘测有道词典笔 6 代 Half-Life 原生小应用的画面居中显示与 Wayland 协议稳定性。

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: read-only investigation, Wayland display centering & protocol stability analysis
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/teamwork_explorer_survey_2
- Original parent: d011f44e-2c2e-4435-82f1-65560d28e80c
- Milestone: Survey 2 - Wayland Centering & Protocol Stability

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Reply strictly in Chinese
- Prohibited phrases strictly observed
- Evidence-based findings with exact file paths and line numbers

## Current Parent
- Conversation ID: d011f44e-2c2e-4435-82f1-65560d28e80c
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `halflife_app/native/wl_center.c` (469 行全部拦截逻辑)
  - `halflife_app/native/libjsapi_hl.c` (LD_PRELOAD 注入与生命周期管理)
  - `halflife_app/tools/build_amr.py` (Zig 交叉编译与 AMR 库隔离校验)
  - `halflife_app/tools/install_amr.py` (独立库部署至 /userdisk/halflife/)
  - `halflife_app/tools/test_lifecycle.mjs` (页面生命周期存退测试，3/3 PASS)
  - `halflife_app/tools/test_controls.py` (触控按键与宏定义测试，5/5 PASS)
  - `halflife_app/tools/test_e2e_verification.py` (127 个 E2E 用例离线自检，127/127 PASS)
  - `halflife_app/tools/test_xrcon.py` (17 项宿主回归测试，16 项 PASS)
  - `/etc/xdg/weston/weston.ini` (设备端真实的 rotate-90 与 panel-position=none 配置)
  - 硬件触控与坐标系映射公式推导 ($px = 107 + ly, py = 959 - lx$)
- **Key findings**:
  - `libwl_center.so` 采用父表面全屏锁定（960x480）+ 黑色 SHM 背景 + 子表面相对偏移 $(0, 107)$ 渲染（960x266）+ 去同步模式（desync）架构；
  - 拦截 `xdg_surface.ack_configure` 后挂载背景缓冲，时序完全符合 XDG Shell 协议规范；
  - 拦截 `wl_touch` 与 `wl_pointer`，自动对 Y 轴坐标减去 107 像素偏移，输入与渲染几何完全一致；
  - 动态库完全与 AMR 安装包隔离，由子进程 `LD_PRELOAD` 加载，消除了 Falcon 宿主主进程死锁隐患；
  - 历史画面随机上下偏移的原因是浮动窗口级联布局与缺乏全屏锁定，现有方案彻底解决了此问题。
- **Unexplored areas**: 全部指定调研目标均已完成深度勘测。

## Key Decisions Made
- 勘测分析报告输出至 `.agents/teamwork/teamwork_explorer_survey_2/analysis.md`
- 5 元素交接报告输出至 `.agents/teamwork/teamwork_explorer_survey_2/handoff.md`

## Artifact Index
- DISPATCH.md — Received dispatch message
- BRIEFING.md — Persistent context & memory
- progress.md — Liveness & heartbeat
- analysis.md — Detailed analysis report
- handoff.md — 5-component handoff report
