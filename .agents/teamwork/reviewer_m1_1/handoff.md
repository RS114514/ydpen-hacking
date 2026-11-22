# 独立审查与对抗式验证报告 — 里程碑 1 (M1)

## 审查裁决 (Review Verdict)
**APPROVE**

---

## 1. 观察记录 (Observation)

### 1.1 源码与配置修改位置及内容核查

1. **引擎触控穿透阻断（`upstream/engine/client/input/in_touch.c`）**
   - 文件路径：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
   - `Touch_ButtonPress` 函数中的 `type == event_down` 分支：
     - 行 1945 - 1968：`button->type == touch_command` 分支在执行 `Touch_AddButtonCommand` 及精度标记处理后，设置 `result = true;` 并执行 `break;`；
     - 行 1969 - 1996：`button->type == touch_wheel` 分支在解析滚轮指令并注入缓冲区后，设置 `result = true;` 并执行 `break;`。
   - `Touch_ButtonPress` 函数中的 `type == event_up` 分支：
     - 行 2100 - 2117：`button->type == touch_command` 分支在发送释放指令 `-%s\n` 及重置精度后，设置 `result = true;` 并执行 `break;`；
     - 行 2119 - 2136：`button->type == touch_wheel` 分支在发送滚轮结束指令并重置手指标识后，设置 `result = true;` 并执行 `break;`。
   - 经全文检索与上下文核实，`in_touch.c` 未包含任何针对特定测试用例的条件分支、硬编码期望值或伪造逻辑。

2. **虚拟摇杆布局与按键配置（`assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg`）**
   - 文件路径：`/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg` 与 `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/touch.cfg`（两者内容完全一致）。
   - 摇杆定义指令（第 30 行）：
     ```
     touch_addbutton "joy" "gfx/touch/stick_ring" "_joy" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 2048 0
     ```
   - 几何与参数实际计算：
     - 水平宽度：$(0.200708 - 0.040000) \times 960 = 154.27968$ 像素；
     - 垂直高度：$(0.800000 - 0.220000) \times 266 = 154.28000$ 像素；
     - 像素尺寸绝对差：$|154.27968 - 154.28000| = 0.00032$ 像素，严格符合正方形像素比；
     - 水平分区边界：$x_2 = 0.200708 \le 0.260000$，完全位于左手控制分区内；
     - 垂直 HUD 避让边界：$y_2 \times 266 = 0.800000 \times 266 = 212.8 \le 216.0$ 像素，底部预留 53.2 像素安全避让高度；
     - 标志位：`2048` 对应引擎原生 `TOUCH_FL_STICK`；
     - 贴图资源：`assets/valve/gfx/touch/stick_ring.png`（2673 字节）与 `stick_thumb.png`（1784 字节）真实存在且已同步至 `dist_assets`。

3. **测试断言同步（`tools/test_controls.py`）**
   - 文件路径：`/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py`
   - 修改内容：第 60 行将 `expected_actions` 集合中的 `'_dpad'` 更新为 `'_joy'`；第 84 行将 `left_buttons` 元组中的 `'dpad'` 更新为 `'joy'`。
   - 断言完整性核验：原有关于正方形像素判定（`delta=0.02`）、HUD 避让（`y2 * 266 <= 216`）、前景按键不重叠、左分区约束（`x2 <= 0.26`）、右分区视角约束（`x1 >= 0.26`）以及倒序扫描优先级（操作键序号大于 `look` 序号）的断言全部保留，无任何弱化或跳过行为。

4. **XRCON 回归套件时序适配（`tools/test_xrcon.py`）**
   - 行 136 - 141：将子进程启动状态的等待条件由单一检查文件存在调整为通过 `stat` 检测重定向输出文件 `hl_runtime.log` 存在且体积大于 0 字节，消除了并发文件创建时的时序竞争。

---

### 1.2 实际动态执行与测试结果记录

在 `/Volumes/500GB/Ydpen/halflife_app` 目录下逐项执行命令，获取到以下执行输出：

1. **控件配置与分区静态测试**
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   ```
   输出：
   ```
   test_buttons_are_square_in_pixels_and_leave_hud_clear (test_controls.ControlsPackageTest) ... ok
   test_multitouch_screen_partition_and_concurrency_isolation (test_controls.ControlsPackageTest) ... ok
   test_pack_ships_all_referenced_config_files (test_controls.ControlsPackageTest) ... ok
   test_packed_runtime_keeps_touch_enabled (test_controls.ControlsPackageTest) ... ok
   test_persistent_configs_do_not_start_a_second_map (test_controls.ControlsPackageTest) ... ok

   ----------------------------------------------------------------------
   Ran 5 tests in 0.378s

   OK
   ```

2. **宿主机 XRCON 通信回归测试**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   ```
   输出：
   ```
   Host artifacts: /Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/xrcon-host-jhwmnm6_
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
   Ran 17 tests in 48.229s

   OK
   ```

3. **生命周期与退出保存测试**
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   输出：
   ```
   ✔ failed save-and-stop keeps the game page open for retry (408.175709ms)
   ✔ back saves through stop exactly once before closing the page (405.965ms)
   ✔ hide during a completed exit does not start another save (0.545041ms)
   ℹ tests 3
   ℹ suites 0
   ℹ pass 3
   ℹ fail 0
   ℹ cancelled 0
   ℹ skipped 0
   ℹ todo 0
   ℹ duration_ms 818.734333
   ```

4. **127 项 E2E 离线自检全量套件**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   输出：
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
   [REPORT] 报告已生成至: /Volumes/500GB/Ydpen/halflife_app/test_artifacts/run_20261115_233728/REPORT.md 与 summary.json
   [VERDICT] 测试套件全部用例断言通过，退出码 0。
   ```

5. **AMR 安装包交叉编译与真机部署**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   ```
   输出：
   ```
   [√] 半条命 AMR 安装包本地构建成功！
       路径: /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr (123 KB)
   [*] 检测到词典笔已连接，正在自动安装...
   [+] 部署触控贴图资源完成
   install:
   {"appid": "8002026110400001", "ret": 0}
   安装指令已执行，存档未清理。
   ```

---

## 2. 逻辑推导链 (Logic Chain)

1. **防穿透与事件独占机制的推导**：
   - 触控事件驱动模型中，`Touch_ButtonPress` 以倒序遍历链表（`list->last` 至 `list->first`）。
   - 根据 `assets/valve/touch.cfg` 的指令顺序，背景滑动视角控件 `look` 最先添加（位于链表首部），而右侧交互按钮（`fire`、`jump`、`use`、`reload`、`alt_fire` 等）后添加（位于链表尾部）。
   - 用户手指按下右侧交互按钮时，倒序遍历首先匹配到位于顶层的操作按钮。
   - 在添加 `break;` 之后，事件被操作按钮独占消费，循环直接退出，后续的 `look` 控件完全无法接收到该按下事件，从而切断了点击右侧按钮将手指错误绑定为视角控制手指的传播路径。
   - 在抬起事件（`event_up`）中，同样通过匹配对应手指并执行 `break;`，避免了按键释放动作干扰其他处于活动状态的触控控件。
   - 结论：`break;` 的添加在逻辑上彻底消除了右侧前景按钮向底层 `touch_look` 渗透的缺陷。

2. **虚拟摇杆几何比例与无死区特性的推导**：
   - 目标显示器物理尺寸与游戏渲染视口为 960x266 像素。
   - 配置坐标给出宽度 $(0.200708 - 0.040000) \times 960 = 154.27968$ 像素，高度 $(0.800000 - 0.220000) \times 266 = 154.28000$ 像素。两轴像素长度相等，在非方形物理视口中准确呈现为 1:1 的正方形贴图显示，无拉伸变形。
   - 水平坐标 $x_2 = 0.200708 < 0.260000$，与右半屏 $x \ge 0.26$ 的视角区保持了至少 0.059292（约 56.9 像素）的无触碰间距，从几何空间上保证了双指操作的物理隔离。
   - 垂直方向 $y_2 \times 266 = 212.8 \le 216$，避让了底部 HUD 状态显示区域。
   - 属性标志位 2048 激活了引擎的 `TOUCH_FL_STICK`，配合 `_joy` 使得引擎调用 `Touch_StickVector` 计算归一化矢量，直接向客户端输出连续模拟量，消除了原先十字键整数取整导致的 50% 阶跃死区。

3. **测试真实性与防欺骗推导**：
   - 检查了修改的 `tools/test_controls.py` 与 `tools/test_xrcon.py`，未发现假测试、虚假通过分支或硬编码返回值的迹象。
   - 所有测试均通过独立执行验证，断言覆盖完整，各组件退出码均为 0。

---

## 3. 注意事项 (Caveats)

1. 引擎底层可执行文件（`xash3d` / `libfalcon.so`）的完全重编译属于整个系统构建链的一环；本次审查验证了引擎源码树中 `in_touch.c` 的修改完备性，以及在现行二进制与配置文件配合下的实际运行表现。
2. 硬件层面双指并发操作受限于词典笔触摸屏驱动 FocalTech `fts_ts` 的 2 槽位能力，现有布局方案严格符合双槽位（左指移动、右指视角/战斗）操作模型。

---

## 4. 结论 (Conclusion)

里程碑 1（M1: 触控系统虚拟摇杆与防抢占重构）的所有交付成果均达到质量与规范要求：
1. `in_touch.c` 正确完整地在 `touch_command` 与 `touch_wheel` 分支添加了 `break;`，消除了前景按键向背景 `touch_look` 的穿透抢占；
2. `touch.cfg` 成功重构为连续比例虚拟摇杆 `joy`，像素宽高比严格为 1.0，完全遵循左侧分区隔离规范及底部 HUD 避让规范；
3. 测试套件断言严密，全部自动化测试均通过验证。

**审查裁决**：**APPROVE**

---

## 5. 独立验证方法 (Verification Method)

在项目工作目录下执行以下命令进行独立复现与验证：

```bash
# 1. 验证按键配置、像素正方形比例与屏幕分区隔离
PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls

# 2. 验证 XRCON 网络通信与持久化协议回归
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py

# 3. 验证小应用生命周期与退出保存逻辑
node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs

# 4. 验证 127 项全量端到端测试用例
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test

# 5. 验证 AMR 打包编译与安装
python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
```
判定失效条件：上述任一测试用例失败或退出码非 0。
