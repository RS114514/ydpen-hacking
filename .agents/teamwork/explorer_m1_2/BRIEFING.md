# BRIEFING — 2026-11-12T17:55:00Z

## Mission
深入勘查 Falcon 小应用的前端生命周期与架构原生化（对标千恋万花SenrenBanka），检查 src 结构、启动/退出生命周期、native 绑定与清理方案。

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_2
- Original parent: 8e8e4808-0f63-4683-bff0-d549e69e3c4c
- Milestone: m1

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- 严禁直接修改业务代码
- 所有的回复必须且只能使用中文
- 遵循严禁词汇规则（无过度比喻、套路模板、口头禅单字动词）

## Current Parent
- Conversation ID: 8e8e4808-0f63-4683-bff0-d549e69e3c4c
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/` 结构与空目录 `src/pages/index`
  - `src/manifest.json`, `src/app.json`, `src/app.js`, `src/root.js`, `src/base-page.js`, `src/page-entry.js`
  - `senren-banka-ydpen-port/app` 架构基准对照
  - `pvz_port/launcher` 架构与生命周期对照
  - `native/libjsapi_hl.c` 与 `native/wl_center.c`
  - `tools/build_amr.py`, `tools/install_amr.py`, `tools/test_lifecycle.mjs`, `tools/test_xrcon.py`
- **Key findings**:
  1. `src/pages/index` 是空目录，全工程无任何代码或配置引用，需清理。
  2. 页面配置与启动链路完备，`pages/game/game` 由 Falcon 容器原生直启，`root.js` 在 `onShow`/`mounted` 直接调用 `hl.start()` 拉起 `xash3d`，无二级按钮或外部 shell 脚本。
  3. `libwl_center.so` 负责 Wayland 全屏覆盖与 960x266 居中定位映射，且在 `fork()` 后通过 `LD_PRELOAD` 注入。
  4. 退出生命周期中，`stop_game_locked()` 存在若保存失败则不退出引擎的设计；若旧进程悬挂，再次启动会因显存/端口争抢导致黑屏。提出启动前进程清理与返回键退出机制强化建议。
- **Unexplored areas**: None

## Key Decisions Made
- 形成详尽的 5 部分交接报告并输出至 `handoff.md`。

## Artifact Index
- DISPATCH.md — 派发指令记录
- progress.md — 心跳与进度记录
- BRIEFING.md — 当前状态工作记忆
- handoff.md — 调查结论报告
