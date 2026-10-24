# 设备画像：有道词典笔（CoCo-1826）· 视频播放器

```yaml
profile_id: youdao-dictpen-coco1826-3.4.6-video
model: "YoudaoDictionaryPen-112 (CoCo-1826, Cvitek cv182x)   # USB 枚举身份显示为 Nexus_4/mako（伪装），实为 Buildroot armv7l"
firmware: "miniapp runtime 3.4.6, kernel 4.19.164-tag--g23c8a94c91bf, Buildroot 2021.05-rc3"
runtime:
  falcon: "jsfm-nvue (QuickJS 字节码加载, /etc/miniapp/resources/framework/jsfm-nvue.js.bin)"
  vue: "2.6.12 (weex-template-compiler 2.6.12-falcon3)"
  quickjs: "20200705"
abi:
  machine: "armv7l (ARMv7-A, Cortex-A53 x4, neon vfpv4)"
  bits: 32
  libc: "glibc (Buildroot 2021.05-rc3)"
  toolchain: "arm-buildroot-linux-gnueabihf / armv7-eabihf--glibc--stable-2018.11 (penosext/Cloudpan)"
screen:
  physical: { width: 254, height: 800, direction: 270, xoffset: 0, yoffset: 0 }
  touch: { direction: 270, xoffset: 113, yoffset: 0, node: "/dev/input/event4" }
  design: { width: 800, height: 254 }
  fb0:
    bpp: 32
    visible: { width: 254, height: 800 }
    virtual: { width: 256, height: 1600 }   # 双缓冲，yoffset 平移切换
    stride: 1024                            # = 256px * 4B
    note: "运行时 cfg.json: dbuffer=true, direction=270; 逻辑横屏->物理竖屏映射 col=y, row=799-x"
media:
  gstreamer: "不存在（无 libgstreamer-1.0、无 gst-launch/gst-inspect）"
  ffmpeg: "FFmpeg 4.4 全套: libavformat.so.58.76, libavcodec.so.58.134, libavutil.so.56.70, libswscale.so.5.9, libswresample.so.3.9, libavfilter.so.7, libavdevice.so.58, libpostproc.so.55 (均在 /usr/lib)"
  hw_codec: "libcvi_vcodec.so 存在（Cvitek 硬编解码，v1 未接入）"
  alsa:
    lib: "libasound.so.2"
    default_pcm: "asym -> speaker -> spk_softvol -> hw:1,0 (softvol 'Master Playback Volume' card 1)"
    capture: "hw:2,0"
    note: "系统 SoundPlayer 常驻进程 /oem/YoudaoDictPen/output/SoundPlayer"
  official_player:
    appid: "8001650599023931 (MEDIAPLAYER, 系统应用)"
    libs: "libjsapi_mediaplayer_*.so + libbusiness_mediaplayer_*.so"
    nature: "音频课程播放器（mp3+歌词字幕），非视频；其 NEEDED 含 libYoudaoStitch.so，但该库不在本机（多平台包痕迹）"
  hole_component: "未验证（jsfm 为 qjsc 字节码，无法静态确认 <hole>；v1 未使用）"
jsapi:
  storage:
    set: "storage.setStorage({key, data})"
    get: "storage.getStorage({key}) -> {data}"
  fs_module: "不存在（本应用自带 libjsapi_better_video.so 注册 fs）"
package:
  appid: "8001876543210988"
  start_page: "index"
startup:
  install: "miniapp_cli install /tmp/<app>.amr"
  start: "miniapp_cli start <appid>   # 裸启动；--page 写法本固件解析不了"
  build: "aiot-cli -c -q -p（qjsc 字节码，每页独立 chunk）"
validation:
  tested_at: "2026-09-04"
  evidence:
    - "adb 只读探测：/usr/lib 无 gstreamer；FFmpeg 4.4 库列表齐全；libasound.so.2 存在"
    - "fb0: bits_per_pixel=32, virtual_size=256x1600, stride=1024"
    - "/etc/miniapp/resources/cfg.json 与 pen-novel-reader profile 一致（254x800, direction 270）"
    - "/userdisk/video 与 /userdisk/Favorite/一些番剧 下有真实 mp4 片源"
    - "系统播放器包内 libjsapi_mediaplayer NEEDED 含 libavcodec.so.58 —— 官方同款解码栈"
    - "本应用 AMR 真机 install + start 成功；miniapp_cli capture 确认首页渲染正常（标题/找视频按钮/空态提示）"
    - "CI（ubuntu）交叉编译 libjsapi_better_video.so 通过 ELF 校验：NEEDED 仅 libdl/libpthread/libstdc++/libm/libgcc_s/libc（FFmpeg/ALSA 运行时 dlopen）"
    - "release 工作流 x5 机型 AMR 构建成功（dist/releases/better-video-1.0.0-x5.amr）"
  unverified:
    - "视频解码→fb0 直写画面（含 270° 旋转方向）——待真机播放确认"
    - "ALSA default PCM 与系统 SoundPlayer 并发占用"
    - "进度条 seek / 倍速（swr 重采样）/ 音量软增益的真机表现"
    - "720p/1080p 软解实测帧率"
    - "其他机型（a6p/p5/x7/s6p）的 FFmpeg/fb0 布局"
  quirks:
    - "captureFB 常返回旧缓冲（书阁 profile 已记录），验证一律用 miniapp_cli capture"
    - "覆盖安装后旧实例可能仍在跑，需要 uninstall + install + start 才能换新版本"
  constraints:
    - "禁止 adb 触发任何声音输出（用户明确要求）：验证播放时把软件音量设为 0（增益 0 = 静音）"
    - "adb 卡住的 shell 抓键进程（/dev/input/event4）不要杀"
  blocker:
    - "2026-09-04 起 adb shell 返回 'login with \"adb shell auth\" to continue'，需人工执行一次 adb shell auth 才能继续真机验证"
```
