# 对抗性压力测试报告 — M1: 触控系统虚拟摇杆与防抢占重构

**对抗裁决**: `APPROVE`
**整体风险等级**: `LOW`

---

## 1. 观察记录 (Observation)

### 1.1 源码与配置观察
1. **触控防抢占逻辑（`upstream/engine/client/input/in_touch.c`）**：
   - 行 1945 - 1968：`event_down` 分支中，当匹配到 `button->type == touch_command` 时，调用 `Touch_AddButtonCommand`，若存在 `TOUCH_FL_PRECISION` 则置位 `touch.precision = true`，置位 `result = true`，并执行 `break;` 终止倒序遍历。
   - 行 2100 - 2117：`event_up` 分支中，当匹配到 `button->type == touch_command` 时，对非锁存指令生成 `-command` 释放命令，若存在 `TOUCH_FL_PRECISION` 则复位 `touch.precision = false`，置位 `result = true`，并执行 `break;` 终止遍历。
   - 行 1941：对 `TOUCH_FL_STICK` 且类型为 `touch_joy` 的控件，当 `button->finger != -1` 时执行 `continue;`，拒绝第二根手指重复抢占已分配的虚拟摇杆。

2. **按键布局与几何尺寸（`assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg`）**：
   - 摇杆定义：`touch_addbutton "joy" "gfx/touch/stick_ring" "_joy" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 2048 0`
   - 水平跨度：$x_1 = 0.040000, x_2 = 0.200708 \implies \Delta x \times 960 = 154.27968$ 像素；
   - 垂直跨度：$y_1 = 0.220000, y_2 = 0.800000 \implies \Delta y \times 266 = 154.28000$ 像素；
   - 像素长宽差：$|154.27968 - 154.28000| = 0.00032$ 像素；
   - 底部位置：$y_2 \times 266 = 212.80$ 像素，小于 HUD 顶部阈值 $216.00$ 像素，留出安全边距 $3.20$ 像素；
   - 分区隔离：左侧控件最大 $x_2 = 0.200708$，全局视角区 $x_1 = 0.260000$，两者之间存在 $\Delta x = 0.059292$（即 $56.92$ 像素）的无按键物理隔离带。

### 1.2 对抗压测与回归套件实测记录
1. **独立原生 C 语言对抗压测套件（`tools/adversarial_touch_harness`）**：
   - 执行指令：`clang -O3 -Wall -Wextra tools/adversarial_touch_harness.c -o tools/adversarial_touch_harness && tools/adversarial_touch_harness`
   - 实测输出：
     ```
     === Starting Native Adversarial Touch Engine Harness Tests ===
     [PASS] Test_Boundary_HUD_Clearance
     [PASS] Test_Partition_At_026_Deadband
     [PASS] Test_HighFreq_Alternating_Buttons (50,000 iterations)
     [PASS] Test_CJump_Spam_While_Holding_Joy (10,000 iterations)
     [PASS] Test_Precision_Flag_With_Break
     [PASS] Test_Full_Touch_Cfg_Layout_Adversarial
     === All 6 Adversarial Harness Suites Passed Successfully ===
     ```
   - 退出代码：0。

2. **Python 几何与容差对抗测试（`tools/test_adversarial_controls.py`）**：
   - 执行指令：`python3 -m unittest -v halflife_app/tools/test_adversarial_controls.py`
   - 实测输出：
     ```
     test_configs_are_in_sync ... ok
     test_hud_clearance_and_margin ... ok
     test_partition_boundary_and_deadband ... ok
     test_square_aspect_ratio_and_floating_point_perturbations ... ok
     test_native_adversarial_harness_full_pass ... ok

     Ran 5 tests in 0.598s
     OK
     ```
   - 退出代码：0。

3. **官方现有回归套件实测记录**：
   - `test_controls.py`：5 项测试全部通过，耗时 0.337s，退出代码 0；
   - `test_xrcon.py`：17 项测试全部通过，耗时 21.083s，退出代码 0；
   - `test_lifecycle.mjs`：3 项测试全部通过，耗时 812ms，退出代码 0；
   - `test_e2e_verification.py --self-test`：127 项分层测试全部通过，退出代码 0。

---

## 2. 逻辑推导链 (Logic Chain)

1. **HUD 避让与下沿边界测试**：
   - 观察表明，摇杆下沿位于 $y_2 = 0.800000$，对应垂直像素为 $212.8$ 像素。
   - 游戏 HUD 上界位于 216 像素，摇杆距离 HUD 上边界留有 3.2 像素安全缓冲，底部留白高度为 53.2 像素。
   - 在静态边界测试中，采样点 $y = 0.800005$ 及 $y \ge 0.812030$ 均未被摇杆捕获，不会侵入 HUD 判定区域。
   - 在动态拖拽测试中，手指在摇杆内按下后向下拉至 $y = 0.98$（深入 HUD 区域），`Touch_StickVector` 内部执行 `amount = Q_min(length, 1)`，模拟量输出向量模长严格限幅在 1.0，不产生数值溢出或异常位移。

2. **左右分区严格互斥与抗漂移分析**：
   - 左侧操作控件的最大水平边界为 $x = 0.200708$，右侧视角层起点为 $x = 0.260000$。
   - 在 $x \in [0.200708, 0.260000)$ 之间存在宽度为 56.92 像素的无控件缓冲带。
   - 在 $x \in [0.259000, 0.261000]$ 的微步进采样中：
     - 当 $x < 0.260000$ 时，任何控件均不响应，手指不被分配；
     - 当 $x \ge 0.260000$ 时，事件由 `_look` 捕获。
   - 当手指在摇杆内按下后横穿滑至右半屏（$x = 0.80$），`Touch_Motion` 检查 `fingerID == touch.look_finger` 条件不满足，视角偏航角与俯仰角保持不变；反之视角手指滑向左侧亦不会触发移动。多指并发绑定保持互斥。

3. **正方形像素比抗浮点形变能力**：
   - 屏幕基准尺寸为 $960 \times 266$。
   - 摇杆像素宽高为 $154.27968 \times 154.28000$，绝对偏差仅为 $0.00032$ 像素，形变率约为 $2.07 \times 10^{-6}$。
   - 在引入 $\pm 10^{-5}$ 浮点微扰动时，像素偏差最大变化量为 $0.0096$ 像素，仍远低于 $0.02$ 像素标准阈值。单精度浮点运算不会引起可见的视觉形变。

4. **高频按键与 `break;` 状态机无锁分析**：
   - 触控按键列表遍历中引入 `break;` 后，每次 `event_down` 与 `event_up` 仅独占处理匹配到的顶层按键。
   - 在 50,000 次极速交替点击 `fire` 与 `jump` 的测试中，每个按键抬起时均匹配各自的 `fingerID`，分别下发 `+attack` / `-attack` 与 `+jump 73` / `-jump 73`，所有状态完全对称复位，无按键悬挂与事件丢失。
   - 在长按虚拟摇杆移动的同时连续 10,000 次触发大跳 `cjump`，`cjump` 产生的 `break;` 阻断不会向下影响已经分配给 `joy` 的 `touch.move_finger`，移动模拟量保持连续输出。
   - 当按键配置包含 `TOUCH_FL_PRECISION` 时，`event_down` 正常置位 `touch.precision = true`，`event_up` 在执行 `break;` 前正常复位 `touch.precision = false`，精度缩放切换准确。

---

## 3. 注意事项 (Caveats)

1. **原生引擎返回值规范**：
   在 Xash3D 原生实现中，`Touch_ButtonPress` 在处理 `touch_move` / `touch_joy` / `touch_look` 的 `event_up` 事件时，内部变量 `result` 保持默认 `false`，但因外部上层调用者 `Touch_ControlsEvent` 无论触控按键结果如何均统一返回 `true`，因此并不影响游戏主事件循环与状态复位。
2. **硬件点数约束**：
   词典笔触摸屏驱动 FocalTech `fts_ts` 原生支持 2 个硬件触控点（Slot 0 与 Slot 1）。测试方案覆盖双指及三指并发逻辑，在真机环境下以双指操作为主。

---

## 4. 结论 (Conclusion)

1. 对抗测试证实：虚拟摇杆与各操作按键的几何排版严格满足 $y_2 \times 266 \le 216$ 的 HUD 避让规范，且左侧移动与右侧视角区之间具备 56.92 像素的硬件物理安全间隔，不存在误触与跨界冲突。
2. 50,000 次高频按键交替并发与 10,000 次摇杆连续移动下大跳压测证实：`Touch_ButtonPress` 中新增的 `break;` 逻辑彻底阻断了按键穿透至底层的 `_look` 区域，消除了视角抖动，且按键的按下与释放状态对称匹配，无状态丢失与挂起。
3. 全套回归测试与对抗测试通过率均为 100%。
4. 综合评审结论为：**APPROVE**。

---

## 5. 验证方法 (Verification Method)

在目标工作目录 `/Volumes/500GB/Ydpen/halflife_app` 下执行以下命令进行独立复核验证：

1. **执行对抗性压测套件**：
   ```bash
   python3 -m unittest -v halflife_app/tools/test_adversarial_controls.py
   ```
2. **执行原生 C 触控对抗压测**：
   ```bash
   clang -O3 -Wall -Wextra tools/adversarial_touch_harness.c -o tools/adversarial_touch_harness
   ./tools/adversarial_touch_harness
   ```
3. **执行全套基准回归套件**：
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
4. **失效条件**：
   若任何测试套件返回非 0 退出代码，或 `adversarial_touch_harness` 出现断言中断，本裁决自动失效。
