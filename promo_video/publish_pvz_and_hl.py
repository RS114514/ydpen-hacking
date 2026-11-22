#!/usr/bin/env python3
import os
import re
import subprocess
import sys
import time

BILIUP_BIN = "/Users/fuzihao/.local/bin/biliup"
COOKIE_FILE = "/Users/fuzihao/biliup/rs_tv.json"

TASKS = [
    {
        "name": "植物大战僵尸",
        "video": "/Volumes/500GB/Ydpen/promo_video/output/ydpen_pvz_promo.mp4",
        "cover": "/Volumes/500GB/Ydpen/promo_video/output/ydpen_pvz_cover.jpg",
        "title": "【实机演示】我把《植物大战僵尸》装进了有道词典笔！原生ARM64草坪丝滑防守",
        "desc": """【真机实测 · 960×266 超宽屏适配】
把国民级经典塔防《植物大战僵尸》以原生 ARM64（pvz-portable）方式直接移植到了有道词典笔 X6 Pro（RK3562）上！

视频内全为真机实机操作与连续运镜展示：
- 无需模拟器、无需串流，直接运行于词典笔原生 Wayland 桌面
- 专为 960×266 超宽带鱼屏定制左侧快捷植物卡片栏 + 右侧 PAD 精准放大镜
- 支持 AUTO 自动收集阳光，触屏一键种植物、樱桃炸弹轰炸僵尸丝滑流畅

【相关工具链】
有道词典笔搞机工具链与逆向套件：github.com/RS114514/ydpen-hacking
* 请支持正版 Plants vs. Zombies，喜欢的话欢迎一键三连！""",
        "tags": "植物大战僵尸,PVZ,词典笔,有道词典笔,游戏移植,极客DIY,开源,嵌入式,实机演示,怀旧游戏",
        "tid": 233,
    },
    {
        "name": "半条命 Half-Life",
        "video": "/Volumes/500GB/Ydpen/promo_video/output/ydpen_halflife_promo.mp4",
        "cover": "/Volumes/500GB/Ydpen/promo_video/output/ydpen_hl_cover.jpg",
        "title": "【实机演示】继DOOM之后，我又把《半条命 Half-Life》3D原生移植进了词典笔！最高73帧",
        "desc": """【真机实测 · OpenGL ES 2.0 硬件加速】
继上次的 DOOM 之后，这次将真 3D 第一人称射击大作《半条命》（Half-Life）通过 Xash3D FWGS (linux-arm64) 完整移植到了有道词典笔 X6 Pro！

实机特性一览：
- Mali GPU OpenGL ES 2.0 原生硬件加速直出，960×266 超宽屏实测可达 50~73 FPS
- 通过 libwl_center 适配超宽屏居中显示，触控虚拟摇杆、手电筒、切枪、快捷存读档一应俱全
- 黑山基地单轨列车开场实机穿梭，3D 光影与地图完整运行

【相关工具链】
有道词典笔搞机工具链与逆向套件：github.com/RS114514/ydpen-hacking
上游引擎：Xash3D FWGS
* 仅作技术展示，请支持正版 Valve Half-Life！喜欢的话欢迎一键三连！""",
        "tags": "半条命,Half-Life,词典笔,有道词典笔,游戏移植,Xash3D,极客DIY,3D游戏,嵌入式,实机演示",
        "tid": 233,
    }
]


def upload_one(item):
    env = os.environ.copy()
    env["PYTHONHOME"] = ""
    env["PYTHONPATH"] = ""
    cmd = [
        BILIUP_BIN, "-u", COOKIE_FILE, "upload",
        "-l", "bda2",
        "--tid", str(item["tid"]),
        "--cover", item["cover"],
        "--title", item["title"],
        "--desc", item["desc"],
        "--tag", item["tags"],
        item["video"],
    ]
    print(f"\n>>> 开始投稿 [{item['name']}] 至 RS_TV...", flush=True)
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, env=env)
    lines = []
    for line in proc.stdout:
        print(line, end="", flush=True)
        lines.append(line)
    proc.wait()
    if proc.returncode != 0:
        raise RuntimeError(f"{item['name']} 上传失败，退出码: {proc.returncode}")
    m = re.search(r"BV[0-9a-zA-Z]{10}", "".join(lines))
    bvid = m.group(0) if m else "未知"
    print(f"[成功] {item['name']} BV号: {bvid}", flush=True)
    return bvid


def main():
    results = []
    for item in TASKS:
        bvid = upload_one(item)
        results.append((item["name"], bvid))
        time.sleep(2)
    print("\n=== 全部投稿汇总 ===", flush=True)
    for name, bvid in results:
        print(f"- {name}: https://www.bilibili.com/video/{bvid}", flush=True)


if __name__ == "__main__":
    main()
