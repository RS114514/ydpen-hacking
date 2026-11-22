## 2026-11-15T15:12:30Z
你是里程碑 1 子编排器（sub_orch_m1），负责全权统筹执行里程碑 1（M1: 触控系统虚拟摇杆与防抢占重构）的实施与验证闭环。

## 基础环境
- 工作目录：/Volumes/500GB/Ydpen/halflife_app
- 状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m1
- 原始需求文件：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md（必须首先阅读）
- 全局架构规约：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_orchestrator_1/PROJECT.md
- 触控系统调研报告参考：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_explorer_survey_1/handoff.md 与 analysis.md

## 里程碑 1 范围与目标
1. **解决按键穿透与视角冲突**：
   - 在 `in_touch.c` 的 `Touch_ButtonPress` 函数中，对消费触控事件的 `touch_command` 与 `touch_wheel` 分支在 `event_down` 和 `event_up` 中补充 `break;`，阻断右侧操作按钮（fire/jump/use/reload 等）向底层 `touch_look` 渗透，消除准星抖动与视角被抢占问题。
2. **虚拟摇杆重构**：
   - 在 `assets/valve/touch.cfg` 中将原十字键（`dpad`）替换为引擎原生虚拟摇杆（`joy`），动作指令绑定为 `_joy`，属性掩码添加 `TOUCH_FL_STICK`（2048），使用 `gfx/touch/stick_ring` 与 `gfx/touch/stick_thumb` 材质；
   - 保证几何坐标严格满足左侧控制分区（$x_2 \le 0.26$）与 HUD 避让规范（$y_2 \times 266 \le 216$），彻底消除原十字键 50% 量化死区与尺寸过小问题。
3. **测试断言同步与本地验证**：
   - 同步调整 `tools/test_controls.py` 中的断言逻辑（支持新的 `_joy` / `joy` 命名与结构）；
   - 要求 Worker 运行 `python3 tools/test_controls.py` 并保证全部测试通过。

## 编排执行流程（2B 迭代循环）
你作为子编排器，自身遵循编排约束（不得直接修改代码或运行测试），必须通过子代理完成：
1. 派发 Worker（`teamwork_worker`）实施代码与配置修改，并执行构建与本地单元测试（Worker 派发必须包含强制诚信警告）；
2. 派发 Reviewer（`teamwork_reviewer`）独立审查修改质量与规范符合度；
3. 派发 Challenger（`teamwork_challenger`）针对双指触控并发与死区消除进行对抗性验证；
4. 派发 Auditor（`teamwork_auditor`）进行独立真实性审计；
5. 执行门禁汇总（GATE_STATUS.md），门禁全绿通过后，输出 `handoff.md` 并使用 send_message 向主编排器汇报。
