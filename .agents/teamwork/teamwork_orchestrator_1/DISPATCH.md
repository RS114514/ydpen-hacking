# Dispatch History

## 2026-11-15T14:44:30Z

全面定位并修复有道词典笔 6 代上 Half-Life 原生小应用遗留问题：将左侧移动改为连续比例虚拟摇杆以解决尺寸过小与死区问题，修复移动与视角旋转及右侧按钮的触控抢占冲突，验证 y=107 居中显示与上下黑边稳定性，修复 NPC 站立姿态，完善触控暂停菜单与存档流程，并完成真机端到端测试。

Working directory: /Volumes/500GB/Ydpen/halflife_app
Integrity mode: development

## Verification Resources
- 目标设备：有道词典笔 6 代（YDPX6-2，ADB 序列号 `9DA2200007506350`，若连接 3 代笔严禁操作）。
- 构建与部署工具：`tools/build_amr.py`（使用指定 zig 编译器构建，exFAT 需先输出至 `/tmp/` 再复制）、`tools/install_amr.py`。
- 测试与探测工具：`dev_probe`（支持 XRCON 命令、KEY_POWER 唤醒、双槽位并发触控注入）、本地测试脚本（`test_controls.py`、`test_lifecycle.mjs`、`test_xrcon.py`）及真机端到端测试（`test_e2e_verification.py --serial 9DA2200007506350`）。

## Requirements

### R1. 重构移动触控为连续比例虚拟摇杆并消除视角冲突
- 将左侧移动控制替换为连续比例虚拟摇杆（Joystick），消除十字键死区过大与按键尺寸过小的问题；
- 解决反编译查明的 `Touch_ButtonPress` 遍历无 break 导致底层 `_look` 区域被右侧操作按钮（fire/jump/use 等）抢占或并发触发的问题；
- 调整 `touch.cfg` 与按键布局，确保双指并发操作时移动与视角旋转互不干扰、视角不发生乱飞。

### R2. 验证 y=107 居中显示与画面稳定性
- 验证 `libwl_center.so` 在 SDL2 环境下的 `dlsym` 拦截与 `xdg_surface.ack_configure` 缓冲挂载机制；
- 确保 960x266 游戏画面严格在 y=107 居中显示，上下黑边正常；
- 启动与多次重进过程中无 Wayland 协议异常，彻底消除画面随机向上或向下偏移问题。

### R3. 验证 NPC 姿态与游戏生命周期管理
- 验证场景内科学家与保安 NPC 保持正常立姿，无前倾或倒立异常；
- 验证触控暂停菜单、快速存读档功能可用；
- 验证原生 Falcon 小应用在返回退出时自动保存，再次进入时自动恢复存档继续游玩。

### R4. 打包部署与全量自动化测试
- 使用 `build_amr.py` 重新打包原生 `.amr` 并通过 `install_amr.py` 全量部署至 6 代真机；
- 运行并全部通过本地测试（`test_controls.py`、`test_lifecycle.mjs`、`test_xrcon.py`）与真机端到端全量测试（`test_e2e_verification.py --serial 9DA2200007506350`）。

## Acceptance Criteria

### 触控与操作
- [ ] 左侧移动控制替换为连续比例虚拟摇杆，响应灵敏无大面积死区
- [ ] 真机双指并发触控注入测试中，按住虚拟摇杆移动的同时滑动旋转视角或点击右侧操作按钮，视角稳定不发生乱跳或抢占
- [ ] 右侧战斗与交互按钮正常响应且不误触发底层视角转动

### 显示与渲染
- [ ] 屏幕呈现 960x266 居中显示，y 轴偏移固定为 107，上下黑边正常
- [ ] 进程存活稳定，无 Weston xdg_surface 协议错误，冷启动多次均无随机偏移

### 游戏功能与生命周期
- [ ] 场景中科学家与保安 NPC 姿态正常，无倒立或前倾趴地异常
- [ ] 触控暂停菜单可正常弹出、操作与关闭
- [ ] 小应用按返回退出时自动保存，重新进入能正确恢复游戏进度继续游玩

### 构建与测试验证
- [ ] `build_amr.py` 与 `install_amr.py` 成功完成编译打包与真机部署
- [ ] 本地测试脚本全部返回 0
- [ ] 真机端到端测试 `python tools/test_e2e_verification.py --serial 9DA2200007506350` 全部执行通过
