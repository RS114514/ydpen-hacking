# Valve / Steam 官方正版 Lambda 图标资产提取与部署勘查报告

## 1. 勘查观测记录 (Observation)

### 1.1 Steam 官方图标源文件勘查
- **源文件绝对路径**：
  `/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns`
- **文件元数据与哈希**：
  - 文件大小：185,830 字节
  - 权限：`-rwxr-xr-x@`
  - MIME / 文件类型：`Mac OS X icon, 185830 bytes, "TOC " type`
  - 图像色彩配置：RGB 空间，`samplesPerPixel: 4`，`bitsPerSample: 8`，`hasAlpha: yes`，`dpi: 72.000`，色彩描述文件为 `Generic RGB Profile`
  - MD5 哈希：`c025341d4ebda78954e29f760a7fd7c4`
  - SHA256 哈希：`c3e4c46f0b4cf8b11b3506f8607ab630e94e21e80d4ea5c52cce71ca8c364aa7`

### 1.2 `game.icns` 内部子分辨率与二进制结构分析
通过解析 `game.icns` 容器内部的 Chunk 标签，观测到以下层级结构：
- `TOC `（104 字节）：目录结构表
- `ics#`（72 字节）、`ics8`（264 字节）、`is32`（681 字节）、`s8mk`（264 字节）：16x16 传统位图及遮罩
- `ICN#`（264 字节）、`icl8`（1032 字节）、`il32`（2184 字节）、`l8mk`（1032 字节）：32x32 传统位图及遮罩
- `it32`（26,808 字节）、`t8mk`（16,392 字节）：128x128 RLE 压缩位图及 8 位 Alpha 遮罩
- `ic08`（55,147 字节）：**256x256 32-bit RGBA 原生 PNG 数据流**（包含完整 PNG 签名头 `\x89PNG`）
- `ic09`（81,578 字节）：**512x512 32-bit RGBA 原生 PNG 数据流**（包含完整 PNG 签名头 `\x89PNG`）

使用 macOS 原生工具 `iconutil -c iconset` 解包至目录后，提取出各级标准 PNG：
- `icon_512x512.png`：512 x 512，8-bit RGBA，81,586 字节，MD5 为 `1e5434635437bf177e64ac551ba7fa41`，SHA256 为 `89317ed2c6c4ff9e8daefe690c897473aca216488f858295efc246a0f4a38bc8`
- `icon_256x256.png`：256 x 256，8-bit RGBA，55,155 字节，MD5 为 `c77579da2a0335e2363b8b1bfb9b00cb`
- `icon_128x128.png`：128 x 128，8-bit RGBA，18,049 字节，MD5 为 `2fc0758416ae8e1d52fc111db0cf8a72`
- `icon_32x32.png`：32 x 32，8-bit RGBA，1,912 字节
- `icon_16x16.png`：16 x 16，8-bit RGBA，701 字节

### 1.3 工程现有图标与打包流水线分析
- **现有图标文件**：`/Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png`
  - 规格：120 x 120，8-bit RGBA，17,238 字节。
  - 内部元数据分析：含有 Photoshop XMP 标签（`PixelXDimension=128`, `PixelYDimension=128`），表明该图此前系从 128 像素资产经第三方图像软件二次导出缩小生成，带有色度偏差与模糊，边缘被判定粗糙。
- **构建脚本 `tools/build_amr.py` 打包路径**：
  - 第 134-138 行：
    ```python
    icon_src = os.path.join(HERE, "assets", "app_icon.png")
    if not os.path.exists(icon_src):
        print(f"[!] 警告: 未找到 {icon_src}")
    else:
        shutil.copy(icon_src, os.path.join(BINS_DIR, "app_icon.png"))
        print("  [+] 正版 Lambda 图标已装配到应用包")
    ```
    构建流程将 `assets/app_icon.png` 复制至暂存目录 `build/bins/app_icon.png`。
  - 第 198 行：
    ```python
    cmd_pack = [
        sys.executable, TOOLKIT_PACK_AMR,
        ...
        "--icon", icon_src,
        ...
    ]
    ```
- **通用打包脚本 `ydpen-toolkit/scripts/pack_amr.py` 逻辑**：
  - 第 74-77 行：
    ```python
    icon_name = "app_icon.png"
    if args.icon:
        ic = args.icon if os.path.isabs(args.icon) else os.path.join(ROOT, args.icon)
        files[icon_name] = open(ic, "rb").read()
    ```
    直接将传入的图标以根路径 `app_icon.png` 写入 AMR 的 zip 结构中。
  - 第 33 行：
    ```python
    CERT_EXCLUDE = {"manifest.json", "app_icon.png"}
    ```
    图标文件不计入 `manifest.json` 的 `cert` 签名哈希字典，更换图标无需重新计算签名校验值。
- **应用配置文件 `src/manifest.json`**：
  - 第 5 行：`"icon": "app_icon.png"` 声明小应用图标索引。
- **词典笔系统真机规范验证**：
  - 检查设备 `9DA2200007506350` 上已安装的官方小应用：
    - 《Doge漫画》（appid: `8001145141919812`）：其实际部署的 `/userdisk/miniapp/data/mini_app/pkg/8001145141919812/b/app_icon.png` 为 **512 x 512, 8-bit RGBA**，真机正常加载显示。
    - 词典笔官方预装应用（如 `8001660789649766`）：其实际部署的 `app_icon.png` 为 **120 x 120, 8-bit RGBA**。
    - 其他移植应用（如千恋万花、魔女的夜宴、PVZ）：`app_icon.png` 分辨率涵盖 150x150 与 128x128。
  - 表明 PenOS 的 Weston / miniapp 桌面合成器能够对传入的 512x512、144x144 或 120x120 图标进行自适应硬件渲染与平滑缩放。

### 1.4 工具转换比对实验数据
在状态目录下对 `sips` 与 `iconutil` 的提取效果进行了实测对比：
1. **直接提取 512x512**：
   - 命令：`sips -s format png "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out test_sips_512.png`
   - 产物：512 x 512 RGBA PNG，81,659 字节。与 `iconutil` 导出的 `icon_512x512.png` 核心像素数据完全等价。
2. **提取并下采样至 144x144**：
   - 命令：`sips -s format png -z 144 144 "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out test_sips_144.png`
   - 产物：144 x 144 RGBA PNG，22,772 字节。
3. **提取并下采样至 120x120**：
   - 命令：`sips -s format png -z 120 120 "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out test_sips_120.png`
   - 产物：120 x 120 RGBA PNG，17,329 字节。
4. **重采样算法验证**：
   通过全图像素通道差值对比脚本，计算 `test_sips_120.png`（由 icns 直接生成）与由 512x512 纯净 PNG 缩放生成的 120 图像：全图像素差为 0，最大通道差为 0。证明 `sips` 在处理 `game.icns` 时，以容器内的 512x512 高清图层为源进行抗锯齿双三次插值计算，无品质损耗。

---

## 2. 推理推导链 (Logic Chain)

1. **官方图标资产权威性与纯净度**：
   - 观测 1.1 与 1.2 证明，本地 Steam 官方原版目录中的 `game.icns` 包含 Valve 官方原装的 512x512 32 位 RGBA 原生 PNG 数据流（Chunk `ic09`）。这是 Half-Life 官方最高清的矢量源渲染位图，包含经典的橙色 Lambda 标志、金属圆环与防滑锈迹纹理，具备原生质感。
2. **消除粗糙感的关键技术路径**：
   - 观测 1.3 证明，现有工程中的 `assets/app_icon.png` 曾由 128x128 低分图二次压缩且含有冗余色度描述，造成图标视觉发虚、锯齿感明显。
   - 必须直接以 `game.icns` 内的 512x512 原生高清图层为数据源进行提取，彻底摆脱低分辨率图源。
3. **目标分辨率选型评估**：
   - **方案一（512x512 原生无损，首选推荐）**：
     - 直接输出 512x512 原版 PNG 至 `assets/app_icon.png`。
     - 优势：与 `SCOPE.md` Feature 3（"从 Steam 官方正版 game.icns 提取 512x512 高清 Lambda 资产并部署为 assets/app_icon.png"）完全一致；且依据观测 1.3，设备端官方应用《Doge漫画》同样使用 512x512 图标，PenOS 桌面合成器能够对高分图标进行多重采样下采样，视觉表现最为锐利细腻。
   - **方案二（144x144 / 120x120 双三次下采样备选）**：
     - 若希望保持较小的包体体积或与基准网格对齐，通过 `sips -s format png -z 144 144`（或 `-z 120 120`）导出。
     - 优势：体积控制在 17KB-23KB，由于直接从 512 高清层双三次重采样，边缘平滑且无任何杂色，同样彻底消除粗糙感。
4. **打包与生命周期契合性**：
   - 观测 1.3 证明，`build_amr.py` 会将 `assets/app_icon.png` 复制进 `build/bins/` 并交由 `pack_amr.py` 写入 AMR 根目录，且不受 `cert` 校验制约。因此只需覆盖更新 `assets/app_icon.png`，随后执行现有构建命令，新图标即会自动装配进 AMR 安装包并在设备桌面上生效。

---

## 3. 注意事项与边界说明 (Caveats)

1. **只读约束**：本勘查严格遵守只读规约，未修改或覆盖 `/Volumes/500GB/Ydpen/halflife_app/` 目录下的任何工程文件。所有测试产物仅存放于本 Agent 状态目录 `/Volumes/500GB/Ydpen/.agents/teamwork/explorer_m1_3/test_extract/`。
2. **设备缓存特性**：PenOS 的 Falcon 桌面或 Launcher 在覆盖安装同 appid 应用时，有时会缓存旧应用图标的位图纹理。若真机安装后图标未即时更新，需执行 `miniapp_cli stop 8002026110400001` 或重启桌面服务（`/usr/bin/miniapp`）。
3. **macOS 元数据文件**：在外部存储卷（如 `/Volumes/500GB`）上操作图片文件时，macOS 容易生成 `._app_icon.png` 伴随文件。在构建 AMR 前，应确保 `pack_amr.py` 过滤 `._*` 文件（经观测，`pack_amr.py` 第 67 行已明确包含 `n.startswith("._")` 过滤逻辑）。

---

## 4. 勘查结论 (Conclusion)

1. **官方源文件路径确定**：
   `/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns` 文件真实完整存在，内置 512x512 官方原装高清 PNG。
2. **工程目标替换路径确定**：
   目标工程文件为 `/Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png`。
3. **推荐提取方案与具体命令**：
   - **首选 512x512 原生无损方案**（符合 `SCOPE.md` 规定）：
     ```bash
     sips -s format png "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
     ```
   - **备选 144x144 高清重采样方案**：
     ```bash
     sips -s format png -z 144 144 "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
     ```
   - **备选 120x120 高清重采样方案**：
     ```bash
     sips -s format png -z 120 120 "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
     ```
4. **打包流程无需改动**：
   `tools/build_amr.py` 已经具备将 `assets/app_icon.png` 打包进 AMR 的完整逻辑，替换 `assets/app_icon.png` 后执行打包即可自动装配。

---

## 5. 独立验证方法 (Verification Method)

负责实施的 Agent 执行替换后，可通过以下命令进行独立校验：

1. **源文件提取与替换命令**：
   ```bash
   sips -s format png "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life/valve/game.icns" --out /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
   ```
2. **文件规格与参数独立检验**：
   ```bash
   file /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
   sips -g pixelWidth -g pixelHeight -g format -g hasAlpha /Volumes/500GB/Ydpen/halflife_app/assets/app_icon.png
   ```
   *预期输出*：
   - `file` 输出包含 `PNG image data, 512 x 512, 8-bit/color RGBA`
   - `pixelWidth: 512`
   - `pixelHeight: 512`
   - `format: png`
   - `hasAlpha: yes`
3. **AMR 安装包集成检验**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/build_amr.py
   unzip -p /Volumes/500GB/Ydpen/halflife_app/dist/half-life-1.0.0.amr app_icon.png | file -
   ```
   *预期输出*：
   输出显示包内根目录的 `app_icon.png` 同样为标准清晰的 RGBA PNG 图像。
4. **真机部署与桌面图标检验**：
   ```bash
   python3 /Volumes/500GB/Ydpen/halflife_app/tools/install_amr.py
   /opt/homebrew/bin/adb -s 9DA2200007506350 shell "file /userdisk/miniapp/data/mini_app/pkg/8002026110400001/*/app_icon.png"
   ```
   *预期输出*：
   返回真机小应用解包路径下的 `app_icon.png` 文件，分辨率与格式与构建产物完全一致，设备桌面呈现官方半条命 Lambda 质感图标。
