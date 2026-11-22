# Handoff Report — M1: 触控系统虚拟摇杆与防抢占重构

## 1. 观察记录 (Observation)

### 1.1 源码修改位置与代码差异

1. **`Touch_ButtonPress` 防穿透阻断（`upstream/engine/client/input/in_touch.c`）**
   - 文件路径：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
   - `type == event_down` 分支中（行 1945 - 1996）：
     ```c
     if( button->type == touch_command )
     {
         ...
         Touch_AddButtonCommand( button, command );
         if( FBitSet( button->flags, TOUCH_FL_PRECISION ))
             touch.precision = true;
         result = true;
         break;  // 阻止倒序遍历下渗至底层的 touch_look 区域
     }
     else if( button->type == touch_wheel )
     {
         ...
         if( FBitSet( button->flags, TOUCH_FL_PRECISION ))
             touch.precision = true;
         result = true;
         break;  // 阻止滚轮操作穿透
     }
     ```
   - `type == event_up` 分支中（行 2100 - 2136）：
     ```c
     if( button->type == touch_command )
     {
         ...
         if( FBitSet( button->flags, TOUCH_FL_PRECISION ))
             touch.precision = false;
         result = true;
         break;  // 独占释放前景按键，防止下层节点误释放
     }
     else if( button->type == touch_wheel )
     {
         ...
         touch.wheel_finger = -1;
         result = true;
         break;  // 滚轮释放阻断
     }
     ```

2. **虚拟比例摇杆布局配置（`assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg`）**
   - 修改位置：行 28 - 30
   - 修改内容：
     ```
     // ===================== 左手区：连续比例虚拟摇杆 (Joystick, 154x154 像素) =====================
     // 原生模拟量 _joy：154x154 像素比例摇杆，支持连续无级模拟量移动，标志位 2048 (TOUCH_FL_STICK)
     touch_addbutton "joy" "gfx/touch/stick_ring" "_joy" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 2048 0
     ```
   - 几何与资源核验：
     - 水平宽度：$(0.200708 - 0.040000) \times 960 = 154.27968$ 像素；
     - 垂直高度：$(0.800000 - 0.220000) \times 266 = 154.28000$ 像素；
     - 宽高差：$0.00032 < 0.02$ 像素，严格符合正方形像素比；
     - 屏幕分区：$x_2 = 0.200708 \le 0.26$；
     - 底部 HUD 避让：$y_2 \times 266 = 212.8 \le 216$ 像素，底部预留 53.2 像素；
     - 贴图资源：`gfx/touch/stick_ring.png` 与 `gfx/touch/stick_thumb.png` 已同步提取放置在 `assets/valve/gfx/touch/` 与 `dist_assets/valve/gfx/touch/`。

3. **测试断言适配（`tools/test_controls.py`）**
   - 文件路径：`/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py`
   - 修改行 58 - 61：`expected_actions` 集合中的 `'_dpad'` 更新为 `'_joy'`；
   - 修改行 84：`left_buttons` 元组中的 `'dpad'` 更新为 `'joy'`。

4. **宿主机 XRCON 回归套件时序适配（`tools/test_xrcon.py`）**
   - 修改位置：`harness.c` 内部的子进程监控逻辑（行 82 与行 136 - 139）；
   - 将原来单纯判断 `engine.args` 文件存在（会在 `fopen` 瞬间产生 0 字节文件从而提前放行）的逻辑，更新为通过 `stat` 确认重定向日志 `hl_runtime.log` 存在且大小大于 0 字节，确保外部文件系统上子进程输出完全写出后再进行断言。

---

## 2. 逻辑推导链 (Logic Chain)

1. **防穿透与视角防抢占机制**：
   - 触控按键列表采用倒序遍历方式（`for (touch_button_t *button = list->last; button; button = button->prev)`）。
   - 全局滑动视角层 `look` 覆盖屏幕右侧区间（$x \in [0.26, 1.0], y \in [0.0, 1.0]$），在配置文件中优先注册，处于链表首部（底层）。
   - 操作按键（`fire`、`jump`、`use`、`reload` 等）在配置文件中靠后注册，处于链表尾部（顶层）。
   - 当用户在右半屏点击操作按键时，倒序遍历先匹配到操作按键。在添加 `break;` 后，循环立即终止，事件不会继续下发至 `look` 控件。
   - `touch.look_finger` 保持独立，右手点击按键不会将按键点击手指误分配为视角控制手指，消除了点击按键伴随的微小位移导致的视角抖动，同时也避免了按住开火时阻断另一根手指滑动视角的冲突。
   - 在按键释放（`event_up`）时，同样在匹配到对应按键后执行 `break;`，确保单次按键释放逻辑的独立性。

2. **比例虚拟摇杆与死区消除机制**：
   - 原十字键（`_dpad`）在计算过程中调用 `round()` 运算，导致偏移量小于 50% 半径时输出始终为 0，产生中心 50% 死区。
   - 切换为 `_joy` 并附加 `TOUCH_FL_STICK`（2048）后，引擎调用 `Touch_StickVector`。
   - `Touch_StickVector` 计算归一化向量，直接输出 $[-1.0, 1.0]$ 的连续模拟量浮点数，消除了中心阶跃截断与死区。
   - 客户端 `FWGSInput::IN_Move` 接收连续浮点量并分别乘以 `cl_forwardspeed` 与 `cl_sidespeed`，转化为平滑的线性移动指令。
   - 当摇杆位移模拟量大于 0.7 时，`IN_ToggleButtons` 会自动同步按键掩码，维持梯子攀爬等特定判定正常运作。

---

## 3. 注意事项 (Caveats)

1. **引擎源码构建**：
   `in_touch.c` 属于引擎（`xash3d` / `libfalcon.so`）源码。若在未重新交叉编译引擎可执行文件的环境下运行，修改体现于源码树及依赖源码树的测试用例中；在已打包环境中，`touch.cfg` 的摇杆重构直接通过引擎原生内置的 `_joy` 与 `TOUCH_FL_STICK` 支持生效。
2. **多点触控硬件限制**：
   词典笔触摸屏驱动为 FocalTech `fts_ts`，硬件原生支持 2 个槽位（Slot 0 与 Slot 1）。测试方案基于双指并发设计（左指控制摇杆，右指滑动视角或点击按键）。

---

## 4. 结论 (Conclusion)

1. 成功在 `in_touch.c` 的 `Touch_ButtonPress` 函数中加入事件阻断逻辑，解决了操作按键穿透至背景 `_look` 的问题。
2. 成功将 `touch.cfg` 与 `dist_assets/valve/touch.cfg` 中的十字键重构为符合正方形像素比、左侧分区约束与底部 HUD 避让约束的原生比例虚拟摇杆 `joy`。
3. 成功更新 `tools/test_controls.py` 断言，并同步优化了宿主机测试套件。
4. 本地全套测试（`test_controls.py`、`test_xrcon.py`、`test_lifecycle.mjs` 以及 `test_e2e_verification.py --self-test`）全部通过，返回代码 0。

---

## 5. 验证方法 (Verification Method)

### 5.1 本地测试执行指令与结果

1. **控件配置与分区静态测试**
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   ```
   **执行输出**：
   ```
   test_buttons_are_square_in_pixels_and_leave_hud_clear (test_controls.ControlsPackageTest) ... ok
   test_multitouch_screen_partition_and_concurrency_isolation (test_controls.ControlsPackageTest) ... ok
   test_pack_ships_all_referenced_config_files (test_controls.ControlsPackageTest) ... ok
   test_packed_runtime_keeps_touch_enabled (test_controls.ControlsPackageTest) ... ok
   test_persistent_configs_do_not_start_a_second_map (test_controls.ControlsPackageTest) ... ok

   ----------------------------------------------------------------------
   Ran 5 tests in 0.217s

   OK
   ```

2. **宿主机 XRCON 通信回归测试**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   ```
   **执行输出**：
   ```
   Host artifacts: /Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/xrcon-host-7vcrppyi
   test_command_wire_and_disconnect (__main__.XRCONTests) ... ok
   test_config_open_failure_prevents_start (__main__.XRCONTests) ... ok
   test_connection_refused (__main__.XRCONTests) ... ok
   test_empty_and_overlong_rejected (__main__.XRCONTests) ... ok
   test_empty_changed_save_fails (__main__.XRCONTests) ... ok
   test_failed_save_keeps_engine_and_does_not_quit (__main__.XRCONTests) ... ok
   test_load_reports_transmission (__main__.XRCONTests) ... ok
   test_max_command_not_truncated (__main__.XRCONTests) ... ok
   test_reset_does_not_raise_sigpipe (__main__.XRCONTests) ... ok
   test_save_accepts_nanosecond_change_in_same_second (__main__.XRCONTests) ... ok
   test_save_new_file (__main__.XRCONTests) ... ok
   test_save_unchanged_fails_after_wait (__main__.XRCONTests) ... ok
   test_send_wait_is_bounded (__main__.XRCONTests) ... ok
   test_start_dynamic_config_and_loopback_arguments (__main__.XRCONTests) ... ok
   test_stop_saves_then_waits_for_actual_exit (__main__.XRCONTests) ... ok
   test_stop_timeout_keeps_engine_alive (__main__.XRCONTests) ... ok
   test_utf8_short_send_eintr_eagain (__main__.XRCONTests) ... ok

   ----------------------------------------------------------------------
   Ran 17 tests in 19.304s

   OK
   ```

3. **生命周期与退出保存测试**
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   **执行输出**：
   ```
   ✔ failed save-and-stop keeps the game page open for retry (408.769042ms)
   ✔ back saves through stop exactly once before closing the page (407.652417ms)
   ✔ hide during a completed exit does not start another save (1.506959ms)
   ℹ tests 3
   ℹ suites 0
   ℹ pass 3
   ℹ fail 0
   ℹ cancelled 0
   ℹ skipped 0
   ℹ todo 0
   ℹ duration_ms 825.716208
   ```

4. **127 项 E2E 离线全链路自检**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   **执行输出摘要**：
   ```
   ================================================================================
                     E2E 自动化测试执行结果汇总摘要
   ================================================================================
   总用例数: 127    | 通过: 127    | 失败: 0      | 超时: 0     
   --------------------------------------------------------------------------------
     - Tier 1: 55/55 通过 (100.0%)
     - Tier 2: 55/55 通过 (100.0%)
     - Tier 3: 12/12 通过 (100.0%)
     - Tier 4: 5/5 通过 (100.0%)
   ================================================================================
   [VERDICT] 测试套件全部用例断言通过，退出码 0。
   ```

5. **AMR 打包构建验证**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   ```
   构建成功，生成 `dist/half-life-1.0.0.amr`（123 KB），各项原生库和配置完整打包并部署。
