# Scope: Milestone 1 — 启动崩溃修复与架构原生化

## Architecture
- **运行平台**：网易有道词典笔 6 代（YDPX6-2，Melon Pro RK3562，aarch64 Linux 5.10.160，PenOS 4.3.5 / Falcon 容器框架）。
- **设备序列号**：`9DA2200007506350`。
- **目标交付物**：
  1. `tools/build_amr.py`：构建脚本在打包时只将 `libjsapi_hl.so` 放置于 `libs/arm64/` 与 `libs/arm64-orange/`，移除 `libwl_center.so` 拷贝与打包参数，移除对包内 `libwl_center.so` 的校验。
  2. `tools/install_amr.py`：删除解包验证中对 `libwl_center.so` 的检查；确保将本地 `libs/libwl_center.so` 推送至 `/userdisk/halflife/libwl_center.so`；所有 ADB 命令添加 `-s 9DA2200007506350`。
  3. `src/pages/index`：删除无用的残留目录，保持 `src/manifest.json` 与 `src/app.json` 的单页面直接拉起配置，确保 Falcon 生命周期原生全屏启动游戏引擎。
  4. `assets/app_icon.png`：从 `/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns` 提取标准清晰的官方正版 Lambda 图标并替换。
- **验收标准**：
  - AMR 构建成功，解压检查包内 `libs/arm64/` 仅含 `libjsapi_hl.so`，不含 `libwl_center.so`。
  - 通过 `install_amr.py` 成功将 AMR 安装至目标设备 `9DA2200007506350`，并将 `libwl_center.so` 推送到 `/userdisk/halflife/libwl_center.so`。
  - 在设备上启动应用后，Falcon 不发生死锁闪退，`xash3d` 进程正常运行。
  - 应用图标更新为 Valve 官方高清 Lambda 图像。

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 启动死锁修复与动态库隔离 | build_amr.py 剔除 libwl_center.so 打包，AMR 仅保留 libjsapi_hl.so；libwl_center.so 放置于 /userdisk/halflife/libwl_center.so | M1 | R1 |
| 2 | 全屏直启与纯原生 mini APP | 彻底废除二级启动器界面与外部 shell 脚本，由 Falcon 生命周期直接原生全屏拉起引擎 | M1 | R1, 追加指令 2 |
| 3 | 官方原版高清 Lambda 图标 | 从 Steam 官方正版 game.icns 提取 512x512 高清 Lambda 资产并部署为 assets/app_icon.png | M1 | 追加指令 1 |

## Interface Contracts
### AMR 内部动态库规约
- `libs/arm64/libjsapi_hl.so`：Falcon 原生扩展库，导出 `custom_init_jsapis` 符号。
- 严禁在 `libs/` 中打包拦截库 `libwl_center.so`。

### 运行时动态库注入规约
- 设备端路径：`/userdisk/halflife/libwl_center.so`。
- 注入机制：由 `libjsapi_hl` 在 `fork()` 后通过 `setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1)` 注入给 `xash3d` 进程。

### ADB 通信规约
- 目标设备统一为 `-s 9DA2200007506350`。
