# 构建与部署脚本动态库隔离适配交接报告 (Explorer M1.1 Handoff)

## 1. 勘查观测记录 (Observation)

### 1.1 构建脚本 `tools/build_amr.py` 现状
- **文件路径**：`/Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py`
- **ADB 指令配置**（第 32 行、第 57-62 行）：
  ```python
  32: ADB = "/opt/homebrew/bin/adb"
  ...
  57: def is_device_connected():
  58:     if not os.path.exists(ADB):
  59:         return False
  60:     ret, out = run_cmd(f"{ADB} get-state")
  61:     return (ret == 0 and "device" in out.strip())
  ```
  未显式指定目标设备序列号。在宿主机连接多台设备时，`adb get-state` 返回 `error: more than one device/emulator`。
- **本地暂存目录拷贝**（第 181-186 行）：
  ```python
  181: for arch in ["arm64", "arm64-orange"]:
  182:     arch_dir = os.path.join(BINS_DIR, "libs", arch)
  183:     os.makedirs(arch_dir, exist_ok=True)
  184:     shutil.copy(so_src, os.path.join(arch_dir, "libjsapi_hl.so"))
  185:     shutil.copy(wl_so, os.path.join(arch_dir, "libwl_center.so"))
  186: print("  [+] 原生插件 libjsapi_hl.so 与 libwl_center.so 编译就绪")
  ```
  第 185 行将 `libwl_center.so` 复制至待打包目录 `BINS_DIR/libs/<arch>/`。
- **打包工具调用参数**（第 191-204 行）：
  ```python
  191: cmd_pack = [
  192:     sys.executable, TOOLKIT_PACK_AMR,
  193:     "--src", BINS_DIR,
  194:     "--out", out_amr,
  195:     "--appid", APPID,
  196:     "--name", NAME,
  197:     "--version", VERSION,
  198:     "--icon", icon_src,
  199:     "--lib", f"arm64={so_src}",
  200:     "--lib", f"arm64={wl_so}",
  201:     "--lib", f"arm64-orange={so_src}",
  202:     "--lib", f"arm64-orange={wl_so}"
  203: ]
  ```
  第 200 行与第 202 行显式传入 `--lib arm64={wl_so}` 与 `--lib arm64-orange={wl_so}`，使 `pack_amr.py` 将 `libwl_center.so` 写入 AMR 的 `libs/arm64/` 与 `libs/arm64-orange/`。
- **包内产物校验**（第 209-215 行）：
  ```python
  209: with zipfile.ZipFile(out_amr) as archive:
  210:     for arch in ("arm64", "arm64-orange"):
  211:         if archive.read(f"libs/{arch}/libjsapi_hl.so") != native_bytes:
  212:             raise RuntimeError("包内原生库与编译产物不一致，停止安装")
  213:         if archive.read(f"libs/{arch}/libwl_center.so") != wl_bytes:
  214:             raise RuntimeError("包内居中插件与编译产物不一致，停止安装")
  ```
  第 213-214 行强制要求 AMR 包内必须存在 `libwl_center.so`。若移除打包参数，此处将抛出 `KeyError` 异常中断构建。

### 1.2 部署脚本 `tools/install_amr.py` 现状
- **文件路径**：`/Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py`
- **ADB 指令配置**（第 17 行、第 23 行、第 41 行、第 56 行、第 65 行、第 67 行）：
  ```python
  17: ADB = '/opt/homebrew/bin/adb'
  ...
  23: output = subprocess.check_output([ADB, 'shell', wrapped], text=True)
  ...
  41: subprocess.run([ADB, 'push', str(Path(CONFIG_DIR) / name), remote], check=True)
  ...
  56: state = subprocess.check_output([ADB, 'get-state'], text=True).strip()
  ...
  65: subprocess.run([ADB, 'push', str(wl_center_local), '/userdisk/halflife/libwl_center.so'], check=True)
  ...
  67: subprocess.run([ADB, 'push', str(AMR_PATH), remote], check=True)
  ```
  所有 ADB 命令均缺少 `-s <serial>` 标识。
- **安装前解包验证**（第 50-55 行）：
  ```python
  50: with zipfile.ZipFile(AMR_PATH) as archive:
  51:     for arch in ('arm64', 'arm64-orange'):
  52:         if not archive.read(f'libs/{arch}/libjsapi_hl.so').startswith(b'\x7fELF'):
  53:             raise RuntimeError('包内原生库 libjsapi_hl.so 无有效 ELF 头，拒绝安装')
  54:         if not archive.read(f'libs/{arch}/libwl_center.so').startswith(b'\x7fELF'):
  55:             raise RuntimeError('包内居中插件 libwl_center.so 无有效 ELF 头，拒绝安装')
  ```
  第 54-55 行强制校验包内必须存在 ELF 格式的 `libwl_center.so`。
- **运行时动态库推送**（第 63-65 行）：
  ```python
  63: wl_center_local = HERE / 'libs' / 'libwl_center.so'
  64: if wl_center_local.is_file():
  65:     subprocess.run([ADB, 'push', str(wl_center_local), '/userdisk/halflife/libwl_center.so'], check=True)
  ```
  存在向 `/userdisk/halflife/libwl_center.so` 推送的逻辑，但缺少对本地文件缺失时的报错防护，且未带设备序列号。

### 1.3 真机运行时环境观测
- **设备序列号**：`9DA2200007506350`
- **当前真机安装目录状态**：
  `/userdisk/miniapp/data/mini_app/pkg/8002026110400001/b/libs/` 下存在：
  - `libjsapi_hl_1753655547.so`
  - `libwl_center_1753655547.so`
- **动态库注入实现**（`native/libjsapi_hl.c` 第 325-329 行）：
  ```c
  if (access("/userdisk/halflife/libwl_center.so", R_OK) == 0) {
      setenv("LD_PRELOAD", "/userdisk/halflife/libwl_center.so", 1);
  }
  ```
  证明游戏引擎运行时依赖设备端绝对路径 `/userdisk/halflife/libwl_center.so`，无需将其置于小应用包内。

---

## 2. 推理推导链 (Logic Chain)

1. **Falcon 启动死锁原因**：
   - 根据观测 1.1 与 1.3，AMR 打包了 `libs/arm64/libwl_center.so`。
   - Falcon 小应用在拉起时遍历 `pkg/<appid>/b/libs/` 下的所有动态库并调用 `dlopen`。
   - `libwl_center.so` 拦截了全局 `dlsym`、`SDL_LoadFunction` 与 Wayland 客户端符号，在 Falcon 容器主进程内部调用 `dlvsym(RTLD_NEXT, "dlsym", ...)` 时造成 glibc rtld 锁竞争形成死锁。
2. **构建脚本剥离逻辑**：
   - 根据观测 1.1，必须在 `tools/build_amr.py` 中删除第 185 行的 `BINS_DIR` 拷贝；删除第 200 行与第 202 行传入 `pack_amr.py` 的 `--lib` 参数；删除第 213-214 行对 `archive.read(f"libs/{arch}/libwl_center.so")` 的校验。
   - 为了确保包内绝对不包含该库，校验逻辑应改为断言 `libs/{arch}/libwl_center.so` 不在 zip 目录列表中，并且 `libs/` 目录下仅包含 `libs/arm64/libjsapi_hl.so` 与 `libs/arm64-orange/libjsapi_hl.so`。
3. **部署脚本适配逻辑**：
   - 根据观测 1.2，`tools/install_amr.py` 第 54-55 行必须删除对包内 `libwl_center.so` 的检查，同样增加禁止包内包含该库的防护逻辑。
   - 第 63-65 行必须确保本地 `libs/libwl_center.so` 存在，不存在时报错中止，存在时使用带 `-s 9DA2200007506350` 的 ADB 指令推送到 `/userdisk/halflife/libwl_center.so`。
   - 所有 ADB 调用统一添加 `-s 9DA2200007506350`，包括 `device_shell` 内部封装、`deploy_configs` 中的 `push`、`get-state` 检查以及推送 AMR 安装包。
   - 在执行 `miniapp_cli install` 前，清理旧的解包目录，防止旧版残留的 `libwl_center_*.so` 被 Falcon 重新加载。

---

## 3. 注意事项与边界说明 (Caveats)

1. **Wayland 交叉编译链接路径依赖**：
   - `tools/build_amr.py` 第 168 行编译 `libwl_center.so` 时使用了 `-L /tmp/dev_libs -lwayland-client`。
   - 观测发现系统重启后 `/tmp/dev_libs` 目录可能不存在。如果本地执行重新编译 `libwl_center.so`，需确保 `/tmp/dev_libs/libwayland-client.so` 存在（可从真机 `/usr/lib/libwayland-client.so.0` 拉取）。当前工程目录 `halflife_app/libs/libwl_center.so` 已存在有效 ELF 文件（43360 字节），可直接用于部署。
2. **多设备共存状态**：
   - 宿主机存在多台 ADB 设备识别记录，所有自动化执行指令必须严格绑定 `-s 9DA2200007506350`。
3. **只读勘查范围**：
   - 本 Agent 仅进行代码勘查与方案设计，未修改任何源文件。

---

## 4. 勘查结论与具体修改方案 (Conclusion)

### 4.1 `tools/build_amr.py` 方案

#### 修改点 1：配置目标设备序列号
- **位置**：第 32 行后
- **修改方案**：
  ```python
  ADB = "/opt/homebrew/bin/adb"
  TARGET_DEVICE = os.environ.get("YDPEN_SERIAL", "9DA2200007506350")
  ```
- **位置**：第 60 行
- **修改方案**：
  ```python
  ret, out = run_cmd(f"{ADB} -s {TARGET_DEVICE} get-state")
  ```

#### 修改点 2：移除 BINS_DIR 内部的 libwl_center.so 拷贝
- **位置**：第 181-186 行
- **原代码**：
  ```python
  for arch in ["arm64", "arm64-orange"]:
      arch_dir = os.path.join(BINS_DIR, "libs", arch)
      os.makedirs(arch_dir, exist_ok=True)
      shutil.copy(so_src, os.path.join(arch_dir, "libjsapi_hl.so"))
      shutil.copy(wl_so, os.path.join(arch_dir, "libwl_center.so"))
  print("  [+] 原生插件 libjsapi_hl.so 与 libwl_center.so 编译就绪")
  ```
- **替换方案**：
  ```python
  for arch in ["arm64", "arm64-orange"]:
      arch_dir = os.path.join(BINS_DIR, "libs", arch)
      os.makedirs(arch_dir, exist_ok=True)
      shutil.copy(so_src, os.path.join(arch_dir, "libjsapi_hl.so"))
  print("  [+] 原生插件 libjsapi_hl.so 准备就绪（libwl_center.so 保持独立外部运行库）")
  ```

#### 修改点 3：移除 pack_amr.py 中的 libwl_center.so 打包参数
- **位置**：第 191-204 行
- **原代码**：
  ```python
  cmd_pack = [
      sys.executable, TOOLKIT_PACK_AMR,
      "--src", BINS_DIR,
      "--out", out_amr,
      "--appid", APPID,
      "--name", NAME,
      "--version", VERSION,
      "--icon", icon_src,
      "--lib", f"arm64={so_src}",
      "--lib", f"arm64={wl_so}",
      "--lib", f"arm64-orange={so_src}",
      "--lib", f"arm64-orange={wl_so}"
  ]
  ```
- **替换方案**：
  ```python
  cmd_pack = [
      sys.executable, TOOLKIT_PACK_AMR,
      "--src", BINS_DIR,
      "--out", out_amr,
      "--appid", APPID,
      "--name", NAME,
      "--version", VERSION,
      "--icon", icon_src,
      "--lib", f"arm64={so_src}",
      "--lib", f"arm64-orange={so_src}"
  ]
  ```

#### 修改点 4：替换包内产物校验逻辑
- **位置**：第 209-215 行
- **原代码**：
  ```python
  with zipfile.ZipFile(out_amr) as archive:
      for arch in ("arm64", "arm64-orange"):
          if archive.read(f"libs/{arch}/libjsapi_hl.so") != native_bytes:
              raise RuntimeError("包内原生库与编译产物不一致，停止安装")
          if archive.read(f"libs/{arch}/libwl_center.so") != wl_bytes:
              raise RuntimeError("包内居中插件与编译产物不一致，停止安装")
  ```
- **替换方案**：
  ```python
  with zipfile.ZipFile(out_amr) as archive:
      namelist = set(archive.namelist())
      for arch in ("arm64", "arm64-orange"):
          jsapi_entry = f"libs/{arch}/libjsapi_hl.so"
          if jsapi_entry not in namelist:
              raise RuntimeError(f"包内缺少必要原生库 {jsapi_entry}，停止打包")
          if archive.read(jsapi_entry) != native_bytes:
              raise RuntimeError(f"包内原生库 {jsapi_entry} 与编译产物不一致，停止打包")
          wl_entry = f"libs/{arch}/libwl_center.so"
          if wl_entry in namelist:
              raise RuntimeError(f"AMR 包内检测到违规包含居中插件 {wl_entry}，必须隔离在包外，停止打包")

      actual_libs = {name for name in namelist if name.startswith("libs/") and not name.endswith("/")}
      expected_libs = {"libs/arm64/libjsapi_hl.so", "libs/arm64-orange/libjsapi_hl.so"}
      if actual_libs != expected_libs:
          raise RuntimeError(f"AMR 包内 libs 目录内容异常：期望 {expected_libs}，实际包含 {actual_libs}")
  ```

---

### 4.2 `tools/install_amr.py` 方案

#### 修改点 1：配置目标设备序列号常量
- **位置**：第 17 行后
- **修改方案**：
  ```python
  ADB = '/opt/homebrew/bin/adb'
  TARGET_DEVICE = os.environ.get('YDPEN_SERIAL', '9DA2200007506350')
  ```

#### 修改点 2：在 device_shell 中添加目标序列号
- **位置**：第 20-27 行
- **原代码**：
  ```python
  output = subprocess.check_output([ADB, 'shell', wrapped], text=True)
  ```
- **替换方案**：
  ```python
  output = subprocess.check_output([ADB, '-s', TARGET_DEVICE, 'shell', wrapped], text=True)
  ```

#### 修改点 3：在 deploy_configs 中添加目标序列号
- **位置**：第 41 行
- **原代码**：
  ```python
  subprocess.run([ADB, 'push', str(Path(CONFIG_DIR) / name), remote], check=True)
  ```
- **替换方案**：
  ```python
  subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(Path(CONFIG_DIR) / name), remote], check=True)
  ```

#### 修改点 4：移除对包内 libwl_center.so 的检查并增加隔离断言
- **位置**：第 50-55 行
- **原代码**：
  ```python
  with zipfile.ZipFile(AMR_PATH) as archive:
      for arch in ('arm64', 'arm64-orange'):
          if not archive.read(f'libs/{arch}/libjsapi_hl.so').startswith(b'\x7fELF'):
              raise RuntimeError('包内原生库 libjsapi_hl.so 无有效 ELF 头，拒绝安装')
          if not archive.read(f'libs/{arch}/libwl_center.so').startswith(b'\x7fELF'):
              raise RuntimeError('包内居中插件 libwl_center.so 无有效 ELF 头，拒绝安装')
  ```
- **替换方案**：
  ```python
  with zipfile.ZipFile(AMR_PATH) as archive:
      namelist = set(archive.namelist())
      for arch in ('arm64', 'arm64-orange'):
          jsapi_path = f'libs/{arch}/libjsapi_hl.so'
          if jsapi_path not in namelist:
              raise RuntimeError(f'包内缺少必要原生库 {jsapi_path}，拒绝安装')
          if not archive.read(jsapi_path).startswith(b'\x7fELF'):
              raise RuntimeError(f'包内原生库 {jsapi_path} 无有效 ELF 头，拒绝安装')
          wl_path = f'libs/{arch}/libwl_center.so'
          if wl_path in namelist:
              raise RuntimeError(f'AMR 包内检测到违规包含 {wl_path}，违反动态库隔离规约，拒绝安装')
  ```

#### 修改点 5：修改 get-state 检查
- **位置**：第 56 行
- **原代码**：
  ```python
  state = subprocess.check_output([ADB, 'get-state'], text=True).strip()
  ```
- **替换方案**：
  ```python
  state = subprocess.check_output([ADB, '-s', TARGET_DEVICE, 'get-state'], text=True).strip()
  ```

#### 修改点 6：确保推送 libwl_center.so 并指定目标设备
- **位置**：第 63-65 行
- **原代码**：
  ```python
  wl_center_local = HERE / 'libs' / 'libwl_center.so'
  if wl_center_local.is_file():
      subprocess.run([ADB, 'push', str(wl_center_local), '/userdisk/halflife/libwl_center.so'], check=True)
  ```
- **替换方案**：
  ```python
  wl_center_local = HERE / 'libs' / 'libwl_center.so'
  if not wl_center_local.is_file():
      raise FileNotFoundError(f'本地未找到运行库 {wl_center_local}，请先执行 build_amr.py 进行编译')
  subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(wl_center_local), '/userdisk/halflife/libwl_center.so'], check=True)
  ```

#### 修改点 7：推送 AMR 包并指定目标序列号
- **位置**：第 67 行
- **原代码**：
  ```python
  subprocess.run([ADB, 'push', str(AMR_PATH), remote], check=True)
  ```
- **替换方案**：
  ```python
  subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(AMR_PATH), remote], check=True)
  ```

#### 修改点 8：安装前清理旧包解压目录残留
- **位置**：第 68 行后
- **补充方案**：
  ```python
  device_shell(f'miniapp_cli uninstall {APPID}')
  device_shell(f'rm -rf /userdisk/miniapp/data/mini_app/pkg/{APPID}')
  output = device_shell(f'miniapp_cli install {shlex.quote(remote)}')
  ```

---

## 5. 独立验证方法 (Verification Method)

在执行修改后，可通过以下操作逐项验证方案有效性：

### 5.1 验证 AMR 构建产物包内动态库隔离
运行构建命令：
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
```
查看包内文件列表：
```bash
unzip -l /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr | grep "libs/"
```
**判定标准**：
- 输出必须且仅包含：
  ```
  libs/arm64/libjsapi_hl.so
  libs/arm64-orange/libjsapi_hl.so
  ```
- 不得出现任何 `libwl_center.so` 记录。

### 5.2 验证部署脚本执行与设备端动态库隔离
运行安装命令：
```bash
python3 /Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py
```
检查设备端解包目录下的动态库：
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "ls -la /userdisk/miniapp/data/mini_app/pkg/8002026110400001/b/libs/"
```
**判定标准**：
- 目录内仅存在 `libjsapi_hl_<hash>.so`，不存在 `libwl_center` 相关文件。

检查设备端外部注入库：
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "ls -la /userdisk/halflife/libwl_center.so"
```
**判定标准**：
- `/userdisk/halflife/libwl_center.so` 文件存在且大小为 43360 字节左右的有效 ELF。

### 5.3 验证真机启动无死锁闪退
启动小应用：
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "miniapp_cli start 8002026110400001"
sleep 2
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "pidof xash3d"
```
**判定标准**：
- Falcon 顺利完成 JSAPI 挂载进入页面；
- `pidof xash3d` 成功返回进程号，无 dlopen 死锁或闪退。
