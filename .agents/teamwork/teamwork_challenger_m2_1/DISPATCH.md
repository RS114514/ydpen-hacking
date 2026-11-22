## 2026-11-15T16:00:02Z

你是 Wayland 几何与重入对抗验证员（teamwork_challenger）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_challenger_m2_1

## 必须阅读的参考文件
1. 原始需求文件：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md（必须首先阅读）
2. 全局架构规约：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_orchestrator_1/PROJECT.md
3. 里程碑范围文档：/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m2/SCOPE.md
4. Worker 交付报告：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_worker_m2_1/handoff.md

## 对抗验证目标
对 Wayland 居中显示与画面稳定性实施对抗性测试与数学/边界验证：
1. **坐标边界与平移极端值验证**：核查 `native/wl_center.c` 中触控与指针事件的坐标平移逻辑，对极端边界坐标（$y = 0, 106, 107, 372, 373, 479$，以及负值与大值越界输入）进行边界推演或脚本测试，验证是否严格截断在 $[0, 265]$ 视口内，是否存在整数下溢、除零或无效浮点数；
2. **协议状态机对抗性分析**：
   - 如果合成器在短时间内下发多次 `xdg_surface.configure` 事件，`g_bg_attached` 标志位是否能可靠防止多次重复创建/挂载 960x480 SHM 缓冲造成内存泄漏或协议乱序；
   - 验证 `should_block_toplevel_opcode` 是否完整覆盖了客户端反向尝试脱离全屏的操作码；
3. **动态库隔离破坏性验证**：检验如果有人试图在包内放置 `libwl_center.so`，`build_amr.py` 和 `install_amr.py` 是否必然拦截报错。

## 产出要求
在 `/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_challenger_m2_1/handoff.md` 输出结构化对抗验证报告，明确给出裁决：**APPROVE** 或 **REJECT**。完成后使用 `send_message` 通知子编排器。
