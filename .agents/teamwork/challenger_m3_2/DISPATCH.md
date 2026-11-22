# Challenger 2 Dispatch Task — M3 生命周期存续与异常恢复实测对抗

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- Worker 交付报告：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`

## 约束条件
- 工作目录：`/Volumes/500GB/Ydpen/halflife_app`
- 状态目录：`/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_2`
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

## 挑战目标
1. 快速重进与存读档极限抗扰：
   - 在 6 代真机（`9DA2200007506350`）上实测连续返回退出与冷启动重新进入流程；
   - 验证返回键退出时自动调用 `save quick` 并纳秒级确认后干净退出；
   - 验证再次进入时自动执行 `load quick` 恢复游戏进度，存档数据无损坏。
2. 异常中断与进程自愈实测：
   - 模拟底层进程异常（例如 `kill -9 $(pidof xash3d)`），实测上层小应用的心跳检测与自动拉起（`launchGame`）自愈能力。
3. 产出交付报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_2/handoff.md` 中给出明确裁决（`APPROVE` 或 `REQUEST_CHANGES`），并通过 send_message 向 sub_orch_m3 发送通知。


## 2026-11-15T20:25:34Z
你是 M3 里程碑的挑战者（challenger_m3_2）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_2
你的任务指派文件已写入：/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_2/DISPATCH.md。

【前置必读】
- /Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md
- /Volumes/500GB/Ydpen/PROJECT.md
- /Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md
- /Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md
- /Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_2/DISPATCH.md

【对抗性实证挑战目标】
1. 在 6 代真机（9DA2200007506350）上进行连续重进与快速存读档极限抗扰验证（返回自动 save quick，冷启动自动 load quick）；
2. 模拟底层 xash3d 进程异常退出/强杀，验证上层心跳自愈与重新拉起能力；
3. 输出 handoff.md 给出裁决（APPROVE 或 REQUEST_CHANGES），并通过 send_message 向 sub_orch_m3 汇报。
