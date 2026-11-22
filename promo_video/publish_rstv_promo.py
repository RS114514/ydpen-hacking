#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
import time

BILIUP_BIN = "/Users/fuzihao/.local/bin/biliup"
COOKIE_FILE = "/Users/fuzihao/biliup/rs_tv.json"
VIDEO_PATH = "/Volumes/500GB/Ydpen/promo_video/output/ydpen_galgame_promo.mp4"
COVER_PATH = "/Volumes/500GB/Ydpen/promo_video/output/snapshots/snap_22s.jpg"

def main():
    if not os.path.exists(VIDEO_PATH):
        print(f"错误: 视频文件不存在: {VIDEO_PATH}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(COVER_PATH):
        print(f"错误: 封面文件不存在: {COVER_PATH}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(COOKIE_FILE):
        print(f"错误: 凭证文件不存在: {COOKIE_FILE}", file=sys.stderr)
        sys.exit(1)

    file_size_mb = os.path.getsize(VIDEO_PATH) / (1024 * 1024)
    print(f"目标视频: {VIDEO_PATH} ({file_size_mb:.2f} MB)", flush=True)
    print(f"封面图片: {COVER_PATH}", flush=True)

    title = "【实机演示】我把《千恋＊万花》《魔女的夜宴》移植进了有道词典笔！超宽屏推Gal体验（附安装包/开源）"
    
    desc = """【真机实测 & 超宽屏适配】
谁说词典笔只能用来查单词？我们将经典 Galgame《千恋＊万花》与《魔女的夜宴》完整移植到了有道词典笔（RK3562 / aarch64）上！

本视频为纯真机实机操作录屏与特性介绍：
- 适配 960×266 极限带鱼屏超宽比例
- 移植自研超宽屏嵌入式引擎 RibbonEngine，内存与图形管线深度优化
- 打字机台词推进、角色语音与 BGM 双声道软件混音
- 触控缩放特写模式、分支选择支、剧情流程图、多槽位存档一应俱全
- 全年龄向内容展示，健康推 Gal

【一键安装包下载】
「Y'd'p'e'n」
夸克网盘口令：/~b3043bya0L~:/
网盘链接：https://pan.quark.cn/s/40927d1e815c

【开源项目仓库】（GitHub 搜索对应仓库名称）：
- 《千恋＊万花》词典笔移植版：RS114514/senren-banka-ydpen-port
- 《魔女的夜宴》词典笔移植版：RS114514/sanoba-witch-ydpen-port
- 超宽屏嵌入式 Galgame 引擎：RS114514/RibbonEngine
- 有道词典笔逆向与搞机工具链：RS114514/ydpen-hacking

* 本项目所有仓库均不包含任何受版权保护的原始游戏解密资源，请大家支持正版 Yuzusoft 作品！
喜欢的话欢迎一键三连（点赞、投币、收藏），后续将带来更多有趣设备的移植与搞机实录！"""

    tags = "千恋万花,魔女的夜宴,Galgame,柚子社,词典笔,游戏移植,数码改造,单片机/嵌入式,有道词典笔,开源"
    tid = 233  # 科技 -> 极客DIY

    cmd = [
        BILIUP_BIN, "-u", COOKIE_FILE, "upload",
        "-l", "bda2",
        "--tid", str(tid),
        "--cover", COVER_PATH,
        "--title", title,
        "--desc", desc,
        "--tag", tags,
        VIDEO_PATH
    ]

    print(f"正在使用 biliup 向 RS_TV (UID: 1354304551) 上传投稿...", flush=True)
    print(f"标题: {title}")
    print(f"分区: {tid} (极客DIY)")
    print(f"标签: {tags}")
    
    start_time = time.time()

    env = os.environ.copy()
    env["PYTHONHOME"] = ""
    env["PYTHONPATH"] = ""

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env
    )

    out_lines = []
    for line in proc.stdout:
        print(line, end='', flush=True)
        out_lines.append(line)
    proc.wait()

    elapsed = time.time() - start_time
    output_text = "".join(out_lines)

    if proc.returncode != 0:
        print(f"biliup 执行退出码: {proc.returncode}", file=sys.stderr)
        sys.exit(proc.returncode)

    bvid = None
    for line in output_text.splitlines():
        if "bvid" in line or "BV" in line:
            m = re.search(r'BV[0-9a-zA-Z]{10}', line)
            if m:
                bvid = m.group(0)
                break

    if bvid:
        print(f"\n[成功] RS_TV 视频上传并提交完成！耗时: {elapsed:.1f} 秒，BV号: {bvid}", flush=True)
        verify_cmd = [BILIUP_BIN, "-u", COOKIE_FILE, "show", bvid]
        v_proc = subprocess.run(verify_cmd, capture_output=True, text=True, env=env)
        print("稿件状态信息:")
        print(v_proc.stdout)
    else:
        print(f"\n[提示] 视频上传完成，耗时: {elapsed:.1f} 秒。")

if __name__ == "__main__":
    main()
