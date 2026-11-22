# BRIEFING — 2026-11-12T14:43:30Z

## Mission
完成 halflife_app 基础架构、构建脚本、dlopen 死锁闪退机理、纯原生直启架构及 Steam 官方高清 Lambda 图标资产勘查。

## 🔒 My Identity
- Archetype: explorer
- Roles: infrastructure and launch survey
- Working directory: /Volumes/500GB/Ydpen/halflife_app
- State folder: /Volumes/500GB/Ydpen/.agents/teamwork/explorer_survey_1
- Original parent: 3976846c-1776-4937-a653-9cf69d968e47
- Milestone: survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- 只能使用中文回复，遵守严禁虚构、如实汇报原则
- 遵守团队通信规范与禁止套话约束

## Current Parent
- Conversation ID: 3976846c-1776-4937-a653-9cf69d968e47
- Updated: not yet

## Investigation State
- **Explored paths**:
  - /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
  - /Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py
  - /Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c
  - /Volumes/500GB/Ydpen/halflife_app/native/wl_center.c
  - /Volumes/500GB/Ydpen/halflife_app/src/* (manifest.json, app.json, app.js, root.js, page-entry.js)
  - /Volumes/500GB/Ydpen/senren-banka-ydpen-port (千恋万花原生 mini APP 架构对比)
  - /Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life (官方原版图标资产)
  - 真机设备 9DA2200007506350 (YDPX6-2 / RK3562 Melon Pro / PenOS Linux)
- **Key findings**:
  1. libwl_center.so 错误被打包入 AMR libs/arm64，Falcon 启动时自动扫描并 dlopen 所有 .so，libwl_center.so 劫持 dlsym/Wayland 符号且缺乏 custom_init_jsapis，引发 rtld 锁竞争死锁闪退；必须在 build_amr.py 中剔除，仅保留 libjsapi_hl.so，libwl_center.so 由安装脚本推送至 /userdisk/halflife/libwl_center.so，由 libjsapi_hl.c fork 后通过 LD_PRELOAD 专供 xash3d 使用。
  2. 废除二级启动器：清理空的 pages/index 残留，在小应用生命周期（onLaunch / Component.mounted / onShow）内直接通过 hl.start() 调起引擎，无中间按钮和外部 shell 脚本。
  3. 官方高清图标：定位到官方原生资源 /Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns（512x512 高清 Lambda 图标），可通过 sips 转换部署为 assets/app_icon.png。
  4. 目标设备：当前在线两台设备中，6 代目标设备为 9DA2200007506350（认证口令 ydpen2026），所有构建/安装脚本应显式带上 -s 9DA2200007506350。
- **Unexplored areas**: 无，所有勘查目标已全部闭合。

## Key Decisions Made
- 勘查结果形成结构化分析，指导后续 Implementer 实施改动。

## Artifact Index
- .agents/teamwork/explorer_survey_1/DISPATCH.md — 任务分发记录
- .agents/teamwork/explorer_survey_1/progress.md — 心跳与阶段进度
- .agents/teamwork/explorer_survey_1/BRIEFING.md — 持久化上下文与工作记忆
- .agents/teamwork/explorer_survey_1/handoff.md — 最终勘查交接报告
