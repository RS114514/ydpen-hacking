# 对抗性压力验证与实证报告 — M1: 触控系统虚拟摇杆与防抢占重构

**对抗裁决**: `APPROVE`

---

## 1. 观察记录 (Observation)

### 1.1 源码实现与事件分发链路观察
1. **防穿透阻断逻辑 (`upstream/engine/client/input/in_touch.c`)**
   - 文件位置：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
   - `Touch_ButtonPress` 函数遍历方式：`for( touch_button_t *button = list->last; button; button = button->prev )`，从链表尾部向头部倒序遍历。
   - 在 `type == event_down` 分支：
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
         result = true;
         break;  // 阻止滚轮操作穿透
     }
     ```
   - 在 `type == event_up` 分支：
     ```c
     if( button->type == touch_command )
     {
         ...
         result = true;
         break;
     }
     else if( button->type == touch_wheel )
     {
         ...
         result = true;
         break;
     }
     ```

2. **连续比例模拟量计算 (`in_touch.c` 行 1474-1496)**
   ```c
   static void Touch_StickVector( touch_button_t *button, float x, float y, float *side, float *forward )
   {
       float half_width = Q_max( ( button->x2 - button->x1 ) * 0.5f, 0.0001f );
       float half_height = Q_max( ( button->y2 - button->y1 ) * 0.5f, 0.0001f );
       float center_x = ( button->x1 + button->x2 ) * 0.5f;
       float center_y = ( button->y1 + button->y2 ) * 0.5f;
       float sx = ( x - center_x ) / half_width;
       float sy = ( y - center_y ) / half_height;
       float length = sqrtf( sx * sx + sy * sy );

       button->stick_x = length > 1 ? sx / length : sx;
       button->stick_y = length > 1 ? sy / length : sy;
       if( length == 0 )
       {
           *side = *forward = 0;
           return;
       }

       float amount = Q_min( length, 1 );
       *side = sx / length * amount;
       *forward = -sy / length * amount;
   }
   ```
   对比原 `touch_dpad`（行 2051-2055）：
   ```c
   touch.forward = round( touch.forward );
   touch.side = round( touch.side );
   ```

3. **配置文件与几何参数 (`assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg`)**
   - 摇杆定义：
     ```
     touch_addbutton "joy" "gfx/touch/stick_ring" "_joy" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 2048 0
     ```
   - 视角层定义：
     ```
     touch_addbutton "look" "" "_look" 0.260000 0.000000 1.000000 1.000000 255 255 255 0 0 0
     ```
   - 像素比例计算（960x266）：
     - 宽度：$(0.200708 - 0.040000) \times 960 = 154.27968$ 像素
     - 高度：$(0.800000 - 0.220000) \times 266 = 154.28000$ 像素
     - 宽高差：$0.00032$ 像素，正方形比例一致
     - 空间分布：摇杆 $x_2 = 0.200708 \le 0.26$，视角区 $x_1 = 0.260000 \ge 0.26$，左右物理隔离
     - 底部空间：$y_2 \times 266 = 212.8 \le 216$ 像素，预留 53.2 像素供 HUD 显示

### 1.2 对抗性测试套件执行记录 (`tools/test_adversarial_m1.py`)
执行指令：
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_m1.py -v
```
实测输出：
```
test_both_configs_identical_and_valid (__main__.TestLayoutGeometricConsistency) ... ok
test_button_order_priority (__main__.TestLayoutGeometricConsistency) ... ok
test_joystick_geometry_and_hud_clearance (__main__.TestLayoutGeometricConsistency) ... ok
test_concurrent_move_and_rapid_fire (__main__.TestLookPreemptionAndMultiTouchConcurrency) ... ok
test_fix_validation_with_break (__main__.TestLookPreemptionAndMultiTouchConcurrency) ... ok
test_fuzzing_random_multitouch_stress (__main__.TestLookPreemptionAndMultiTouchConcurrency) ... ok
test_held_fire_with_concurrent_look_pan (__main__.TestLookPreemptionAndMultiTouchConcurrency) ... ok
test_vulnerability_reproduction_without_break (__main__.TestLookPreemptionAndMultiTouchConcurrency) ... ok
test_wheel_weapon_switch_does_not_hijack_look (__main__.TestLookPreemptionAndMultiTouchConcurrency) ... ok
test_deadzone_elimination_at_small_displacements (__main__.TestVirtualStickDeadzoneAndContinuity) ... ok
test_high_density_continuity_sweep (__main__.TestVirtualStickDeadzoneAndContinuity) ... ok
test_isotropic_angular_fidelity (__main__.TestVirtualStickDeadzoneAndContinuity) ... ok
test_overdeflection_clamping (__main__.TestVirtualStickDeadzoneAndContinuity) ... ok

----------------------------------------------------------------------
Ran 13 tests in 0.031s

OK
```

### 1.3 现有官方回归套件执行记录
1. **控件配置回归测试**
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   ```
   结果：`Ran 5 tests in 0.492s, OK`。
2. **宿主机 XRCON 通信回归测试**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   ```
   结果：`Ran 17 tests in 30.503s, OK`。
3. **生命周期与退出保存测试**
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   结果：`tests 3, pass 3, fail 0`。
4. **端到端测试套件全量自检**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   结果：`总用例数: 127 | 通过: 127 | 失败: 0 | 超时: 0 (100.0%)`。
5. **应用包构建与真机推送**
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   ```
   结果：成功生成 `dist/half-life-1.0.0.amr`（123 KB），并向 6 代真机完成配置与贴图部署，返回码 0。

---

## 2. 逻辑推导链 (Logic Chain)

1. **死区消除与连续模拟量输出支持**：
   - 基于观察 1.1 中的 `Touch_StickVector` 计算公式，当输入位移处于单位圆内部（$length \le 1.0$）时，`amount = length`，使得 `*side = sx` 且 `*forward = -sy`。
   - 在测试用例 `test_deadzone_elimination_at_small_displacements` 中，对微小位移 $\delta \in [0.01, 0.499]$ 进行输入测试。原 `touch_dpad` 由于执行 `round()` 计算，位移全部被截断为 0.0；而虚拟摇杆模型输出与位移严格一致，输出非零连续模拟量。
   - 在 `test_high_density_continuity_sweep` 的 1000 阶细粒度步进扫描中，输出一阶导数恒为 1.0，证实无阶跃跳变。
   - 在 `test_isotropic_angular_fidelity` 中，360 度圆周采样验证了输出向量的方向角与输入方向角误差小于 $10^{-4}$ 弧度，证实各向同性良好。
   - 逻辑结论：虚拟摇杆模型彻底消除了原十字键 50% 的死区，提供了完整的连续比例模拟量控制。

2. **按键事件阻断与视角防抢占支持**：
   - 基于观察 1.1，按键链表为倒序遍历。`look` 在配置文件中排在最前（位于链表首部），而操作按键（`fire`, `jump`, `use`, `reload`）在配置文件中排在后方（位于链表尾部）。
   - 在测试用例 `test_vulnerability_reproduction_without_break` 中证实，若无 `break;`，倒序扫描在匹配到操作按键后仍会继续前进，最终匹配到覆盖右侧全屏的 `look`，导致操作手指被记录到 `touch.look_finger`，手指轻微颤动直接导致视角偏转（$\Delta yaw \ne 0, \Delta pitch \ne 0$）。
   - 在 `test_fix_validation_with_break` 中证实，加入 `break;` 后，操作按键被触发后立即退出循环，`touch.look_finger` 维持原状（-1），手指微动不再引起视角抖动。
   - 在 `test_held_fire_with_concurrent_look_pan` 中模拟了 FPS 常见操作：Slot 0 按住开火按键连射，Slot 1 在视角区域滑动。在无 break 时 Slot 0 占用了 `look_finger` 导致 Slot 1 无法调整视角；加入 break 后，Slot 0 仅激活开火命令，Slot 1 正常获得 `look_finger` 并平滑转动视角。
   - 在 `test_concurrent_move_and_rapid_fire` 中模拟左侧按住摇杆移动的同时右侧 100 次高频点击开火，摇杆位移向量持续平稳输出，无任何重置或中断。
   - 在 `test_fuzzing_random_multitouch_stress` 的 1000 步随机压力测试中，`move_finger` 与 `look_finger` 从未发生重叠冲突，未出现任何数学异常。
   - 逻辑结论：`Touch_ButtonPress` 的 `break;` 逻辑有效隔离了按键与视角区域，消除了操作按键对视角的抢占和抖动干扰。

3. **布局约束与物理隔离支持**：
   - 基于观察 1.1，摇杆水平最大范围为 0.200708，小于左侧分区上限 0.26；视角区域起始于 0.26，两区域在空间上互不交叉。
   - 摇杆底部边缘为 212.8 像素，小于 216 像素阈值，确保了底部 HUD 的完整显示。
   - 逻辑结论：布局配置符合物理屏分区与 HUD 避让规范。

---

## 3. 注意事项 (Caveats)

1. **真机物理多指硬件特性**：
   词典笔配备 FocalTech `fts_ts` 触控 IC，驱动层最大支持 2 点触控（Slot 0 与 Slot 1）。对抗测试构建于双槽位并发模型，三指以上操作受限于硬件无法同时上报。
2. **引擎交叉编译依赖**：
   `in_touch.c` 的修改针对 Xash3D 引擎源码。实际发布运行依赖于内置支持 `_joy` 与 `TOUCH_FL_STICK` 的引擎动态库。

---

## 4. 结论 (Conclusion)

- **对抗裁决**: `APPROVE`
- **评估结果**:
  1. 虚拟摇杆替换消除了原十字键在小位移（$|\delta| < 0.5$）下的截断死区，输出比例连续模拟量。
  2. `Touch_ButtonPress` 在 `touch_command` 与 `touch_wheel` 分支添加的 `break;` 正确阻断了事件下渗，解决了右侧操作按键导致的视角抢占与准星抖动问题，确保了按住开火连射与另一手指滑动视角的并发操作。
  3. 触控配置与贴图资源满足正方形像素比例、左侧分区物理隔离及底部 HUD 避让约束。
  4. 官方全套回归测试（127 项自检、XRCON 通信、生命周期、控件校验）及独立对抗测试（13 项用例）全部通过。

---

## 5. 验证方法 (Verification Method)

可使用以下命令独立复现全部实证与对抗验证：

1. **运行对抗性压力验证套件**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_m1.py -v
   ```
   断言条件：13 项测试全部输出 `ok`，退出码为 0。

2. **运行控件与几何布局回归测试**：
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   ```
   断言条件：5 项测试全部通过，退出码为 0。

3. **运行通信与生命周期回归测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   断言条件：XRCON 17 项测试通过，生命周期 3 项测试通过。

4. **运行全量端到端自动化测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   断言条件：127 项用例 100% 通过，退出码为 0。
