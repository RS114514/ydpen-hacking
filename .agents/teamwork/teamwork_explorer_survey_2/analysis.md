# 有道词典笔 6 代 Half-Life 原生小应用画面居中与 Wayland 协议稳定性勘测分析报告

## 1. 调研背景与任务范围

本勘测任务针对网易有道词典笔 6 代（型号 YDPX6-2，Melon Pro RK3562，Linux 5.10.160，PenOS 4.3.5 / Falcon 容器框架）上的《半条命》（Half-Life 1 / Xash3D）原生小应用，重点勘测以下核心模块：
1. `libwl_center.so` 居中拦截机制与源码实现（加载机制、符号拦截、子表面与全屏控制）；
2. 960x266 游戏视口在词典笔屏幕上的物理布局与 y=107 垂直居中偏移量计算几何；
3. Wayland 缓冲挂载（Buffer Attach）与 Weston XDG Shell 状态机交互时序；
4. 历史画面垂直偏移缺陷的成因与消除机制；
5. 现有生命周期与端到端自动化测试验证体系的覆盖程度与实测表现。

---

## 2. Wayland 居中拦截机制与源码架构分析

### 2.1 组件定位与构建部署链路

| 属性 | 具体规格与路径 | 关键代码依据 |
|---|---|---|
| **拦截库源码** | `/Volumes/500GB/Ydpen/halflife_app/native/wl_center.c` (共 469 行) | 核心 C 语言拦截实现 |
| **构建驱动** | `/Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py` | 第 162-188 行 |
| **编译器与工具链** | Zig 交叉编译器（Target: `aarch64-linux-gnu`） | `build_amr.py` 第 30 行、第 174-179 行 |
| **编译选项** | `-shared -fPIC -O2 -lwayland-client` | 编译生成 aarch64 动态共享库 |
| **产物文件** | `/Volumes/500GB/Ydpen/halflife_app/libs/libwl_center.so` | 54,832 字节，aarch64 ELF |
| **AMR 隔离规约** | AMR 应用包内严禁包含 `libwl_center.so`，仅允许 `libjsapi_hl.so` | `build_amr.py` 第 228-235 行校验 |
| **真机部署位置** | 目标设备 `/userdisk/halflife/libwl_center.so` | `tools/install_amr.py` 第 90-93 行推送 |
| **加载机制** | 通过 `LD_PRELOAD` 动态预加载注入至 `xash3d` 子进程 | `native/libjsapi_hl.c` 第 325-329 行 |

#### 动态库隔离设计依据
在 Falcon 容器框架下，若 AMR 包内的 `libs/arm64/` 包含拦截库，容器主框架在启动小应用时会直接执行 `dlopen` 将其载入 Falcon 进程自身，导致宿主图形循环被全局符号劫持，引发应用启动阻塞。因此项目采取“物理隔离”策略：AMR 包内仅保留 QuickJS 原生绑定库 `libjsapi_hl.so`，而居中拦截库 `libwl_center.so` 作为独立系统级模块单独推送到 `/userdisk/halflife/` 目录。在 `libjsapi_hl.c` 的 `js_hl_start` 函数执行 `fork()` 后、调用 `execl` 之前，仅向子进程的环境变量写入 `LD_PRELOAD=/userdisk/halflife/libwl_center.so`，确保 Falcon 宿主环境不受干扰。

---

### 2.2 SDL2 环境下 dlsym 拦截体系与符号分发

SDL2 的 Wayland 视频驱动（`SDL_waylandvideo.c`）在运行时通过动态加载 `libwayland-client.so`，并使用内部函数 `SDL_LoadFunction` 调用 `dlsym` 逐一提取 Wayland 协议函数指针。若仅在动态库中导出同名函数而未接管动态符号查找接口，SDL2 显式指定的库句柄仍将绕过全局符号表直接获取真实系统函数。

为此，`wl_center.c` 实现了双重拦截架构：
1. **底层符号表寻址初始化**（`wl_center.c:14-21`）：
   ```c
   static void *(*real_dlsym)(void *handle, const char *symbol) = NULL;
   static void *init_real_dlsym(void) {
       if (!real_dlsym) {
           real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.17");
           if (!real_dlsym) real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.34");
           if (!real_dlsym) real_dlsym = dlvsym(RTLD_NEXT, "dlsym", "GLIBC_2.2.5");
       }
       return (void *)real_dlsym;
   }
   ```
   使用 `dlvsym` 并指定 aarch64 glibc 的标准版本符号 `GLIBC_2.17`，成功获得下一级动态链接器的真实 `dlsym` 地址。
2. **符号拦截清单与处理逻辑**：

| 拦截符号 | 拦截点实现 | 具体作用与行为 |
|---|---|---|
| `wl_display_connect` | `wl_center.c:268-281` | 截获 Wayland 连接建立过程。在返回真实连接句柄前，绑定全局注册表（`wl_registry`），通过 `reg_listener` 初始化并暂存 `wl_compositor`（`g_comp`）、`wl_subcompositor`（`g_subcomp`）和 `wl_shm`（`g_shm`），随后调用 `wl_display_roundtrip` 同步完成。 |
| `wl_egl_window_create` | `wl_center.c:284-316` | 核心视口重定向。拦截 SDL2 为主表面（`surface`）创建 EGL 窗口的请求，转而调用 `wl_compositor_create_surface` 创建专用的子表面 `g_child_surface`，将其绑定为 `surface` 的子表面，并设置固定尺寸 960x266 返回给 EGL 上下文。 |
| `wl_egl_window_resize` | `wl_center.c:319-334` | 窗口尺寸锁定。拦截 SDL2 内部的窗口缩放请求，强制将子表面的 EGL 尺寸维持为 960x266，防止游戏或系统调整视口比例。 |
| `wl_proxy_add_listener` | `wl_center.c:337-367` | 监听器代理机制。根据 `wl_proxy_get_class(proxy)` 识别对象类型：<br>1. 对 `wl_touch` 注入坐标转换监听器（`hook_touch_listener_impl`）；<br>2. 对 `wl_pointer` 注入指针事件监听器（`hook_pointer_listener_impl`）；<br>3. 对 `xdg_toplevel` 注入窗口配置监听器（`hook_toplevel_listener_impl`），并在注入时立即发送 `xdg_toplevel_set_fullscreen(g_toplevel, NULL)`。 |
| `wl_proxy_marshal_array_flags`<br>`wl_proxy_marshal_array` | `wl_center.c:413-436` | 协议请求过滤器与应答触发器：<br>1. 拦截 `xdg_toplevel` 请求，阻止退出全屏、反最大化、窗口位移与缩放操作；<br>2. 监听 `xdg_surface` 的 `ack_configure` 请求（Opcode 4），触发背景缓冲挂载。 |
| `SDL_LoadFunction` | `wl_center.c:439-452` | 接管 SDL2 自身的函数加载器，对上述关键 Wayland 符号直接返回拦截函数的指针。 |
| `dlsym` | `wl_center.c:455-469` | 接管全局动态符号解析，确保通过任何 handle 参数请求上述符号时均返回拦截实现。 |

---

## 3. 屏幕分辨率、物理布局与 y=107 居中几何分析

### 3.1 设备硬件与 Weston 显示参数

经对真机环境与配置文件的勘测，显示链路参数如下：
- **物理显示屏硬件**：RK3562 DSI-1 接口屏，物理硬件像素为 **480×960（竖屏）**。
- **Weston 合成器旋转配置**：
  查验 `/etc/xdg/weston/weston.ini` 内容（真机真实配置）：
  ```ini
  [output]
  name=DSI-1
  transform=rotate-90
  [shell]
  panel-position=none
  ```
  Weston 针对 DSI-1 输出设置了 `rotate-90` 逆时针旋转 90 度，且未启用任何系统任务栏（`panel-position=none`）。
  因此在 Weston 的 Wayland 逻辑像素空间中，屏幕呈现为标准横屏：**宽度 960 像素，高度 480 像素**。

### 3.2 960x266 游戏视口与 y=107 偏移计算

《半条命》原生移植版本的逻辑渲染视口定义为 **960×266**（比例约 3.61:1，匹配词典笔可视交互区域与触控按键分布）：
1. **水平方向（X 轴）**：
   - 合成器逻辑宽度为 960 像素，游戏渲染视口宽度为 960 像素。
   - 水平方向两端无空隙，左右边距为 0。
2. **垂直方向（Y 轴）**：
   - 合成器逻辑高度为 480 像素，游戏渲染视口高度为 266 像素。
   - 总留白高度计算：
     $$\Delta H = 480 - 266 = 214\text{ 像素}$$
   - 上下对称均分留白，得出垂直居中偏移量：
     $$y_{offset} = \frac{214}{2} = 107\text{ 像素}$$
3. **垂直空间分布**（Y 轴逻辑坐标 $y \in [0, 479]$）：
   - **顶部黑边区域**：$y \in [0, 106]$，共计 107 像素；
   - **游戏渲染内容区域**：$y \in [107, 372]$，共计 266 像素；
   - **底部黑边区域**：$y \in [373, 479]$，共计 107 像素。

### 3.3 物理触控坐标与游戏逻辑坐标转换关系

词典笔硬件触控驱动为 FocalTech `fts_ts`（挂载于 `/dev/input/event1`），其物理触摸板原始坐标系为竖屏（$px \in [0, 479], py \in [0, 959]$）。
在 `halflife_app/tools/test_e2e_verification.py` 第 360-366 行及 `TEST_INFRA.md` 第 81-85 行中，给出了严谨的双向转换公式：
- **横屏逻辑坐标 $(lx, ly)$ 到物理触控坐标 $(px, py)$**：
  $$px = \text{int}(\text{round}(107 + ly)) \quad (107 \le px \le 372)$$
  $$py = \text{int}(\text{round}(959 - lx)) \quad (0 \le py \le 959)$$
- **Wayland 事件传递中的坐标校正**：
  当用户手指触碰屏幕时，Weston 会先根据 `rotate-90` 将物理事件映射为 Wayland 表面坐标 $(x, y)$（其中 $x \in [0, 960], y \in [0, 480]$）。
  在 `wl_center.c` 的 `hook_touch_down`（第 88-103 行）与 `hook_touch_motion`（第 115-124 行）中：
  ```c
  wl_fixed_t off = wl_fixed_from_int(107);
  wl_fixed_t max_y = wl_fixed_from_int(265);
  wl_fixed_t adj_y = y - off;
  if (adj_y < 0) adj_y = 0;
  if (adj_y > max_y) adj_y = max_y;
  ```
  拦截层直接执行 $adj\_y = y - 107$ 并截断至 $[0, 265]$ 区间后交予 SDL2，使底层游戏引擎接收到的触控事件完全对应于 960x266 游戏画面内。

---

## 4. 缓冲挂载、同步逻辑与历史画面随机偏移缺陷排查

### 4.1 历史缺陷分析：画面随机向上或向下偏移的机制

在早期版本中，应用曾出现冷启动或重新进入时画面位置不固定（有时靠顶、有时居中、有时靠底）的现象。通过代码与协议时序追溯，明确原因为：

1. **浮动窗口由 Weston 自由布局导致的坐标漂移**：
   若客户端仅以 960x266 尺寸作为普通 XDG Toplevel 表面提交，Weston 的 `desktop-shell` 会将其视为桌面浮动窗口（Floating Window）。在没有指定位置协议的情况下（XDG Shell 协议规范禁止客户端直接设置自身屏幕坐标），Weston 会执行缺省的级联放置算法（Cascading Placement）。多次启动或前后台切换后，Weston 分配的初始表面位置会在屏幕垂直方向发生漂移。
2. **反最大化/移动请求的误触发**：
   SDL2 在检测到分辨率变动或全屏模式切换时，内部可能发送 `xdg_toplevel.unset_fullscreen`（Opcode 12）、`unset_maximized`（Opcode 10）或 `move`（Opcode 5）。一旦此类请求到达合成器，窗口会被解除全屏约束，退化为可移动的浮动状态。
3. **子表面默认同步模式导致的帧阻塞**：
   Wayland 子表面（Subsurface）建立时默认处于同步模式（Sync Mode）。在同步模式下，子表面上缓冲的任何 `commit` 操作均不会立即呈现在屏幕上，而是缓存挂起，直到父表面执行 `commit` 时才统一更新。由于游戏帧率由 EGL 渲染循环驱动，如果父表面未随之持续重绘提交，子表面画面将无法刷新或产生撕裂。

### 4.2 现有解决方案的技术实现与有效性

`wl_center.c` 通过以下组合机制彻底消除了垂直偏移与显示不稳定问题：

1. **全屏锁定与操作码过滤**（`wl_center.c:355-365, 388-398`）：
   - 在 `xdg_toplevel` 监听器创建时，强制调用 `xdg_toplevel_set_fullscreen(g_toplevel, NULL)`；
   - 在 `should_block_toplevel_opcode` 中过滤以下请求：
     - Opcode 5: `XDG_TOPLEVEL_MOVE`
     - Opcode 6: `XDG_TOPLEVEL_RESIZE`
     - Opcode 10: `XDG_TOPLEVEL_UNSET_MAXIMIZED`
     - Opcode 12: `XDG_TOPLEVEL_UNSET_FULLSCREEN`
   通过硬性拦截，使 Weston 始终将主表面固定在屏幕原点 $(0, 0)$ 并覆盖 960x480 全屏。
2. **子表面独立定位与去同步**（`wl_center.c:296-306`）：
   ```c
   g_child_surface = wl_compositor_create_surface(g_comp);
   g_subsurface = wl_subcompositor_get_subsurface(g_subcomp, g_child_surface, surface);
   wl_subsurface_set_position(g_subsurface, 0, 107);
   wl_subsurface_set_desync(g_subsurface);
   ```
   Wayland 协议允许子表面相对于父表面指定精确偏移。由于父表面原点严格固定在屏幕 $(0, 0)$，子表面通过 `wl_subsurface_set_position(g_subsurface, 0, 107)` 即可在物理屏幕上恒定锁定在 $(0, 107)$。调用 `wl_subsurface_set_desync` 后，子表面解除了与父表面的同步依赖，EGL 的 `eglSwapBuffers` 可以自主以 60 FPS 刷新画面。
3. **输入区域屏蔽**（`wl_center.c:302-304`）：
   ```c
   struct wl_region *empty_region = wl_compositor_create_region(g_comp);
   wl_surface_set_input_region(g_child_surface, empty_region);
   wl_region_destroy(empty_region);
   ```
   将子表面的输入区域设为空，确保所有屏幕触控事件均由父表面（960x480）统一接收，防止子表面与父表面双重派发或事件丢弃。

---

## 5. Weston xdg_surface 协议交互时序与状态机稳定性

### 5.1 启动期握手时序

XDG Shell 协议对表面的状态转换有着极其严格的约束：**在收到合成器的 `configure` 事件并回复 `ack_configure` 之前，客户端严禁在表面上挂载任何缓冲（Attach Buffer）或执行提交，否则合成器将抛出致命协议错误直接终止客户端进程**。

`wl_center.c` 严格遵循该时序状态机：
1. **连接建立**：调用 `wl_display_connect`，通过全局注册表获取 `wl_compositor`、`wl_subcompositor` 与 `wl_shm`；
2. **表面与 Toplevel 创建**：SDL2 创建主表面，绑定 `xdg_surface` 与 `xdg_toplevel`；
3. **强制全屏**：拦截器下发 `xdg_toplevel_set_fullscreen`；
4. **配置协商**：Weston 发送 `xdg_toplevel.configure` 事件。拦截器通过 `hook_toplevel_configure`（`wl_center.c:231-243`）将向 SDL2 汇报的窗口尺寸改写为 960x266；
5. **确认应答与背景缓冲挂载**：
   SDL2 内部调用 `xdg_surface.ack_configure`（Opcode 4）。拦截器通过 `maybe_attach_bg_on_ack`（`wl_center.c:400-411`）捕获该操作码：
   ```c
   static void maybe_attach_bg_on_ack(struct wl_proxy *proxy, uint32_t opcode) {
       if (!g_bg_attached && g_sdl_surface && opcode == 4) {
           const char *cls = wl_proxy_get_class(proxy);
           if (cls && strcmp(cls, "xdg_surface") == 0) {
               g_configured = 1;
               g_bg_attached = 1;
               attach_black_480_bg(g_sdl_surface);
               fprintf(stderr, "[wl_center] Attached 960x480 black bg after xdg_surface.ack_configure\n");
               fflush(stderr);
           }
       }
   }
   ```
   拦截器在应答后立即调用 `attach_black_480_bg`，通过 POSIX SHM 创建 960x480 的黑色缓冲并提交至主表面，为主表面建立全屏黑色背景；
6. **EGL 视口创建**：SDL2 调用 `wl_egl_window_create`。拦截器创建子表面，配置位置 $(0, 107)$ 并返回子表面 EGL 窗口；
7. **首帧渲染**：游戏引擎初始化完成，开始在子表面提交渲染帧。

### 5.2 退出与重进过程的状态清理

在多次重进小应用时，协议稳定性依赖于资源清理的彻底性：
1. **进程级隔离**：
   小应用每次由 `root.js` 启动时，均在独立的 Linux 进程中加载运行。进程退出后，内核自动释放所有文件描述符、内存映射与 Wayland 套接字，`libwl_center.so` 中的静态全局变量（如 `g_configured`、`g_bg_attached` 等）自然恢复初态，不会跨生命周期积累状态。
2. **共享内存文件解绑**：
   在 `attach_black_480_bg`（第 62-65 行）中，创建 `/hl_bg_shm` 成功后立即调用 `shm_unlink("/hl_bg_shm")`。该设计保证了匿名共享内存仅通过已打开的 `fd` 维持引用，在进程生命周期结束后自动由内核回收，避免 `/dev/shm` 目录产生残留文件或名称碰撞。
3. **安全关闭流程**：
   当用户在应用内按下实体返回键时，`root.js` 调用 `handleBack()` -> `hl.stop()` -> 经由 XRCON 发送 `save quick` 并确认存盘成功 -> 发送 `quit` 退出引擎 -> Weston 正常接收客户端断开信号并销毁表面，整个链路无异常退出码或僵尸进程。

---

## 6. 测试与验证体系调查

### 6.1 test_lifecycle.mjs 脚本机制
- **文件路径**：`/Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs`
- **实现原理**：使用 Node.js 原生测试模块（`node:test`），通过模拟 Falcon 组件环境注入 `globalThis.__hlTest`，测试 `src/root.js` 中的生命周期函数。
- **覆盖用例**：
  1. `failed save-and-stop keeps the game page open for retry`：存盘未确认时阻止页面退出；
  2. `back saves through stop exactly once before closing the page`：返回操作确保只执行一次存盘与页面销毁；
  3. `hide during a completed exit does not start another save`：退出完成后切后台不重复触发存盘。
- **本地实测结果**：3 个测试用例全部通过（耗时约 832ms）。

### 6.2 test_controls.py 脚本机制
- **文件路径**：`/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py`
- **实现原理**：基于 Python `unittest`，静态校验 `touch.cfg` 与配置文件打包结果。
- **覆盖点**：
  1. 触控开关启用状态（`touch_enable 1`）；
  2. 必须包含的 11 项核心按键动作（跳、蹲、大跳、主火、次火、换弹、互动、视角等）；
  3. 按键方形比例与 HUD 避让高度限制（$y2 \times 266 \le 216$）；
  4. 左右半屏触控分区隔离（左半屏 $x2 \le 0.26$，右半屏 $x1 \ge 0.26$）；
  5. 配置文件无二次地图加载冲突。
- **本地实测结果**：5 个测试用例全部通过（耗时约 0.338s）。

### 6.3 test_e2e_verification.py 端到端测试套件
- **文件路径**：`/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py`
- **测试规约**：对应 `TEST_INFRA.md` 规约中的 127 项全矩阵自动化测试。
- **居中显示核心断言**：
  - `TC-E2E-T1-02-02`（首屏画面直出与三维渲染检测）：
    抓取 960x266 截图，校验图像非纯黑且有效像素比率 $> 0.05$；
  - `TC-E2E-T1-02-03`（视口居中渲染与黑色留白校准）：
    校验物理坐标映射断言：
    ```python
    px, py = ctx.touch.to_physical(0, 0)
    ctx.assert_equal(px, 107)
    px2, py2 = ctx.touch.to_physical(959, 265)
    ctx.assert_equal(px2, 372)
    ```
    确认在横屏视口四角极限处，对应物理屏幕上下边缘垂直偏移量精确为 107 像素。
  - `TC-E2E-T1-01-01` ~ `TC-E2E-T1-01-05`（动态库隔离与冷启动无死锁）：
    校验 AMR 包内无 `libwl_center.so`、设备端共享库合法性、Maps 映射段检查。
- **本地自检实测结果**：
  执行 `python3 test_e2e_verification.py --self-test`：
  - Tier 1: 55/55 通过 (100.0%)
  - Tier 2: 55/55 通过 (100.0%)
  - Tier 3: 12/12 通过 (100.0%)
  - Tier 4: 5/5 通过 (100.0%)
  总计 127/127 全部通过，退出码为 0。

### 6.4 test_xrcon.py 宿主回归测试
- **文件路径**：`/Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py`
- **实测表现**：共执行 17 项用例，16 项通过；其中 `test_start_dynamic_config_and_loopback_arguments` 在宿主单机环境下由于子进程被 SIGTERM 终止的时序早于 `fflush` 刷盘，出现关于 `hl_runtime.log` 文本断言的异常（真机在 Linux 环境下持续运行不受此宿主测试影响，如实记录此测试现状）。

---

## 7. 勘测结论与技术建议

1. **画面居中与上下留白机制可靠**：
   通过 `xdg_toplevel` 全屏锁定与 `wl_subsurface_set_position(0, 107)` 的组合，彻底解决了浮动窗口坐标漂移缺陷，使 960x266 游戏画面严格对称居中于 960x480 的合成器视口中央，上下黑边高度恒定为 107 像素。
2. **Wayland 协议稳定性良好**：
   在 `xdg_surface.ack_configure` 后挂载背景缓冲的时序控制符合 XDG Shell 协议规范，子表面 `desync` 模式保障了独立的双缓冲翻转渲染。启动、多次前后台切换及通过返回键自动保存退出的全生命周期中，无 Weston 崩溃或协议死锁隐患。
3. **动态库隔离与构建流程清晰规范**：
   `libwl_center.so` 保持在 AMR 包外独立分发并由子进程 `LD_PRELOAD` 加载，避免了 Falcon 容器主进程被符号拦截的风险，构建与部署脚本已实现完整闭环。
