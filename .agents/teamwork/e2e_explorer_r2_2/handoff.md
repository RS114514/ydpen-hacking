# Tier 2 边界异常真实防御与 PNG RFC 2083 滤波反变换算法勘查整改蓝图

## 1. Observation (直接观察事实)

### 1.1 PNG 解码器滤波缺陷代码与真机数据实测
- **源码位置**：`/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py` 第 121-136 行：
  ```python
  pixels = []
  for row_idx in range(height):
      row_start = row_idx * stride
      filter_type = raw_decompressed[row_start]
      row_bytes = raw_decompressed[row_start + 1: row_start + stride]
      # 简化处理：收集每行像素
      for col_idx in range(width):
          px_start = col_idx * bytes_per_pixel
          if bytes_per_pixel == 4:
              pixels.append(struct.unpack("4B", row_bytes[px_start: px_start + 4]))
  ```
  在第 123 行读取了 `filter_type`，但在第 125 行以注释“`# 简化处理：收集每行像素`”直接忽略了滤波标志，将差分差值当成原始像素解包。

- **实机资产滤波类型探测结果**：
  - 官方应用图标文件 `/Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png`：尺寸 512×512，颜色类型 `color_type = 6` (RGBA 8-bit)，`bpp = 4`。经解析其实际扫描行滤波类型集合包含 `[1, 2, 4]`（即 Sub, Up, Paeth 三种差分滤波）。
  - 真机截屏文件 `/Volumes/500GB/Ydpen/halflife_app/hl_gameplay_live.png`：尺寸 480×960，颜色类型 `color_type = 2` (RGB 8-bit)，`bpp = 3`。经解析其实际扫描行滤波类型集合同样包含 `[1, 2, 4]`。
  - 使用当前未反滤波的 `ArtifactVerifier.parse_png` 读取 `app_icon.png`，提取中心区域（本应为鲜艳工控橙黄色 RGB ~ 245, 126, 0）像素结果为 `(0, 0, 0, 0)`, `(255, 255, 0, 0)`, `(0, 0, 1, 0)` 等错位离散值，导致色彩直方图分析彻底失效。

### 1.2 Tier 2 边界用例断言真实性静态扫描结果
通过 AST 语法树遍历 `/Volumes/500GB/Ydpen/halflife_app/tools/test_e2e_verification.py` 第 924 至 1195 行中的全部 55 个 Tier 2 用例函数：
- **纯空桩用例（共 38 例）**：函数体内仅存在单行 `ctx.assert_true(True)`，不包含任何逻辑调用或状态校验：
  - 特性 1：`test_t2_01_01`, `test_t2_01_02`, `test_t2_01_05`
  - 特性 2：`test_t2_02_02`, `test_t2_02_03`, `test_t2_02_04`, `test_t2_02_05`
  - 特性 3：`test_t2_03_01`, `test_t2_03_02`, `test_t2_03_04`, `test_t2_03_05`
  - 特性 4：`test_t2_04_05`
  - 特性 5：`test_t2_05_02`, `test_t2_05_03`, `test_t2_05_04`, `test_t2_05_05`
  - 特性 6：`test_t2_06_01`, `test_t2_06_03`, `test_t2_06_04`, `test_t2_06_05`
  - 特性 7：`test_t2_07_01`, `test_t2_07_02`, `test_t2_07_03`, `test_t2_07_04`, `test_t2_07_05`
  - 特性 8：`test_t2_08_03`, `test_t2_08_04`, `test_t2_08_05`
  - 特性 9：`test_t2_09_01`, `test_t2_09_03`, `test_t2_09_04`, `test_t2_09_05`
  - 特性 10：`test_t2_10_03`, `test_t2_10_04`, `test_t2_10_05`
  - 特性 11：`test_t2_11_01`, `test_t2_11_03`, `test_t2_11_05`
- **动作后无判定用例（共 11 例）**：调用了触控或换图动作，但未对任何状态进行判定，直接以 `ctx.assert_true(True)` 结束：
  - `test_t2_02_01` (按返回键后未判定进程存活与否)
  - `test_t2_04_02` (点击按键缝隙后无状态判定)
  - `test_t2_04_03` (连击开火后无弹药或输入队列判定)
  - `test_t2_04_04` (下蹲切换后无视高判定)
  - `test_t2_05_01` (后退大跳后无位移向量与非 NaN 判定)
  - `test_t2_06_02` (划屏跨分区后无指针判定)
  - `test_t2_08_01` (连按菜单无界面显示判定)
  - `test_t2_08_02` (菜单背景点击无操作拦截判定)
  - `test_t2_09_02` (高频存档无文件完整度与大小判定)
  - `test_t2_10_01` (快速换图无内存与进程响应判定)
  - `test_t2_11_04` (pkill 后未检查进程是否彻底退出)
- **具备实质断言的用例（仅 6 例）**：
  `test_t2_01_03`, `test_t2_01_04`, `test_t2_03_03`, `test_t2_04_01`, `test_t2_10_02`, `test_t2_11_02`。

### 1.3 原生运行时与生命周期契约对应关系
- **原生层行为契约**（`/Volumes/500GB/Ydpen/halflife_app/native/libjsapi_hl.c`）：
  - 第 283-300 行：`fopen(auto_exec_path, "w")` 若失败，原生层调用 `pthread_mutex_unlock(&g_hl_lock)` 并向 JS 抛出 `TypeError`。
  - 第 304-309 行：`fork()` 若失败，原生层调用 `pthread_mutex_unlock(&g_hl_lock)` 并向 JS 抛出 `TypeError`。
  - 第 325-329 行：子进程通过 `access("/userdisk/halflife/libwl_center.so", R_OK)` 检查拦截库，若权限为 000 或文件丢失，跳过 `LD_PRELOAD`，子进程不发生死锁闪退。
  - 第 331-347 行：子进程如果 `chdir(basedir) != 0` 则 `_exit(126)`；如果 `execl("./xash3d")` 失败则 `_exit(127)`。
  - 第 148-158 行：父进程 `is_game_running_locked` 调用 `waitpid(g_hl_pid, NULL, WNOHANG)`，当子进程退出后自动重置 `g_hl_pid = 0`，使 `hl.isRunning()` 返回 `false`。
  - 第 202-219 行：`stop_game_locked` 在互斥锁内先调用 `save_game_locked`，确保在发送 `quit` 前存档已完整写入。

---

## 2. Logic Chain (推导逻辑链)

1. **PNG 差分滤波对真机验收有效性的直接影响**：
   - 由观察 1.1 可知，真机截图与官方 PNG 图标普遍采用了标准差分行滤波（Filter 1, 2, 4）；
   - 当前测试套件在执行 `--self-test` 离线运行时，由于 Mock 截屏直接生成 Filter 0（None）的纯色图，掩盖了解码器缺失逆变换的缺陷；
   - 一旦在真机执行时，由于未执行逆变换，解码出的像素矩阵为差分差值而非真实颜色，导致颜色比例统计失真，使得所有依赖截图核验的断言产生误判；
   - 因此，根据 RFC 2083 规范实现完整的 5 种行滤波逆变换算法是真机测试具备可信度的物理前提。

2. **从 38 个空桩与 11 个缺少断言用例推导整改方案**：
   - 由观察 1.2 可知，Tier 2 中有 49 个用例未对预期结果进行实际验证，构成了审查员认定的门面实现（Facade / Dummy Assertions）；
   - 由观察 1.3 可知，底层 C 原生代码、QuickJS 运行时以及 Falcon 前端生命周期均具备完备的状态返回值、退出码及异常抛出机制；
   - 这些边界行为完全可以通过具体、可复现的检测手段建立真实断言，包括：
     - 文件权限变更后的退出码检测与日志比对；
     - 基于 XRCON 查询的物理坐标、视线高度、弹药数量与姿态角核验；
     - 针对 `TestRunner` 看门狗机制，通过调度微型超时任务验证其超时标记行为。

---

## 3. Caveats (注意条件与限制)

1. **只读勘查范围限制**：本次工作属于勘查与方案设计阶段，未直接对 `test_e2e_verification.py` 进行源码修改。所有算法与断言方案均作为整改蓝图交付后续实施人员。
2. **硬件多指触控物理限制**：网易有道词典笔 6 代触摸驱动 `fts_ts` 物理层提供 2 个多点触控槽位（Slot 0 和 Slot 1）。对于 5 点触控压测，测试目标是验证驱动与 Wayland 合成器对超出槽位数的手势具备丢弃或平滑降级能力，不发生系统崩溃，而非要求硬件真正同时识别 5 个物理触控点。
3. **真实环境与 Mock 环境的兼容**：设计整改方案时，需确保测试用例在 `--self-test`（离线模拟）和连接真机（ADB 在线执行）两种模式下均能正常判定，避免离线运行时因硬件不存在而报出非预期的环境错误。

---

## 4. Conclusion (勘查整改蓝图)

### 4.1 PNG RFC 2083 标准 5 种行滤波逆变换算法设计

#### 4.1.1 算法数学定义与参数规则
设当前扫描行为第 $r$ 行（$0 \le r < \text{height}$），解压后扫描行包含 1 字节滤波类型头及 $W \times \text{bpp}$ 字节数据。
每个像素字节大小 $\text{bpp}$：
- 颜色类型 6 (RGBA)：$\text{bpp} = 4$
- 颜色类型 2 (RGB)：$\text{bpp} = 3$
- 颜色类型 0 (灰度)：$\text{bpp} = 1$
- 颜色类型 4 (灰度+Alpha)：$\text{bpp} = 2$

设当前字节下标为 $i$ ($0 \le i < \text{row\_len}$)，Raw 差分输入字节为 $x = \text{filt\_bytes}[i]$。
定义参考像素对应字节：
- $a$：当前行左侧相邻像素同一通道的重构值。若 $i \ge \text{bpp}$，则 $a = \text{recon\_row}[i - \text{bpp}]$；若 $i < \text{bpp}$，则 $a = 0$。
- $b$：上一行正上方像素同一通道的重构值。若 $r = 0$，则 $b = 0$；若 $r > 0$，则 $b = \text{prev\_row}[i]$。
- $c$：上一行左上方像素同一通道的重构值。若 $r = 0$ 或 $i < \text{bpp}$，则 $c = 0$；否则 $c = \text{prev\_row}[i - \text{bpp}]$。

#### 4.1.2 5 种滤波逆变换公式
1. **Filter 0 (None)**：
   $$\text{recon\_row}[i] = x$$
2. **Filter 1 (Sub)**：
   $$\text{recon\_row}[i] = (x + a) \pmod{256}$$
3. **Filter 2 (Up)**：
   $$\text{recon\_row}[i] = (x + b) \pmod{256}$$
4. **Filter 3 (Average)**：
   $$\text{recon\_row}[i] = \left(x + \left\lfloor \frac{a + b}{2} \right\rfloor\right) \pmod{256} = (x + ((a + b) \gg 1)) \ \& \ \text{0xFF}$$
5. **Filter 4 (Paeth Predictor)**：
   定义预测函数：
   $$p = a + b - c$$
   $$pa = |p - a|, \quad pb = |p - b|, \quad pc = |p - c|$$
   选择逻辑：
   - 若 $pa \le pb$ 且 $pa \le pc$，则返回 $a$；
   - 否则若 $pb \le pc$，则返回 $b$；
   - 否则返回 $c$。
   重构公式：
   $$\text{recon\_row}[i] = (x + \text{PaethPredictor}(a, b, c)) \pmod{256}$$

#### 4.1.3 `ArtifactVerifier.parse_png` 改造参考实现代码
```python
@staticmethod
def parse_png(data):
    """纯 Python 解析符合 RFC 2083 规范的 PNG 图像，支持 5 种行滤波逆变换。"""
    if len(data) < 8 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Invalid PNG signature")

    offset = 8
    width = height = bit_depth = color_type = 0
    idat_chunks = []

    while offset < len(data):
        if offset + 8 > len(data):
            break
        length, ctype = struct.unpack(">I4s", data[offset:offset + 8])
        offset += 8
        chunk_data = data[offset:offset + length]
        offset += length + 4  # 跳过 CRC

        if ctype == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk_data[:10])
        elif ctype == b"IDAT":
            idat_chunks.append(chunk_data)
        elif ctype == b"IEND":
            break

    if width == 0 or height == 0:
        raise ValueError("Corrupted PNG: missing IHDR")
    if bit_depth != 8:
        raise ValueError(f"Unsupported bit depth: {bit_depth}")

    raw_decompressed = zlib.decompress(b"".join(idat_chunks))
    bpp = 4 if color_type == 6 else (3 if color_type == 2 else (1 if color_type == 0 else 2))
    row_len = width * bpp
    stride = 1 + row_len

    if len(raw_decompressed) < height * stride:
        raise ValueError("Corrupted PNG: decompressed stream shorter than expected scanlines")

    def paeth_predictor(a, b, c):
        p = a + b - c
        pa = abs(p - a)
        pb = abs(p - b)
        pc = abs(p - c)
        if pa <= pb and pa <= pc:
            return a
        elif pb <= pc:
            return b
        else:
            return c

    pixels = []
    prev_row = bytearray(row_len)

    for row_idx in range(height):
        row_start = row_idx * stride
        filter_type = raw_decompressed[row_start]
        filt_bytes = raw_decompressed[row_start + 1: row_start + stride]
        recon_row = bytearray(row_len)

        for i in range(row_len):
            x = filt_bytes[i]
            a = recon_row[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            c = prev_row[i - bpp] if i >= bpp else 0

            if filter_type == 0:
                val = x
            elif filter_type == 1:
                val = (x + a) & 0xFF
            elif filter_type == 2:
                val = (x + b) & 0xFF
            elif filter_type == 3:
                val = (x + ((a + b) >> 1)) & 0xFF
            elif filter_type == 4:
                val = (x + paeth_predictor(a, b, c)) & 0xFF
            else:
                raise ValueError(f"Corrupted PNG: unknown filter type {filter_type} at row {row_idx}")

            recon_row[i] = val

        prev_row = recon_row

        # 提取像素
        for col_idx in range(width):
            px_start = col_idx * bpp
            if bpp == 4:
                pixels.append(struct.unpack("4B", recon_row[px_start: px_start + 4]))
            elif bpp == 3:
                r, g, b = struct.unpack("3B", recon_row[px_start: px_start + 3])
                pixels.append((r, g, b, 255))
            elif bpp == 2:
                gray, alpha = struct.unpack("2B", recon_row[px_start: px_start + 2])
                pixels.append((gray, gray, gray, alpha))
            else:
                v = recon_row[px_start]
                pixels.append((v, v, v, 255))

    return {
        "width": width,
        "height": height,
        "bit_depth": bit_depth,
        "color_type": color_type,
        "pixels": pixels,
    }
```

---

### 4.2 Tier 2 全部用例真实断言设计方案

#### 特性 1：启动死锁修复与动态库隔离边界
- **`TC-E2E-T2-01-01`（拦截库物理丢失时的优雅降级验证）**：
  - **断言逻辑**：通过命令备份并将 `/userdisk/halflife/libwl_center.so` 临时更名为 `.so.bak`。启动应用后读取应用状态及 `/userdisk/halflife/hl_runtime.log`，断言退出码为 0，日志中无 `dlopen` 死锁崩溃记录。在 `finally` 中恢复原文件。
  - **断言语句**：
    `ctx.assert_equal(res["code"], 0)`
    `ctx.assert_true(not re.search(r"deadlock|SIGSEGV|Aborted", log_text))`
- **`TC-E2E-T2-01-02`（拦截库权限受限异常处理）**：
  - **断言逻辑**：将 `/userdisk/halflife/libwl_center.so` 权限更改为 `000`。调用启动并随后查询状态，断言接口未发生阻塞卡死，调用能够正常返回，证明主线程互斥锁 `g_hl_lock` 已平稳释放。在 `finally` 中恢复权限 `chmod 755`。
  - **断言语句**：
    `ctx.assert_equal(st["code"], 0)`
    `ctx.assert_true(st["output"] != "")`
- **`TC-E2E-T2-01-05`（低内存 OOM 模拟下的启动异常捕获）**：
  - **断言逻辑**：针对 `libjsapi_hl.c` 中 `fork()` 失败返回 `JS_ThrowTypeError` 的契约，在执行器中触发低内存或进程句柄耗尽模拟，验证返回内容中捕获到 `TypeError: failed to fork xash3d`，且随后调用的 `hl.isRunning()` 返回 `false`，未因锁未释放而发生死锁。
  - **断言语句**：
    `ctx.assert_true("failed to fork" in err_msg or res["code"] != 0)`
    `ctx.assert_equal(running_status, False)`

#### 特性 2：全屏直启与纯原生 mini APP 边界
- **`TC-E2E-T2-02-01`（首帧渲染未就绪时极速按返回键中断）**：
  - **断言逻辑**：启动应用后在 200ms 内注入 `input keyevent 4`。延时 500ms 后执行 `pidof xash3d`，断言进程正常退出或处于已终止状态，不存在残留孤儿僵尸进程。
  - **断言语句**：
    `pids = ctx.dev.run_cmd("pidof xash3d")["output"].strip().split()`
    `ctx.assert_true(len(pids) == 0)`
- **`TC-E2E-T2-02-02`（高频前后台交替切换压测）**：
  - **断言逻辑**：连续执行 6 次 `input keyevent 3`（HOME 切后台）与 `miniapp_cli start`（切前台）。最后查询进程状态与 XRCON 联通性，断言 PID 维持唯一且引擎仍可响应 `status`。
  - **断言语句**：
    `ctx.assert_equal(len(pids), 1)`
    `ctx.assert_true(xrcon_ok)`
- **`TC-E2E-T2-02-03`（basedir 参数为空或非法路径的异常防御）**：
  - **断言逻辑**：向启动配置传入非法的 `basedir: "/invalid_nonexistent_dir"`。依据 C 原生层第 287 行抛出 `TypeError` 的契约，断言调用返回捕获到异常，且退出码非 0。
  - **断言语句**：
    `ctx.assert_true("failed to open auto_exec.cfg" in res["error"] or res["code"] != 0)`
- **`TC-E2E-T2-02-04`（引擎二进制不可执行时的进程退避）**：
  - **断言逻辑**：临时执行 `chmod -x /userdisk/halflife/xash3d`。启动应用并等待子进程触发 `_exit(127)`。查询 `pidof xash3d`，断言返回值退出码非 0（进程已安全退出，未形成僵尸阻塞）。在 `finally` 中恢复权限 `chmod +x`。
  - **断言语句**：
    `ctx.assert_true(ctx.dev.run_cmd("pidof xash3d")["code"] != 0)`
- **`TC-E2E-T2-02-05`（连续快速杀死并重启应用压测）**：
  - **断言逻辑**：循环 8 次执行 `pkill -9 xash3d` 后立即调用 `miniapp_cli start`。循环结束后查询系统进程，断言系统内存未耗尽，且最终仅有单个活跃实例。
  - **断言语句**：
    `ctx.assert_equal(len(ctx.dev.run_cmd("pidof xash3d")["output"].split()), 1)`

#### 特性 3：官方原版高清 Lambda 图标边界
- **`TC-E2E-T2-03-01`（0 字节损坏图标打包拦截）**：
  - **断言逻辑**：构造 0 字节内容并传入 `ArtifactVerifier.parse_png(b"")`，断言抛出 `ValueError("Invalid PNG signature")`。
  - **断言语句**：
    ```python
    try:
        ctx.verifier.parse_png(b"")
        ctx.assert_true(False, "0 字节文件未抛出异常")
    except ValueError as e:
        ctx.assert_true("Invalid PNG signature" in str(e))
    ```
- **`TC-E2E-T2-03-02`（超大分辨率图标 4096x4096 压力测试）**：
  - **断言逻辑**：构造 IHDR 标明尺寸为 4096×4096 的 PNG 头部，传入解码函数。断言解码器能正确解析其分辨率属性，同时对图标尺寸超标（规定标准图标 $\le 1024\times 1024$）能够进行尺寸范围判定。
  - **断言语句**：
    `ctx.assert_equal(ihdr_info["width"], 4096)`
    `ctx.assert_true(ihdr_info["width"] > 1024, "检测到超标大图标")`
- **`TC-E2E-T2-03-04`（极小尺寸图标 16x16 展示测试）**：
  - **断言逻辑**：使用 `ArtifactVerifier.create_solid_png(16, 16)` 生成微型图像，解码后验证返回像素数量严格等于 $16 \times 16 = 256$。
  - **断言语句**：
    `ctx.assert_equal(len(parsed["pixels"]), 256)`
    `ctx.assert_equal(parsed["width"], 16)`
- **`TC-E2E-T2-03-05`（图标 PNG 关键块 IHDR 损坏容错）**：
  - **断言逻辑**：构造魔数有效但 IHDR 块被截断或损坏的 PNG 数据包，传入 `parse_png`，断言明确抛出包含 `"missing IHDR"` 的 `ValueError`。
  - **断言语句**：
    ```python
    corrupted = b"\x89PNG\r\n\x1a\n\x00\x00\x00\x04XXXX1234"
    try:
        ctx.verifier.parse_png(corrupted)
        ctx.assert_true(False, "损坏 IHDR 未被拦截")
    except ValueError as e:
        ctx.assert_true("missing IHDR" in str(e) or "Corrupted" in str(e))
    ```

#### 特性 4：全套触控按键完整覆盖边界
- **`TC-E2E-T2-04-02`（相邻按键物理缝隙盲区点击）**：
  - **断言逻辑**：在开火键（中心坐标 778, 134）与跳跃键（中心坐标 881, 63）之间的盲区缝隙坐标 (830, 100) 注入点击。记录注入前后的弹药数与玩家坐标，断言弹药未减少且 Z 轴高度未跳起。
  - **断言语句**：
    `ctx.assert_equal(ammo_after, ammo_before)`
    `ctx.assert_almost_equal(pos_after["z"], pos_before["z"], delta=1.0)`
- **`TC-E2E-T2-04-03`（开火键超高频连击 25Hz 压测）**：
  - **断言逻辑**：以 40ms 间隔连续注入 20 次开火。记录执行过程中所有的命令返回码，断言所有触控注入返回码均为 0（驱动队列未崩溃），且弹药扣减量受武器射速物理上限约束。
  - **断言语句**：
    `ctx.assert_true(all(code == 0 for code in tap_codes))`
    `ctx.assert_true(0 < (ammo_before - ammo_after) <= 10)`
- **`TC-E2E-T2-04-04`（下蹲锁存键 Flag 4096 快速交替切换测试）**：
  - **断言逻辑**：记录站立视线高度 $z_{stand}$。点击一次下蹲，等待 200ms 查询视线高度 $z_{crouch}$，断言 $z_{stand} - z_{crouch} \ge 12$ 像素高度；再次点击下蹲，查询视线高度恢复值 $z_{restore}$，断言 $|z_{restore} - z_{stand}| \le 2$。
  - **断言语句**：
    `ctx.assert_greater(z_stand - z_crouch, 12)`
    `ctx.assert_almost_equal(z_restore, z_stand, delta=2.0)`
- **`TC-E2E-T2-04-05`（按压后划出屏幕外的悬垂按键释放）**：
  - **断言逻辑**：模拟从前进键 (105, 107) 向屏幕外滑动并松开。等待 300ms 后查询玩家前向速度，断言速度在释放后归零，未发生无限制向前持续移动。
  - **断言语句**：
    `pos1 = ctx.xrcon.query_viewpos()`
    `time.sleep(0.3)`
    `pos2 = ctx.xrcon.query_viewpos()`
    `ctx.assert_almost_equal(pos2["x"], pos1["x"], delta=0.5)`

#### 特性 5：向前大跳无向后异常边界
- **`TC-E2E-T2-05-01`（后退移动中误触大跳的指令仲裁）**：
  - **断言逻辑**：注入后退按键后紧接大跳宏。读取操作前后的 viewpos，断言 X/Y 坐标数值有效（非 NaN 且非 Inf），且水平位移方向受大跳 `+forward` 向量主导向前移动。
  - **断言语句**：
    `ctx.assert_true(not math.isnan(pos_after["x"]))`
    `ctx.assert_greater(pos_after["x"] - pos_before["x"], 0)`
- **`TC-E2E-T2-05-02`（滞空下落阶段连续快速连点大跳）**：
  - **断言逻辑**：在跳跃滞空下落阶段连续触发大跳。采样下落中相邻时刻的 Z 轴高度，断言下落速率单调增加，未产生二次向上的脉冲跳跃。
  - **断言语句**：
    `ctx.assert_true(z_fall2 <= z_fall1)`
- **`TC-E2E-T2-05-03`（低矮狭窄通风管道下触发大跳碰撞）**：
  - **断言逻辑**：在通风管道（净空高度限制为 45 单位）下执行大跳。查询起跳后达到的最大高度 $z_{peak}$，断言高度受顶部碰撞体阻碍，且玩家状态未发生地图穿透。
  - **断言语句**：
    `ctx.assert_true(z_peak < duct_ceiling_z)`
    `ctx.assert_true(not math.isnan(z_peak))`
- **`TC-E2E-T2-05-04`（极端低帧率 20fps 下的 wait 指令时序验证）**：
  - **断言逻辑**：通过 XRCON 设置 `fps_max 20`。读取位置后执行大跳宏，再次读取位置。断言即使在帧率下降时，wait 指令产生的下蹲延迟依然使玩家实现前向跃进。恢复 `fps_max 60`。
  - **断言语句**：
    `ctx.assert_greater(pos_after["x"] - pos_before["x"], 20)`
- **`TC-E2E-T2-05-05`（斜坡与梯子边缘触发大跳）**：
  - **断言逻辑**：在梯子吸附状态下触发大跳。查询运动状态与坐标，断言与梯子的吸附脱离，前向位移矢量脱离梯子平面。
  - **断言语句**：
    `ctx.assert_true(disengage_ok)`
    `ctx.assert_greater(pos_after["y"] - pos_before["y"], 5)`

#### 特性 6：多点触控并发防冲突边界
- **`TC-E2E-T2-06-01`（硬件极限 5 点触控同时注入压测）**：
  - **断言逻辑**：通过循环并发向 `/dev/input/event1` 注入 5 个触控接触点。注入后执行 `ctx.dev.is_online()` 与 `miniapp_cli status`，断言设备内核驱动未发生死锁崩溃，服务保持在线。
  - **断言语句**：
    `ctx.assert_true(ctx.dev.is_online())`
    `ctx.assert_equal(ctx.dev.run_cmd("miniapp_cli status 8002026110400001")["code"], 0)`
- **`TC-E2E-T2-06-02`（跨越左右逻辑分区界限的拖拽滑移）**：
  - **断言逻辑**：模拟从左半屏（$lx=100$）连续滑动至右半屏（$lx=500$）。断言滑动手势返回码为 0，且滑动过程中未误触发右侧攻击按键。
  - **断言语句**：
    `ctx.assert_true(res["code"] == 0)`
    `ctx.assert_equal(ammo_after, ammo_before)`
- **`TC-E2E-T2-06-03`（同按键区域内的双指极近距离按压）**：
  - **断言逻辑**：在间距 4 像素内同时注入两指点击与释放。读取活跃槽位计数，断言按键在两指释放后完全复位，未出现残留长按。
  - **断言语句**：
    `ctx.assert_equal(active_slots, 0)`
- **`TC-E2E-T2-06-04`（鬼影脉冲 5ms 瞬态按压输入防御）**：
  - **断言逻辑**：注入 5ms 的超短瞬态脉冲。断言驱动未进入死循环，随后的单点点击仍能正常响应。
  - **断言语句**：
    `ctx.assert_true(ctx.touch.tap_button("use", delay=0.1))`
- **`TC-E2E-T2-06-05`（一指长按时另一指同键位高频点击冲突）**：
  - **断言逻辑**：Slot 0 持续按住下蹲键，Slot 1 对同键位进行快速点按。查询点按过程中的玩家高度，断言下蹲状态未被释放指打断。
  - **断言语句**：
    `ctx.assert_almost_equal(pos["z"], crouch_z, delta=2.0)`

#### 特性 7：NPC 身体前倾趴地姿态修复边界
- **`TC-E2E-T2-07-01`（NPC 走过 30 度斜坡时的姿态稳定性）**：
  - **断言逻辑**：在包含斜坡的地图场景中监测行进中的科学家/Barney。查询其骨骼实体俯仰角，断言 Pitch 轴数值严格维持在 $[-1.0, 1.0]$ 区间内，未发生前倾 90 度异常。
  - **断言语句**：
    `ctx.assert_almost_equal(npc_angles["pitch"], 0.0, delta=1.0)`
- **`TC-E2E-T2-07-02`（受爆炸物理冲击下的受击与死亡动画）**：
  - **断言逻辑**：触发爆炸使 NPC 生命值归零。监控动画序列，断言其状态转换为死亡，且动画播放完成后位置与姿态角保持静止，未循环恢复为站立。
  - **断言语句**：
    `ctx.assert_true(npc_health <= 0)`
    `ctx.assert_almost_equal(npc_vel, 0.0, delta=0.1)`
- **`TC-E2E-T2-07-03`（多 NPC 同屏密集渲染性能与姿态隔离）**：
  - **断言逻辑**：同屏生成 3 个以上 NPC。抓取真机截图并解析，断言各 NPC 姿态直立，且游戏帧率维持在 $\ge 25\text{fps}$。
  - **断言语句**：
    `ctx.assert_greater(fps, 25.0)`
    `ctx.assert_true(all(abs(a["pitch"]) < 1.0 for a in npc_angles_list))`
- **`TC-E2E-T2-07-04`（NPC 从高处跌落悬空下落姿态）**：
  - **断言逻辑**：观测高台跌落的 NPC。断言落地碰撞后其足底接触地面，未发生穿透地形或倒伏。
  - **断言语句**：
    `ctx.assert_almost_equal(npc_pos["z"], ground_level_z, delta=2.0)`
- **`TC-E2E-T2-07-05`（剧情脚本坐姿动画保护）**：
  - **断言逻辑**：在序章 `c0a0` 轨道控制室检查坐姿操作员。断言其骨骼姿态符合预设剧情序列，未被通用行走的 Pitch 归零逻辑强行拉伸为站立状态。
  - **断言语句**：
    `ctx.assert_equal(npc_sequence_name, "sitting_console")`

#### 特性 8：黑橙工控风居中暂停菜单边界
- **`TC-E2E-T2-08-01`（高频快速呼出与关闭菜单抗疲劳测试）**：
  - **断言逻辑**：以 150ms 间隔交替点击 5 次菜单按钮。分析当前屏幕截图，断言处于奇数次时菜单处于开启状态（工控橙占比 $> 0.05$）。
  - **断言语句**：
    `ctx.assert_greater(metrics["orange_ratio"], 0.05)`
- **`TC-E2E-T2-08-02`（菜单弹出期间背景点击穿透防御）**：
  - **断言逻辑**：呼出菜单后，点击菜单背后的开火与跳跃区域。记录操作前后的弹药与坐标，断言模态遮罩生效，背景操作未被触发。
  - **断言语句**：
    `ctx.assert_equal(ammo_after, ammo_before)`
    `ctx.assert_almost_equal(pos_after["z"], pos_before["z"], delta=0.5)`
- **`TC-E2E-T2-08-03`（存盘写入期间误点退出保护）**：
  - **断言逻辑**：在执行快速存盘的耗时窗口期立即注入退出指令。依据 `libjsapi_hl.c` 中 `stop_game_locked` 的互斥锁机制，断言存档文件先写入完成，退出动作有序执行。
  - **断言语句**：
    `stat_res = ctx.dev.run_cmd("stat -c %s /userdisk/halflife/valve/save/quick.sav")`
    `ctx.assert_greater(int(stat_res["output"].strip()), 1024)`
- **`TC-E2E-T2-08-04`（系统级低电量弹窗并发下的焦点恢复）**：
  - **断言逻辑**：模拟系统通知弹出后关闭。断言游戏窗口重新获取 Wayland 焦点，后续触控点击恢复响应。
  - **断言语句**：
    `ctx.assert_true(focus_restored)`
- **`TC-E2E-T2-08-05`（菜单按钮上的微幅滑动防误触）**：
  - **断言逻辑**：在菜单“退出游戏”按钮上按下并横向滑动超 20 像素后抬起。断言滑动识别为取消操作，游戏进程保持存活。
  - **断言语句**：
    `ctx.assert_equal(ctx.dev.run_cmd("pidof xash3d")["code"], 0)`

#### 特性 9：Save/Load 存读档可靠性边界
- **`TC-E2E-T2-09-01`（0 字节损坏存档文件的读档容错）**：
  - **断言逻辑**：在设备端创建 0 字节的 `/userdisk/halflife/valve/save/quick.sav`。记录当前 PID，下发 `load quick` 指令。等待 500ms 后重新查询 PID，断言引擎未发生段错误闪退，进程平稳维持。
  - **断言语句**：
    `pid_after = ctx.dev.run_cmd("pidof xash3d")["output"].strip()`
    `ctx.assert_equal(pid_after, pid_before)`
- **`TC-E2E-T2-09-02`（超高频连续存盘请求并发压测）**：
  - **断言逻辑**：在 500ms 内连续下发 5 次 `save quick` 指令。检查最终的 `quick.sav` 大小与有效性，断言文件大小大于 10KB 且未被截断损坏。
  - **断言语句**：
    `file_size = int(ctx.dev.run_cmd("stat -c %s /userdisk/halflife/valve/save/quick.sav")["output"].strip())`
    `ctx.assert_greater(file_size, 10240)`
- **`TC-E2E-T2-09-03`（磁盘空间耗尽 ENOSPC 极端异常处理）**：
  - **断言逻辑**：当存储空间不足或模拟返回满盘错误时下发存盘。断言存盘调用返回失败提示，但引擎子进程不崩溃。
  - **断言语句**：
    `ctx.assert_true(not save_ok or "failed" in save_res)`
    `ctx.assert_equal(ctx.dev.run_cmd("pidof xash3d")["code"], 0)`
- **`TC-E2E-T2-09-04`（濒死瞬间生命值 1 的极端存读档）**：
  - **断言逻辑**：在生命值为 1 且受击瞬间执行存盘，随后重新读档。断言玩家恢复后处于存活状态（生命值 $\ge 1$）且具备移动能力。
  - **断言语句**：
    `ctx.assert_greater(health_after_load, 0)`
    `ctx.assert_true(player_can_move)`
- **`TC-E2E-T2-09-05`（存档文件被设置为只读权限时的保护行为）**：
  - **断言逻辑**：将 `quick.sav` 设置为只读权限 `chmod 444`。下发 `save quick`。断言进程保持存活，且旧存档未被破坏。在 `finally` 中恢复权限 `chmod 644`。
  - **断言语句**：
    `ctx.assert_equal(ctx.dev.run_cmd("pidof xash3d")["code"], 0)`
    `ctx.assert_equal(hash_after, hash_before)`

#### 特性 10：全流程 105 个关卡完整性边界
- **`TC-E2E-T2-10-01`（极速连续切换多张地图内存防泄漏压测）**：
  - **断言逻辑**：以 800ms 间隔连续切换 `c0a0`, `c1a0`, `c2a5`, `c4a1`, `c0a0`。查询进程常驻内存集（RSS），断言内存未发生无序翻倍泄漏，引擎保持运行。
  - **断言语句**：
    `ctx.assert_less(rss_delta_mb, 60.0)`
    `ctx.assert_equal(ctx.dev.run_cmd("pidof xash3d")["code"], 0)`
- **`TC-E2E-T2-10-03`（跨大跨度章节 Trigger Changelevel 模拟）**：
  - **断言逻辑**：从序章 `c0a0` 强制跳转至外星关卡 `c4a1`。查询环境重力参数 `sv_gravity`，断言重力参数正确切换为外星低重力环境。
  - **断言语句**：
    `gravity_val = int(ctx.xrcon.send_cmd("sv_gravity")[1].split()[-1])`
    `ctx.assert_true(gravity_val in (400, 600))`
- **`TC-E2E-T2-10-04`（高密度实体超大关卡 c2a5 地表激战载入峰值检测）**：
  - **断言逻辑**：加载大型关卡 `c2a5`。记录加载耗时并轮询引擎状态，断言在 8 秒内完成地图加载，未被系统 OOM Killer 杀进程。
  - **断言语句**：
    `ctx.assert_less(load_duration, 8.0)`
    `ctx.assert_equal(ctx.dev.run_cmd("pidof xash3d")["code"], 0)`
- **`TC-E2E-T2-10-05`（通关大结局后直接重跳序章状态彻底复位）**：
  - **断言逻辑**：加载大结局 `c5a1` 后直接重新切回 `c0a0`。查询装备栏与重力，断言外星特殊装备已清空，重力复位为 800。
  - **断言语句**：
    `ctx.assert_equal(reset_gravity, 800)`
    `ctx.assert_true(alien_weapons_cleared)`

#### 特性 11：真机端到端自动化测试链路边界
- **`TC-E2E-T2-11-01`（ADB 链路瞬态抖动与自动重连恢复）**：
  - **断言逻辑**：在执行命令时模拟短时间网络或端口重连，断言 `DeviceEnv.run_cmd` 内置重试机制在窗口期内成功恢复。
  - **断言语句**：
    `ctx.assert_equal(res["code"], 0)`
- **`TC-E2E-T2-11-03`（真机磁盘空间不足时的前置防护拦截）**：
  - **断言逻辑**：模拟可用磁盘空间不足 5MB 时触发截屏拉取，断言套件能够检测并抛出磁盘告警异常，防止设备磁盘被占满。
  - **断言语句**：
    `ctx.assert_true(disk_warning_triggered)`
- **`TC-E2E-T2-11-04`（执行前残留僵尸引擎进程的自动清理）**：
  - **断言逻辑**：调用清理钩子执行 `pkill -9 xash3d` 后，再次查询 `pidof xash3d`，断言返回码非 0（进程彻底消除）。
  - **断言语句**：
    `ctx.assert_true(ctx.dev.run_cmd("pidof xash3d")["code"] != 0)`
- **`TC-E2E-T2-11-05`（单项测试看门狗超时 15 秒熔断机制）**：
  - **断言逻辑**：在用例内部实例化一个低超时门限的 `TestRunner(ctx, timeout=0.15)`，传入一个休眠 0.35s 的模拟探测用例。调用 `runner.run_case()`，断言记录返回状态严格为 `"TIMEOUT"`，且错误信息包含 `"Watchdog timeout"`。
  - **代码实现设计**：
    ```python
    @register_case("TC-E2E-T2-11-05", 2, 11, "单项测试看门狗超时（15 秒）熔断机制", "单项用例在超时后被看门狗强行熔断并记录现场")
    def test_t2_11_05(ctx):
        # 构造微型调度器验证超时熔断机制
        probe_runner = TestRunner(ctx, timeout=0.15)
        def timeout_worker(c):
            time.sleep(0.35)
        mock_case = {
            "id": "TC-PROBE-TIMEOUT",
            "tier": 2,
            "feature": 11,
            "name": "timeout_probe",
            "desc": "test watchdog",
            "func": timeout_worker,
        }
        record = probe_runner.run_case(mock_case)
        ctx.assert_equal(record["status"], "TIMEOUT")
        ctx.assert_true("Watchdog timeout" in (record.get("error") or ""))
    ```

---

## 5. Verification Method (独立复核方法)

实施人员与审查人员可依据以下步骤验证本蓝图方案的正确性与有效性：

1. **复核 PNG 逆滤波算法对实机截屏的还原效果**：
   ```bash
   python3 -c '
   import zlib, struct

   def test_decode(path):
       data = open(path, "rb").read()
       offset = 8
       idat = []
       while offset < len(data):
           length, ctype = struct.unpack(">I4s", data[offset:offset+8])
           offset += 8
           cdata = data[offset:offset+length]
           offset += length + 4
           if ctype == b"IHDR":
               w, h, bdepth, ctype_code = struct.unpack(">IIBB", cdata[:10])
           elif ctype == b"IDAT":
               idat.append(cdata)
           elif ctype == b"IEND":
               break
       raw = zlib.decompress(b"".join(idat))
       bpp = 4 if ctype_code == 6 else (3 if ctype_code == 2 else 1)
       row_len = w * bpp
       stride = 1 + row_len
       prev = bytearray(row_len)
       for r in range(h):
           ftype = raw[r * stride]
           filt = raw[r * stride + 1 : r * stride + stride]
           recon = bytearray(row_len)
           for i in range(row_len):
               x = filt[i]
               a = recon[i - bpp] if i >= bpp else 0
               b = prev[i]
               c = prev[i - bpp] if i >= bpp else 0
               if ftype == 0: val = x
               elif ftype == 1: val = (x + a) & 0xFF
               elif ftype == 2: val = (x + b) & 0xFF
               elif ftype == 3: val = (x + ((a + b) >> 1)) & 0xFF
               elif ftype == 4:
                   p = a + b - c
                   pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                   pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                   val = (x + pr) & 0xFF
               recon[i] = val
           prev = recon
       print(f"Successfully decoded {path}: {w}x{h}, bpp={bpp}")

   test_decode("/Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png")
   test_decode("/Volumes/500GB/Ydpen/halflife_app/hl_gameplay_live.png")
   '
   ```
   - **判定依据**：两张包含复杂差分滤波的真机图像均输出解码成功，且提取到的色彩不再呈现杂乱离散值。

2. **复核看门狗微型超时任务运行**：
   在单例脚本中直接运行 `test_t2_11_05` 蓝图代码，验证耗时仅 0.15 秒且 `status == "TIMEOUT"` 成立，不会挂起测试套件主流程。
