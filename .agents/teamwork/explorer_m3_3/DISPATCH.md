# Explorer 3 Dispatch Task — 引擎活动状态引导、生命周期存盘闭环与资源清理方案探索

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- 失败尝试记录：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/DEAD_ENDS.md`
- **法证审计员完整报告（必读全文）**：`/Volumes/500GB/Ydpen/.agents/teamwork/auditor_m3_1/handoff.md`
- 挑战者 2 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_2/handoff.md`
- 审查员 1 报告：`/Volumes/500GB/Ydpen/.agents/teamwork/reviewer_m3_1/handoff.md`

## 探索任务与技术要求
1. 解决 `cl.state == 0` 导致的存盘拒绝问题：
   - 深入分析 Challenger 2 的发现：启动小应用时由于未自动进入活动关卡（`cl.state == 0`），导致 Xash3D 底层执行 `save quick` 时因“Savegame is not allowed”直接拒绝。
   - 探索如何在小应用启动流程（`src/root.js`、`libjsapi_hl.c` 或默认启动脚本 `valve/autoexec.cfg`）中，确保引擎干净地加载基础活动地图（如 `map c0a0`），将引擎推进到 `cl.state == 4`（CA_ACTIVE）状态，使原生自动保存与快速存盘能够稳定落盘。
2. 设备端事件注入与端口转发清理：
   - 排查词典笔系统为何无 `/bin/input keyevent 4`，探索如何通过小应用前端物理返回事件或原生 touch 菜单正确触发 `hl.stop()`。
   - 制定在 `tools/test_e2e_verification.py` 中清理 `tcp:27000` 端口转发的健壮方案，避免造成宿主机端口冲突。
3. 产出调研报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_3/handoff.md` 中给出完整的技术整改建议，并通过 send_message 向 sub_orch_m3 汇报。


## 2026-11-15T20:55:21Z
你是 M3 里程碑的探索者（explorer_m3_3），负责引擎活动状态引导、生命周期存盘闭环与资源清理方案探索。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_3
你的任务指派文件：/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m3_3/DISPATCH.md
