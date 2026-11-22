# Challenger 1 Dispatch Task — M3 触控系统与显示抗扰对决

## 前置必读
- 原始用户需求：`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
- 全局项目规约：`/Volumes/500GB/Ydpen/PROJECT.md`
- M3 里程碑范围说明：`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m3/SCOPE.md`
- Worker 交付报告：`/Volumes/500GB/Ydpen/.agents/teamwork/worker_m3_1/handoff.md`

## 约束条件
- 工作目录：`/Volumes/500GB/Ydpen/halflife_app`
- 状态目录：`/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_1`
- 目标设备严格限定为有道词典笔 6 代（ADB 序列号 `9DA2200007506350`），若连接 3 代笔严禁操作。

## 挑战目标
1. 双指并发触控注入实证对抗：
   - 在 6 代真机（`9DA2200007506350`）上通过底层输入注入工具（如 dev_probe），实测双指并发操作：
     - Slot 0 在左侧连续比例虚拟摇杆区域（$x \le 0.26$）推移移动；
     - 同时 Slot 1 在右侧区域（$x \ge 0.26$）连续滑动视角或高频点击战斗按钮（fire、jump、use 等）；
   - 验证视角绝对不发生跳动、抢占或方向错乱，左侧虚拟摇杆无 50% 阶跃死区。
2. 画面居中与黑边稳定性对抗：
   - 验证全屏 960x480 下 960x266 视口固定在 y=107，上下各 107px 黑边稳定，在高频输入与场景重绘下无偏移或抖动。
3. 产出交付报告：
   在 `/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_1/handoff.md` 中给出明确裁决（`APPROVE` 或 `REQUEST_CHANGES`），并通过 send_message 向 sub_orch_m3 发送通知。


## 2026-11-15T20:25:20Z
你是 M3 里程碑的挑战者（challenger_m3_1）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_1
你的任务指派文件已写入：/Volumes/500GB/Ydpen/.agents/teamwork/challenger_m3_1/DISPATCH.md。
【对抗性实证挑战目标】
1. 在 6 代真机（9DA2200007506350）上进行双槽位并发触控注入实证对抗（Slot 0 虚拟摇杆推移，Slot 1 右侧视角滑动与按键点击），核验视角稳定不抢占、摇杆无阶跃死区；
2. 核验 960x266 视口居中性与上下黑边在极端触发下的稳定性；
3. 输出 handoff.md 给出裁决（APPROVE 或 REQUEST_CHANGES），并通过 send_message 向 sub_orch_m3 汇报。
