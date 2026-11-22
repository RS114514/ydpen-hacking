# Milestone 1 实施交接报告 (Worker M1.2 Handoff)

## 1. 勘查与实施观测记录 (Observation)

### 1.1 架构清理与元数据排查
- **残留目录排查与清理**：
  执行 `rm -rf /Volumes/500GB/Ydpen/halflife_app/src/pages/index` 与 `rm -f /Volumes/500GB/Ydpen/halflife_app/src/._*`。
  验证结果：
  ```bash
  ls -la /Volumes/500GB/Ydpen/halflife_app/src/pages
  # 输出: total 768, 仅包含 game 目录，index 目录已清除
  ```

### 1.2 官方原版 Steam 高清 Lambda 图标提取与规格验证
- **源文件路径**：
  `/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns`
- **提取命令**：
  ```bash
  sips -s format png "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
  ```
- **参数检验**：
  ```bash
  file /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
  # 输出: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
  sips -g pixelWidth -g pixelHeight -g format -g hasAlpha /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
  # 输出: pixelWidth: 512, pixelHeight: 512, format: png, hasAlpha: yes
  ```

### 1.3 构建脚本 `tools/build_amr.py` 改造
- 显式绑定目标设备：
  `TARGET_DEVICE = os.environ.get("YDPEN_SERIAL", "9DA2200007506350")`，所有 ADB 命令携带 `-s {TARGET_DEVICE}`。
- 动态库隔离策略：
  移除 `BINS_DIR/libs/` 下对 `libwl_center.so` 的拷贝，移除调用 `pack_amr.py` 时的 `--lib arm64={wl_so}` 与 `--lib arm64-orange={wl_so}` 参数。
- 打包断言升级：
  遍历 AMR 内部条目，断言 `libs/arm64/libjsapi_hl.so` 与 `libs/arm64-orange/libjsapi_hl.so` 存在且内容与编译产物一致；严格断言 `libs/` 路径下绝对不包含 `libwl_center.so`，且不包含任何多余非预期文件。
- 编译环境与文件缓存加固：
  在 macOS 外部卷（exFAT）环境下，Zig 生成动态库时直接写入 `/tmp/` 内存文件系统再拷贝回工程目录，消除因外置文件系统内存映射未及时同步导致的文件头空洞现象。

### 1.4 部署脚本 `tools/install_amr.py` 改造
- 显式绑定目标设备：
  所有 `subprocess` 调用的 ADB 指令均指定 `-s 9DA2200007506350`。
- 校验逻辑更新：
  解包检查断言 AMR 内仅包含有效 ELF 的 `libjsapi_hl.so`，显式断言包内不得存在 `libwl_center.so`。
- 外部依赖与残留清理：
  安装前执行 `rm -rf /userdisk/miniapp/data/mini_app/pkg/8002026110400001` 清理历史残留，推送本地 `libs/libwl_center.so` 至设备端 `/userdisk/halflife/libwl_center.so`。

### 1.5 `hl_runtime.log` 为 0 字节与自递归死锁分析修复
- **现场现象**：
  真机调用 `miniapp_cli start 8002026110400001` 后，子进程拉起即闪退，`/userdisk/halflife/hl_runtime.log` 为 0 字节。
- **GDB 回溯追踪**：
  在设备端通过 GDB 附加调试执行：
  ```
  #0  wl_display_connect (name=0x0) at halflife_app/native/wl_center.c:246
  #1  0x0000007fb3601600 in wl_display_connect (name=<optimized out>) at halflife_app/native/wl_center.c:252
  ...
  #124181 0x0000007fb3601600 in wl_display_connect (name=<optimized out>) at halflife_app/native/wl_center.c:252
  ```
  堆栈深度达 12 万层，最终触发 SIGSEGV（栈溢出）。
- **递归原因**：
  `native/wl_center.c` 中 `wl_display_connect` 内部调用 `dlsym(h, "wl_display_connect")` 获取真实函数指针，而全局 `dlsym` 被拦截器重定向，当请求符号匹配 `"wl_display_connect"` 时直接返回拦截器自身函数地址，导致函数不断递归调用自身。
- **源码修复**：
  在 `native/wl_center.c` 中建立 `init_real_dlsym`，在全局 `dlsym` 拦截逻辑中增加句柄判断：当传入句柄为特定动态库句柄（`handle != RTLD_DEFAULT && handle != RTLD_NEXT`）时，直接委托给底层系统的 `real_dlsym`；各内部挂钩获取函数指针时直接使用 `real_dlsym`。修改已同步回写至 `halflife_app/native/wl_center.c`。

### 1.6 真机实测与验证数据
- **AMR 包内结构验证**：
  ```bash
  unzip -l /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr | grep "libs/"
  # 结果:
  #   49736  11-13-2026 05:29   libs/arm64-orange/libjsapi_hl.so
  #   49736  11-13-2026 05:29   libs/arm64/libjsapi_hl.so
  ```
- **真机安装与文件格式验证**：
  ```bash
  /opt/homebrew/bin/adb -s 9DA2200007506350 shell "file /userdisk/halflife/libwl_center.so && file /userdisk/miniapp/data/mini_app/pkg/8002026110400001/*/app_icon.png && ls -la /userdisk/miniapp/data/mini_app/pkg/8002026110400001/*/libs/"
  # 结果:
  # /userdisk/halflife/libwl_center.so: ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), statically linked, with debug_info, not stripped
  # /userdisk/miniapp/data/mini_app/pkg/8002026110400001/a/app_icon.png: PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
  # libs 目录仅包含: libjsapi_hl_328300033.so
  ```
- **引擎拉起与运行日志**：
  启动后 `pidof xash3d` 返回进程号 `2820`。
  `/userdisk/halflife/hl_runtime.log` 产生持续输出（文件大小 9252 字节），记录完整的 GLES2 着色器编译与引擎初始化过程。
- **动态库加载与内存映射隔离**：
  ```bash
  # 检查 xash3d 进程映射:
  cat /proc/2820/maps | grep libwl_center
  # 结果: /userdisk/halflife/libwl_center.so 正常映射入 xash3d 内存空间 (r--p, r-xp, rw-p)

  # 检查 Falcon 主框架 (miniapp 进程 PID 987):
  cat /proc/987/maps | grep libwl_center
  # 结果: 未包含 libwl_center.so，完全隔离
  ```
- **真机全屏截屏获取**：
  执行 `miniapp_cli capture /tmp/screen_m1.png`，拉取至本地 `/Volumes/500GB/Ydpen/halflife_app/screen_m1.png`。
  验证分辨率：960 x 266, 8-bit RGBA。

---

## 2. 推理推导链 (Logic Chain)

1. **动态库隔离推导**：
   Falcon 小应用在加载安装包时，会遍历解压目录中 `libs/` 下的所有动态库并逐一执行 `dlopen`。如果将具有符号全局拦截性质的 `libwl_center.so` 放在 AMR 包内，会干扰 Falcon 框架自身主线程中的符号解析与 Wayland 通信。将其移出 AMR 包体，仅在 `libjsapi_hl.c` 执行 `fork()` 后的子进程环境中通过 `LD_PRELOAD=/userdisk/halflife/libwl_center.so` 注入，即可保证 Falcon 宿主环境的稳定性。

2. **自递归与 0 字节日志推导**：
   在子进程启动早期，动态链接器根据 `LD_PRELOAD` 加载 `libwl_center.so`，当首次调用 Wayland 接口时，拦截库内部使用拦截后的 `dlsym` 解析自身函数指针，形成死循环递归导致栈溢出崩溃。由于崩溃发生在标准输出重定向之后、引擎打印日志之前，导致文件被截断为 0 字节。通过给 `dlsym` 增加句柄分支判断并使用 `real_dlsym`，消除了自循环死锁，使引擎成功进入渲染主循环。

3. **外置文件系统缓存推导**：
   macOS 下对外置 exFAT 卷进行编译输出时，Zig 编译器的内存映射写入方式存在延迟同步现象，直接读取易导致 ELF 头部读取到全零数据。调整为先写入系统临时文件系统再拷贝至目标路径，确保了动态库文件的完整性。

---

## 3. 注意事项与边界说明 (Caveats)

1. **游戏运行退出时机**：
   执行 `install_amr.py` 覆盖安装前，若词典笔上正在运行 `xash3d`，脚本会提示保存退出。在自动化测试或重新部署前需保证旧实例已退出。
2. **多设备环境指定**：
   宿主机当前仅连接目标设备 `9DA2200007506350`。如遇多设备连接，可通过环境变量 `YDPEN_SERIAL` 指定。
3. **后续里程碑范围划分**：
   本阶段（Milestone 1）重点保障启动死锁消除、动态库包内隔离、官方图标部署以及引擎成功拉起。关于全套触控按键映射（R2/M2）、NPC 骨骼动画直立（R3/M3）、黑橙工控暂停菜单（R4/M4）以及全关卡通关推进（R5/M5）属于后续里程碑范畴。

---

## 4. 实施结论 (Conclusion)

1. **动态库隔离与构建脚本重构完成**：
   `tools/build_amr.py` 打包产物中 `libs/` 仅保留 `libjsapi_hl.so`，包内绝对排除 `libwl_center.so`；`tools/install_amr.py` 成功将 `libwl_center.so` 独立推送至设备端 `/userdisk/halflife/libwl_center.so`。
2. **底层拦截器自递归与文件格式问题解决**：
   修复了 `native/wl_center.c` 中符号重入导致的栈溢出崩溃问题，经 Zig 编译生成合法的 ELF 64-bit aarch64 动态库，运行时成功注入至 `xash3d` 进程，且未污染 Falcon 主进程。
3. **官方高清图标部署完成**：
   从 Steam 官方 `game.icns` 中提取出标准 512x512 RGBA 图标并装配至 `assets/app_icon.png`，真机安装与图标测试全部通过。
4. **架构与残留目录清理完成**：
   空目录 `src/pages/index` 与 `src/._*` 元数据已彻底清除，前端生命周期测试全部通过。
5. **真机直启实证完成**：
   设备端小应用启动后直接拉起 `xash3d` 进程（PID 2820），`/userdisk/halflife/hl_runtime.log` 正常输出渲染日志，获取到 960x266 真机截图。

---

## 5. 独立验证方法 (Verification Method)

可依序运行以下指令对实施结果进行独立复现与检验：

### 5.1 本地前端生命周期单元测试
```bash
node --test /Volumes/500GB/Ydpen/halflife_app/tools/test_lifecycle.mjs
```
*预期结果*：3 项测试全部通过（pass 3, fail 0）。

### 5.2 AMR 本地构建与包内依赖隔离核验
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
unzip -l /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr | grep "libs/"
```
*预期结果*：仅显示 `libjsapi_hl.so`，无 `libwl_center.so`。

### 5.3 设备端动态库与图标文件格式核验
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "file /userdisk/halflife/libwl_center.so && file /userdisk/miniapp/data/mini_app/pkg/8002026110400001/*/app_icon.png"
```
*预期结果*：
- `libwl_center.so` 报告为 `ELF 64-bit LSB shared object, ARM aarch64`；
- `app_icon.png` 报告为 `PNG image data, 512 x 512, 8-bit/color RGBA`。

### 5.4 真机启动与进程运行验证
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "miniapp_cli start 8002026110400001"
sleep 2
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "pidof xash3d"
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "ls -la /userdisk/halflife/hl_runtime.log"
```
*预期结果*：
- `pidof xash3d` 返回正在运行的有效 PID；
- `hl_runtime.log` 文件大小大于 0 且包含 GLES2 着色器编译日志。

### 5.5 自动化 E2E 规约核验（特性 1 与特性 3）
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --feature 1 --serial 9DA2200007506350
python3 /Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py --feature 3 --serial 9DA2200007506350
```
*预期结果*：
- Feature 1 Tier 1 用例通过率 100%；
- Feature 3 全部 10 项测试用例 100% 通过（退出码 0）。
