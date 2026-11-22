# Handoff Report — 半条命触控控制系统与按键/摇杆架构勘测

## 1. 观察记录 (Observation)

1. **`Touch_ButtonPress` 实现代码**
   - 文件路径：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
   - 行号：1914 - 2150
   - 源码片段（行 1921 - 1967 及行 2057 - 2087）：
     ```c
     // run from end(front) to start(back)
     for( touch_button_t *button = list->last; button; button = button->prev )
     {
         if( !Touch_IsVisible( button ))
             continue;

         if( type == event_down )
         {
             if( x < button->x1 || x > button->x2 || y < button->y1 || y > button->y2 )
                 continue;
             ...
             button->finger = fingerID;

             if( button->type == touch_command )
             {
                 ...
                 Touch_AddButtonCommand( button, command );
                 result = true;
             }
             ...
             else if( button->type == touch_look )
             {
                 if( touch.look_finger !=-1 )
                 {
                     button->finger = touch.look_finger;
                     continue;
                 }
                 result = true;
                 ...
                 touch.look_finger = fingerID;
             }
         }
         ...
     }
     ```
   - 现象：在 `button->type == touch_command` 匹配并执行命令后，没有包含 `break;` 语句。

2. **`touch.cfg` 按键注册顺序与几何范围**
   - 文件路径：`/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`
   - 全局滑动视角层注册（行 26）：
     ```
     touch_addbutton "look" "" "_look" 0.260000 0.000000 1.000000 1.000000 255 255 255 0 0 0
     ```
   - 现有十字键移动注册（行 30）：
     ```
     touch_addbutton "dpad" "gfx/touch/dpad" "_dpad" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 0 0
     ```
   - 右侧操作按键注册（行 47 - 55）：
     ```
     touch_addbutton "reload" "gfx/touch/reload" "+reload" 0.650000 0.230000 0.712500 0.455564 255 255 255 190 0 0
     touch_addbutton "alt_fire" "gfx/touch/alt_fire" "+attack2" 0.650000 0.530000 0.712500 0.755564 255 255 255 190 0 0
     touch_addbutton "fire" "gfx/touch/fire" "+attack" 0.740000 0.380000 0.823333 0.680752 255 255 255 220 0 0
     touch_addbutton "jump" "gfx/touch/jump" "+jump 73" 0.860000 0.120000 0.930833 0.375639 255 255 255 220 0 0
     touch_addbutton "use" "gfx/touch/use" "+use" 0.860000 0.500000 0.930833 0.755639 255 255 255 210 0 0
     ```

3. **现有 D-Pad 计算逻辑与量化截断**
   - 文件路径：`in_touch.c` 行 2045 - 2053 及行 1853 - 1867
   - 源码片段：
     ```c
     touch.forward = (( b->y2 + b->y1 ) - y * 2 ) / ( b->y2 - b->y1 );
     touch.side = ( x * 2 - ( b->x2 + b->x1 )) / ( b->x2 - b->x1 );
     else if( b->type == touch_dpad )
     {
         touch.forward = round( touch.forward * touch_dpad_radius.value );
         touch.side = round( touch.side * touch_dpad_radius.value );
     }
     ```
   - 现象：`round()` 运算在输入相对位移低于 0.5 时输出始终为 0，高于等于 0.5 时突变为 1.0 或 -1.0。

4. **内置比例摇杆实现**
   - 文件路径：`in_touch.c` 行 1474 - 1496 及 `upstream/engine/mobility_int.h` 行 55
   - 标志常量：`TOUCH_FL_STICK = (1U << 11)`（即十进制 2048）
   - 核心函数 `Touch_StickVector`：
     ```c
     float sx = ( x - center_x ) / half_width;
     float sy = ( y - center_y ) / half_height;
     float length = sqrtf( sx * sx + sy * sy );
     float amount = Q_min( length, 1.0f );
     *side = sx / length * amount;
     *forward = -sy / length * amount;
     ```
   - 预设参考：`dist_assets/valve/extras.pk3` 内的 `touch_presets/analog.cfg`，使用配置 `touch_addbutton "move" "gfx/touch/stick_ring" "_joy" ... 2048 1`。

5. **本地测试与设备端注入工具链**
   - `halflife_app/tools/test_controls.py` 执行命令与结果：
     `PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest discover -s /Volumes/500GB/Ydpen/halflife_app/tools -p "test_controls.py"`
     输出：`Ran 5 tests in 1.236s, OK`。
   - `halflife_app/tools/test_xrcon.py` 执行命令与结果：
     `python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py`
     输出：`Ran 17 tests in 25.350s, OK`。
   - `halflife_app/tools/test_lifecycle.mjs` 执行命令与结果：
     `node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs`
     输出：`pass 3, fail 0`。
   - 底层触控注入程序：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/touch_probe.c`，直接基于 Linux input subsystem 向 `/dev/input/event1` 写入 `ABS_MT_SLOT`、`ABS_MT_TRACKING_ID`、`ABS_MT_POSITION_X`（$y + 107$）、`ABS_MT_POSITION_Y`（$959 - x$）与 `SYN_REPORT`。

---

## 2. 逻辑推导链 (Logic Chain)

1. **视角区域被右侧按钮抢占的成因**：
   - 根据观察项 1，`Touch_ButtonPress` 从链表末尾（`list->last`）向前遍历；
   - 根据观察项 2，`look` 在第 26 行注册，处于链表最前端；`fire` 等操作按钮在第 47 - 55 行注册，处于链表靠后位置；
   - 当点击右侧按钮时，虽然由于倒序遍历首先匹配到了 `fire`，但由于没有 `break` 阻断，循环继续向前执行；
   - 处于底层的 `look` 覆盖整个右半屏（$x \in [0.26, 1.00], y \in [0.00, 1.00]$），坐标判定必然成立；
   - 因而 `look` 也会被触发，并将该点击手指的 `fingerID` 赋值给 `touch.look_finger`；
   - 手指点击开火键时产生的细微滑动量，被 `Touch_Motion` 误认为是视角滑动，导致准星抖动；若开火键处于按住状态，其它手指滑动视角的输入因 `touch.look_finger != -1` 被直接忽略。

2. **移动控制死区过大与尺寸过小的成因**：
   - 根据观察项 3，现有移动使用的是 `_dpad`（十字键），计算公式使用 `round()` 进行离散化四舍五入；
   - 当手指偏移处于 $[0, 0.5 \times \text{半径})$ 时，输出数值恒为 0，形成了半径占比达 50% 的死区；
   - 现有按键尺寸为 $154.28 \times 154.28$ 像素，在词典笔紧凑屏幕上，中心半径 38.5 像素均为无效触发区，导致手指滑动时极易因稍微偏向中心而失去移动响应，且无法进行微速移动。

3. **虚拟摇杆重构的实现通路**：
   - 根据观察项 4，引擎本身通过 `_joy` 搭配 `TOUCH_FL_STICK` (2048) 原生提供了连续比例摇杆支持；
   - `Touch_StickVector` 在无死区截断的情况下，直接输出归一化矢量；
   - 矢量通过 `Touch_GetMove` 传递至客户端的 `FWGSInput::IN_Move`，分别乘以 `cl_forwardspeed` 与 `cl_sidespeed`，转换为 `cmd->forwardmove` 与 `cmd->sidemove` 的连续线性模拟量，同时保持大跳宏等按键功能完整运作。

4. **多指触控独占隔离的达成逻辑**：
   - 在 `Touch_ButtonPress` 的 `event_down` 处理中，当按钮为指令按键并命中时，立即执行 `break`；
   - 这样前景按键将独占当前手指的 `fingerID`，绝不会穿透给底层的 `look` 视角区域；
   - 在 `event_up` 处理中，匹配并释放对应按键后同样执行 `break`，防止同 ID 意外释放底层组件；
   - 结合左右分区（左侧移动与身法 $x \le 0.26$，右侧视角与操作 $x \ge 0.26$），Slot 0 与 Slot 1 在硬件与逻辑上完全解耦。

---

## 3. 注意事项 (Caveats)

1. **测试断言同步更新**：
   `halflife_app/tools/test_controls.py` 第 60 行目前硬编码断言了 `expected_actions` 包含 `'_dpad'`，第 84 行断言了 `left_buttons = ('dpad', 'crouch', 'cjump')`。若后续实施代理将 `dpad` 改名为 `joy` 并将指令类型从 `_dpad` 改为 `_joy`，必须同步修改测试文件中的断言集合，否则 `test_controls.py` 将断言失败。
2. **构建产物隔离**：
   根据 `TEST_INFRA.md` 规约，AMR 安装包内的 `libs/arm64/` 严禁打包 `libwl_center.so`（仅允许 `libjsapi_hl.so`），`libwl_center.so` 必须独立部署至 `/userdisk/halflife/` 供子进程 `LD_PRELOAD` 加载。

---

## 4. 调研结论 (Conclusion)

1. **穿透冲突解决结论**：
   在 `in_touch.c` 的 `Touch_ButtonPress` 函数中，对匹配成功的 `touch_command` 和 `touch_wheel` 分支补充 `break`，可彻底阻止右侧操作按钮向底层 `_look` 渗透，消除准星抖动与视角抢占。
2. **虚拟摇杆重构结论**：
   直接利用引擎内置成熟的 `_joy` 与 `TOUCH_FL_STICK`（属性值 2048），在 `touch.cfg` 中将 `dpad` 替换为虚拟摇杆；摇杆贴图使用 `gfx/touch/stick_ring`，摇杆帽由引擎自动加载 `gfx/touch/stick_thumb` 进行连续位移渲染。这样即可消除 50% 量化死区，实现连续比例的平滑移动控制。
3. **坐标配置结论**：
   新摇杆保持正方形像素尺寸，坐标范围建议保持在 $x \in [0.035, 0.208], y \in [0.200, 0.825]$，严格满足 $x_2 \le 0.26$（左侧分区）以及 $y_2 \times 266 \le 216$（HUD 避让）规范。

---

## 5. 验证方法 (Verification Method)

1. **静态与配置验证**：
   运行本地控件配置检查脚本：
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest discover -s /Volumes/500GB/Ydpen/halflife_app/tools -p "test_controls.py"
   ```
   预期结果：测试通过，无重叠、无宽高比偏差、无 HUD 侵占。

2. **宿主机 XRCON 与生命周期测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   预期结果：全部返回 0，无任何失败。

3. **真机双指并发触控测试**：
   在连接设备 `9DA2200007506350` 的情况下，执行端到端测试套件中的并发与按键测试：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --serial 9DA2200007506350
   ```
   重点观测用例：
   - `TC-E2E-T1-06-01`：双指并发——边移动边滑动视角；
   - `TC-E2E-T3-01`：移动中滑屏转视角（双指并发）；
   - `TC-E2E-T3-05`：持续开火中呼出黑橙暂停菜单。
