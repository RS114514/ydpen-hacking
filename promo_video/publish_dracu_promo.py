#!/usr/bin/env python3
import os
import re
import subprocess
import sys
import time

BILIUP_BIN = "/Users/fuzihao/.local/bin/biliup"
COOKIE_FILE = "/Users/fuzihao/biliup/rs_tv.json"
VIDEO_PATH = "/Volumes/500GB/Ydpen/promo_video/output/ydpen_dracu_promo.mp4"
COVER_PATH = "/Volumes/500GB/Ydpen/promo_video/output/ydpen_dracu_cover.jpg"

TITLE = "【实机演示】我把《DRACU-RIOT!》完整移植进了有道词典笔！超宽屏推Gal体验（开源）"

DESC = """【真机实测 & 960×266 超宽屏适配】
谁说词典笔只能用来查单词？这次将柚子社经典名作《DRACU-RIOT!》完整移植到了有道词典笔 X6 Pro（RK3562 / aarch64）真机上！

本视频展示全年龄合规实机画面与核心特性：
- 适配 960×266 极限带鱼屏超宽比例与白底新版定制主标题
- 基于自研超宽屏嵌入式引擎 RibbonEngine，共通线 9019 句 + 5 大女主个人线 + 后日谈完整可玩
- 全角色语音与 37 首原声音乐盒（含片头曲 Scarlet），双声道原生 PCM 软件混音
- 支持 2.5 倍舞台特写自由缩放、剧情流程图直跳、分支选择支面板、30 槽位本地存档与 Q 版 SD CG 鉴赏

【开源项目仓库】
- 《DRACU-RIOT!》词典笔移植版：github.com/RS114514/dracu-riot-ydpen-port
- 超宽屏嵌入式 Galgame 引擎：github.com/RS114514/RibbonEngine
- 有道词典笔逆向与搞机工具链：github.com/RS114514/ydpen-hacking

* 本项目所有仓库均不包含任何受版权保护的商业游戏素材，请支持正版 Yuzusoft（柚子社）作品！
BGM：DRACU-RIOT! - Scarlet（片头曲，仅作非商业展示，版权归原作者所有）。
喜欢的话欢迎一键三连，感谢支持！"""

TAGS = "DRACU-RIOT,柚子社,Galgame,词典笔,游戏移植,有道词典笔,RibbonEngine,开源,极客DIY,实机演示"
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

    print(f"正在向 RS_TV (UID: 1354304551) 上传《DRACU-RIOT!》宣传片...", flush=True)
    print(f"标题: {TITLE}", flush=True)
    print(f"分区: {TID} (极客DIY)", flush=True)
    print(f"标签: {TAGS}", flush=True)

    env = os.environ.copy()
    env["PYTHONHOME"] = ""
    env["PYTHONPATH"] = ""

    start = time.time()
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1, env=env
    )
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
        print(f"\n[成功] 已提交至 RS_TV，耗时 {elapsed:.1f}s，BV号: {bvid}", flush=True)
        v = subprocess.run([BILIUP_BIN, "-u", COOKIE_FILE, "show", bvid],
                           capture_output=True, text=True, env=env)
        print(v.stdout)
    else:
        print(f"\n[提示] 上传完成，耗时 {elapsed:.1f}s，未从输出解析到 BV 号。", flush=True)


if __name__ == "__main__":
    main()
