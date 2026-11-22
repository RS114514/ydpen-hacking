# 触控输入与界面交互勘查交接报告 (Explorer 2 Handoff)

## 1. 勘查观测记录 (Observation)

### 1.1 触控坐标映射与协议转换观测
- **硬件驱动与测试工具定义**：`/Volumes/500GB/Ydpen/test_runner_core.py` 与 `/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/touch_probe.c`
  - 设备硬件触控节点为 `/dev/input/event1`，采用标准 Linux Multi-touch 协议 B（`ABS_MT_SLOT`, `ABS_MT_TRACKING_ID`, `ABS_MT_POSITION_X`, `ABS_MT_POSITION_Y`）。
  - `touch_probe.c` 第 18-31 行核心转换逻辑：
    ```c
    int slot = atoi(argv[2]), x = atoi(argv[3]), y = atoi(argv[4]);
    event(fd, EV_ABS, ABS_MT_SLOT, slot);
    if (!strcmp(argv[1], "down")) {
        event(fd, EV_ABS, ABS_MT_TRACKING_ID, 100 + slot);
        event(fd, EV_KEY, BTN_TOUCH, 1);
    }
    if (!strcmp(argv[1], "up") || !strcmp(argv[1], "last")) {
        event(fd, EV_ABS, ABS_MT_TRACKING_ID, -1);
        if (!strcmp(argv[1], "last")) event(fd, EV_KEY, BTN_TOUCH, 0);
    } else {
        event(fd, EV_ABS, ABS_MT_POSITION_X, y + 107);
        event(fd, EV_ABS, ABS_MT_POSITION_Y, 959 - x);
    }
    event(fd, EV_SYN, SYN_REPORT, 0);
    ```
  - `test_runner_core.py` 第 20-33 行转换：
    ```python
    def tap_phys(px, py, delay=0.6):
        adb(f"shell '/userdisk/doom/tap_mt /dev/input/event1 {px} {py}'")
        time.sleep(delay)

    def tap_css(cx, cy, delay=0.6):
        px = int(round(107 + cy * 1.2))
        py = int(round(959 - cx * 1.2))
        tap_phys(px, py, delay)

    def tap_960(lx, ly, delay=0.6):
        cx = lx / 1.2
        cy = ly / 1.2
        tap_css(cx, cy, delay)
    ```
  - 物理屏幕像素为 480×960（竖屏），游戏横屏渲染视口为 960×266。高度居中偏移量为 `(480 - 266) / 2 = 107` 像素。
- **Wayland 中间层事件截获**：`/Volumes/500GB/Ydpen/halflife_app/native/wl_center.c`
  - 第 70-95 行对 `wl_touch` 监听器的包装：
    ```c
    static void hook_touch_down(void *data, struct wl_touch *touch, uint32_t serial, uint32_t time,
                                struct wl_surface *surface, int32_t id, wl_fixed_t x, wl_fixed_t y) {
        wl_fixed_t off = wl_fixed_from_int(107);
        wl_fixed_t max_y = wl_fixed_from_int(265);
        wl_fixed_t adj_y = y - off;
        if (adj_y < 0) adj_y = 0;
        if (adj_y > max_y) adj_y = max_y;
        if (real_touch_listener.down)
            real_touch_listener.down(data, touch, serial, time, surface, id, x, adj_y);
    }
    ```
  - `hook_touch_motion` 同样执行 `adj_y = y - 107`，将 Wayland 事件的 Y 轴有效范围校准为 0..265，`id` 保持完整透传给 SDL2 与 Xash3D。

### 1.2 引擎触控按键分发与多点并发机制观测
- **引擎触控核心**：`/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c`
  - **命令类型识别**（第 743-755 行）：
    ```c
    if( !Q_strcmp( command, "_look" ))
        button->type = touch_look;
    else if( !Q_strcmp( command, "_move" ))
        button->type = touch_move;
    else if( !Q_strcmp( command, "_joy" ))
        button->type = touch_joy;
    else if( !Q_strcmp( command, "_dpad" ))
        button->type = touch_dpad;
    else if( !Q_strncmp( "_wheel ", command, 7 ) || !Q_strncmp( "_hwheel ", command, 8 ))
        button->type = touch_wheel;
    else
        button->type = touch_command;
    ```
  - **按键状态与多指分发**（第 1921-2088 行）：
    - 遍历链表采用倒序 `for( touch_button_t *button = list->last; button; button = button->prev )`，后添加的按键具有更高命中优先级。
    - 普通指令键（`touch_command`）：若带有 `+` 前缀且设置了 `TOUCH_FL_COMMAND_LATCH`（4096），则交替触发 `+command` 与 `-command`（下蹲切换特性）；普通 `+command` 按键按下时执行 `+command`，在释放（`event_up`）时发送 `-command`。
    - 滑屏视角键（`touch_look`）：绑定 `touch.look_finger = fingerID`。当已有手指占用视角旋转时（`touch.look_finger != -1`），其他手指触碰该区域不会抢夺视角控制权。
    - 视角运动计算（第 1909-1910 行）：
      `touch.yaw -= dx * touch_yaw.value;`
      `touch.pitch += dy * touch_pitch.value;`
- **GoldSrc 客户端按键槽位机制**：`/Volumes/500GB/qoder_cache/fwgs_official/hlsdk/cl_dll/input.cpp`
  - 第 304-331 行 `KeyDown` 与第 338-370 行 `KeyUp`：每个 `kbutton_t` 结构体提供两个独立输入槽位 `down[0]` 与 `down[1]`。当带数字参数调用时（例如 `+duck 71` 与 `+duck 72`），分别占用不同槽位，释放一个不会影响另一个的按住状态。

### 1.3 现有触控按键配置与缺失项观测
- **现有配置文件**：`/Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg` 与 `userconfig.cfg`
  - **已配置移动与身法**：
    - `dpad_up`（+forward）、`dpad_down`（+back）、`dpad_left`（+moveleft）、`dpad_right`（+moveright）。
    - `crouch`：`touch_addbutton "crouch" "gfx/touch/crouch" "+duck 71" ... 4096 0`（带有锁存标志 4096）。
    - `cjump`：`touch_addbutton "cjump" "gfx/touch/dpad_cjump" "+cjump" ... 0 0`。在 `userconfig.cfg` 中定义为：
      `alias +cjump "+forward; +jump 72; wait; +duck 72"`
      `alias -cjump "-jump 72; -duck 72; -forward"`
    - `jump`：`touch_addbutton "jump" "gfx/touch/jump" "+jump 73" ... 0 0`。
  - **已配置战斗与交互**：
    - `fire`（+attack）、`alt_fire`（+attack2）、`use`（+use）、`reload`（+reload）、`flashlight`（impulse 100）。
  - **已配置系统与选枪**：
    - `prev`（invprev）、`next`（invnext）、`show_numbers`（呼出数字槽位选枪）、`menu`（cancelselect）。
  - **明确缺失项**：
    - 缺少快速保存（Quick Save）屏幕按键。
    - 缺少快速加载（Quick Load）屏幕按键。
- **现有自动化测试失败观测**：
  - 运行 `python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py` 报错：
    ```
    FAIL: test_buttons_are_square_in_pixels_and_leave_hud_clear (__main__.ControlsPackageTest)
    AssertionError: False is not true
    ```
    原因为 `test_controls.py` 第 58 行强制断言必须包含 `_move` 虚拟摇杆动作，而现有 `touch.cfg` 已重构成纯正 D-Pad 四向键（`+forward`, `+back`, `+moveleft`, `+moveright`），未同步更新测试断言。

### 1.4 暂停菜单与存读档数据流观测
- **Xash3D 菜单动态库**：`/Volumes/500GB/qoder_cache/fwgs_official/extracted/xash3d-fwgs-linux-arm64/libmenu.so`
  - 内部实现包含完整的主菜单与暂停菜单体系（`CMenuMain`、`CMenuSaveLoad`、`CMenuSaveGame`、`CMenuLoadGame`）。
  - `cancelselect` 指令在游戏中触发时调出 `CMenuMain`。
  - `libmenu.so` 直接使用本地化语言字典 `/userdisk/halflife/valve/resource/gameui_schinese.txt`。
- **Falcon 原生桥接层存读档**：`/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`
  - `hl.save()`：向 `127.0.0.1:27000` XRCON 发送 `save quick`，并阻塞轮询 `/userdisk/halflife/valve/save/quick.sav` 的文件修改时间戳（mtime）与文件大小（size > 0），超时 3000ms，确认落盘后返回 `ok: true`。
  - `hl.load()`：向 XRCON 发送 `load quick` 指令。
  - `hl.stop()`：先触发 `save_game_locked()` 确保存档写入，再发送 `quit` 并回收 `xash3d` 子进程。
  - 启动阶段自动续盘：`libjsapi_hl.c` 第 273-294 行检查若存在有效的 `quick.sav`，则生成 `auto_exec.cfg` 内容为 `load quick`，否则生成 `map c0a0`。

---

## 2. 推理推导链 (Logic Chain)

### 2.1 物理触控到引擎视口映射链
1. 词典笔电容触控屏物理驱动汇报的是竖屏坐标（480×960）。
2. 在横屏模式（960×266）下，由于显示屏物理居中安装且高度仅占 266 像素，留有 107 像素的顶部物理黑边（`(480 - 266) / 2 = 107`）。
3. 坐标映射关系：横屏输入点 `(lx, ly)`（其中 `0 <= lx < 960`, `0 <= ly < 266`）发送到物理驱动时，X 轴对应物理 Y 轴偏移 `ly + 107`，Y 轴对应物理 X 轴镜像 `959 - lx`。
4. Wayland 合成器接收物理事件后旋转 90 度并传递给 EGL 窗口。`wl_center.c` 在挂载点对 Y 坐标减去 107 偏移量，使得传递至 SDL2 / Xash3D 的坐标精准落入 `[0, 960]` 与 `[0, 266]`。
5. 最终在 Xash3D 引擎内部，所有坐标通过 `x / 960.0f` 与 `y / 266.0f` 归一化为 `0.0..1.0` 浮点区间，实现触控位置与屏幕按键贴图的重合。

### 2.2 多点触控并发无冲突保障机制
1. **左右分区隔离**：
   - 屏幕左侧区域（X 坐标 0.0 至 0.26）集中布置 D-Pad 四向键、下蹲与向前大跳按键。
   - 滑屏视角控制键 `look` 仅覆盖右侧区域（`0.26 0 1 1`）。
   - 左手在移动和身法操作时，手指事件完全局限在 `0.0..0.26`，绝对不会触发 `look` 按键或引起意外视角晃动。
2. **右侧多功能并发**：
   - 右侧布置了滑动视角区与操作按键（开火、副火、跳跃、换弹、互动）。
   - 在 `in_touch.c` 中，操作按键在 `look` 之后注册，因此处于链表后部，在倒序扫描中享有优先检测权。
   - 当手指点击 `fire` 或 `jump` 时，操作按键优先捕获该手指 ID。
   - 当右手另一手指在空白区滑动物理旋转视角时，`touch.look_finger` 独占该滑动指针。后续操作键被点击时，由于 `touch.look_finger != -1`，`touch_look` 逻辑直接跳过该新指针，不会产生视角打断或冲突。
3. **按键槽位隔离**：
   - 针对 `+duck` 和 `+jump` 等多重状态操作，下蹲切换绑定键码 71（`+duck 71`），大跳绑定键码 72（`+jump 72; +duck 72`），普通跳跃绑定键码 73（`+jump 73`）。
   - 依据 GoldSrc `kbutton_t` 双槽位机制，即使玩家在下蹲切换保持蹲姿的同时按下大跳，大跳释放时只会清除槽位 72，不会解除槽位 71 的常驻蹲姿，彻底杜绝状态异常。

### 2.3 向前大跳无向后异常的因果链
1. 经典 Half-Life 身法中，大跳是由前进冲量、跳跃初速度和下蹲收腿复合构成的。
2. 现有别名宏：`alias +cjump "+forward; +jump 72; wait; +duck 72"`。
3. 显式在第一帧触发 `+forward`，为引擎赋予正向运动向量；紧随其后的 `+jump 72` 获得向前跃起动量；`wait` 延迟一帧后触发 `+duck 72` 收缩碰撞箱进入滑翔跳跃。
4. 释放时 `-cjump` 依次解除 `-jump 72; -duck 72; -forward`。整个宏无论在角色静止或后退状态下触发，均由强制注入的 `+forward` 锁定前进方向，不会出现反向起跳缺陷。

### 2.4 暂停菜单与存读档实现架构
1. **方案选择与排版要求**：
   - 方案 A（Xash3D 原生 GameUI）：通过 `cancelselect` 呼出 `libmenu.so`。界面使用黑山基地的黑底与醒目橙色（`#F57E00`）高亮，但其子菜单层级繁多，在 960×266 窄长屏幕上若未精确设置 UI 缩放可能造成界面排版局促。
   - 方案 B（轻量级黑橙工控 Touch Overlay 暂停菜单）：对标 `touch_numbers.cfg` 模式，在用户点击 `menu` 按键时，隐藏战斗操作键，动态加载一组居中排列的黑橙工控风格半透明按钮（`[继续游戏]`, `[保存存档]`, `[读取存档]`, `[重新开始]`, `[退出桌面]`），并在点击后恢复正常操作界面。
   - 方案推荐：以 `libmenu.so` 作为底层标准 GameUI，同时在屏幕常驻条中补充快捷存读档按键（`quicksave` 与 `quickload`），既可一键极速存读档，又保留完整官方菜单功能。
2. **Save / Load 数据完整性闭环**：
   - 保存时：XRCON 发送 `save quick` -> 引擎生成 `/userdisk/halflife/valve/save/quick.sav` -> `libjsapi_hl.c` 校验文件大小及修改时间确认写入成功。
   - 读取时：XRCON 发送 `load quick` -> 引擎热重载关卡地图与实体状态，Gordon Freeman 恢复至保存时的坐标、朝向、生命值与武器配置。

---

## 3. 注意事项与边界说明 (Caveats)

1. **测试断言过时**：当前 `halflife_app/tools/test_controls.py` 中的 `actions` 检查包含旧版的 `_move` 虚拟摇杆标识。在验证 D-Pad 纯正十字键前，必须将测试断言更新为包含 `+forward`, `+back`, `+moveleft`, `+moveright`。
2. **按键垂直边界检查**：`test_controls.py` 要求带贴图的按键底部不得超出 Y=216 像素（`y2 * 266 <= 216`），以避免遮挡底层血量与弹药 HUD。在为 `touch.cfg` 新增或调整按键（尤其是新增的快存、快读按键）时，垂直范围必须满足此要求。
3. **只读勘查范围**：本报告未对 `touch.cfg`、`test_controls.py` 或任何源码执行修改。

---

## 4. 勘查结论 (Conclusion)

1. **全套触控按键完整映射方案确定**：
   - 补充缺失的快存与快读按键：在顶部操作条区域新增 `quicksave`（`save quick`，贴图 `gfx/touch/save`）与 `quickload`（`load quick`，贴图 `gfx/touch/load`）。
   - 保留左手 D-Pad 四向十字键（`dpad_up`, `dpad_down`, `dpad_left`, `dpad_right`）、下蹲切换（`crouch`, 标志 4096）、向前大跳（`cjump`）。
   - 保留右手战斗键（`fire`, `alt_fire`, `use`, `reload`）、跳跃键（`jump`）、换枪键（`prev`, `next`）、手电（`flashlight`）与菜单键（`menu`）。
2. **多点触控并发机制经源码分析完全成立**：
   - 左右屏幕物理划分与 Z 轴扫描优先级天然规避按键争抢。
   - 在按住 D-Pad 移动的同时，滑屏旋转视角、射击开火与跳跃属于独立事件与槽位，不会产生输入互斥。
3. **暂停菜单与存读档具备完整数据流保障**：
   - 960×266 视口内通过居中布局与黑橙工控配色（背景 `#000000`，主体 `#F57E00`，边框高亮 `#FFA500`）能够提供契合黑山基地的视觉呈现。
   - 前后端通过 `save quick` / `load quick` 及底层 `quick.sav` 文件时间戳校验，确保数据存盘与状态恢复的可靠性。

---

## 5. 独立验证方法 (Verification Method)

后续执行 Agent 完成配置后，可通过以下自动化指令进行独立验证：

1. **本地触控配置与断言单元测试**：
   ```bash
   python3 -m unittest /Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py
   ```
   *预期结果*：4 项测试全部通过（Ran 4 tests ... OK），按键无重叠、呈正方形且不遮挡底部 HUD。
2. **真机全套触控与多点并发自动化仿真测试**：
   ```bash
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "/userdisk/doom/tap_mt /dev/input/event1 150 500"
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "/bin/swipe /dev/input/event1 200 300 200 600 300"
   ```
3. **XRCON 存读档状态流测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py --output /tmp/hl_xrcon_test
   ```
   *预期结果*：`save`、`load`、`send` 状态码均为 0，`quick.sav` 生成并成功加载。
