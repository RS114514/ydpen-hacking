#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""batch_export_all_cg.py —— 批量从资源库提取全角色多款官方 CG"""

import os, sys, subprocess, shutil, glob

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
OUT_CG_DIR = os.path.join(PROJECT_DIR, "assets", "cg")
os.makedirs(OUT_CG_DIR, exist_ok=True)

DECOMPILER = os.path.join(HERE, "FreeMote", "PsbDecompile.exe")
TLG2BMP = os.path.join(HERE, "tlg2bmp")

SOURCES = [
    "/Volumes/500GB/千恋万花_移植资源库/assets_ready/cg/evimage",
    "/Volumes/500GB/G/千恋万花Senren Banka Steam Edition/unencrypted"
]

# 精选全角色代表性 CG (名称 -> (角色, 描述))
SELECTED_CGS = {
    # 朝武 芳乃
    "ev101a": ("芳乃", "折断神刀名场面"),
    "ev102a": ("芳乃", "与芳乃初遇"),
    "ev105a": ("芳乃", "巫女祭典祈愿"),
    "ev106a": ("芳乃", "日常羞涩"),
    "ev107a": ("芳乃", "温柔凝望"),
    "ev108a": ("芳乃", "月下祈愿"),
    "ev112a": ("芳乃", "无修正专属名场面"),

    # 常陆 茉子
    "ev202a": ("茉子", "忍者巡查"),
    "ev206a": ("茉子", "围裙女仆风情"),
    "ev207a": ("茉子", "便服微笑"),
    "ev209a": ("茉子", "并肩前行"),
    "ev211a": ("茉子", "羞赧特写"),
    "ev214a": ("茉子", "无修正专属名场面"),

    # 丛雨
    "ev301a": ("丛雨", "神刀灵光显现"),
    "ev302a": ("丛雨", "幼刀漂浮姿态"),
    "ev303a": ("丛雨", "开心品尝甜点"),
    "ev304a": ("丛雨", "小动物嬉戏"),
    "ev308a": ("丛雨", "灵力爆发名场面"),
    "ev317a": ("丛雨", "无修正专属名场面"),

    # 蕾娜
    "ev401a": ("蕾娜", "异国少女初登场"),
    "ev403a": ("蕾娜", "享受甜点圣代"),
    "ev404a": ("蕾娜", "神社参拜见学"),
    "ev406a": ("蕾娜", "祭典和服盛装"),
    "ev407a": ("蕾娜", "金发金眸特写"),
    "ev414a": ("蕾娜", "无修正专属名场面"),

    # 鞍马 小春
    "ev501a": ("小春", "甜品屋店员日常"),
    "ev502a": ("小春", "兄妹结伴散步"),
    "ev503a": ("小春", "低头羞怯"),
    "ev505a": ("小春", "无修正专属名场面"),

    # 马场 芦花
    "ev601a": ("芦花", "居酒屋老板娘风韵"),
    "ev602a": ("芦花", "温泉浴衣风情"),
    "ev603a": ("芦花", "温柔倾听"),
    "ev604a": ("芦花", "无修正专属名场面"),

    # 共通/风景名场面
    "ev701a": ("共通", "穗织镇远景全貌"),
    "ev702a": ("共通", "神刀丛雨丸"),
    "ev703a": ("共通", "温泉街夜色"),
    "ev705a": ("共通", "夏日祭典烟花大会"),
}

TMP_ROOT = "/tmp/extract_cg_all"
shutil.rmtree(TMP_ROOT, ignore_errors=True)
os.makedirs(TMP_ROOT, exist_ok=True)

success_count = 0

for cg_stem, (char_name, desc) in SELECTED_CGS.items():
    out_png = os.path.join(OUT_CG_DIR, f"{cg_stem}.png")
    if os.path.exists(out_png) and os.path.getsize(out_png) > 50000:
        print(f"[=] Already exists: {cg_stem}.png ({char_name} - {desc})")
        success_count += 1
        continue

    # 寻找 pimg 文件
    pimg_found = None
    for sdir in SOURCES:
        candidate = os.path.join(sdir, f"{cg_stem}.pimg")
        if os.path.exists(candidate):
            pimg_found = candidate
            break
    
    if not pimg_found:
        print(f"[!] Warning: Cannot find {cg_stem}.pimg in sources")
        continue

    tmp_out = os.path.join(TMP_ROOT, cg_stem)
    os.makedirs(tmp_out, exist_ok=True)

    print(f"[*] Processing {cg_stem} ({char_name} - {desc})...")
    res = subprocess.run(["mono", DECOMPILER, "-raw", pimg_found, "-o", tmp_out], capture_output=True)
    
    layer_dir = os.path.join(tmp_out, cg_stem)
    bins = glob.glob(os.path.join(layer_dir, "*.bin"))
    if not bins:
        print(f"    [X] No bin extracted for {cg_stem}")
        shutil.rmtree(tmp_out, ignore_errors=True)
        continue

    # 取最大的 base bin
    bins.sort(key=lambda x: os.path.getsize(x), reverse=True)
    base_bin = bins[0]

    with open(base_bin, "rb") as f:
        head = f.read(16)

    if head.startswith(b"RIFF") and b"WEBP" in head:
        # WebP 格式
        cmd = ["ffmpeg", "-i", base_bin, "-vf", "scale=944:532", out_png, "-y"]
        subprocess.run(cmd, capture_output=True)
    elif head.startswith(b"TLG"):
        # TLG 格式
        tmp_bmp = os.path.join(tmp_out, "base.bmp")
        subprocess.run([TLG2BMP, base_bin, tmp_bmp], capture_output=True)
        subprocess.run(["sips", "-s", "format", "png", "--resampleHeightWidth", "532", "944", tmp_bmp, "--out", out_png], capture_output=True)
    else:
        # 尝试 ffmpeg 直接转
        subprocess.run(["ffmpeg", "-i", base_bin, "-vf", "scale=944:532", out_png, "-y"], capture_output=True)

    if os.path.exists(out_png) and os.path.getsize(out_png) > 10000:
        print(f"    [+] Generated: {out_png} ({os.path.getsize(out_png) / 1024:.1f} KB)")
        success_count += 1
    else:
        print(f"    [X] Failed to generate valid png for {cg_stem}")

    shutil.rmtree(tmp_out, ignore_errors=True)

shutil.rmtree(TMP_ROOT, ignore_errors=True)
print(f"\nDone! Successfully prepared {success_count}/{len(SELECTED_CGS)} CGs.")
