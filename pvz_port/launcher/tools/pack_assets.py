#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pack_assets.py —— 提取并裁剪 Steam 原版与官方中文 Half-Life 战役资产

处理逻辑：
1. 提取所有单人战役地图 (c0a0..c5a1, t0a0)，排除多人对战地图
2. 提取 halflife.wad, liquids.wad, xeno.wad, decals.wad, fonts.wad, gfx.wad
3. 提取 low-poly models 与 sprites
4. 合并 valve/sound 与 valve_schinese/sound（官方中文配音覆盖）
5. 合并 valve_schinese/titles.txt 与 resource/*
6. 拷贝 Xash3D extras.pk3
7. 预置针对 960x266 宽带屏优化的 autoexec.cfg / config.cfg
"""

import os
import shutil
import glob
import sys

STEAM_DIR = "/Users/fuzihao/Library/Application Support/Steam/steamapps/common/Half-Life"
PREBUILT_DIR = "/tmp/hl_build/prebuilt/xash3d-fwgs-linux-arm64"
TARGET_DIR = "/Volumes/500GB/Ydpen/halflife_app/dist_assets/valve"
CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "valve")
CONFIG_FILES = ("config.cfg", "autoexec.cfg", "userconfig.cfg", "touch.cfg", "touch_numbers.cfg")


def write_runtime_configs(target):
    os.makedirs(target, exist_ok=True)
    for name in CONFIG_FILES:
        destination = os.path.join(target, name)
        if name == "config.cfg" and os.path.exists(destination):
            continue
        shutil.copy2(os.path.join(CONFIG_DIR, name), destination)


def main():
    if not os.path.isdir(STEAM_DIR):
        print(f"[x] Steam Half-Life 目录不存在: {STEAM_DIR}")
        sys.exit(1)
        
    valve_src = os.path.join(STEAM_DIR, "valve")
    valve_cn = os.path.join(STEAM_DIR, "valve_schinese")
    
    os.makedirs(TARGET_DIR, exist_ok=True)
    print(f"[*] 准备目标目录: {TARGET_DIR}")

    # 1. 拷贝 WAD 文件
    wads = ["halflife.wad", "liquids.wad", "xeno.wad", "decals.wad", "fonts.wad", "gfx.wad"]
    for w in wads:
        src = os.path.join(valve_src, w)
        if os.path.exists(src):
            dst = os.path.join(TARGET_DIR, w)
            shutil.copy2(src, dst)
            print(f"  [WAD] {w} -> {os.path.getsize(dst) // 1024} KB")

    # 2. 拷贝基础配置文件与游戏脚本
    cfgs = ["skill.cfg", "game.cfg", "delta.lst", "default.cfg"]
    for c in cfgs:
        src = os.path.join(valve_src, c)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(TARGET_DIR, c))

    # 3. 筛选并拷贝单人战役地图 (c0a0..c5a1, t0a0)
    maps_src = os.path.join(valve_src, "maps")
    maps_dst = os.path.join(TARGET_DIR, "maps")
    os.makedirs(maps_dst, exist_ok=True)
    map_count = 0
    map_bytes = 0
    for bsp in glob.glob(os.path.join(maps_src, "*.bsp")):
        name = os.path.basename(bsp)
        # 单人战役关卡: c0a0, c1a0..c5a1, t0a0 (训练关)
        if name.startswith("c") or name.startswith("t0a0"):
            dst = os.path.join(maps_dst, name)
            shutil.copy2(bsp, dst)
            map_count += 1
            map_bytes += os.path.getsize(dst)
    print(f"  [MAPS] 已提取 {map_count} 个单人战役关卡 (共 {map_bytes // (1024*1024)} MB)")

    # 4. 拷贝 models 与 sprites
    for folder in ["models", "sprites"]:
        s = os.path.join(valve_src, folder)
        d = os.path.join(TARGET_DIR, folder)
        if os.path.exists(s):
            if os.path.exists(d):
                shutil.rmtree(d)
            shutil.copytree(s, d)
            print(f"  [{folder.upper()}] 完整同步: {len(os.listdir(d))} 项")

    # 5. 音效与官方中文语音合并
    sound_dst = os.path.join(TARGET_DIR, "sound")
    if os.path.exists(sound_dst):
        shutil.rmtree(sound_dst)
    sound_src = os.path.join(valve_src, "sound")
    if os.path.exists(sound_src):
        shutil.copytree(sound_src, sound_dst)
        print("  [SOUND] 复制基础音效库完成")

    # 覆盖中文语音
    sound_cn = os.path.join(valve_cn, "sound")
    if os.path.exists(sound_cn):
        for root, dirs, files in os.walk(sound_cn):
            rel = os.path.relpath(root, sound_cn)
            target_sub = os.path.join(sound_dst, rel)
            os.makedirs(target_sub, exist_ok=True)
            for f in files:
                shutil.copy2(os.path.join(root, f), os.path.join(target_sub, f))
        print("  [SOUND_CN] 官方中文配音 (科学家/保安/广播/G-Man) 覆盖完成")

    # 6. 中文文本与字幕
    titles_cn = os.path.join(valve_cn, "titles.txt")
    if os.path.exists(titles_cn):
        shutil.copy2(titles_cn, os.path.join(TARGET_DIR, "titles.txt"))
        print("  [TEXT] 官方中文字幕 titles.txt 已部署")

    res_cn = os.path.join(valve_cn, "resource")
    if os.path.exists(res_cn):
        res_dst = os.path.join(TARGET_DIR, "resource")
        os.makedirs(res_dst, exist_ok=True)
        for f in os.listdir(res_cn):
            shutil.copy2(os.path.join(res_cn, f), os.path.join(res_dst, f))
        print("  [RESOURCE] 官方中文资源配置已部署")

    # 7. Xash3D extras.pk3
    extras = os.path.join(PREBUILT_DIR, "valve", "extras.pk3")
    if os.path.exists(extras):
        shutil.copy2(extras, os.path.join(TARGET_DIR, "extras.pk3"))
        print("  [XASH] extras.pk3 已部署")

    write_runtime_configs(TARGET_DIR)
    print("  [CFG] 启动与触控配置已同步")

    print("[+] Half-Life 战役资产打包完毕！")

if __name__ == "__main__":
    main()
