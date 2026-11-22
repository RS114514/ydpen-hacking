# Forensic Audit Report & Handoff — M1: 触控系统虚拟摇杆与防抢占重构

**Work Product**: Milestone 1 (M1: 触控系统虚拟摇杆与防抢占重构)
**Profile**: General Project (Integrity Mode: development)
**Verdict**: CLEAN

---

### Phase Results
- **源码修改真实性审计 (`in_touch.c`)**: PASS — `Touch_ButtonPress` 在 `event_down` 与 `event_up` 中真实添加 `break;`，无空操作宏定义或伪造分支。
- **配置文件与材质资产真实性审计 (`touch.cfg` & textures)**: PASS — `touch_addbutton "joy" ... 2048` 正确配置，贴图 `stick_ring.png` 与 `stick_thumb.png` 为真实有效的 128x128 PNG 图像文件。
- **测试代码真实性与断言防作弊审计 (`test_controls.py`)**: PASS — 无无条件 `self.assertTrue(True)`，完整保留正方形比例校验、HUD 避让校验、按键重叠冲突检测与屏幕分区隔离断言。
- **运行时与测试真实执行审计**: PASS — 本地单元测试、XRCON 回归、生命周期测试及 127 项 E2E 离线自检全部实测通过，退出码均为 0。
- **通用欺骗模式排查 (Facade / Hardcoded / Fabricated)**: PASS — 无硬编码测试返回值，无空桩函数或预置伪造日志。

---

## 1. 观察记录 (Observation)

### 1.1 源码 `in_touch.c` 实际代码核对
文件绝对路径：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`

1. 在 `type == event_down` 分支中（行 1945 - 1996）：
```c
if( button->type == touch_command )
{
    char command[256];
    ...
    Touch_AddButtonCommand( button, command );
    if( FBitSet( button->flags, TOUCH_FL_PRECISION ))
        touch.precision = true;
    result = true;
    break;
}
else if( button->type == touch_wheel )
{
    ...
    if( FBitSet( button->flags, TOUCH_FL_PRECISION ))
        touch.precision = true;
    result = true;
    break;
}
```

2. 在 `type == event_up` 分支中（行 2100 - 2136）：
```c
if( button->type == touch_command )
{
    if( button->command[0] == '+' && !FBitSet( button->flags, TOUCH_FL_COMMAND_LATCH ))
    {
        char command[256];
        Q_snprintf( command, sizeof( command ), "-%s\n", &button->command[1] );
        Touch_AddButtonCommand( button, command );
    }
    if( FBitSet( button->flags, TOUCH_FL_PRECISION ))
        touch.precision = false;
    result = true;
    break;
}
else if( button->type == touch_wheel )
{
    ...
    touch.wheel_finger = -1;
    result = true;
    break;
}
```

核查确认：倒序遍历结构 `for( touch_button_t *button = list->last; button; button = button->prev )` 中，操作按键和滚轮按键处理完成后均有实际的 `break;` 语句跳出循环，不存在任何宏劫持或伪条件旁路。

### 1.2 配置文件与材质文件实际内容核对
1. 配置文件路径：
   - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`（行 30）
   - `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/touch.cfg`（行 30）
   内容完全一致：
   ```
   touch_addbutton "joy" "gfx/touch/stick_ring" "_joy" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 2048 0
   ```
   参数解析与几何检验：
   - 水平像素跨度：$(0.200708 - 0.040000) \times 960 = 154.27968$ 像素
   - 垂直像素跨度：$(0.800000 - 0.220000) \times 266 = 154.28000$ 像素
   - 像素差值：$|154.27968 - 154.28000| = 0.00032 < 0.02$ 像素，严格符合正方形像素比
   - 底部 HUD 避让：$y_2 \times 266 = 0.800000 \times 266 = 212.8 \le 216$ 像素
   - 摇杆标志位：$2048 = 1 \ll 11 = \text{TOUCH\_FL\_STICK}$

2. 贴图资产路径与文件属性：
   - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/gfx/touch/stick_ring.png`: 2673 字节，PNG 128x128, 8-bit colormap
   - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/gfx/touch/stick_thumb.png`: 1784 字节，PNG 128x128, 8-bit colormap
   - `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/gfx/touch/stick_ring.png`: 2673 字节，PNG 128x128, 8-bit colormap
   - `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/gfx/touch/stick_thumb.png`: 1784 字节，PNG 128x128, 8-bit colormap
   两处目录均真实存在有效贴图文件，引擎源码 `in_touch.c:171` 的默认 CVar 定义直接指向 `gfx/touch/stick_thumb`。

### 1.3 测试文件 `tools/test_controls.py` 代码完整性核对
查看 `/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py`：
- 第 58-61 行：`expected_actions` 集合中的动作已准确更新为 `'_joy'`，并保留了全部其余核心动作（`+jump`、`+attack`、`+attack2`、`+reload`、`+use`、`_look`、`+duck`、`+cjump`、`save`、`load`）。
- 第 67 行：严格保留 `self.assertAlmostEqual((x2 - x1) * 960, (y2 - y1) * 266, delta=0.02, msg=row[1])`。
- 第 68 行：严格保留 `self.assertLessEqual(y2 * 266, 216, row[1])`。
- 第 74-75 行：严格保留双重循环几何矩形重叠检测 `self.assertFalse(overlap, f'{first[1]} overlaps {second[1]}')`。
- 第 84-88 行：`left_buttons` 包含 `'joy'`，并严格断言 `self.assertLessEqual(x2, 0.26)`。
- 第 93 行：严格断言视角区域 `self.assertGreaterEqual(float(look_row[4]), 0.26)`。
- 第 97-100 行：严格断言倒序优先级 `self.assertGreater(action_idx, look_idx)`。
全文件无任何形式的断言降级或欺骗性占位语句。

### 1.4 审计师亲自实测命令输出
1. **控件测试**：
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   ```
   实际输出：
   ```
   test_buttons_are_square_in_pixels_and_leave_hud_clear (test_controls.ControlsPackageTest) ... ok
   test_multitouch_screen_partition_and_concurrency_isolation (test_controls.ControlsPackageTest) ... ok
   test_pack_ships_all_referenced_config_files (test_controls.ControlsPackageTest) ... ok
   test_packed_runtime_keeps_touch_enabled (test_controls.ControlsPackageTest) ... ok
   test_persistent_configs_do_not_start_a_second_map (test_controls.ControlsPackageTest) ... ok

   ----------------------------------------------------------------------
   Ran 5 tests in 0.211s

   OK
   ```

2. **XRCON 宿主机测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   ```
   实际输出：17 项测试全部执行通过（`Ran 17 tests in 19.572s, OK`）。

3. **生命周期测试**：
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   实际输出：3 项测试全部执行通过（`pass 3, fail 0, duration_ms 816.215875`）。

4. **127 项 E2E 离线自检**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   实际输出：127 个测试用例全部执行通过（`Tier 1: 55/55, Tier 2: 55/55, Tier 3: 12/12, Tier 4: 5/5, 总计通过: 127, 退出码 0`）。

5. **AMR 打包编译**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   ```
   实际输出：生成 126,075 字节应用包，自动部署全部配置文件、修复 NPC 姿态后的 `hl.so` 以及虚拟摇杆贴图资产，安装结果 `ret: 0`。

---

## 2. 逻辑推导链 (Logic Chain)

1. **防抢占真实有效性**：
   在 `in_touch.c` 的倒序事件分发遍历中，排在链表末端的前景操作按钮先被评估。添加 `break;` 后，一旦前景按钮命中，遍历立即停止，事件不会继续传递到处于链表前端的全局视角 `_look` 控件。因此，右侧点击操作按钮不再影响视角转动，消除了触控抢占。
2. **虚拟摇杆真实有效性**：
   `touch.cfg` 中的 `_joy` 配合 `2048`（`TOUCH_FL_STICK`）直接触发引擎内的 `Touch_StickVector` 模拟量输入计算。通过几何计算，摇杆按钮在 960x266 视口下的像素尺寸为 154.28x154.28，宽高差小于 0.00032 像素，同时其底部边界固定在 212.8 像素，严格避让了底部 50 像素的 HUD 区域，且完全位于左侧 0.26 分区内。
3. **测试可信度**：
   `test_controls.py` 对打包产物进行了端到端生成与静态解析，所包含的正方形比例、HUD 避让、分区隔离和优先级断言均保持数学严格性，未做任何宽松化改动，仅将对应键名与动作名称由 `_dpad` 调整为 `_joy`。测试通过是真实算法校验的结果。

---

## 3. 注意事项 (Caveats)

- 物理设备屏幕在最边缘处可能存在触控死区，配置中已保留 $x_1 = 0.04$ 的左侧内边距作为安全余量。
- 真机触控芯片最大并发硬件槽位为 2 点并发，自动化测试用例基于此硬件特性设计了双指与模拟三指并发逻辑。

---

## 4. 结论 (Conclusion)

对 Milestone 1 的源码改动、配置文件、贴图资源、测试用例及执行链路的真实性审计未发现任何违规行为、作弊代码或虚假测试。
各项功能实现完整、真实且符合规约要求。

**审计结论：CLEAN**

---

## 5. 独立复核验证方法 (Verification Method)

执行以下命令即可复现全部审计核验：
```bash
# 1. 验证控件测试套件断言
PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls

# 2. 验证 XRCON 通信套件
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py

# 3. 验证生命周期逻辑
node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs

# 4. 验证 E2E 全链路自检套件
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
```
失效条件：若上述任意命令出现失败断言、或 `touch.cfg` 几何计算超出正方形容差，则本报告结论失效。
