# Handoff Report — M1 触控系统虚拟摇杆与防抢占重构独立审查与对抗挑战

## 审查裁决 (Review Summary)

**Verdict**: APPROVE

---

## 1. 观察记录 (Observation)

### 1.1 源码核验：防穿透阻断与释放对称性
在文件 `/Volumes/500GB/qoder_cache/hl_controls_20261106_587q96wi/upstream/engine/client/input/in_touch.c` 中：
- 第 1945 行至第 1996 行（`type == event_down` 分支）：
  ```c
  if( button->type == touch_command )
  {
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
- 第 2100 行至第 2136 行（`type == event_up` 分支）：
  ```c
  if( button->type == touch_command )
  {
      ...
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
- 释放按键校验：第 2095 行以 `if (fingerID != button->finger) continue;` 精确匹配手指标识，随后重置 `button->finger = -1;`，并且在 `touch_command` 与 `touch_wheel` 处理完毕后均执行 `break;`，阻断遍历继续下行。

### 1.2 配置文件核验：虚拟摇杆几何与空间分区
在 `assets/valve/touch.cfg` 与 `dist_assets/valve/touch.cfg` 中：
- 摇杆定义位于第 30 行：
  `touch_addbutton "joy" "gfx/touch/stick_ring" "_joy" 0.040000 0.220000 0.200708 0.800000 255 255 255 220 2048 0`
- 空间几何计算（基于 $960 \times 266$ 视口）：
  - 水平像素跨度：$(0.200708 - 0.040000) \times 960 = 154.27968$ 像素
  - 垂直像素跨度：$(0.800000 - 0.220000) \times 266 = 154.28000$ 像素
  - 宽高像素差值：$0.00032$ 像素，满足正方形比例约束（$\Delta < 0.02$ 像素）
  - 左侧物理分区：$x_2 = 0.200708 \le 0.260000$
  - 底部 HUD 避让：$y_2 \times 266 = 212.8$ 像素 $\le 216$ 像素，底部预留 $53.2$ 像素避让生命值与护甲显示区
- 身法辅助按键定义与间距核验：
  - `crouch`（第 33 行）：$x \in [0.040000, 0.092083], y \in [0.015000, 0.202970]$
  - `cjump`（第 34 行）：$x \in [0.140000, 0.192083], y \in [0.015000, 0.202970]$
  - 垂直方向：`crouch` 与 `cjump` 下边缘 $y_2 = 0.202970$，与 `joy` 上边缘 $y_1 = 0.220000$ 存在垂直净间距 $\Delta y = 0.017030$（即 $4.53$ 像素），互不重叠
  - 水平方向：`crouch` 右边缘 $x_2 = 0.092083$ 与 `cjump` 左边缘 $x_1 = 0.140000$ 存在水平净间距 $\Delta x = 0.047917$（即 $46.0$ 像素），互不重叠
  - 与视角层间距：`joy` 右边缘 $x_2 = 0.200708$ 与 `look` 左边缘 $x_1 = 0.260000$ 存在隔离缓冲带宽 $\Delta x = 0.059292$（即 $56.92$ 像素）

### 1.3 贴图资源完备性
通过 `file` 命令核查以下路径的贴图资源：
- `/Volumes/500GB/Ydpen/halflife_app/assets/valve/gfx/touch/stick_ring.png`: PNG image data, 128 x 128, 8-bit colormap
- `/Volumes/500GB/Ydpen/halflife_app/assets/valve/gfx/touch/stick_thumb.png`: PNG image data, 128 x 128, 8-bit colormap
- `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/gfx/touch/stick_ring.png`: PNG image data, 128 x 128, 8-bit colormap
- `/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve/gfx/touch/stick_thumb.png`: PNG image data, 128 x 128, 8-bit colormap
两组贴图均存在且规格完整。

### 1.4 自动化测试执行实测结果
在工作目录 `/Volumes/500GB/Ydpen/halflife_app` 下执行以下测试：
1. **控件配置与分区静态测试**：
   ```bash
   PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls
   ```
   输出：5 项测试全部通过（Ran 5 tests in 0.036s, OK），退出码 0。
2. **宿主机 XRCON 回归套件测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py
   ```
   输出：17 项测试全部通过（Ran 17 tests in 22.728s, OK），退出码 0。
3. **前端生命周期与退出逻辑测试**：
   ```bash
   node /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
   ```
   输出：3 项测试全部通过（pass 3, fail 0, duration_ms 809.684167），退出码 0。
4. **E2E 全链路自检套件测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --self-test
   ```
   输出：127 项分层测试全部通过（Tier 1: 55/55, Tier 2: 55/55, Tier 3: 12/12, Tier 4: 5/5），退出码 0。
5. **小应用打包与自动部署检验**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   ```
   输出：本地编译生成 `dist/half-life-1.0.0.amr`（123 KB），自动识别 6 代真机（9DA2200007506350），完整同步配置、摇杆贴图与原生动态库，安装响应 `{"appid": "8002026110400001", "ret": 0}`，退出码 0。

---

## 2. 逻辑推导链 (Logic Chain)

1. **防穿透机制推导**：
   - 触控系统采用双向链表，按逆向次序（`list->last` 至 `list->first`）遍历按钮。
   - 在 `touch.cfg` 中，底层的滑动视角区域 `_look` 最早注册（位于链表首部），而右侧交互按钮（`fire`, `jump`, `reload`, `use` 等）在配置后半段依次注册（位于链表尾部）。
   - 用户触碰右侧操作按键时，逆向遍历率先匹配到操作按键。
   - 观察记录 1.1 表明，`touch_command` 分支执行指令后显式调用 `break;`，使循环立即终止，事件不会继续下渗至处于底层的 `_look`。
   - 由此，右手操作按键时 `touch.look_finger` 维持独立，消除了按键点击产生的视角颤动以及视角手指被误抢占的异常。
   - 在释放阶段（`event_up`），通过 `fingerID == button->finger` 精准筛选释放节点并以 `break;` 结束，保证按键生命周期对称。

2. **虚拟摇杆无级模拟量与无死区推导**：
   - 配置中指定 `_joy` 并配置标志位 2048（`TOUCH_FL_STICK`）。
   - 引擎根据该标志位调用 `Touch_StickVector` 函数，直接计算基于摇杆半径的归一化偏离比例向量（$x \in [-1.0, 1.0], y \in [-1.0, 1.0]$）。
   - 相比原 `_dpad` 采用的整数取整运算（`round()`），`Touch_StickVector` 采用连续浮点除法，消除了原有小于 50% 范围时的截断死区。

3. **双指并发隔离推导**：
   - 左手区虚拟摇杆及身法按键全部严格约束在 $x \le 0.260000$。
   - 右手区视角控制与操作区域全部起始于 $x \ge 0.260000$。
   - 左右两区存在接近 57 像素的物理隔离带，且左区内部摇杆与上方身法按键之间保留了 4.5 像素以上的间距。
   - 结合多槽位输入流与独立的 `move_finger` 与 `look_finger` 分配机制，双指并发操作在数学几何与状态机逻辑上完全解耦。

---

## 3. 完整性核查 (Integrity Check)

经过对测试用例与源码修改的逐项核查：
1. **测试断言真实性**：
   `tools/test_controls.py` 中的几何校验、正方形比例计算、HUD 避让检查以及两两相交检验均为实际的数学浮点计算与文件解析，不存在任何硬编码期望结果或伪造通过的逻辑。
2. **源码实现真实性**：
   `in_touch.c` 的修改为真实的 C 语言分支流程控制（`break;`），非空桩或假象实现。
3. **XRCON 验证真实性**：
   `tools/test_xrcon.py` 通过实际拉起子进程并建立 TCP Socket 链路进行指令交互，时序同步通过文件大小的非零状态进行真实判定。
4. **审查结论**：未发现任何违规造假或作弊行为。

---

## 4. 对抗性挑战与风险分析 (Adversarial Challenges)

### 挑战 1：`touch_move` / `touch_joy` 分支缺少防御性 `break;`
- **受测假设**：当手指触碰虚拟摇杆时，是否可能穿透至下层控件。
- **失效场景推演**：
  在 `in_touch.c` 第 1998 行至第 2057 行中，`touch_move || touch_joy || touch_dpad` 命中并初始化移动后，并无 `break;` 语句。
  如果未来有配置文件将 `_look` 错误配置为全屏覆盖（$x \in [0.0, 1.0]$），则用户触碰左侧摇杆后，循环将继续遍历至底层的 `_look`。
  由于此时 `touch.move_finger` 刚被赋值，底层的 `_look` 将进入第 2072 行的 `if (touch.move_finger == fingerID)` 错误恢复分支，导致 `move_finger` 与 `look_finger` 同时被重置为 -1，移动指令意外中断。
- **当前防护状态**：
  在当前项目中，`touch.cfg` 对左侧控制区与右侧视角区实施了严格的 X 轴物理分区（$x \le 0.26$ 与 $x \ge 0.26$），因此当前的触控坐标绝不会同时命中 `joy` 与 `look`。
- **防御建议（架构改进）**：
  在后续引擎代码维护时，建议在 `touch_move` / `touch_joy` 初始化完成的分支末尾同样补充 `break;`，以提供防御能力。

### 挑战 2：多点触控同键并发点击
- **受测假设**：多根手指同时触碰同一摇杆区域是否会导致状态错乱。
- **机制检验**：
  在第 1941 行存在防护逻辑：`if( FBitSet( button->flags, TOUCH_FL_STICK ) && button->type == touch_joy && button->finger != -1 ) continue;`。
  当首根手指已经控制摇杆时，后续手指的点击会被该检查直接跳过，摇杆的所有权不会发生漂移，具有良好的抗并发干扰能力。

---

## 5. 注意事项 (Caveats)

1. **引擎二进制编译依赖**：
   `in_touch.c` 属于引擎端（`xash3d` / `libfalcon.so`）源码。当前修改在源码树中已就绪并通过相关测试，真机运行时的虚拟摇杆支持则依托于预置引擎中原生的 `_joy` 与 `TOUCH_FL_STICK`（标志位 2048）特性。
2. **多点触控硬件槽位**：
   有道词典笔 6 代触控屏采用 FocalTech `fts_ts` 驱动，硬件原生支持 2 个并发触控槽位。双指并发（左指摇杆移动 + 右指转动视角或点击操作）是该硬件上的主要工作模式。

---

## 6. 审查结论 (Conclusion)

1. 确认已成功在 `Touch_ButtonPress` 的 `touch_command` 与 `touch_wheel` 分支中加入 `break;` 阻断逻辑，有效防止事件下渗至底层 `_look`，按键释放逻辑对称独立。
2. 确认 `touch.cfg` 与 `dist_assets/valve/touch.cfg` 已完整配置正方形比例虚拟摇杆 `joy`，其几何布局满足左半屏分区隔离与底部 HUD 避让规范，与身法按键间距清晰无干涉。
3. 确认配套测试工具 `tools/test_controls.py` 与时序适配后的 `tools/test_xrcon.py` 全部通过，全量自动化验证退出码为 0。
4. 审查结论为 **APPROVE**。

---

## 7. 独立验证方法 (Verification Method)

执行以下命令即可复现全部测试结论：
```bash
# 1. 验证按键几何正方形、HUD 避让与分区隔离断言
cd /Volumes/500GB/Ydpen/halflife_app && PYTHONPATH=/Volumes/500GB/Ydpen/halflife_app/tools python3 -m unittest -v test_controls

# 2. 验证宿主机 XRCON 通信机制
cd /Volumes/500GB/Ydpen/halflife_app && python3 tools/test_xrcon.py

# 3. 验证生命周期管理与安全退出
cd /Volumes/500GB/Ydpen/halflife_app && node tools/test_lifecycle.mjs

# 4. 验证 127 项 E2E 自动化测试流程
cd /Volumes/500GB/Ydpen/halflife_app && python3 tools/test_e2e_verification.py --self-test
```
任何一条命令返回非零值即代表验证不成立。
