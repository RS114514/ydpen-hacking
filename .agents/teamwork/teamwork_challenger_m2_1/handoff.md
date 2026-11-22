# Handoff Report — Wayland 几何与重入对抗验证报告

## 1. 观察事实 (Observation)

### 1.1 坐标边界与平移极端值验证事实
1. **源码逻辑结构**（`native/wl_center.c` 第 88-103 行、第 115-123 行、第 159-183 行）：
   - `hook_touch_down`、`hook_touch_motion`、`hook_pointer_enter`、`hook_pointer_motion` 中坐标平移与截断实现如下：
     ```c
     wl_fixed_t off = wl_fixed_from_int(107);
     wl_fixed_t max_y = wl_fixed_from_int(265);
     wl_fixed_t adj_y = y - off;
     if (adj_y < 0) adj_y = 0;
     if (adj_y > max_y) adj_y = max_y;
     ```
   - 算法不包含除法算子（`/`），不存在由于除零导致的浮点异常。
   - `wl_fixed_to_double(adj_y)` 使用固定除数 256.0 进行浮点转换，结果不存在 NaN 或 Inf。
2. **测试脚本实测数据**（执行 `tools/test_adversarial_wayland.py` 中 `TestCoordinateBoundaryAdversarial` 5 项用例）：
   - $y = 0 \implies adj\_y = 0.0$（顶部屏幕边缘截断）
   - $y = 106 \implies adj\_y = 0.0$（顶部黑边最后一像素截断）
   - $y = 107 \implies adj\_y = 0.0$（视口顶部边界）
   - $y = 372 \implies adj\_y = 265.0$（视口底部边界）
   - $y = 373 \implies adj\_y = 265.0$（底部黑边第一像素截断）
   - $y = 479 \implies adj\_y = 265.0$（底部屏幕边缘截断）
   - 负坐标输入（$-0.001, -1.0, -10.0, -107.0, -480.0, -1000.0, -32768.0, -100000.0$）全部输出为 $0.0$。
   - 越界大坐标输入（$480.0, 500.0, 1000.0, 32767.0, 100000.0$）全部输出为 $265.0$。
   - 在 $[107, 372]$ 区间内以 $0.25$ 步进进行线性扫描，输出严格单调递增，且满足 $y' = y - 107.0$。
   - Clang 编译执行 C 原生测试程序（密集循环 20,001 次采样），无任何未定义行为，退出码为 0。

### 1.2 协议状态机对抗性分析事实
1. **多重 configure 与背景缓冲挂载逻辑**（`native/wl_center.c` 第 36-38 行、第 57-81 行、第 400-411 行）：
   - `g_bg_attached` 与 `g_configured` 初始值为 0。
   - 收到 Opcode 4（`XDG_SURFACE_ACK_CONFIGURE`）后：
     ```c
     if (!g_bg_attached && g_sdl_surface && opcode == 4) {
         const char *cls = wl_proxy_get_class(proxy);
         if (cls && strcmp(cls, "xdg_surface") == 0) {
             g_configured = 1;
             g_bg_attached = 1;
             attach_black_480_bg(g_sdl_surface);
         }
     }
     ```
   - 静态全局缓冲指针 `static struct wl_buffer *g_bg_buf = NULL;`：在 `attach_black_480_bg` 内部仅在 `!g_bg_buf` 时创建共享内存池与缓冲。
2. **测试脚本实测数据**（`TestWaylandStateMachineAdversarial`）：
   - 模拟合成器短时间内连续下发 100 次 `xdg_surface.configure` 并触发客户端回复 `ack_configure`（Opcode 4），`attach_black_480_bg` 调用次数为 1，SHM 缓冲创建次数为 1，父表面 commit 次数为 1，未产生重复挂载或泄漏。
   - 非 Opcode 4 的请求（如 0: DESTROY, 1: GET_TOPLEVEL, 3: SET_WINDOW_GEOMETRY）未触发背景缓冲挂载。
3. **全屏操作码拦截覆盖范围**（`native/wl_center.c` 第 388-398 行）：
   - 函数 `should_block_toplevel_opcode` 对 `xdg_toplevel` 的 Opcode 5、6、10、12 实施拦截并返回 1。
   - 依据 `xdg-shell-client-protocol.h`，该协议定义的全部 14 个请求中：
     - Opcode 5 为 `XDG_TOPLEVEL_MOVE`（交互式移动，可改变窗口坐标使其脱离全屏）；
     - Opcode 6 为 `XDG_TOPLEVEL_RESIZE`（交互式缩放，可改变窗口尺寸使其脱离全屏）；
     - Opcode 10 为 `XDG_TOPLEVEL_UNSET_MAXIMIZED`（取消最大化，使窗口回到浮动状态）；
     - Opcode 12 为 `XDG_TOPLEVEL_UNSET_FULLSCREEN`（取消全屏，使窗口回到浮动状态）。
   - 其余合法请求（Opcode 0: 销毁, Opcode 2: 标题, Opcode 11: 请求全屏等）均返回 0 正常传递。

### 1.3 动态库隔离破坏性验证事实
1. **打包与安装脚本校验逻辑**（`tools/build_amr.py` 第 228-236 行、`tools/install_amr.py` 第 60-66 行）：
   - 明确检查 `f"libs/{arch}/libwl_center.so" in namelist`，若存在抛出 `RuntimeError`。
   - 集合比对 `actual_libs != expected_libs`，其中 `expected_libs` 严格限定为 `{"libs/arm64/libjsapi_hl.so", "libs/arm64-orange/libjsapi_hl.so"}`。
2. **破坏性注入测试结果**（`TestDynamicLibraryIsolationAdversarial`）：
   - 注入 `libs/arm64/libwl_center.so`：打包与安装校验均抛出 `RuntimeError` 拒绝处理。
   - 注入 `libs/arm64-orange/libwl_center.so`：打包与安装校验均抛出 `RuntimeError` 拒绝处理。
   - 注入 `libs/libwl_center.so` 或 `libs/other/libwl_center.so`：被 `actual_libs != expected_libs` 判定捕获，抛出 `RuntimeError` 拒绝处理。
   - 物理核对当前项目制品 `dist/half-life-1.0.0.amr`：压缩包内仅包含合规的 2 个 `libjsapi_hl.so` 动态库，不存在任何 `libwl_center.so` 条目。
3. **引擎子进程注入机制**（`native/libjsapi_hl.c` 第 325-329 行）：
   - 在 `fork()` 分支内部执行 `setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1)` 与 `execl("./xash3d", ...)`，仅在引擎子进程生效，不影响 Falcon 宿主环境。

---

## 2. 推导逻辑链 (Logic Chain)

1. **坐标变换与视口几何推导**：
   - 依据 1.1 观察，物理屏幕分辨率为 960x480，游戏渲染视口为 960x266，垂直物理留白为 $(480 - 266) / 2 = 107$ 像素；
   - 依据 1.1 观察，触控与指针事件通过减去偏移量 107 像素，将视口区间 $[107, 372]$ 映射为 $[0, 265]$；
   - 依据 1.1 观察，上黑边区间 $[0, 106]$ 经减法运算为负数，通过 `if (adj_y < 0) adj_y = 0;` 限制在 0；下黑边区间 $[373, 479]$ 经减法运算大于 265，通过 `if (adj_y > max_y) adj_y = max_y;` 限制在 265；
   - 依据 1.1 观察与数学分析，有符号 32 位定点数在下溢阈值 $-8,388,501.0$ 像素以上均可保持非负性与截断有效性，远超硬件与驱动所能产生的极值范围，推导得出坐标变换在输入空间内具备数学单调性与稳定性。
2. **状态机防重入与协议一致性推导**：
   - 依据 1.2 观察，Wayland xdg-shell 规范规定客户端在收到 `xdg_surface.configure` 事件并回复 `ack_configure` 之前不得挂载缓冲；
   - 依据 1.2 观察，`maybe_attach_bg_on_ack` 在 Opcode 4 发送时挂载黑色背景缓冲，满足首个 configure 应答前不挂载的时序约束；
   - 依据 1.2 观察，`g_bg_attached` 标志位置位后，后续重复的 `ack_configure` 以及 `wl_egl_window_resize` 均直接跳过背景挂载；同时 `g_bg_buf` 静态指针避免了二次分配共享内存，推导得出合成器下发多次 configure 事件不会导致重复挂载、协议乱序或内存泄漏。
3. **全屏状态保持完备性推导**：
   - 依据 1.2 观察，`xdg_toplevel` 中能够引起窗口退出全屏或移动位置的操作码为 `MOVE` (5)、`RESIZE` (6)、`UNSET_MAXIMIZED` (10)、`UNSET_FULLSCREEN` (12)；
   - 依据 1.2 观察，`should_block_toplevel_opcode` 对上述 4 个操作码全部返回 1 并在 `wl_proxy_marshal_*` 层面予以阻断，而其他正常请求未受拦截；
   - 结合初始化阶段 `xdg_toplevel_set_fullscreen(g_toplevel, NULL)` 的设定，推导得出窗口被锁定在 $(0, 0)$ 全屏状态，客户端无法通过协议请求逆向解除全屏。
4. **动态库隔离推导**：
   - 依据 1.3 观察，构建脚本与安装脚本在两道环节通过黑名单（匹配 `libwl_center.so`）与白名单（全等比对预期库集合）双重检验；
   - 依据 1.3 观察，测试表明恶意将 `libwl_center.so` 注入压缩包内任何位置均会引发 `RuntimeError` 导致构建或安装中断；
   - 依据 1.3 观察，真实产物中未包含居中库，而在运行时仅通过子进程环境变量 `LD_PRELOAD` 加载，推导得出 Falcon 宿主环境具备物理与进程层面的双重隔离。

---

## 3. 局限与注意事项 (Caveats)

1. **定点数下溢的理论边界**：
   `wl_fixed_t` 作为 32 位有符号整数，当输入坐标小于 $-8,388,501.0$ 像素时，减去偏移量会导致 32 位有符号整数下溢绕回为正数并截断为 265。由于物理屏幕高度仅为 480 像素，且驱动层上报数值通常限定在 16 位整数范围内，该理论极端值在实际硬件环境下无法被触发。
2. **真机物理多点触控与 Weston 合成器时序**：
   当前对抗性分析覆盖了数学推演、C 原生单测、状态机模拟及对抗注入测试。真机环境下触控驱动的物理防抖与 Weston 合成器的实时表现，仍需依赖 M3 里程碑的物理设备端到端执行。

---

## 4. 结论 (Conclusion)

### 裁决结果：APPROVE

1. **坐标边界与平移极端值验证通过**：
   极端坐标输入（$y = 0, 106, 107, 372, 373, 479$、负值与超大值越界输入）严格截断在 $[0, 265]$ 视口内，映射关系满足线性单调性，无除零与浮点异常风险。
2. **协议状态机对抗性分析通过**：
   `g_bg_attached` 标志位与 `g_bg_buf` 静态缓存能有效阻断合成器下发多次 configure 事件引发的重入挂载与内存泄漏；`should_block_toplevel_opcode` 完整覆盖了脱离全屏所需的全部 4 个操作码（5, 6, 10, 12），窗口锁定机制完备。
3. **动态库隔离破坏性验证通过**：
   `tools/build_amr.py` 与 `tools/install_amr.py` 具备双重检测，针对包内注入 `libwl_center.so` 的各攻击场景均能准确识别并拦截；实际产物包符合物理隔离标准。

---

## 5. 独立复现与验证方法 (Verification Method)

审查人员可使用以下命令独立执行对抗测试套件进行复现验证：

1. **执行 Wayland 对抗验证全套测试**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_adversarial_wayland.py
   ```
   *预期输出*：13 项对抗用例（坐标平移与 C 原生压测、状态机重入与操作码拦截、动态库破坏性注入与实体包检查）全部输出 `ok`，退出码为 0。

2. **验证现有本地回归与生命周期测试套件**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   node tools/test_lifecycle.mjs
   python3 tools/test_controls.py
   python3 tools/test_e2e_verification.py --self-test
   python3 tools/test_xrcon.py --output /tmp/xrcon_verify && rm -rf /tmp/xrcon_verify
   python3 tools/test_adversarial_m2.py
   ```
   *预期输出*：所有测试全部通过，退出码均为 0。
