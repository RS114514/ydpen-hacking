# 更好的视频 · 有道词典笔视频播放器

一款运行在有道词典笔（Falcon / HaaS UI mini-app 运行时）上的**视频播放器**。
读取笔内存储的视频文件（mp4/mkv/avi 等），支持播放历史与断点续播、进度条拖动、
倍速、音量调节，**高分辨率视频（1080P/4K）自动降画质保证流畅**。

![appid](https://img.shields.io/badge/appid-8001876543210988-4fd6c3)
![runtime](https://img.shields.io/badge/runtime-Falcon%20%2F%20Vue2.6-121922)

## 功能

- **找视频**：进入任意目录自动递归扫描视频文件（mp4/mkv/avi/mov/m4v/3gp/webm/ts/flv…），
  一级文件夹导航 + 扫描结果合并展示
- **播放器**：
  - **进度条**：拖动滑动条 seek（-30s/+30s 快捷键随时可点），500ms 轮询刷新
  - **倍速**：0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x，按钮循环切换
  - **音量**：0–100 滑动条（软件增益，不影响系统混音器）
  - **自动降画质**：视频分辨率超出屏幕（800×254）时自动缩放到屏幕内输出；
    1080P/4K 片源直接播放会给出「已降至流畅画质」提示
- **播放历史**：按条目记忆进度/倍速/音量，首页「继续播放」一键回到上次位置，
  最近 50 条，播完（≥98%）自动让位
- **断点续播**：重进同一视频自动 seek 到上次进度（>3s 才生效），退出/切后台即存

## 架构

官方 HaaS UI 没有 `<video>` 组件，本机也没有 GStreamer——所以视频引擎是**自带的原生模块**：

```
ui/src/utils/player-bridge.js   ← JS 侧稳定接口（play/seek/setRate/setVolume/...）
native/jsapi/src/VideoBridge.cpp ← FFmpeg(4.4) 解码 + libswscale 缩放
                                   + /dev/fb0 直写（254×800 竖屏，270° 旋转 blit）
                                   + ALSA 出声（libasound，软件音量）
                                   + 倍速 = swresample 重采样加速（音调随速度）
```

- **FFmpeg / ALSA 全部运行时 `dlopen`**：编译期零依赖（头文件 vendor 在
  `native/jsapi/ffmpeg-include/`，与目标固件 libavcodec 58.134 同为 4.4 系），
  目标笔 `/usr/lib` 里已有全部所需库（CoCo-1826 真机已验证）；缺库时返回
  明确错误而不是崩溃。
- **fs 模块**（扫描/持久化，跨机型）来自 pen-novel-reader 同源的 FileSystem 骨架；
  armv7-glibc 笔上另打包 `libjsapi_langningchen.so`（custom.scan）加速目录枚举。
- 页面代码不感知机型：分辨率从 `/etc/miniapp/resources/cfg.json` 读取，
  原生 fb 布局经 ioctl 现场探测。

## 真机适配记录（profile 摘要 · CoCo-1826 / X5）

| 项目 | 值 |
|---|---|
| 屏幕 | 逻辑 800×254 横屏；fb0 物理 254×800、32bpp、stride 1024B、双缓冲（yoffset 平移） |
| 解码 | FFmpeg 4.4 软解（libavcodec.so.58），输出 BGRA 经 swscale 缩放 |
| 显示 | `/dev/fb0` mmap 直写，逻辑→物理映射 `col = y, row = 799 - x`（direction=270） |
| 声音 | ALSA `default` PCM（asym→speaker→hw:1,0），S16 交错立体声，软件增益 |
| 倍速 | swresample 输出率 ×rate（音调随速度变化，v1 取舍） |
| 启动 | `miniapp_cli install <amr>` 后 `miniapp_cli start <appid>`（不带 --page） |
| 构建 | `aiot-cli -c -q -p`（qjsc 字节码，每页独立 chunk） |

详细画像与验证状态见 [profiles/youdao-dictpen-coco1826.md](profiles/youdao-dictpen-coco1826.md)。

## 多机型构建（GitHub Actions）

仓库：<https://github.com/Guzhuooo/better-video-player>

两个工作流：

- **build-amr**（push / PR）：单测 → 交叉编译 armv7-glibc 原生模块（编译门禁）→ 打包 AMR。
  ✅ 当前全绿（含原生模块编译）。
- **release**（tag 或手动）：`tools/build-all-releases.sh` 逐机型编译并打包
  `dist/releases/better-video-<版本>-<机型>.amr`。
  当前默认只做 **x5**（用户指定），其余机型留待后续：

| 机型 | ABI | 原生模块 | 状态 |
|---|---|---|---|
| X5 / S6 Pro | armv7 glibc | better_video(fs+video) + langningchen(custom.scan) | ✅ CI 构建通过 |
| A6 Pro | armv7 uclibc | better_video(fs+video) | 待构建/验证 |
| P5 / X7 | aarch64 glibc | better_video(fs+video) | 待构建/验证 |

x5 原生模块的 ELF 检查结果：`NEEDED: libdl libpthread libstdc++ libm libgcc_s libc`——
FFmpeg/ALSA 全部 dlopen，不引入额外链接依赖，因此同一个 `.so` 在带 FFmpeg 的固件上即可用。

## 真机验证状态（CoCo-1826 / X5）

已验证：

- 交叉编译产物在真机 `miniapp_cli install/start` 成功，首页（标题 / 找视频按钮 / 空态提示）
  通过 `miniapp_cli capture` 截屏确认渲染正常
- 原生模块经 CI 交叉编译通过 ELF 校验（只依赖基础库，FFmpeg/ALSA 运行时 dlopen）

待验证（**卡在 ADB 认证**：当前 `adb shell` 返回 `login with "adb shell auth" to continue`，
需要人工在电脑上执行一次 `adb shell auth` 完成认证）：

- 视频解码/显示链路（fb0 直写画面、270° 旋转方向）
- ALSA 出声、进度条 seek、倍速、音量
- `captureFB` 在本机存在取旧缓冲的问题，验证一律用 `miniapp_cli capture`

## 本地开发

```sh
pnpm install
pnpm test                 # 纯逻辑单测（node --test）
pnpm -C ui package        # 打包 AMR（win32/linux/darwin qjsc 均有）
tools/build-native.sh --list     # 查看本机交叉工具链
```

真机安装：

```sh
adb push ui/8001876543210988.1_0_0.amr /tmp/app.amr
adb shell miniapp_cli install /tmp/app.amr
adb shell miniapp_cli start 8001876543210988
```

## 已知限制（v1）

- 1080P 走 FFmpeg 软解：4×Cortex-A53 上约 12–20fps，播放节奏正确（音频主时钟、
  视频追帧丢帧），追求满帧需后续接入 Cvitek 硬解码（libcvi_vcodec）
- 倍速为重采样加速，音调随速度变化
- 视频帧与 Falcon UI 同写一个 fb：控件重绘瞬间可能短暂覆盖视频区，下一帧即恢复
- 双缓冲在运行时 pan 时偶发一帧闪烁（v1 写当前可见缓冲）

## License

GPL-3.0-or-later（原生模块基于 miniapp-template / 书阁同源骨架）
