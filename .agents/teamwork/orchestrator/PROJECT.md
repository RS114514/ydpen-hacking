# Project: Half-Life 1 (Xash3D) YDPX6-2 Native Porting & Adaptation

## Architecture
- **运行平台**：网易有道词典笔 6 代（YDPX6-2，Melon Pro RK3562，aarch64 Linux 5.10.160，PenOS 4.3.5 / Falcon 容器框架）。
- **设备序列号**：`9DA2200007506350`。
- **微应用架构**：纯原生 Falcon mini APP（对标千恋万花架构），由 `src/root.js` 组件生命周期直接调用 `libjsapi_hl.so` 模块中的 `hl.start()` 原生启动游戏引擎，彻底废除二级启动器界面与外部 shell 脚本。
- **动态库隔离**：
  - AMR 安装包内 `libs/arm64/` 仅保留 `libjsapi_hl.so`（Falcon 原生 JSAPI 插件）。
  - 拦截库 `libwl_center.so` 部署于设备 `/userdisk/halflife/libwl_center.so`，由 `libjsapi_hl` 在 `fork()` 后通过 `LD_PRELOAD` 单独注入给 `xash3d` 子进程，彻底解决 Falcon 框架在扫描 `b/libs/` 时 dlopen 触发的死锁闪退。
- **触控与输入**：
  - 物理竖屏 480×960，横屏渲染 960×266（居中偏移 107 像素）。
  - 多点触控并发：左半屏（0..0.26）物理隔离 D-Pad 四向移动与身法键；右半屏（0.26..1.0）负责滑动视角与战斗操作按键。视角指针独占，操作按键享有倒序扫描优先权。
  - 按键槽位隔离：下蹲使用槽位 71（`+duck 71`，带锁存 4096），向前大跳使用槽位 72（`+cjump` 宏），普通跳跃使用槽位 73（`+jump 73`）。
- **NPC 姿态渲染**：
  - 在客户端模型渲染管线（`StudioModelRenderer.cpp`）与服务端怪兽逻辑（`monsters.cpp`）中，对地面行走的人形 NPC 强制重置 Pitch/Roll 轴为 0，彻底消除科学家与 Barney 前倾 90 度趴地走动的问题。
- **暂停菜单与存读档**：
  - 黑山基地黑橙工控风格美学（背景 `#000000`，主体 `#F57E00`，高亮 `#FFA500`），960×266 屏幕内居中完整排版。
  - 屏幕常驻快速存读档按键与 XRCON `save quick` / `load quick` 结合，通过 `/userdisk/halflife/valve/save/quick.sav` 时间戳双向确认。

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 启动死锁修复与动态库隔离 | build_amr.py 剔除 libwl_center.so 打包，AMR 仅保留 libjsapi_hl.so；libwl_center.so 放置于 /userdisk/halflife/libwl_center.so | M1 | R1 |
| 2 | 全屏直启与纯原生 mini APP | 彻底废除二级启动器界面与外部 shell 脚本，由 Falcon 生命周期直接原生全屏拉起引擎 | M1 | R1, 追加指令 2 |
| 3 | 官方原版高清 Lambda 图标 | 从 Steam 官方正版 game.icns 提取 512x512 高清 Lambda 资产并部署为 assets/app_icon.png | M1 | 追加指令 1 |
| 4 | 全套触控按键完整覆盖 | 补齐快速存读档按键，配置 D-Pad 四向键、下蹲、跳跃、大跳、主副火、互动、换弹、手电、切枪、菜单全套按键 | M2 | R2 |
| 5 | 向前大跳无向后异常 | 优化 +cjump 宏（+forward; +jump 72; wait; +duck 72），确保前进初速度注入 | M2 | R2 |
| 6 | 多点触控并发防冲突 | 左右屏物理分区隔离、视角指针独占追踪与按键多槽位隔离，实现边移动边滑屏视角边射击跳跃 | M2 | R2 |
| 7 | NPC 身体前倾趴地姿态修复 | 在 StudioModelRenderer 与怪兽实体逻辑中强制归零地面 NPC Pitch 轴，恢复科学家与 Barney 直立姿态 | M3 | R3 |
| 8 | 黑橙工控风居中暂停菜单 | 960x266 屏幕内居中完整排版，契合黑山基地黑橙美学，按键尺寸与对比度适中 | M3 | R4 |
| 9 | Save/Load 存读档可靠闭环 | XRCON save/load quick 与 quick.sav 时间戳及文件大小校验，确保进度有效保存与恢复 | M3 | R4 |
| 10 | 全流程 105 个关卡完整性核验 | 验证 c0a0 至 c5a1 全序列 BSP、模型、音频与字幕资产完整，无卡关与死锁崩溃 | M4 | R5 |
| 11 | 真机端到端自动化测试与验收 | 自动化脚本在 6 代真机（-s 9DA2200007506350）上完成安装、全屏直启、多点按键遍历、NPC截图核验、菜单截图、存读档与大结局加载，输出全套证据 | M4 | R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 启动崩溃修复与架构原生化 | 修复 build_amr.py 动态库隔离、清除 index 启动器、部署官方高清图标、实现全屏直启 | none | IN_PROGRESS (conv: a13e7502-fdc7-4bd2-8a07-22f1b4ea562d) |
| M2 | 全功能触控 GUI 与多点并发 | 补充 quicksave/quickload 按键、优化 touch.cfg 与大跳宏、更新 test_controls.py 断言 | none (并行启动) | IN_PROGRESS |
| M3-A | NPC 姿态修复 (hlsdk) | 修复 NPC 骨骼俯仰前倾趴地问题，在 StudioModelRenderer 与 monsters 逻辑强制归零 Pitch/Roll 并编译 client.so 与 hl.so | none (并行启动) | IN_PROGRESS |
| M3-B | 黑橙工控暂停菜单与存读档 | 优化 960x266 黑橙工控居中暂停菜单排版、触控适配与 XRCON quicksave/quickload 存读档数据流 | none (并行启动) | IN_PROGRESS |
| M4 | 全流程通关验证与真机自动化验收 | 100% 通过真机自动化端到端测试（Tiers 1-4），白盒对抗性覆盖测试（Tier 5），真机截图与交付日志 | M1, M2, M3-A, M3-B, TEST_READY | PLANNED |

## Interface Contracts
### Falcon Mini APP ↔ Half-Life Native Runtime
- **启动接口**：`hl.start({ basedir: '/userdisk/halflife' })` -> 在子进程 `fork()` 后设置 `LD_PRELOAD=/userdisk/halflife/libwl_center.so` 并 `execve("/userdisk/halflife/xash3d")`。
- **通信接口**：XRCON UDP 套接字通信（`127.0.0.1:27000`），发送控制台指令（`save quick`, `load quick`, `map <mapname>`, `quit`）。
- **存档协议**：存储于 `/userdisk/halflife/valve/save/quick.sav`，通过检查文件的修改时间与大小确认持久化。

### Touch Subsystem ↔ Input Subsystem
- **硬件驱动输入**：`/dev/input/event1` 物理事件（480×960 竖屏）。
- **坐标映射变换**：横屏 960×266 对应物理 `px = 107 + cy * 1.2`, `py = 959 - cx * 1.2`。
- **Wayland 中间层**：`wl_center.c` 将 Y 坐标减去 107 像素校准并截断在 `[0, 265]`，透明透传触控槽位与 ID 给 Xash3D。
- **引擎分发**：`in_touch.c` 维护归一化坐标 `(0.0..1.0)`，区分 `look_finger` 与操作按键列表。

## Code Layout
- `halflife_app/tools/build_amr.py`：AMR 打包构建脚本（M1）。
- `halflife_app/tools/install_amr.py`：真机部署与安装脚本（M1, M4）。
- `halflife_app/assets/app_icon.png`：官方 Lambda 高清应用图标（M1）。
- `halflife_app/src/`：Falcon 小应用前端生命周期（M1）。
- `halflife_app/assets/valve/touch.cfg`：全套触控按键布局配置文件（M2）。
- `halflife_app/assets/valve/userconfig.cfg`：按键别名宏定义（含 +cjump 向前大跳）（M2）。
- `halflife_app/tools/test_controls.py`：触控按键单元与边界测试（M2）。
- `halflife_app/native/`：客户端渲染与服务怪兽相关修复（M3）。
- `halflife_app/tools/test_e2e_verification.py`：真机全功能端到端自动化测试脚本（M4）。
