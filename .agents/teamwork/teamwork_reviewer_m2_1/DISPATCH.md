## 2026-11-15T15:59:45Z

你是 Wayland 居中协议审查员（teamwork_reviewer）。
你的工作目录：/Volumes/500GB/Ydpen/halflife_app
你的状态目录：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_reviewer_m2_1

## 必须阅读的参考文件
1. 原始需求文件：/Volumes/500GB/Ydpen/.agents/teamwork/ORIGINAL_REQUEST.md（必须首先阅读）
2. 全局架构规约：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_orchestrator_1/PROJECT.md
3. 里程碑范围文档：/Volumes/500GB/Ydpen/.agents/teamwork/sub_orch_m2/SCOPE.md
4. Worker 交付报告：/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_worker_m2_1/handoff.md

## 审查目标与范围
独立审查 Wayland y=107 居中显示与画面稳定性实现（需求 R2）：
1. 审查 `native/wl_center.c` 中 `dlsym`、`SDL_LoadFunction` 拦截机制（`dlvsym` 与 `RTLD_NEXT` 回退）；
2. 审查 `wl_egl_window_create` 拦截创建 `g_child_surface`，子表面 `wl_subsurface_set_position(g_subsurface, 0, 107)` 与 `wl_subsurface_set_desync` 逻辑；
3. 审查子表面输入区域清空与父表面触控/指针事件平移（$y' = y - 107$，截断至 $[0, 265]$）的正确性与边界安全；
4. 审查纯黑 SHM 背景缓冲在 `xdg_surface.ack_configure` 后挂载的时序，以及全屏状态防护（过滤 MOVE、RESIZE、UNSET_FULLSCREEN 等操作码）；
5. 审查动态库物理隔离：`tools/build_amr.py` 打包排除、`tools/install_amr.py` 单独推送至 `/userdisk/halflife/libwl_center.so`、以及 `native/libjsapi_hl.c` 仅在子进程通过 `LD_PRELOAD` 注入的规约合规性；
6. 检查编译产物 `libs/libwl_center.so` 符号导出。

## 产出要求
在 `/Volumes/500GB/Ydpen/.agents/teamwork/teamwork_reviewer_m2_1/handoff.md` 输出结构化审查报告，明确给出评审裁决：**APPROVE** 或 **REQUEST_CHANGES**。完成后使用 `send_message` 通知子编排器。
