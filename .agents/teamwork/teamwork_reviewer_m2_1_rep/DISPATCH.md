## 2026-11-15T18:58:22Z
你被指派为 M2 里程碑的 Wayland 居中显示与协议合规独立审查员（Reviewer 1 替补）。

【前置必读】
请首先完整阅读原始需求文档：
`/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md`
全局项目架构规约：
`/Volumes/500GB/Ydpen/PROJECT.md`
M2 里程碑范围说明：
`/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m2/SCOPE.md`
以及 Worker 的交付报告：
`/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_worker_m2_1/handoff.md`

【工作目录与状态目录】
- 工作目录：/Volumes/500GB/Ydpen/halflife_app
- 你的专属状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_reviewer_m2_1_rep/
所有过程记录（BRIEFING.md, progress.md）与最终交付报告（handoff.md）必须写入你的专属状态目录。

【审查任务与核心范围】
重点针对需求 R2 进行静态代码与协议时序审查：
1. 深入核查 `native/wl_center.c` 中对 `dlsym` 与 `SDL_LoadFunction` 的符号拦截实现，验证底层符号解析（如 dlvsym GLIBC_2.17）的可靠性；
2. 验证子表面 `g_child_surface` 的创建、定位 `wl_subsurface_set_position(g_subsurface, 0, 107)`、`wl_subsurface_set_desync` 去同步渲染以及清空子表面输入区域的逻辑；
3. 验证 960x480 纯黑 SHM 缓冲在 `xdg_surface.ack_configure`（Opcode 4）到达后的挂载时序，是否严格符合 Wayland 规范要求；
4. 验证全屏状态防护（`should_block_toplevel_opcode` 对 MOVE/RESIZE/UNSET_MAXIMIZED/UNSET_FULLSCREEN 的拦截）；
5. 验证触控与指针事件 Y 坐标偏移算法（`adj_y = y - 107` 并限制在 `[0, 265]`）在边界与极端值下的正确性；
6. 验证构建、安装与运行时动态库隔离机制（`build_amr.py` 拒绝打包、`install_amr.py` 单独推送、`libjsapi_hl.c` 仅在 fork 子进程注入 LD_PRELOAD）。

【输出要求】
在 `/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_reviewer_m2_1_rep/handoff.md` 产出完整 Handoff 报告，必须包含：
- 审查结论裁决：明确给出 APPROVE 或 REQUEST_CHANGES；
- Observation（观察事实，附具体源码行号与分析事实）；
- Logic Chain（推导逻辑链）；
- Caveats（注意事项与局限）；
- Conclusion（审查结论）；
- Verification Method（验证复现方法）。
完成后通过 send_message 向父代理汇报完成。
