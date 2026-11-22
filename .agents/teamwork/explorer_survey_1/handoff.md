# 半条命基础架构与构建启动勘查交接报告 (Explorer 1 Handoff)

## 1. 勘查观测记录 (Observation)

### 1.1 构建与打包配置现状
- **构建脚本文件**：`/Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py`
  - 第 181-186 行：
    ```python
    for arch in ["arm64", "arm64-orange"]:
        arch_dir = os.path.join(BINS_DIR, "libs", arch)
        os.makedirs(arch_dir, exist_ok=True)
        shutil.copy(so_src, os.path.join(arch_dir, "libjsapi_hl.so"))
        shutil.copy(wl_so, os.path.join(arch_dir, "libwl_center.so"))
    ```
  - 第 199-202 行：调用 `pack_amr.py` 时传入：
    ```python
    "--lib", f"arm64={so_src}",
    "--lib", f"arm64={wl_so}",
    "--lib", f"arm64-orange={so_src}",
    "--lib", f"arm64-orange={wl_so}"
    ```
  - 第 210-214 行：AMR 构建后强制校验包内包含 `libwl_center.so`：
    ```python
    if archive.read(f"libs/{arch}/libwl_center.so") != wl_bytes:
        raise RuntimeError("包内居中插件与编译产物不一致，停止安装")
    ```
- **安装脚本文件**：`/Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py`
  - 第 54-55 行校验 AMR 包必须包含 `libwl_center.so`：
    ```python
    if not archive.read(f'libs/{arch}/libwl_center.so').startswith(b'\x7fELF'):
        raise RuntimeError('包内居中插件 libwl_center.so 无有效 ELF 头，拒绝安装')
    ```
  - 第 63-65 行已存在将 `libwl_center.so` 单独推送到设备 `/userdisk/halflife/` 的逻辑：
    ```python
    wl_center_local = HERE / 'libs' / 'libwl_center.so'
    if wl_center_local.is_file():
        subprocess.run([ADB, 'push', str(wl_center_local), '/userdisk/halflife/libwl_center.so'], check=True)
    ```

### 1.2 动态库符号与真机解压事实
- **真机解压目录**：`/userdisk/miniapp/data/mini_app/pkg/8002026110400001/b/libs/`
  - 真机执行检查输出：
    ```
    -rw-r--r-- 1 root root 132048 Nov  7 11:56 /userdisk/miniapp/data/mini_app/pkg/8002026110400001/b/libs/libjsapi_hl_1753655547.so
    -rw-r--r-- 1 root root 132160 Nov  7 11:56 /userdisk/miniapp/data/mini_app/pkg/8002026110400001/b/libs/libwl_center_1753655547.so
    ```
  - Falcon 框架在安装 AMR 时，将包内 `libs/arm64/` 下的所有动态库提取至上述路径并附带 hash 后缀。
- **动态库源码符号对比**：
  - `libjsapi_hl.c`（第 486-489 行）：包含导出符号 `custom_init_jsapis`，向 QuickJS 运行时注册 `hl` 原生模块。
  - `wl_center.c`（第 305-365 行）：无 `custom_init_jsapis` 符号，导出并拦截了全局符号 `dlsym`、`SDL_LoadFunction`、`wl_proxy_add_listener`、`wl_display_connect`、`wl_egl_window_create`、`wl_egl_window_resize`。内部 `dlsym` 拦截逻辑调用 `dlvsym(RTLD_NEXT, "dlsym", ...)`。
  - `libjsapi_hl.c`（第 325-329 行）：在 `fork` 子进程后，通过 `LD_PRELOAD` 将 `libwl_center.so` 注入给 `xash3d` 进程：
    ```c
    if (access("/userdisk/halflife/libwl_center.so", R_OK) == 0) {
        setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1);
    }
    ```

### 1.3 启动器界面与 Falcon 生命周期现状
- **现有文件与配置**：
  - 存在空目录：`/Volumes/500GB/Ydpen/halflife_app/src/pages/index`（无内容）。
  - `src/manifest.json`：页面配置为 `"pages": ["pages/game/game"]`。
  - `src/app.json`：页面映射为 `"pages": { "game": "pages/game/game.js" }`。
  - `src/app.js`：定义继承自 `$falcon.App` 的应用程序类，在 `onLaunch` 时调用 `this.setViewPort(960)`。
  - `src/root.js`（构建后为 `Component.js.bin`）：在组件 `onShow()` 与 `mounted()` 生命周期钩子中直接调用 `this.launchGame()`，通过 `hl.start({ basedir: '/userdisk/halflife' })` 启动底层引擎，不包含任何外部点击启动按钮。
- **千恋万花（`senren-banka-ydpen-port`）对比**：
  - 纯原生 mini APP，由 Falcon 容器拉起小应用生命周期后，由组件树直接挂载原生逻辑，没有外部辅助 shell 脚本（如 `run_game.sh`）或独立启动前置器。

### 1.4 应用图标资产现状与官方资源定位
- **当前应用图标**：`/Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png`
  - 规格：PNG 图像，120x120，8-bit RGBA。视觉细节被评定为自制粗糙。
- **Valve / Steam 官方原版高清图标定位**：
  - 本地路径：`/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns`
  - 规格：Mac OS X 原生图标文件，容量 185,830 字节，包含最高 512x512 分辨率的原生官方 Half-Life Lambda 高清图标。

### 1.5 硬件与 ADB 连接环境
- 执行 `/opt/homebrew/bin/adb devices -l` 发现两台连接设备：
  - `2C11200001902234`
  - `9DA2200007506350`
- 通过输入口令 `ydpen2026` 执行 `shell auth` 验证：
  - `2C11200001902234` 返回 `password incorrect!`
  - `9DA2200007506350` 返回 `success.`，系统为 Buildroot 2021.11 / Linux 内核 5.10.160 aarch64，设备型号为 6 代有道词典笔（RK3562 Melon Pro）。
  - 设备上 `/userdisk/halflife` 目录已具备完整的半条命游戏数据与 `libwl_center.so` 运行库。

---

## 2. 推理推导链 (Logic Chain)

1. **Falcon 启动死锁闪退机理**：
   - 依据观测 1.1 与 1.2，AMR 安装包将 `libwl_center.so` 放置于包内 `libs/arm64/`。
   - Falcon 小应用在真机启动时，会自动遍历解压路径 `/userdisk/miniapp/data/mini_app/pkg/<appid>/b/libs/` 下的所有动态库，并逐一对每个库调用 `dlopen`，尝试查找 `custom_init_jsapis` 注册 JSAPI。
   - `libwl_center.so` 并非 Falcon JSAPI 插件，而是设计给 `xash3d` 游戏引擎使用的 Wayland/EGL 拦截注入库。
   - 当 Falcon 宿主进程对其执行 `dlopen` 时，`libwl_center.so` 导出的全局 `dlsym` 拦截函数生效，且其内部通过 `dlvsym(RTLD_NEXT, "dlsym", ...)` 进行动态符号解析。在动态链接器处理多线程初始化的上下文中，这会造成 glibc 内部 rtld 锁竞争，形成死锁；同时其劫持的 Wayland 客户端通信破坏了 Falcon 进程与 Weston 合成器的连接，最终导致 Falcon 进程无响应或崩溃闪退。

2. **解决动态库冲突的架构方案**：
   - 依据观测 1.1 与 1.2，`libwl_center.so` 仅供 `xash3d` 子进程使用，且 `libjsapi_hl.c` 中在 `fork()` 后通过环境变量 `setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1)` 进行挂载。
   - 因此，AMR 安装包中的 `libs/arm64/` 必须且仅能包含 `libjsapi_hl.so`。
   - 修改 `build_amr.py` 移除向 `BINS_DIR/libs/` 拷贝 `libwl_center.so` 以及在 `pack_amr.py` 中打包该库的参数，并移除对应的 zip 内部校验。
   - `libwl_center.so` 仅需通过 `install_amr.py` 推送至 `/userdisk/halflife/libwl_center.so`。这样 Falcon 进程在加载小应用插件时，永远不会触及 `libwl_center.so`，彻底解除死锁风险。

3. **原生 mini APP 全屏直启推进方案**：
   - 依据观测 1.3，`halflife_app` 的代码架构已具备在组件 `onShow()` / `mounted()` 中直接调用 `hl.start()` 的能力。
   - 为符合纯原生 mini APP 规范，需彻底删除未使用的空目录 `src/pages/index`；确保应用启动过程中不呈现中间按钮界面；保证返回键接管、息屏保存与退出生命周期的稳定性。
   - `tools/install_amr.py` 与自动化测试脚本必须显式配置目标序列号 `-s 9DA2200007506350`，避免多设备环境下 ADB 报错中断。

4. **官方高清图标部署方案**：
   - 依据观测 1.4，Steam 官方 Half-Life 原版目录中存在 512x512 高精度图标文件 `game.icns`。
   - 使用 macOS 内置工具 `sips` 将其转为 120x120（或 144x144）的标准 PNG 图像，输出到 `assets/app_icon.png`，在打包时装配进 AMR 根目录，即可完全满足用户对正版官方高清 Lambda 图标的要求。

---

## 3. 注意事项与边界说明 (Caveats)

1. **多设备 ADB 并行环境**：宿主机同时连接了 `2C11200001902234` 和 `9DA2200007506350`。后续所有执行构建安装和自动化测试的脚本，必须显式附加 `-s 9DA2200007506350`，否则会触发 ADB 多设备冲突错误。
2. **Wayland 本地编译依赖**：`halflife_app/libs/libwl_center.so` 目前已有现成编译产物；如需本地重新构建，需要注意 `/tmp/dev_libs/libwayland-client.so` 在系统重启后可能丢失，可从词典笔 `/usr/lib/libwayland-client.so.0` 拉取补充。
3. **只读勘查范围**：本 Agent 未对业务代码及构建脚本进行任何写入修改，所有改动建议由后续负责实施的 Agent 执行。

---

## 4. 勘查结论 (Conclusion)

1. **构建打包脚本改动点清晰明了**：
   - 在 `tools/build_amr.py` 中：剔除 `libwl_center.so` 拷贝至 `BINS_DIR/libs/arm64` 与 `libs/arm64-orange` 的逻辑；剔除调用 `pack_amr.py` 时的 `--lib arm64=...libwl_center.so` 参数；删除 zip 校验中对 `libs/{arch}/libwl_center.so` 的检查。
   - 在 `tools/install_amr.py` 中：删除解包验证中对 `libs/{arch}/libwl_center.so` 的断言；所有 ADB 调用统一添加 `-s 9DA2200007506350`；保留将本地 `libs/libwl_center.so` 独立推送到 `/userdisk/halflife/libwl_center.so` 的逻辑。
2. **纯原生直接启动方案可行且完备**：
   - 清理 `src/pages/index` 残留目录；
   - 保持 `src/manifest.json` 与 `src/app.json` 的直启配置，由 Falcon 生命周期函数直接调用 `hl.start()` 拉起 `xash3d`，消除二级启动器界面与外部脚本依赖。
3. **官方高清图标资源位置明确**：
   - 官方源文件路径为 `/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns`。
   - 提取并覆盖 `assets/app_icon.png` 即可完成正版高清资产的部署。

---

## 5. 独立验证方法 (Verification Method)

后续执行 Agent 完成修改后，可通过以下命令进行独立验证：

1. **图标提取验证**：
   ```bash
   sips -s format png -z 120 120 "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
   file /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
   ```
2. **AMR 包内容独立检验**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   unzip -l /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr | grep libs/
   ```
   *检验标准*：输出中仅允许出现 `libs/arm64/libjsapi_hl.so` 与 `libs/arm64-orange/libjsapi_hl.so`，绝对不能出现 `libwl_center.so`。
3. **真机安装与启动验证**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "miniapp_cli start 8002026110400001"
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "pidof xash3d"
   ```
   *检验标准*：Falcon 正常启动无死锁闪退，`xash3d` 进程 PID 正常生成并在全屏展示游戏画面。
