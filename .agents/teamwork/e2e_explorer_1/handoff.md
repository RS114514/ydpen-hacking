# 端到端测试基础设施勘查与架构设计交接报告

## 1. Observation

### 1.1 现有工具体系源码分析

#### 1.1.1 触控与坐标映射体系（`test_runner_core.py`）
文件路径：`/Volumes/500GB/Ydpen/test_runner_core.py`
- 关键常量与设备序列号（第 11-13 行）：
  ```python
  SERIAL = "9DA2200007506350"
  RESULTS_DIR = "/Volumes/500GB/Ydpen/dracu_test_results"
  os.makedirs(RESULTS_DIR, exist_ok=True)
  ```
- 坐标变换实现（第 24-33 行）：
  ```python
  def tap_css(cx, cy, delay=0.6):
      px = int(round(107 + cy * 1.2))
      py = int(round(959 - cx * 1.2))
      tap_phys(px, py, delay)

  def tap_960(lx, ly, delay=0.6):
      cx = lx / 1.2
      cy = ly / 1.2
      tap_css(cx, cy, delay)
  ```
  在 960×266 游戏视口与 480×960 物理竖屏之间：
  游戏横屏坐标 `(lx, ly)`（范围 `0 <= lx < 960`, `0 <= ly < 266`）直接代入后：
  `px = int(round(107 + (ly / 1.2) * 1.2)) = int(round(107 + ly))`，取值区间 `[107, 372]`（总宽 266 像素，居中于物理屏宽 480 像素，两端留黑边 `(480 - 266) / 2 = 107` 像素）。
  `py = int(round(959 - (lx / 1.2) * 1.2)) = int(round(959 - lx))`，取值区间 `[0, 959]`（覆盖物理屏高 960 像素全长）。
- 物理注入方式（第 20-40 行）：
  - 点击：调用设备端 `/userdisk/doom/tap_mt /dev/input/event1 {px} {py}`。
  - 滑动：调用设备端 `/bin/swipe /dev/input/event1 {px1} {py1} {px2} {py2} {dur_ms}`。
- 截屏与生命周期指令（第 42-54 行）：
  - 截屏：执行 `miniapp_cli capture {tmp_path}`，随后拉取到本地。
  - 应用启停：调用 `miniapp_cli stop 8002026110100097` 与 `miniapp_cli start 8002026110100097`。

#### 1.1.2 触控配置与按键断言（`halflife_app/tools/test_controls.py`）
文件路径：`/Volumes/500GB/Ydpen/halflife_app/tools/test_controls.py`
- 触控按键规范要求（第 53-72 行）：
  - 必须包含动作：`{'+jump', '+attack', '+attack2', '+reload', '+use', '_look', '_move'}`。
  - 按键像素正方形校验：`(x2 - x1) * 960 == (y2 - y1) * 266`（公差 0.02）。
  - HUD 避让校验：`y2 * 266 <= 216`（底部留出 50 像素状态栏）。
  - 互斥无重叠校验：`min(a[2], b[2]) > max(a[0], b[0]) and min(a[3], b[3]) > max(a[1], b[1])` 为 False。

#### 1.1.3 XRCON 通信底层实现（`halflife_app/native/libjsapi_hl.c` 与 `test_xrcon.py`）
文件路径：`/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`
- 协议类型与套接字（第 82-96 行）：
  ```c
  int fd = socket(AF_INET, SOCK_STREAM, 0); // TCP 套接字
  struct sockaddr_in addr = { 0 };
  addr.sin_family = AF_INET;
  addr.sin_port = htons(27000);
  addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK); // 127.0.0.1
  ```
- 帧头格式定义（第 74-79 行）：
  ```c
  unsigned char frame[HL_XRCON_HEADER_SIZE + HL_XRCON_MAX_COMMAND] =
      { 'C', 'M', 'N', 'D', 0, 0, 0, 0xD4, 0, 0, 0, 0 };
  size_t total = HL_XRCON_HEADER_SIZE + len;
  frame[8] = (unsigned char)(total >> 8);
  frame[9] = (unsigned char)total;
  memcpy(frame + HL_XRCON_HEADER_SIZE, cmd, len);
  ```
  - 长度为 12 字节固定帧头：前 4 字节为 `CMND`，随后 4 字节为大端魔数 `0x000000D4`，随后 2 字节为大端总长度 `(12 + len)`，最后 2 字节为保留位 `0x0000`。
  - 发送完成后执行 `shutdown(fd, SHUT_WR)` 并读取对端握手数据 `b'AINF...'` 直至对端断开，防止 TCP RST 中断未决数据。
文件路径：`/Volumes/500GB/Ydpen/halflife_app/tools/test_xrcon.py`
- Python 端封装帧（第 163-164 行）：
  ```python
  def frame(payload):
      return b'CMND\x00\x00\x00\xd4' + struct.pack('!HH', 12 + len(payload), 0) + payload
  ```

#### 1.1.4 应用部署与安装机制（`halflife_app/tools/install_amr.py`）
文件路径：`/Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py`
- 应用唯一标识符：`APPID = '8002026110400001'`。
- ADB 远程执行退出码机制（第 20-27 行）：
  ```python
  def device_shell(command):
      # This device's legacy ADB transport does not propagate remote exit codes.
      wrapped = command + '; code=$?; printf "\\n__HL_EXIT__%s\\n" "$code"'
      output = subprocess.check_output([ADB, 'shell', wrapped], text=True)
      match = re.search(r'__HL_EXIT__(\d+)\s*$', output)
      if not match or int(match[1]):
          raise RuntimeError(output.strip())
      return output[:match.start()].strip()
  ```
  设备端 PenOS 的 ADB 通道默认不向宿主机返回远程命令退出码，必须附加 `; code=$?; printf "\n__HL_EXIT__%s\n" "$code"` 获取执行状态。
- 安装与卸载回执校验（第 68-78 行）：
  - 卸载：`miniapp_cli uninstall 8002026110400001`。
  - 安装：`miniapp_cli install /userdisk/halflife/half-life-1.0.0.amr`。
  - 校验：必须解析 JSON 回执，确认 `appid == "8002026110400001"` 且 `ret == 0`。

---

### 1.2 目标真机（-s 9DA2200007506350）运行环境实测数据

1. **设备连接状态**：
   执行 `/opt/homebrew/bin/adb devices`：
   ```
   List of devices attached
   9DA2200007506350	device
   ```
   设备在线，执行 `adb shell id` 返回 `uid=0(root) gid=0(root)`，拥有完全 Root 权限。

2. **触控输入硬件特征**：
   执行 `/opt/homebrew/bin/adb -s 9DA2200007506350 shell "cat /proc/bus/input/devices"` 与 `timeout 1 evtest /dev/input/event1`：
   ```
   Input device name: "fts_ts" (FocalTech Touchscreen)
   Event code 47 (ABS_MT_SLOT): Min 0, Max 1
   Event code 53 (ABS_MT_POSITION_X): Min 0, Max 480
   Event code 54 (ABS_MT_POSITION_Y): Min 0, Max 960
   Event code 57 (ABS_MT_TRACKING_ID): Min 0, Max 65535
   Event code 330 (BTN_TOUCH)
   ```
   硬件支持双触控槽位（Slot 0 与 Slot 1）。

3. **单点与手势注入工具现状**：
   - `/userdisk/doom/tap_mt`（源码位于 `/Volumes/500GB/Ydpen/doom_port/tools/tap_mt.c`）：
     固定使用 `ABS_MT_SLOT 0`、`ABS_MT_TRACKING_ID 1`，按压 80ms 后释放（`ABS_MT_TRACKING_ID -1`）。
   - `/bin/swipe`（源码位于 `/Volumes/500GB/Ydpen/gwjcfls-ydpen-toolkit/scripts/swipe.c`）：
     使用单点 `ABS_MT_TRACKING_ID 1`，按照 10ms 步长插值坐标并发送 `SYN_REPORT`。

4. **截屏机制与输出规格**：
   执行 `/opt/homebrew/bin/adb -s 9DA2200007506350 shell "miniapp_cli capture /tmp/test_cap.png && file /tmp/test_cap.png"`：
   ```
   capture:
   {"ret": 0}
   /tmp/test_cap.png: PNG image data, 960 x 266, 8-bit/color RGBA, non-interlaced
   ```
   `miniapp_cli capture` 直接生成 960×266 8-bit RGBA PNG 格式图像。

5. **端口转发通信实测**：
   执行 `/opt/homebrew/bin/adb -s 9DA2200007506350 forward tcp:27000 tcp:27000`：
   成功建立转发，允许宿主机 Python 脚本通过标准 TCP 套接字（`127.0.0.1:27000`）直接与设备端 Xash3D 交互。

6. **宿主机 Python 环境**：
   宿主机 `/usr/bin/python3` 与 `/opt/homebrew/bin/python3` 均未安装第三方 `PIL` 库。通过标准库 `struct` 与 `zlib`，可直接解析 960×266 PNG 头部与 IDAT 像素，实现零第三方依赖的图像尺寸、非黑屏及色彩特征验证。

7. **游戏关卡资源现状**：
   执行 `adb shell "ls /userdisk/halflife/valve/maps | wc -l"` 返回 132 个地图文件，序章 `c0a0.bsp`（2,232,620 字节）与大结局关卡 `c5a1.bsp`（2,751,608 字节）均完整就绪。

---

## 2. Logic Chain

### 步骤 1：XRCON 传输层协议与通信通道决策
- **依据**：Observation 1.1.3 与 1.2.5 中，`native/libjsapi_hl.c` 第 82 行明确调用 `socket(AF_INET, SOCK_STREAM, 0)`（TCP 协议），`test_xrcon.py` 同样基于 TCP 套接字实现。虽然上层文档部分提及 UDP，但底层引擎交互为 TCP 流协议。
- **推导**：自动化测试套件若直接在设备端通过每次执行 shell 命令发送 XRCON，存在进程启动延迟与命令截断风险。采用 `adb -s 9DA2200007506350 forward tcp:27000 tcp:27000` 将端口映射至宿主机，使测试套件在宿主机直接建立持久或瞬态 TCP 连接，按照 12 字节固定帧头发送 `CMND` 报文，能够将命令传输延迟降低至毫秒级，并确保握手流正常接收。

### 步骤 2：触控事件双槽位并发注入机制
- **依据**：Observation 1.1.1、1.1.2 与 1.2.2 中，触控驱动 `fts_ts` 原生提供 `ABS_MT_SLOT` 0 与 1 两个槽位；但现有的 `tap_mt` 仅写入 Slot 0，且多次 `adb shell` 调用之间存在约 150ms 进程启动时延，无法在物理时钟上实现真正的双指同时触控。
- **推导**：为验证 Feature 6（移动+滑动视角、移动+射击/跳跃）与 Tier 3 正交组合，测试套件需设计多指并发注入器。通过向 `/dev/input/event1` 写入多槽位事件流：
  1. Slot 0 发送按下（`ABS_MT_TRACKING_ID 1`, `ABS_MT_POSITION_X/Y` 为 D-Pad 坐标）；
  2. 保持 Slot 0 状态的同时，Slot 1 发送按下与滑动（`ABS_MT_SLOT 1`, `ABS_MT_TRACKING_ID 2`，视口滑动坐标）；
  3. 分别或同时发送抬起事件（`ABS_MT_TRACKING_ID -1`）。
  该方案可由测试套件直接生成多槽位二进制事件流写入设备，或调度设备端脚本完成并发动作。

### 步骤 3：生命周期监控与退出码可靠传播
- **依据**：Observation 1.1.4 表明 PenOS 的 ADB 通道会丢失远程命令退出码，必须附加 `; code=$?; printf "\n__HL_EXIT__%s\n" "$code"` 解析真实状态。
- **推导**：测试架构必须封装统一的 `device_shell(cmd)` 方法，严格捕获远程真实退出码。在启动阶段，通过轮询 `pidof xash3d`（超时时间设定为 5 秒）获取游戏进程 PID；在退出阶段，通过发送 `save quick` 并监测 `/userdisk/halflife/valve/save/quick.sav` 文件修改时间戳发生变更，再发送 `quit` 命令，随后验证 PID 消失，确保测试流程不残留僵尸进程。

### 步骤 4：零依赖图像处理与证据归档设计
- **依据**：Observation 1.2.4 与 1.2.6 表明 `miniapp_cli capture` 输出标准 960×266 RGBA PNG，而宿主机 Python 未预装 `PIL`。
- **推导**：测试套件应内置基于标准库 `struct` 与 `zlib` 的纯 Python PNG 解码分析器，提取图像宽高、非空白画面像素方差以及黑橙配色（`#000000` 与 `#F57E00`）占比。截图证据归档于 `/Volumes/500GB/Ydpen/halflife_app/test_artifacts/<run_id>/`，配合 JSON 与 Markdown 报告输出，避免对宿主机环境产生外部依赖。

---

## 3. Caveats

1. **硬件槽位上限约束**：真机触控芯片 `fts_ts` 的 `ABS_MT_SLOT` 范围为 `[0, 1]`，物理支持上限为双指并发（2 个接触点）。涉及三指以上的复合动作必须通过分时调度或快速交替序列进行模拟，无法物理并发三指。
2. **端口占用与冲突防护**：`adb forward tcp:27000 tcp:27000` 依赖宿主机 27000 端口未被占用。测试套件在初始化时应检查宿主机端口可用性，并在测试退出（无论成功或异常退出）时执行 `adb forward --remove tcp:27000`，清理转发规则。
3. **引擎冷启动时间差**：应用通过 `miniapp_cli start 8002026110400001` 拉起后，需经历 Falcon 容器初始化、`libjsapi_hl.so` 加载与 Xash3D 进程 `fork/execve`，到 XRCON 端口处于监听状态通常需要 1.5 至 2.5 秒。通信前置检查必须设置带递增退避的连接重试机制。

---

## 4. Conclusion

针对 `halflife_app/tools/test_e2e_verification.py`，设计完整模块化架构方案如下：

### 4.1 核心模块划分与职责契约

```
test_e2e_verification.py
├── DeviceEnv           # 设备连接、鉴权、存储空间与退出码包装
├── AppLifecycleManager # AMR 状态校验、安装、全屏直启与 PID 检测
├── TouchController     # 坐标换算、单点/滑动与双槽位并发手势注入
├── XRCONClient         # 宿主机直接建立的 TCP 27000 通信通道
├── ArtifactVerifier    # 截图拉取、无依赖 PNG 质量分析与证据归档
├── TestRunner          # 分级（Tiers 1-4）测试调度与断言管理
└── ReportGenerator     # 控制台摘要、结构化 JSON 与 Markdown 产出
```

### 4.2 模块实现规范

#### 1. 设备环境与 ADB 通道（`DeviceEnv`）
- 显式绑定设备序列号：默认使用 `9DA2200007506350`，支持 `--serial` 参数覆盖。
- 封装远程命令执行函数：通过 `; code=$?; printf "\n__HL_EXIT__%s\n" "$code"` 提取远程返回码，返回码非 0 即触发异常。
- 端口映射生命周期：在启动时调用 `adb -s <serial> forward tcp:27000 tcp:27000`，在 Python `atexit` 钩子中执行 `forward --remove`。

#### 2. 应用与引擎生命周期（`AppLifecycleManager`）
- 检查 `/userdisk/halflife/half-life-1.0.0.amr` 与 `/userdisk/halflife/libwl_center.so`。
- 调用 `miniapp_cli start 8002026110400001` 进行全屏直启。
- 轮询检测 `pidof xash3d`，确认进程启动，记录 PID 并断言 PID > 0。
- 安全终止：优先经由 XRCON 发送 `save quick` 并在验证存档修改时间后发送 `quit`；若超时则通过 `miniapp_cli stop 8002026110400001` 终止。

#### 3. 触控与并发手势控制器（`TouchController`）
- 坐标变换：
  - 游戏坐标 `(lx, ly)`（范围 `[0, 959]`, `[0, 265]`）映射至物理坐标：
    `px = int(round(107 + ly))`（限制在 `[107, 372]`）
    `py = int(round(959 - lx))`（限制在 `[0, 959]`）
- 按键几何字典：
  - `dpad_up`: `(105, 107)`
  - `dpad_down`: `(105, 212)`
  - `dpad_left`: `(53, 160)`
  - `dpad_right`: `(158, 160)`
  - `crouch`: `(53, 42)`
  - `cjump`: `(158, 42)`
  - `fire`: `(778, 134)`
  - `jump`: `(881, 63)`
  - `use`: `(881, 180)`
  - `alt_fire`: `(686, 183)`
  - `reload`: `(686, 82)`
  - `flashlight`: `(478, 32)`
  - `menu`: `(550, 32)`
  - `prev`: `(754, 33)`
  - `next`: `(801, 33)`
- 单点与手势：直接调用设备端已有工具 `/userdisk/doom/tap_mt` 与 `/bin/swipe`。
- 双槽位并发注入：
  - 通过 Python 构造多事件二进制缓冲区写入设备 `/tmp/mt_seq.bin`，并通过 `cat /tmp/mt_seq.bin > /dev/input/event1` 注入；或利用设备端循环脚本控制 Slot 0 保持按下，同时在 Slot 1 发送滑动或点击事件。

#### 4. XRCON 通信包装器（`XRCONClient`）
- 协议：直连宿主机 `127.0.0.1:27000`（经由 ADB 转发通道）。
- 报文封装：`b'CMND\x00\x00\x00\xd4' + struct.pack('!HH', 12 + len(payload), 0) + payload`。
- API 接口：
  - `send_cmd(cmd: str) -> bool`
  - `change_level(mapname: str) -> bool`
  - `save_quick() -> bool`（发送 `save quick` 并检测 `/userdisk/halflife/valve/save/quick.sav` 的更新状态）
  - `load_quick() -> bool`
  - `query_status() -> str`

#### 5. 截图比对与证据归档（`ArtifactVerifier`）
- 归档路径规约：
  `/Volumes/500GB/Ydpen/halflife_app/test_artifacts/<run_id>/`
  子目录结构：
  - `tier1_functional/`
  - `tier2_boundary/`
  - `tier3_concurrent/`
  - `tier4_campaign/`
- 零依赖图像校验能力：
  - 提取 PNG 头部确认尺寸为 960×266。
  - 解压 IDAT 像素数据，计算图像色彩分布及非黑像素比例，防止截屏为全黑或渲染死锁。
  - 对暂停菜单进行黑橙工控色系（主色 `#000000`、橙色 `#F57E00` 与高亮色 `#FFA500`）色彩直方图判定。

#### 6. 命令行接口与退出码规范
- 参数定义：
  - `--serial <id>`：目标设备序列号（默认 `9DA2200007506350`）
  - `--tier <1|2|3|4|all>`：按层级执行测试
  - `--feature <1..11>`：按特性筛选测试
  - `--install`：前置重新打包安装 AMR
  - `--output <dir>`：指定证据保存目录
- 退出码与输出：
  - 全绿退出码为 `0`；任何断言失败或异常退出码为 `1`。
  - 自动输出控制台进度指示、`summary.json` 机器可读摘要与包含截图引用的 `REPORT.md`。

---

## 5. Verification Method

独立验证本勘查报告结论的命令与检验标准：

### 5.1 验证设备连接与 Root 权限
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 get-state
/opt/homebrew/bin/adb -s 9DA2200007506350 shell id
```
- **期望结果**：输出 `device`，`id` 输出 `uid=0(root) gid=0(root)`。
- **失效条件**：设备未连接或无 Root 权限。

### 5.2 验证触控驱动双槽位支持
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "timeout 1 evtest /dev/input/event1" | grep -A 4 "ABS_MT_SLOT"
```
- **期望结果**：包含 `Event code 47 (ABS_MT_SLOT)` 且 `Max 1`。
- **失效条件**：输出不存在 `ABS_MT_SLOT` 或 `Max 0`。

### 5.3 验证 XRCON 底层协议为 TCP
```bash
grep -n -C 5 "socket(AF_INET, SOCK_STREAM" /Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c
```
- **期望结果**：第 82 行明确为 `socket(AF_INET, SOCK_STREAM, 0)`。
- **失效条件**：代码更改为 `SOCK_DGRAM`。

### 5.4 验证 ADB 端口转发能力
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 forward tcp:27000 tcp:27000
/opt/homebrew/bin/adb -s 9DA2200007506350 forward --list
/opt/homebrew/bin/adb -s 9DA2200007506350 forward --remove tcp:27000
```
- **期望结果**：`forward --list` 列出 `9DA2200007506350 tcp:27000 tcp:27000`。
- **失效条件**：命令报错或端口冲突。

### 5.5 验证纯 Python PNG 零依赖解析
```bash
python3 -c "
import struct, zlib
with open('/Volumes/500GB/Ydpen/halflife_app/hl_screen_fresh.png', 'rb') as f:
    sig = f.read(8)
    assert sig == b'\x89PNG\r\n\x1a\n'
    length, ctype = struct.unpack('>I4s', f.read(8))
    assert ctype == b'IHDR'
    w, h, depth, colortype = struct.unpack('>IIBB', f.read(10))
    assert (w, h) == (960, 266)
print('PNG Parser Verified: 960x266 RGBA')
"
```
- **期望结果**：输出 `PNG Parser Verified: 960x266 RGBA`，退出码为 0。
- **失效条件**：断言失败或异常退出。

### 5.6 验证关卡资源完整性
```bash
/opt/homebrew/bin/adb -s 9DA2200007506350 shell "ls /userdisk/halflife/valve/maps/c0a0.bsp /userdisk/halflife/valve/maps/c5a1.bsp"
```
- **期望结果**：输出序章与大结局地图文件路径。
- **失效条件**：文件不存在。
