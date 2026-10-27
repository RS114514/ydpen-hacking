# 网易有道词典笔 YDPX6-2 (X6 Pro) 完整生态开发工作区

> **重要工作区路径**：`/Volumes/500GB/Ydpen`  
> **说明**：本项目已于 2026-10-25 全量迁移至本 500GB 硬盘工作区。本地原路径（`~/.gemini/antigravity/scratch/ydpen`）已配置软链接透明跳转。后续所有开发、编译构建与部署请直接在本目录下进行。

---

## 一、 硬件与系统平台参数

| 项目 | 参数规约 | 核心注意事项 |
| :--- | :--- | :--- |
| **主控芯片** | Rockchip RK3562 (四核 A53 @ 2.0GHz, Mali-G52) | 支持 ARMv8-A (aarch64) 架构原生指令 |
| **操作系统** | PenOS 4.3.5 (Linux 5.10.66) | 根分区只读保护，可写分区为 `/userdisk` 与 `/tmp` |
| **显示系统** | Weston (Wayland 合成器) | **逻辑分辨率 960 × 266**（屏幕物理顺时针旋转 90 度，`rotate-90`） |
| **触控芯片** | FocalTech `fts_ts` (`/dev/input/event1`) | 物理采样范围 **X: 0~480, Y: 0~960**，需做坐标换算 |
| **小程序引擎** | 官方自研 Falcon 引擎 | 基于嵌入式 QuickJS 字节码（`.js.bin`）+ 裁剪版 Vue 2.6 |
| **视口约束** | Falcon 页面限制 | 宽度建议最大 800px，高度绝对限制 ≤ 220px |

---

## 二、 核心应用与子工程清单

| 子项目目录 | 应用名称 | AppID | 功能与架构特性 |
| :--- | :--- | :--- | :--- |
| [`senren_banka/`](https://github.com/RS114514/senren-banka-ydpen-port) | **《千恋＊万花》移植版** | `8002026102400099` | PenOS 移植版视觉小说完整工程（**已独立开源维护于 [RS114514/senren-banka-ydpen-port](https://github.com/RS114514/senren-banka-ydpen-port)**，底层引擎参见 [gal-dictionary-pen-engine](https://github.com/RS114514/gal-dictionary-pen-engine)），含全套自动化解包转码工具链 |
| [`video_player/`](video_player/) | **视频播放器** | `8002026102300004` | 硬件解码播放，支持实时读取目录、多级文件夹浏览与宽屏触控界面 |
| [`minigames_app/`](minigames_app/) | **小游戏合集** | `8002026102500001` | 集成扫雷、小恐龙、马里奥、五子棋、贪吃蛇、推箱子等十多款 GUI 游戏 |
| [`aichat_repo/`](aichat_repo/) | **词典笔 AI 助手** | `8002026091900010` | 离线/在线大模型对话助手，含语音输入与 Markdown 富文本排版 |
| [`pen_term_repo/`](pen_term_repo/) | **PenTerm 终端** | `8002026091900001` | 词典笔端原生 Linux Shell 终端交互界面 |
| [`screen_cast_app/`](screen_cast_app/) | **屏幕投屏** | `8002026102400001` | 低延迟实时屏幕流式传输至电脑端浏览器 |
| [`file_transfer_app/`](file_transfer_app/) | **文件快传** | `8002026091900003` | 局域网 HTTP 文件无线上传下载管理器 |
| [`ydpen-toolkit/`](ydpen-toolkit/) | **开发运维工具集** | — | AMR 字节码编译、逆向分析、签名与 ADB 自动化脚本（包含本地适配插件） |
| [`gwjcfls-ydpen-toolkit/`](gwjcfls-ydpen-toolkit/) | **上游开源工具包** | — | [gwjcfls/ydpen-toolkit](https://github.com/gwjcfls/ydpen-toolkit) 原版仓库，支持持续与上游同步更新 |
| [`research_scripts/`](research_scripts/) | **逆向与调试工具** | — | 针对 QuickJS 字节码与动态库导出的 40+ 深度分析脚本 |
| [`pen_backup/`](pen_backup/) | **系统历史备份** | — | 提取自设备的原始系统包、固件碎片与备份产物 |

---

## 三、 常用设备调试与连接指令

### 1. 设备 ADB 认证与连接
词典笔已开启 ADB（USB 自动枚举，无线端口 5555）：
```bash
# 查看连接状态
adb devices

# 获取词典笔 root 权限
printf 'ydpen2026\n' | adb shell auth
```

### 2. Falcon 应用编译与安装
Falcon 小程序需编译为 QuickJS 字节码后打成 `.amr` 包：
```bash
# 1. 使用内置工具链打包
python3 ydpen-toolkit/scripts/pack_amr.py \
  --src <build_bins_dir> \
  --out /tmp/app-1.0.0.amr \
  --appid <APPID> \
  --name "应用名称" \
  --version "1.0.0"

# 2. 推送并安装到词典笔
adb push /tmp/app-1.0.0.amr /tmp/app.amr
adb shell miniapp_cli install /tmp/app.amr

# 3. 启动应用
adb shell miniapp_cli start <APPID>
```

### 3. 屏幕截图验证
```bash
# 方法一：利用小程序管理器直接截取渲染缓冲区
adb shell "miniapp_cli capture /tmp/screen.png"
adb pull /tmp/screen.png ./screen.png

# 方法二：利用 Wayland 合成器截屏（全屏）
adb shell "cd /tmp && weston-screenshooter"
```

### 4. 触控物理坐标映射算法
因 Weston 显示层顺时针旋转了 90 度，屏幕逻辑坐标 $(X_{screen}, Y_{screen})$ 转换为底座硬件物理坐标 $(X_{raw}, Y_{raw})$ 算法为：
$$\begin{cases} X_{raw} = (266 - Y_{screen}) \times 1.8 \\ Y_{raw} = X_{screen} \end{cases}$$

可通过端口 19999 的极速触控服务端直接注入事件：
```python
import socket

def tap(screen_x, screen_y, duration_ms=50):
    s = socket.socket()
    s.connect(('127.0.0.1', 19999))
    s.sendall(f"T {screen_x} {screen_y} {duration_ms}\n".encode())
    s.close()
```

---

## 四、 跨 Agent 协作与开发规范

1. **工作区边界**：
   - 《千恋＊万花》（`senren_banka/`）由专门的 Agent 持续维护，其他开发任务严禁改动该目录内的业务代码。
2. **磁盘空间管理**：
   - 所有的视频文件、测试大型素材包、编译缓存一律放置在 `/Volumes/500GB/Ydpen` 目录下，严禁拷贝回 MacBook 本地根磁盘。
3. **字体兼容性**：
   - PenOS 系统自带字体不支持现代彩色 Emoji（如 📁、🎬 等）和某些特殊 Unicode 符号（如 ➔）。在界面文本中请使用支持良好的几何字符（如 ▶、◀、[目录]、进入等）。
