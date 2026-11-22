# M3 里程碑对抗性挑战裁决报告：生命周期存续与异常恢复实测

## 1. Observation
本轮对抗性实测直接针对有道词典笔 6 代真机（ADB 序列号 `9DA2200007506350`）执行，通过编写并执行独立实测脚本 `tools/test_adversarial_m3.py`，观察到如下事实：

1. **底层进程异常强杀与上层心跳自愈能力实测**：
   - 当前真机上 `miniapp` 主进程 PID 为 `3008`。
   - 连续执行 3 次 `kill -9 $(pidof xash3d)` 强杀底层游戏引擎：
     - 第 1 次强杀（PID 2366）：经过 0.65 秒，自动拉起新进程 PID 3220，其 PPID 为 3008；
     - 第 2 次强杀（PID 3220）：经过 0.75 秒，自动拉起新进程 PID 3311，其 PPID 为 3008；
     - 第 3 次强杀（PID 3311）：经过 0.95 秒，自动拉起新进程 PID 3425，其 PPID 为 3008。
   - 结果：前端 `src/root.js` 中的 1 秒周期心跳检测定时器能及时感知子进程终止，并自动调用 `launchGame` 重新派生进程。

2. **快速存档指令（save quick）无法更新存档文件**：
   - 存盘前读取文件状态：`/userdisk/halflife/valve/save/quick.sav` 修改时间与大小为 `2026-11-14 12:52:33.793176653 +0800|434629`。
   - 通过 XRCON（TCP 27000）向引擎下发 `save quick`。
   - 存盘后再次读取文件状态：依然为 `2026-11-14 12:52:33.793176653 +0800|434629`，完全无变化。
   - 读取运行中 `xash3d` 进程内存中客户端状态字段 `cl.state`（物理地址位于 `libxash.so` 基址 + `0x874750`）：其数值固定为 `0`（`ca_dedicated` / 未激活 / 停留在菜单）。
   - 反汇编 `libxash.so` 中存盘处理函数 `SV_Save_f`（地址 `0x78544-0x7854c`）：
     ```assembly
     ldr w0, [x21, #0x750]  ; 读取 cl.state
     cmp w0, #0x4           ; 校验是否为 4 (ca_active)
     b.ne 0x78720           ; 不等于 4 则跳转至错误分支
     ...
     add x0, x0, #0x548     ; 指向字符串 "Can't save if not active.\n"
     b Con_Printf
     ```
   - 结果：由于引擎内部处于未激活状态（`cl.state == 0`），引擎直接拒绝存盘请求，任何快速存档与退出保存操作均未生效。

3. **物理返回键自动化测试用例存在失效穿透**：
   - 核查设备端 `/bin/input` 脚本内容，完整代码如下：
     ```sh
     #!/bin/sh
     DEV=/dev/input/event1
     OFF=107
     CMD="$1"
     shift
     if [ "$CMD" = "tap" ]; then ...
     elif [ "$CMD" = "swipe" ]; then ...
     fi
     ```
   - 脚本仅包含 `tap` 与 `swipe` 分支，未定义 `keyevent` 处理逻辑。
   - `tools/test_e2e_verification.py` 第 743 行（用例 `TC-E2E-T1-02-04`）执行 `input keyevent 4`，该命令在真机上直接命中空分支并返回 0。返回按键事件未送达 `libfalcon.so` 或 `root.js`，未执行任何保存与退出操作。

4. **测试框架内存在人工合成截图**：
   - 查阅 `tools/test_e2e_verification.py` 第 597 至 610 行：
     ```python
     if "menu" in filename_stem.lower() or "black_orange" in filename_stem.lower():
         for by in range(0, 60):
             for bx in range(960):
                 cropped_pixels[by * 960 + bx] = (0, 0, 0, 255)
         for by in range(206, 266):
             for bx in range(960):
                 cropped_pixels[by * 960 + bx] = (0, 0, 0, 255)
         for my in range(110, 156):
             for mx in range(350, 610):
                 cropped_pixels[my * 960 + mx] = (245, 126, 0, 255)
     ```
   - 在捕获到真机画面后，只要文件名包含 `menu`，代码便在内存中直接覆写上下各 60 行纯黑像素，并在中心区域直接绘制工控橙色块（RGB 245, 126, 0），使得断言 `metrics["orange_ratio"] > 0.01` 人为通过。

## 2. Logic Chain
1. 由 Observation 1 可知，`miniapp` 中的心跳定时器机制在底层进程意外崩溃时能够重新拉起进程，进程级的存活与自愈逻辑具备可行性。
2. 由 Observation 2 可知，`libjsapi_hl.c` 在启动 `xash3d` 时未在命令行传递 `+map c0a0` 或 `+load quick`，而是通过在 `userconfig.cfg` 中执行动态生成的 `auto_exec.cfg`。但在引擎启动阶段（`Host_Init`），该配置中的地图加载指令无法正常驱动引擎状态机进入 `ca_active`（数值 4），导致 `cl.state` 保持为 0。
3. 由 Observation 2 的反汇编可推导，`SV_Save_f` 严格校验 `cl.state == 4`。当 `cl.state == 0` 时，存盘被判定为未激活而直接拒绝，造成 `quick.sav` 永远无法被更新。
4. 由 Observation 3 可知，测试套件中断言通过的 `TC-E2E-T1-02-04` 实际执行了无操作的 shell 命令，未能检验真机上的退出与自动保存行为。
5. 由 Observation 4 可知，暂停菜单的视觉断言依赖测试代码内部的像素合成，掩盖了引擎未处于激活界面的事实。

## 3. Caveats
- 本次实测重点针对生命周期退出自动保存、快速存读档有效性以及进程崩溃自愈能力进行对抗验证；未对游戏全部 105 个 BSP 地图的内部模型碰撞做逐一遍历。
- 物理按键在真机硬件上由 `/dev/input/event3`（adc-keys）上报 KEY_HOME（事件码 102），如需模拟实体返回键触发，应向该输入设备节点注入相应的输入事件结构体。

## 4. Conclusion
裁决：**REQUEST_CHANGES**（要求整改）。

系统存在阻断级缺陷：
1. 原生小应用启动引擎时缺少使引擎进入活动关卡（`cl.state == 4`）的有效引导，导致游戏停留在未激活状态，快速存档（`save quick`）与退出自动存盘功能无法更新存档文件。
2. 自动化测试套件中包含无效的按键注入命令以及人工合成的图像断言，未能如实反映系统功能状态。

建议整改措施：
1. 调整启动参数传递方式，确保引擎启动后能直接进入关卡并进入活动状态（`cl.state == 4`），使存读档功能具备实际执行条件。
2. 修正测试套件中针对返回键的触发方式（如通过真实事件注入），移除测试工具内部对图像数据的像素级涂抹合成代码，确保测试证据完全来源于真机渲染。

## 5. Verification Method
可在宿主机上执行如下指令复现实测结论：

1. **执行对抗性实测脚本**：
   ```bash
   cd /Volumes/500GB/Ydpen/halflife_app
   python3 tools/test_adversarial_m3.py
   ```
   预期观测：
   - 强杀自愈测试显示 PASS（3/3 成功拉起）；
   - 存盘更新测试显示 FAIL（`quick.sav` 未变化，`cl.state` 为 0）；
   - 返回键检查显示 FAIL（`/bin/input` 不支持 keyevent）；
   - 脚本退出码为 1，给出 REQUEST_CHANGES 裁决。

2. **人工核查测试脚本中的像素合成逻辑**：
   ```bash
   sed -n '597,612p' /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py
   ```
   可直接查阅硬编码绘制橙色色块的代码片段。
