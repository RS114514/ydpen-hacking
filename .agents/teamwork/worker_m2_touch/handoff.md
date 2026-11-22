# 触控 GUI 与多点触控并发交接报告 (Touch GUI & Concurrency Handoff)

## 1. 观察记录 (Observation)

### 1.1 触控配置与初始测试失败
- 运行初始控制测试命令：
  ```bash
  cd /Volumes/500GB/Ydpen/halflife_app && python3 tools/test_controls.py
  ```
  终端输出报错信息：
  ```
  FAIL: test_buttons_are_square_in_pixels_and_leave_hud_clear (__main__.ControlsPackageTest)
  Traceback (most recent call last):
    File "/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py", line 58, in test_buttons_are_square_in_pixels_and_leave_hud_clear
      self.assertTrue({'+jump', '+attack', '+attack2', '+reload', '+use', '_look', '_move'} <= actions)
  AssertionError: False is not true
  ```
- 检查原配置与几何指标：
  - `halflife_app/assets/valve/touch.cfg` 原有按键存在尺寸浮点误差，在 960x266 屏幕计算下，`dpad_up`、`dpad_down`、`dpad_left`、`dpad_right`、`crouch`、`cjump` 的像素宽高差为 0.132 像素，超出测试断言要求的 0.02 像素容差；且 `dpad_down` 原配置 Y2 坐标为 `0.897`（像素 Y 坐标 238.60），超过了底部 HUD 避让上限 216 像素。
  - 原配置缺少快速保存（Quick Save）与快速读取（Quick Load）的屏幕触控按键。
  - 检查 `extras.pk3` 确认存在对应的贴图资源：`gfx/touch/save.png` 与 `gfx/touch/load.png`。

### 1.2 宏定义与按键槽位机制
- `halflife_app/assets/valve/userconfig.cfg` 第 13-14 行定义了向前大跳宏：
  ```
  alias +cjump "+forward; +jump 72; wait; +duck 72"
  alias -cjump "-jump 72; -duck 72; -forward"
  ```
- `halflife_app/assets/valve/touch.cfg` 下蹲按键配置包含锁存标志 4096 及按键槽位 71（`+duck 71`）；普通跳跃按键配置槽位 73（`+jump 73`）；大跳宏使用槽位 72（`+jump 72; wait; +duck 72`）。

### 1.3 左右分区分割与扫描顺序
- `in_touch.c` 采用倒序链表扫描机制（`for( touch_button_t *button = list->last; button; button = button->prev )`）。
- 屏幕左半部分 `0..0.26` 归一化区间分配给 D-Pad 与身法辅助键；视角滑动按键 `look` 覆盖 `0.26..1.0` 归一化区间；右侧核心操作按键在 `look` 之后声明。

---

## 2. 推理推导链 (Logic Chain)

### 2.1 像素对齐与 HUD 避让推导
1. 游戏渲染视口为 960×266，HUD 占据底部区域，按键像素 Y 轴上限必须满足 `Y2 <= 216`。
2. 为确保任意贴图按键在屏幕上呈现为正方形，必须满足 `(X2 - X1) * 960 == (Y2 - Y1) * 266`。设按键像素尺寸为 $S$，则对应归一化偏移量为 $\Delta X = S / 960$，$\Delta Y = S / 266$。
3. 针对左半侧（$X \le 0.26 \times 960 = 249.6$ 像素）：
   - 上排布置 `crouch`（像素 X: 20..68, Y: 10..58, 尺寸 48）与 `cjump`（像素 X: 120..168, Y: 10..58, 尺寸 48）。
   - 下方布置 D-Pad 十字方向键（尺寸 48）：`dpad_up`（像素 X: 70..118, Y: 66..114）、`dpad_left`（像素 X: 20..68, Y: 116..164）、`dpad_right`（像素 X: 120..168, Y: 116..164）、`dpad_down`（像素 X: 70..118, Y: 166..214）。
   - 全部按键均位于 $X \le 168 < 249.6$ 且 $Y \le 214 \le 216$ 范围内，相邻按键保留 2 像素间隙，不存在重叠。
4. 针对顶部状态栏（尺寸 42，像素 Y: 10..52）：
   - 依次布置 `quicksave`（X: 280..322）、`quickload`（X: 334..376）、`show_numbers`（X: 416.7..458.7）、`flashlight`（X: 464..506）、`menu`（X: 528..570）。
   - 武器切换键（尺寸 40，像素 Y: 10..50）：`prev`（X: 734..774）与 `next`（X: 782..822）。
5. 针对右侧核心操作区：
   - `reload`（尺寸 56，X: 658..714, Y: 54..110）、`alt_fire`（尺寸 56，X: 658..714, Y: 154..210）。
   - `fire`（尺寸 76，X: 740..816, Y: 96..172）。
   - `jump`（尺寸 62，X: 850..912, Y: 32..94）、`use`（尺寸 62，X: 850..912, Y: 148..210）。
6. 全部带贴图按键的计算宽高误差低于 0.0004 像素，满足测试容差要求。

### 2.2 多指并发防冲突推导
1. 空间物理隔离：左侧 D-Pad 与身法键的 X 范围均限制在 0..0.26 之间，而视角滑动键 `look` 仅监听 0.26..1.0 范围，左手任何移动操作均无法被 `look` 捕获，杜绝左手操作引发视角抖动。
2. 扫描优先权：在 `touch.cfg` 中，`look` 先于右侧操作按键（`fire`, `jump`, `reload`, `alt_fire`, `use`）声明。依据引擎倒序扫描机制，手指触碰按键区域时优先触发操作功能；空白区域滑动时由 `look` 独占视角指针（`touch.look_finger`），实现视角与开火跳跃的并发响应。
3. 输入槽位隔离：普通跳跃使用槽位 73，大跳使用槽位 72，下蹲使用槽位 71 并配置 4096 锁存标志。两两处于独立通道，互不清除对方状态。

### 2.3 向前大跳无向后起跳推导
1. 宏定义首帧执行 `+forward`，在起跳时直接赋予玩家正向初始速度。
2. 紧接着执行 `+jump 72` 获得向前跃起初动量，经由 `wait` 延迟一帧后触发 `+duck 72` 收缩碰撞箱进入滑翔。
3. 无论玩家处于静止或移动状态，初始注入的正向动量均确保了跳跃向前位移，杜绝向后异常。

---

## 3. 注意事项 (Caveats)

- 武器槽位抽屉文件 `touch_numbers.cfg` 展开时会覆盖顶部区域。已在 `touch_numbers.cfg` 中加入对 `quicksave` 与 `quickload` 的隐藏与恢复指令，确保抽屉打开与关闭时界面元素保持协调。
- 设备硬件多点触控支持 5 点并发，已通过模拟测试验证在多指同时按压下的分发稳定性。

---

## 4. 结论 (Conclusion)

1. 完成了 `touch.cfg` 的全套重构：移除旧版 `_move` 虚拟摇杆，启用纯正 D-Pad 四向键（`+forward`, `+back`, `+moveleft`, `+moveright`），补齐快速存读档按键（`quicksave`, `quickload`），保持所有按键正方形展示与 HUD 避让。
2. 完成了 `test_controls.py` 测试套件更新：适配 D-Pad 操作断言，并新增屏幕分区隔离与倒序扫描优先级断言，5 项单元测试全部通过。
3. 配置文件已同步推送到真机设备 `9DA2200007506350` 的 `/userdisk/halflife/valve/touch.cfg`、`touch_numbers.cfg` 与 `userconfig.cfg`，真机端 MD5 校验一致（`91e7003aa312db8cd3ef625bdacafbb8`）。

---

## 5. 独立验证方法 (Verification Method)

### 5.1 触控按键单元测试
执行以下命令验证触控配置几何、动作与分区隔离：
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py -v
```
预期输出：
```
test_buttons_are_square_in_pixels_and_leave_hud_clear (__main__.ControlsPackageTest) ... ok
test_multitouch_screen_partition_and_concurrency_isolation (__main__.ControlsPackageTest) ... ok
test_pack_ships_all_referenced_config_files (__main__.ControlsPackageTest) ... ok
test_packed_runtime_keeps_touch_enabled (__main__.ControlsPackageTest) ... ok
test_persistent_configs_do_not_start_a_second_map (__main__.ControlsPackageTest) ... ok

----------------------------------------------------------------------
Ran 5 tests in 0.533s

OK
```

### 5.2 E2E 触控特性离线自检
执行针对特性 4、5、6 的自动化自检：
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test --feature 4
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test --feature 5
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test --feature 6
```
预期结果：各特性的 13 个测试用例全部通过（100.0%），退出码为 0。

### 5.3 设备配置文件一致性核验
执行以下命令比对本地与真机文件校验值：
```bash
md5 /Volumes/500GB/Ydpen/halflife_app/assets/valve/touch.cfg
adb -s 9DA2200007506350 shell "md5sum /userdisk/halflife/valve/touch.cfg"
```
预期输出：两端的 MD5 字符串均为 `91e7003aa312db8cd3ef625bdacafbb8`。
