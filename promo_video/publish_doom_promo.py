#!/usr/bin/env python3
import os
import re
import subprocess
import sys
import time

BILIUP_BIN = "/Users/fuzihao/.local/bin/biliup"
COOKIE_FILE = "/Users/fuzihao/biliup/rs_tv.json"
VIDEO_PATH = "/Volumes/500GB/Ydpen/promo_video/output/ydpen_doom_promo.mp4"
COVER_PATH = "/Volumes/500GB/Ydpen/promo_video/output/ydpen_doom_cover.jpg"

TITLE = "我把DOOM装进了有道词典笔。"

DESC = """【给词典笔的 DOOM 移植做的一支宣传片】
说明白：本片以动效包装为主，真机画面是其中两段——约 1 秒的存档加载擦除，以及约 6 秒的真实游玩录制（走动、转向、开火，弹药从 50 打到 31）。

移植本身是货真价实的原生运行：
- 有道词典笔 X6 Pro（RK3562 / aarch64），doomgeneric 原生移植
- 960×266 超宽屏原生渲染，客户端实测约 60FPS
- Wayland 直出 + ALSA 音频 + evdev 触控，无模拟器、无串流
- 左侧六键移动，右侧 FIRE / USE / MENU / OK / SPEED / WEAPON
- 自动存档 slot 7，退出即存，图标冷启动自动续关
- E1M1 完整可玩，运行内存约 10MB

【开源与工具链】
有道词典笔搞机工具链与逆向套件：github.com/RS114514/ydpen-hacking
上游引擎：doomgeneric
* DOOM 移植源码整理中；仓库不含任何商业游戏素材，请支持正版 id Software

BGM：Andrew Hulshult - At Doom's Gate (E1M1) Metal Cover
仅作非商业展示，版权归原作者所有。

后续会补一条纯实机游玩演示。喜欢的话欢迎一键三连，感谢支持！"""

TAGS = "DOOM,毁灭战士,词典笔,游戏移植,开源,嵌入式,极客DIY,有道词典笔,doomgeneric,实机演示"
TID = 233  # 科技 -> 极客DIY


def main():
    for p in (VIDEO_PATH, COVER_PATH, COOKIE_FILE):
        if not os.path.exists(p):
            print(f"错误: 文件不存在: {p}", file=sys.stderr)
            sys.exit(1)

    print(f"目标视频: {VIDEO_PATH} ({os.path.getsize(VIDEO_PATH)/1024/1024:.2f} MB)", flush=True)
    print(f"封面图片: {COVER_PATH}", flush=True)

    cmd = [
        BILIUP_BIN, "-u", COOKIE_FILE, "upload",
        "-l", "bda2",
        "--tid", str(TID),
        "--cover", COVER_PATH,
        "--title", TITLE,
        "--desc", DESC,
        "--tag", TAGS,
        VIDEO_PATH,
    ]

    print(f"正在向 RS_TV (UID: 1354304551) 上传 DOOM 宣传片...", flush=True)
    print(f"标题: {TITLE}", flush=True)
    print(f"分区: {TID} (极客DIY)", flush=True)
    print(f"标签: {TAGS}", flush=True)

    env = os.environ.copy()
    env["PYTHONHOME"] = ""
    env["PYTHONPATH"] = ""

    start = time.time()
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True, bufsize=1, env=env)
    out_lines = []
    for line in proc.stdout:
        print(line, end="", flush=True)
        out_lines.append(line)
    proc.wait()
    elapsed = time.time() - start

    if proc.returncode != 0:
        print(f"biliup 退出码: {proc.returncode}", file=sys.stderr)
        sys.exit(proc.returncode)

    output = "".join(out_lines)
    bvid = None
    for line in output.splitlines():
        m = re.search(r"BV[0-9a-zA-Z]{10}", line)
        if m:
            bvid = m.group(0)
            break

    if bvid:
        print(f"\n[成功] 已提交 RS_TV，耗时 {elapsed:.1f}s，BV号: {bvid}", flush=True)
        v = subprocess.run([BILIUP_BIN, "-u", COOKIE_FILE, "show", bvid],
                           capture_output=True, text=True, env=env)
        print(v.stdout)
    else:
        print(f"\n[提示] 上传完成，耗时 {elapsed:.1f}s，未从输出解析到 BV 号。", flush=True)


if __name__ == "__main__":
    main()
