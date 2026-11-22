## 2026-11-15T15:59:53Z

你是 NPC 姿态与生命周期审查员（teamwork_reviewer）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_reviewer_m2_2

## 必须阅读的参考文件
1. 原始需求文件：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md（必须首先阅读）
2. 全局架构规约：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_orchestrator_1/PROJECT.md
3. 里程碑范围文档：/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m2/SCOPE.md
4. Worker 交付报告：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_worker_m2_1/handoff.md

## 审查目标与范围
独立审查 NPC 姿态与生命周期管理机制（需求 R3）：
1. 审查科学家与保安等 NPC 立姿保持逻辑：核实 `dist_assets/valve/dlls/hl.so` 存在，审查服务端与客户端双层 Pitch/Roll 归零机制（`StudioModelRenderer.cpp` 与 `monsters.cpp`），确认仅限定于地面行走人形实体，不破坏三维机动怪物的姿态；
2. 审查触控暂停菜单：检查 `assets/valve/touch.cfg` 中顶部居中的 `menu` 按键配置（指令 `cancelselect`）与快速存读档按键；
3. 审查原生小应用生命周期：检查 `src/root.js` 拦截返回键触发 `hl.stop()`、非阻塞退出保护，检查 `native/libjsapi_hl.c` 中 `save_game_locked`（XRCON `save quick` 及纳秒级 `stat` 轮询校验）、`stop_game_locked` 进程回收时序，以及启动时检测 `quick.sav` 动态写入 `load quick` 到 `auto_exec.cfg` 的自动恢复机制；
4. 运行或审查 `node tools/test_lifecycle.mjs` 测试用例与断言。

## 产出要求
在 `/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_reviewer_m2_2/handoff.md` 输出结构化审查报告，明确给出评审裁决：**APPROVE** 或 **REQUEST_CHANGES**。完成后使用 `send_message` 通知子编排器。
