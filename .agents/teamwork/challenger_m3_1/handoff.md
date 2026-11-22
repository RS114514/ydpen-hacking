# M3 里程碑挑战者实证报告：双槽位并发触控抗扰与视口居中对抗性验收

## 1. Observation
本次对抗性实证挑战严格在有道词典笔 6 代真机（ADB 序列号 `9DA2200007506350`）以及本地环境上执行，不轻信任何间接断言或既有日志，通过编写独立的底层探测工具与高频压力测试获取第一手实测数据：

1. **设备与硬件多点触控规格直接探测**：
   - 执行指令：`adb -s 9DA2200007506350 shell "timeout 1 /bin/evtest /dev/input/event1"`
   - 设备回执确认：输入设备为 `fts_ts`（Bus 0x18, Direct Input），支持 Linux Multi-Touch Protocol Type B。
   - 核心参数：
     - `ABS_MT_SLOT`：Min 0, Max 1（严格支持 2 个独立并发触控槽位：Slot 0 与 Slot 1）；
     - `ABS_MT_POSITION_X`：Min 0, Max 480；
     - `ABS_MT_POSITION_Y`：Min 0, Max 960；
     - `BTN_TOUCH` 与 `ABS_MT_TRACKING_ID` 正常可用。
   - 屏幕旋转与渲染架构：Weston 配置文件 `/etc/xdg/weston/weston.ini` 设置 `transform=rotate-90`，将物理 480x960 映射为逻辑 960x480 横屏环境。

2. **原生双槽位实证对抗探测器构建与执行**：
   - 针对原有测试工具使用独立 shell 进程分别调用 `tap_mt` 与 `swipe` 导致的非严格双槽位并发问题，独立实现了 Native C 对抗探测工具 `tools/dev_multitouch_probe.c`。
   - 使用 Zig 工具链交叉编译为 aarch64 原生二进制：
     `/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig cc -target aarch64-linux-gnu.2.36 -O2 tools/dev_multitouch_probe.c -lm -o tools/dev_multitouch_probe`
   - 推送至真机并在真机前台运行中的 Half-Life 实例（PID 3671）上执行实证对决：
     - **Mode 1（虚拟摇杆连续比例与零死区实测）**：
       - 执行命令：`adb -s 9DA2200007506350 shell "/userdisk/halflife/dev_multitouch_probe --joystick"`
       - 实测结果：在 Slot 0 上实施从 5%（0.05）到 100%（1.00）的线性偏转（偏转半径由 3.8px 至 76px）及 16 方向圆周偏转，进程回执退出代码 0。引擎层 `wl_center` 实测捕获到连续坐标更新，未发生传统方向十字键在 50% 范围内的量化断续与阶跃死区。
     - **Mode 2（双槽位移动+视角并发实测）**：
       - 执行命令：`adb -s 9DA2200007506350 shell "/userdisk/halflife/dev_multitouch_probe --move-look"`
       - 真机运行时日志实测捕获：
         ```text
         [wl_center] touch_down id=0 x=116.9 y=133.6->26.6
         [wl_center] touch_down id=1 x=501.5 y=186.5->79.5
         [wl_center] touch_up id=1
         [wl_center] touch_up id=0
         ```
       - 实测结果：Slot 0 在左半屏虚拟摇杆（$x \le 0.26$）按住移动期间，Slot 1 在右半屏（$x \ge 0.26$）连续滑动视角。Slot 1 抬起释放时，Slot 0 依然维持按压与推移动作，两个槽位生命周期相互独立，未出现触点互串或视角跳动。
     - **Mode 3（虚拟摇杆按住与右侧高频战斗按键防抢占实测）**：
       - 执行命令：`adb -s 9DA2200007506350 shell "/userdisk/halflife/dev_multitouch_probe --anti-preemption"`
       - 真机运行时日志实测捕获：
         ```text
         [wl_center] touch_down id=0 x=116.9 y=133.6->26.6
         [wl_center] touch_down id=1 x=781.2 y=193.5->86.5
         [wl_center] touch_up id=1
         [wl_center] touch_down id=1 x=891.1 y=118.6->11.6
         [wl_center] touch_up id=1
         [wl_center] touch_down id=1 x=891.1 y=218.4->111.4
         [wl_center] touch_up id=1
         [wl_center] touch_down id=1 x=681.3 y=143.6->36.6
         [wl_center] touch_up id=1
         [wl_center] touch_up id=0
         ```
       - 实测结果：Slot 0 持续推移摇杆时，Slot 1 连续触发 fire、jump、use、reload 等按键。每次按键在 `Touch_ButtonPress` 处理后立即 `break`，未下渗渗透至底层 `touch_look`，未造成视角跳变或抢占；期间 Slot 0 始终保持按住状态，未发生误释放。
     - **Mode 4（视口边缘与越界极限坐标抗扰实测）**：
       - 针对 $y \in [0, 106]$（顶部黑边）、$y=107$（视口顶沿）、$y=372$（视口底沿）、$y \in [373, 479]$（底部黑边）以及负数和越界数值（$y=-50, -1, 480, 600$）进行高频注入。
       - 真机运行时捕获日志：`[wl_center] Blocked xdg_toplevel opcode 12 (keeping strict fullscreen)`，所有越界坐标均被截断至 $[0, 265]$ 视口区间内，进程稳定存活，未触发浮点或内存崩溃。
     - **5 轮全量高频压力对抗**：
       - 执行命令：`adb -s 9DA2200007506350 shell "for i in 1 2 3 4 5; do /userdisk/halflife/dev_multitouch_probe --all || exit 1; done"`
       - 实测结果：5 轮循环测试全部通过，退出代码为 0，底层引擎 `xash3d` 进程 PID 持续保持，无崩溃与僵死现象。

3. **画面居中与黑边像素级实测验证**：
   - 通过 XRCON `snapshot` 指令触发引擎帧缓冲生成 `/userdisk/halflife/_0000.png` 并拉取分析。
   - 解析结果：分辨率严格为 960x480。
   - 像素统计：
     - 纯黑像素比例为 44.5833%（恰好等于上下各 107px 黑边像素占比：$\frac{214}{480} = 44.5833\%$）；
     - 游戏视口像素比例为 55.4167%（恰好等于居中 266px 视口像素占比：$\frac{266}{480} = 55.4167\%$）；
     - 逐行扫描验证：顶部第 0~106 行完全为纯黑（0 像素非黑），中间 266 行包含实际三维场景绘制，上下黑边宽度完全对称，无垂直偏移或抖动。

4. **端到端测试套件全量复现**：
   - 确保宿主机 27000 端口映射正常后，执行：
     `python3 tools/test_e2e_verification.py --serial 9DA2200007506350`
   - 实测结果：
     - 总用例数：127
     - 通过数：127
     - 失败数：0
     - 通过率：100.0%
     - 退出代码：0
   - 本地回归测试套件独立复现：
     - `tools/test_controls.py`：5 项用例通过（耗时 0.139s，退出代码 0）；
     - `tools/test_lifecycle.mjs`：3 项用例通过（耗时 830ms，退出代码 0）；
     - `tools/test_xrcon.py`：17 项用例通过（耗时 19.650s，退出代码 0）。

## 2. Logic Chain
1. **输入系统硬件真实性与协议支持性**：
   - 由 Observation 1 可知，`fts_ts` 触控驱动原生上报 `ABS_MT_SLOT`（Min 0, Max 1），物理硬件完整支持双触控槽位并发。
   - 通过在 Observation 2 中编写的原生 Type B 协议注入器，验证了两个物理 Slot 能够同时向内核和 Weston 发送触摸轨迹。

2. **双指并发隔离与防抢占有效性**：
   - 由 Observation 2 Mode 2 日志可见，`touch_down id=0` 与 `touch_down id=1` 同时在线且各自响应独立手势，Slot 1 的释放并未影响 Slot 0 的持续按压状态。
   - 由 Observation 2 Mode 3 日志可见，在 Slot 0 按住虚拟摇杆期间，Slot 1 连续触发战斗按键，按键处理后由于存在 `break` 语句阻断，事件未被后续的 `touch_look` 捕获，消除了视角跳动与抢占。

3. **虚拟摇杆无级模拟量与无死区验证**：
   - 由 Observation 2 Mode 1 可知，摇杆在 5% 至 100% 的径向偏转范围内逐级触发平滑移动坐标，数学模型中 `amount = min(length, 1.0)` 与 `side = sx / length * amount` 自微小位移起即产生连续浮点速度分量，消除了旧版十字键在小于 50% 偏转时产生的阶跃死区。

4. **居中视口与黑边稳定性**：
   - 由 Observation 3 图像直方图与扫描行分析可知，960x480 的合成表面中，有效游戏画面高度严格限制为 266px，上下黑边宽度均为 107px。
   - 由 Observation 2 Mode 4 边界测试可知，所有落在黑边区间或屏幕外的触控输入均被 `libwl_center.so` 截断在 $[0, 265]$ 内，同时拦截了破坏全屏的 `xdg_toplevel` 操作码，确保了显示居中性不被外部输入破坏。

5. **全流程回归完备性**：
   - 由 Observation 4 可知，所有本地回归测试与真机全量 127 项 E2E 测试均由挑战者独立执行通过，退出码严格为 0，证实系统在持续压力下具备稳定运行能力。

## 3. Caveats
- 真机通过 XRCON 端口（27000）通信时，宿主机在执行 `test_xrcon.py`（自建本地 Server）与 `test_e2e_verification.py`（连接真机端口映射）之间需要通过 `adb forward --remove` 进行端口控制权的切换，避免端口绑定冲突。

## 4. Conclusion
裁决结果：**`APPROVE`**。
经由真机原生多槽位并发注入、视角防抢占实测、虚拟摇杆零死区线性偏转验证以及视口像素级直方图核验，M3 里程碑的原生小应用触控与显示系统在极限压力对抗下保持稳定，各项功能规约与验收标准全部达成。

## 5. Verification Method
独立复现验证步骤如下：

1. **编译并执行真机双槽位对抗探测器**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   /Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig cc -target aarch64-linux-gnu.2.36 -O2 tools/dev_multitouch_probe.c -lm -o tools/dev_multitouch_probe
   adb -s 9DA2200007506350 push tools/dev_multitouch_probe /userdisk/halflife/dev_multitouch_probe
   adb -s 9DA2200007506350 shell "chmod +x /userdisk/halflife/dev_multitouch_probe && /userdisk/halflife/dev_multitouch_probe --all"
   ```
   期望输出：4 项对抗测试全部显示 `[PASS]`，退出代码为 0。

2. **真机 127 项全量端到端测试验收**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   adb -s 9DA2200007506350 forward tcp:27000 tcp:27000
   python3 tools/test_e2e_verification.py --serial 9DA2200007506350
   ```
   期望输出：127 个测试用例全部 `PASS`，退出代码为 0。

3. **本地单元与回归测试核验**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   python3 tools/test_controls.py
   node tools/test_lifecycle.mjs
   adb forward --remove-all
   python3 tools/test_xrcon.py
   ```
   期望输出：全部用例绿灯通过，退出代码为 0。
