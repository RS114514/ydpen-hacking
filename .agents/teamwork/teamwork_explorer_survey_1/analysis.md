# 有道词典笔 6 代 Half-Life 触控控制系统与按键/摇杆架构勘测分析报告

## 1. 架构总览与事件分发调用链路

### 1.1 硬件与系统拓扑
- **硬件平台**：网易有道词典笔 6 代（型号 YDPX6-2，SoC 为瑞芯微 RK3562，操作系统为 PenOS 4.3.5 / Linux 5.10.160 aarch64）。
- **物理屏幕规格**：480×960（竖屏），横屏游戏画面使用 960×266 视口渲染，垂直居中偏移 107 像素（上下各保留 $(480 - 266) / 2 = 107$ 像素黑边）。
- **触控硬件与驱动**：FocalTech `fts_ts` 电容触摸屏，输入设备节点为 `/dev/input/event1`，遵循 Linux Multi-touch Type B 协议，硬件原生支持双触控槽位（Slot 0 与 Slot 1）。

### 1.2 触控事件完整调用拓扑
```
硬件电容屏 (/dev/input/event1)
    │
    ▼ Linux Input Type B 协议 (ABS_MT_SLOT, ABS_MT_TRACKING_ID, ABS_MT_POSITION_X, ABS_MT_POSITION_Y)
Weston Wayland 合成器 (wayland-0)
    │
    ▼ wl_touch 监听器事件 (down, motion, up, frame)
libwl_center.so (native/wl_center.c:88-153)
    │  - 拦截 wl_touch_listener
    │  - 坐标变换：adj_y = y - 107，约束至 [0, 265]
    ▼
SDL2 Wayland 后端 (upstream/SDL-2.30.12)
    │  - 生成 SDL_FINGERDOWN, SDL_FINGERMOTION, SDL_FINGERUP
    │  - 坐标归一化至 [0.0, 1.0]
    ▼
Xash3D 引擎事件入口 IN_TouchEvent (upstream/engine/client/input/in_touch.c:2237)
    │  - 视口裁剪与坐标变换
    ▼
Touch_ControlsEvent (in_touch.c:2217)
    ├── Touch_ButtonPress (in_touch.c:1914)  [处理 event_down 与 event_up]
    └── Touch_Motion (in_touch.c:1802)       [处理 event_motion 移动增量]
```

---

## 2. Touch_ButtonPress 实现与穿透缺陷分析

### 2.1 源码位置与函数签名
- **源文件**：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
- **函数名**：`Touch_ButtonPress`（行 1914 - 2150）
- **签名**：
  ```c
  static qboolean Touch_ButtonPress( touchbuttonlist_t *list, touchEventType type, int fingerID, float x, float y )
  ```

### 2.2 循环遍历机制与缺陷机理
在 `in_touch.c` 第 1921 - 1923 行：
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
            if( touch.look_finger != -1 )
            {
                button->finger = touch.look_finger;
                continue;
            }
            result = true;
            touch.look_finger = fingerID;
        }
    }
}
```

#### 穿透与抢占产生的直接原因：
1. **按键注册顺序与 Z 序链表结构**：
   在 `assets/valve/touch.cfg` 中：
   - 第 26 行首先注册全局滑动视角层：
     ```
     touch_addbutton "look" "" "_look" 0.260000 0.000000 1.000000 1.000000 255 255 255 0 0 0
     ```
     该按键被插入到 `touch.list_user` 的首部（底层）。
   - 随后的第 46 - 55 行注册核心右侧操作按键（`reload`、`alt_fire`、`fire`、`jump`、`use`），插入到链表尾部（顶层）。
2. **缺乏 break 导致穿透**：
   当用户在右侧点击操作按键（例如开火键 `fire`，坐标范围 $x \in [0.74, 0.82], y \in [0.38, 0.68]$）时：
   - 倒序循环首先匹配到位于表尾的 `fire` 按键，将其 `button->finger` 置为 `fingerID`，并向命令缓冲区发送 `+attack`。
   - **由于循环体在处理完前景指令按键后没有执行 `break`**，循环继续向前遍历。
   - 由于 `look` 按键的坐标范围覆盖整个右半屏（$x \in [0.26, 1.00], y \in [0.00, 1.00]$），点击坐标同样满足 `look` 按键的判定范围。
   - 当循环到达 `look` 节点时：
     - 若此时没有其他手指正在控制视角（`touch.look_finger == -1`），该 `fingerID` 会被再次赋给 `touch.look_finger`；
     - 结果导致同一个 `fingerID` 同时隶属于 `fire` 按键与 `look` 视角区域。
3. **并发破坏与乱跳表现**：
   - **视角跳动抖动**：手指在点击 `fire`/`jump`/`use` 瞬间产生的轻微物理颤动（$\Delta x, \Delta y$），会在 `Touch_Motion`（第 1875 - 1911 行）中被当成视角旋转增量，造成准星剧烈晃动；
   - **右侧滑动失效**：若右手拇指长按 `fire` 连射，由于 `touch.look_finger` 已被开火手指占据，另一根手指试图滑动右侧屏幕转动视角时，由于 `touch.look_finger != -1`，滑动视角请求被直接丢弃；
   - **按键释放连锁异常**：在 `type == event_up` 处理中（第 2089 - 2145 行），同一个 `fingerID` 的释放会同时清除 `fire` 状态并重置 `touch.look_finger = -1`，导致视角跟踪状态机异常。

---

## 3. touch.cfg 当前按键布局与几何配置深度核验

### 3.1 配置文件基准参数
- **源文件路径**：
  - `/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg`
  - `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/touch.cfg`
- **显示参数与视口**：
  - `touch_aspectratio 0.2770833333`（$266 / 960 \approx 0.27708333$）
  - `touch_pitch 90`，`touch_yaw 120`
  - `touch_forwardzone 0.16`，`touch_sidezone 0.055`
  - `touch_dpad_radius 1.0`

### 3.2 控件坐标与尺寸矩阵表
画布基准：宽 960 像素，高 266 像素。

| 控件名称 | 功能类型 | 纹理路径 | 归一化坐标 ($x_1, y_1, x_2, y_2$) | 像素尺寸 ($W \times H$) | 宽高比 | 属性标志 | 说明 |
|---|---|---|---|---|---|---|---|
| `look` | `_look` | *(无)* | `0.260000 0.000000 1.000000 1.000000` | $710.4 \times 266$ | 2.67 | 0 | 右半屏全域滑动视角 |
| `dpad` | `_dpad` | `gfx/touch/dpad` | `0.040000 0.220000 0.200708 0.800000` | $154.28 \times 154.28$ | 1.00 | 0 | 现有左侧十字键移动 |
| `crouch` | `+duck 71` | `gfx/touch/crouch` | `0.040000 0.015000 0.092083 0.202970` | $50.00 \times 50.00$ | 1.00 | 4096 | 下蹲按键（槽位 71，状态锁存） |
| `cjump` | `+cjump` | `gfx/touch/dpad_cjump` | `0.140000 0.015000 0.192083 0.202970` | $50.00 \times 50.00$ | 1.00 | 0 | 向前大跳宏（槽位 72） |
| `quicksave` | `save quick` | `gfx/touch/save` | `0.280000 0.020000 0.325833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 快速存档 |
| `quickload` | `load quick` | `gfx/touch/load` | `0.340000 0.020000 0.385833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 快速读档 |
| `show_numbers`| `touch_numbers`| `gfx/touch/weapons` | `0.400000 0.020000 0.445833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 数字切枪选单 |
| `flashlight`| `impulse 100` | `gfx/touch/flashlight`| `0.460000 0.020000 0.505833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 手电筒 |
| `menu` | `cancelselect`| `gfx/touch/menu` | `0.520000 0.020000 0.565833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 暂停菜单呼出/返回 |
| `prev` | `invprev` | `gfx/touch/prev` | `0.730000 0.020000 0.775833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 上一武器 |
| `next` | `invnext` | `gfx/touch/next` | `0.790000 0.020000 0.835833 0.185414` | $44.00 \times 44.00$ | 1.00 | 0 | 下一武器 |
| `reload` | `+reload` | `gfx/touch/reload` | `0.650000 0.230000 0.712500 0.455564` | $60.00 \times 60.00$ | 1.00 | 0 | 武器换弹 |
| `alt_fire` | `+attack2` | `gfx/touch/alt_fire` | `0.650000 0.530000 0.712500 0.755564` | $60.00 \times 60.00$ | 1.00 | 0 | 次要开火/特殊功能 |
| `fire` | `+attack` | `gfx/touch/fire` | `0.740000 0.380000 0.823333 0.680752` | $80.00 \times 80.00$ | 1.00 | 0 | 主要开火按键 |
| `jump` | `+jump 73` | `gfx/touch/jump` | `0.860000 0.120000 0.930833 0.375639` | $68.00 \times 68.00$ | 1.00 | 0 | 普通跳跃（槽位 73） |
| `use` | `+use` | `gfx/touch/use` | `0.860000 0.500000 0.930833 0.755639` | $68.00 \times 68.00$ | 1.00 | 0 | 场景交互/开门/交谈 |

### 3.3 布局硬性几何约束检查
1. **正方形像素对齐**：所有带有材质的按键，其实际渲染像素宽度与高度均完全一致（$(x_2 - x_1) \times 960 = (y_2 - y_1) \times 266$），满足 `test_controls.py` 的测试要求；
2. **HUD 底部区域避让**：所有按键的下边沿 $y_2 \times 266 \le 216$ 像素，在屏幕底部保留了 50 像素（$266 - 216 = 50$）的完整空间用于渲染生命值、护甲值与弹药计数；
3. **屏幕左右分区**：左侧移动与身法按键的 $x_2$ 均 $\le 0.26$（$249.6$ 像素），右侧视角与交互区域的 $x_1$ 均 $\ge 0.26$。

---

## 4. 现有左侧移动控制实现机制与缺陷溯源

### 4.1 现有 D-Pad 实现细节
在 `in_touch.c` 中，当按键类型为 `touch_dpad` 时：
1. **初始按下计算（Touch_ButtonPress 第 2045 - 2053 行）**：
   ```c
   touch.forward = (( button->y2 + button->y1 ) - y * 2 ) / ( button->y2 - button->y1 );
   touch.side = (x * 2 - ( button->x2 + button->x1 )) / ( button->x2 - button->x1 );
   if( button->type == touch_dpad )
   {
       touch.forward = round( touch.forward );
       touch.side = round( touch.side );
   }
   ```
2. **滑移更新计算（Touch_Motion 第 1853 - 1867 行）**：
   ```c
   touch.forward = (( b->y2 + b->y1 ) - y * 2 ) / ( b->y2 - b->y1 );
   touch.side = ( x * 2 - ( b->x2 + b->x1 )) / ( b->x2 - b->x1 );
   else if( b->type == touch_dpad )
   {
       touch.forward = round( touch.forward * touch_dpad_radius.value );
       touch.side = round( touch.side * touch_dpad_radius.value );
   }
   touch.forward = bound( -1, touch.forward, 1 );
   touch.side = bound( -1, touch.side, 1 );
   ```

### 4.2 缺陷机理：量化截断与 50% 巨大死区
1. **死区过大的数学根源**：
   - 设当前触摸点距离按键中心的归一化相对偏移为 $\delta \in [0, 1]$；
   - 代码中直接对偏移值执行 `round()`：
     - 当 $|\delta| < 0.5$ 时，`round(\delta)` 恒等于 0；
     - 只有当手指位移超过半宽/半高的 50%（$|\delta| \ge 0.5$）时，输出才突变为 1.0 或 -1.0。
   - 这意味着十字键中心存在一个占据半径 50% 的“零响应”盲区；在 $154 \times 154$ 像素的按键内，中心半径达 $38.5$ 像素的圆形范围内触摸完全不触发移动。
2. **离散阶跃与缺乏模拟量**：
   - D-Pad 输出的数值只有 0、1 或 -1，没有连续比例中间值；
   - 玩家无法进行微调移动、低速潜行或精细瞄准微调，一旦触发便瞬间进入全速冲刺；
3. **尺寸偏小与物理操作受限**：
   - 词典笔屏幕物理尺寸紧凑，在 480×960 物理屏幕上，154 像素对应的物理触摸范围较窄；再加上中心 50% 的死区，使得可有效触发的环形操作带仅有 38 像素左右，极易因手指轻微滑动掉入死区导致人物停步。

---

## 5. 连续比例虚拟摇杆（Joystick）重构方案设计

### 5.1 引擎内置虚拟摇杆架构与成熟度
经过对 `upstream/engine/client/input/in_touch.c` 的勘测，Xash3D 引擎内部已经具备完整的摇杆算法实现：
- 摇杆按键类型：`touch_joy`（枚举值 2）；
- 核心功能标志：`TOUCH_FL_STICK = (1U << 11) = 2048`（定义于 `engine/mobility_int.h:55`）；
- 扩展包内置预设：`extras.pk3` 中已有成熟的 `touch_presets/analog.cfg`，明确配置为：
  ```
  touch_addbutton "move" "gfx/touch/stick_ring" "_joy" 0.060 0.600 0.240 0.920 255 255 255 200 2048 1
  ```

### 5.2 模拟量连续计算模型（Touch_StickVector）
在 `in_touch.c` 第 1474 - 1496 行，`Touch_StickVector` 提供了经过实践检验的比例摇杆向量算法：
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

    // 不舍弃微小位移，平滑夹取对角线
    float amount = Q_min( length, 1.0f );
    *side = sx / length * amount;
    *forward = -sy / length * amount;
}
```

### 5.3 模拟量输入到客户端 usercmd 的映射逻辑
1. **引擎层导出**（`in_touch.c:2376` `Touch_GetMove`）：
   ```c
   void Touch_GetMove( float *forward, float *side, float *pitch, float *yaw )
   {
       ...
       if( cls.key_dest == key_game && touch.state == state_none &&
           ( touch_enable.value || touch.clientonly ) && ( !touch.move_stick || touch.move_finger != -1 ))
       {
           *forward += touch.forward;
           *side += touch.side;
       }
       *pitch += touch.pitch;
       *yaw += touch.yaw;
       touch.yaw = touch.pitch = 0;
   }
   ```
2. **客户端接收与 usercmd 构造**（`hlsdk/cl_dll/input_xash3d.cpp:221-235` `FWGSInput::IN_Move`）：
   ```cpp
   if( ac_movecount )
   {
       IN_ToggleButtons( ac_forwardmove / ac_movecount, ac_sidemove / ac_movecount );

       if( ac_forwardmove )
           cmd->forwardmove = ac_forwardmove * cl_forwardspeed->value / ac_movecount;
       if( ac_sidemove )
           cmd->sidemove  = ac_sidemove * cl_sidespeed->value / ac_movecount;
       if( ( in_speed.state & 1 ) && ( ac_sidemove || ac_forwardmove ) )
       {
           cmd->forwardmove *= cl_movespeedkey->value;
           cmd->sidemove *= cl_movespeedkey->value;
       }
   }
   ```
- `ac_forwardmove` 与 `ac_sidemove` 取值为 $[-1.0, +1.0]$ 的连续模拟量浮点数；
- 乘以 `cl_forwardspeed`（默认 400）与 `cl_sidespeed`（默认 400）后，生成连续平滑的线性移动速度；
- `IN_ToggleButtons` 会在模拟量绝对值大于 0.7 时自动触发引擎内部的 `IN_FORWARD`、`IN_BACK`、`IN_MOVERIGHT`、`IN_MOVELEFT` 按键掩码，确保梯子攀爬等依赖按键状态标志的游戏逻辑完全不受影响。

### 5.4 摇杆渲染与摇杆帽贴图联动
- 当启用 `TOUCH_FL_STICK` (2048) 标志时，`Touch_DrawButtons` 会自动调用 `Touch_DrawStickThumb`（`in_touch.c:1498`）；
- 摇杆基座使用 `touch_addbutton` 指定的贴图（如 `gfx/touch/stick_ring`）；
- 内部滑动的摇杆帽（Thumb）使用 `touch_stick_texture` 指定的贴图（默认为 `gfx/touch/stick_thumb`，已内置于 `extras.pk3` 中）；
- 摇杆帽的实时偏移坐标由 `button->stick_x` 与 `button->stick_y` 驱动，视觉反馈连续自然。

---

## 6. 多指触控并发时的事件槽位管理与独占隔离机制

### 6.1 Linux Input Type B 协议与多槽位驱动
词典笔的 `/dev/input/event1` 支持两个物理触摸触点（Slot 0 与 Slot 1）。其内核事件时序为：
```
# Slot 0 下压（左手移动）
EV_ABS  ABS_MT_SLOT          0
EV_ABS  ABS_MT_TRACKING_ID   100
EV_KEY  BTN_TOUCH            1
EV_ABS  ABS_MT_POSITION_X    px0
EV_ABS  ABS_MT_POSITION_Y    py0
EV_SYN  SYN_REPORT           0

# Slot 1 并发下压与滑动（右手滑动视角或开火）
EV_ABS  ABS_MT_SLOT          1
EV_ABS  ABS_MT_TRACKING_ID   101
EV_ABS  ABS_MT_POSITION_X    px1
EV_ABS  ABS_MT_POSITION_Y    py1
EV_SYN  SYN_REPORT           0
```

### 6.2 引擎状态槽位独占模型
在引擎内部，`struct touch_s` 维护关键的手指持有状态：
- `touch.move_finger`：持有移动控制（摇杆）的手指 ID；
- `touch.look_finger`：持有视角滑动的指针 ID；
- `touch.wheel_finger`：持有武器轮盘的指针 ID；
- 每个 `touch_button_t` 结构体维护各自的 `button->finger`。

### 6.3 消除并发冲突与抢占的独占机制

#### 机制 1：前景按钮事件消费截断（Down 事件 break）
在 `Touch_ButtonPress` 的 `type == event_down` 逻辑中：
- 当手指点击坐标命中位于前景的操作按键（`button->type == touch_command` 或 `touch_wheel`）时，立即分配 `button->finger = fingerID`，并在发送指令后**执行 `break` 终止循环**；
- 这一改动使得右侧战斗按键（开火、跳跃、换弹、使用）成为事件消费终端，事件绝不会向下渗透到背景层的 `_look`；
- `touch.look_finger` 永远不会被右侧操作按钮意外赋值，开火时手指微颤导致的视角乱飞被根除。

#### 机制 2：按键释放精准归还（Up 事件独占释放）
在 `Touch_ButtonPress` 的 `type == event_up` 逻辑中：
- 仅当 `button->finger == fingerID` 时释放对应按键，且在完成释放逻辑（如发送 `-attack`）后**立即 `break`**；
- 避免一个手指抬起事件误触发其他同 ID 残留节点的释放逻辑。

#### 机制 3：空间绝对分区互斥
- 左侧摇杆与身法功能键严格限制在 $x \in [0.00, 0.26]$ 内；
- 右侧全局视角滑动区 `look` 严格限制在 $x \in [0.26, 1.00]$ 内；
- 空间完全隔离，即使两个手指同时在屏幕上滑移，Slot 0 仅在 $[0.00, 0.26]$ 产生摇杆位移，Slot 1 仅在 $[0.26, 1.00]$ 产生视角差分旋转，二者从源头上互不干扰。

---

## 7. 现有测试套件与注入验证机制评估

### 7.1 本地测试套件：`tools/test_controls.py`
该脚本在无设备连接状态下对构建资产与配置文件执行静态规格验证：
- `test_packed_runtime_keeps_touch_enabled`：断言 `autoexec.cfg` 中 `touch_enable` 为 1；
- `test_pack_ships_all_referenced_config_files`：断言所有运行时配置（`userconfig.cfg`、`touch.cfg`、`touch_numbers.cfg`）完整存在；
- `test_buttons_are_square_in_pixels_and_leave_hud_clear`：
  - 核心断言 1：所有前景按键的像素宽高比必须严格等于 1.0（容差 0.02）；
  - 核心断言 2：按键下沿高度 $y_2 \times 266 \le 216$；
  - 核心断言 3：前景按键互不发生几何重叠；
  - **重要观察**：第 58 - 61 行断言了集合 `expected_actions`，当前包含 `'_dpad'`。如果重构为虚拟摇杆 `'_joy'`，需要同步适配此处的集合判定。
- `test_multitouch_screen_partition_and_concurrency_isolation`：
  - 核心断言 1：左侧按键 $x_2 \le 0.26$；
  - 核心断言 2：`look` 按键 $x_1 \ge 0.26$；
  - 核心断言 3：`look` 必须先于右侧核心战斗操作按键注册（验证倒序扫描优先级）；
  - 核心断言 4：身法按键状态槽位与宏绑定（`crouch` 为 `+duck 71` 搭配属性 `4096`，`jump` 为 `+jump 73`，`cjump` 为 `+cjump` 宏）。

### 7.2 触控注入机制：`dev_probe` 与 `touch_probe.c`
设备端测试脚本采用两种注入方式验证双槽位并发：
1. **Shell 并发工具链注入**（`TouchController.concurrent_move_and_look`）：
   ```python
   inject_script = (
       f"(/userdisk/doom/tap_mt /dev/input/event1 {m_px} {m_py} &) ; "
       f"/bin/swipe /dev/input/event1 {l_px1} {l_py1} {l_px2} {l_py2} {dur_ms}"
   )
   ```
   通过后台子进程并发调用 `tap_mt`（注入 Slot 0 移动点击）与 `swipe`（注入 Slot 1 视角滑动）。
2. **底层 Type B 原生驱动注入**（`qoder_cache/hl_controls_20261106_587q96wi/touch_probe.c`）：
   直接通过 C 语言向 `/dev/input/event1` 写入 `input_event` 结构体：
   - 使用 `ABS_MT_SLOT` 显式切换槽位 0 与 1；
   - 使用 `ABS_MT_TRACKING_ID` 绑定独立触控生命周期；
   - 坐标变换公式直接使用物理屏幕映射：
     $$px = y_{game} + 107, \quad py = 959 - x_{game}$$
   - 发送 `SYN_REPORT` 同步事件帧。
   该方式绕过上层代理，具备微秒级时序可控性，是排查多指并发死锁最严谨的注入手段。

---

## 8. 调研结论与具体重构建议

1. **`in_touch.c` 修复点**：
   - 在 `Touch_ButtonPress` 的 `type == event_down` 中，当 `button->type == touch_command` 或 `touch_wheel` 成功响应时，添加 `break;`，防止事件下渗至 `_look`；
   - 在 `Touch_ButtonPress` 的 `type == event_up` 中，当匹配到释放按键后同样添加 `break;`，确保单指释放一一对应；
2. **`touch.cfg` 重构点**：
   - 将原有的 `_dpad` 按键替换为 `_joy` 连续比例虚拟摇杆；
   - 设置属性标志为 `2048`（`TOUCH_FL_STICK`），启用圆环边界碰撞检测与比例摇杆帽渲染；
   - 材质配置为 `gfx/touch/stick_ring`，利用引擎内置贴图资源；
   - 精确计算摇杆归一化坐标，确保其实际像素宽高为正方形（例如 $154.28 \times 154.28$ 或更大比例 $164 \times 164$），右边沿不超过 $x = 0.26$，下边沿不超过 $y \times 266 = 216$；
3. **测试套件协同适配**：
   - 调整 `tools/test_controls.py` 中的 `expected_actions` 集合，允许 `_joy` 替换 `_dpad`；
   - 调整 `left_buttons` 校验元组，纳入新的摇杆标识名（如 `joy` 或 `move`）。
