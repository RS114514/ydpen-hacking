# BRIEFING — 2026-11-12T21:00:00Z

## Mission
修复 Half-Life 1 在网易有道词典笔 6 代（YDPX6-2）上科学家与 Barney 等地面 NPC 身体前倾 90 度趴伏行走姿态异常，编译 aarch64 client.so 与 hl.so 并推送到真机实测验证。

## 🔒 My Identity
- Archetype: implementer / qa / specialist
- Roles: [implementer, qa, specialist]
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_npc
- Original parent: 3976846c-1776-4937-a653-9cf69d968e47
- Milestone: M3 (NPC Pitch Fix & Native Build)

## 🔒 Key Constraints
- 独占修改范围：hlsdk 源码目录（dlls/ 与 cl_dlls/ 源码），对应编译配置文件。
- 严禁修改其他战线的文件（严禁修改 touch.cfg、build_amr.py、install_amr.py、src/ 前端代码）。
- 严禁作弊与硬编码虚假测试结果，真实修改、真实编译、真机实测验证。

## Current Parent
- Conversation ID: 3976846c-1776-4937-a653-9cf69d968e47
- Updated: 2026-11-12T21:00:00Z

## Task Summary
- **What to build**: 修复 StudioModelRenderer.cpp 和 服务端怪兽逻辑中的 NPC pitch 异常，编译 aarch64 的 client.so 与 hl.so。
- **Success criteria**: 科学家与 Barney 实体正常直立走动，编译成功并部署到 `/userdisk/halflife/valve/cl_dlls/client.so` 和 `/userdisk/halflife/valve/dlls/hl.so`，真机实测通过。
- **Interface contracts**: /Volumes/500GB/Ydpen/.agents/teamwork/orchestrator/PROJECT.md
- **Code layout**: /Volumes/500GB/Ydpen/halflife_app/hlsdk-xash3d

## Key Decisions Made
- 准备深入分析 explorer_survey_3 的分析报告，实施客户端 StudioSetUpTransform 和服务端怪兽实体角度矫正。

## Artifact Index
- [TBD]

## Change Tracker
- **Files modified**: None yet
- **Build status**: Not started
- **Pending issues**: None

## Quality Status
- **Build/test result**: Not started
- **Lint status**: None
- **Tests added/modified**: None

## Loaded Skills
- None
