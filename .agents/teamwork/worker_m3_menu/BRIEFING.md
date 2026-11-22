# BRIEFING — 2026-11-13T05:02:00Z

## Mission
在网易有道词典笔 6 代（YDPX6-2，960x266 视口）上重构并美化黑橙工控风暂停菜单，并实现可靠的 Save / Load 存读档功能。

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_menu
- Original parent: 3976846c-1776-4937-a653-9cf69d968e47
- Milestone: Milestone 3 - Pause Menu & Save Load

## 🔒 Key Constraints
- 独占修改范围：`halflife_app/src/pages/game/` 暂停菜单相关 UI 组件、样式与 XRCON 存读档数据流代码。
- 严禁修改其他战线的文件（严禁修改 `assets/valve/touch.cfg`、`build_amr.py`、`install_amr.py`、hlsdk 源码）。
- 960x266 视口黑橙工控风美学设计（纯黑 `#000000`、黑山橙 `#F57E00`、高亮金橙 `#FFA500`、文字白色/琥珀色）。
- 手指触控大热区与触控反馈。
- XRCON / 原生通信执行 save quick / load quick。
- 存档 /userdisk/halflife/valve/save/quick.sav 与读档状态真实验证。

## Current Parent
- Conversation ID: 3976846c-1776-4937-a653-9cf69d968e47
- Updated: not yet

## Task Summary
- **What to build**: 黑橙工控风暂停菜单重构与 Save / Load 功能实现及验证
- **Success criteria**: 960x266 居中规整排版；Save 成功生成 quick.sav；Load 恢复状态；真机截图验证
- **Interface contracts**: /Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
- **Code layout**: halflife_app/src/pages/game/

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Not built yet
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: None
