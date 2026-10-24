#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""extract_all_cg.py —— 批量从 unencrypted/ 提取无修正 H-CG（修正色彩通道，输出 944x532 2x超清 16:9 PNG）"""
import os, sys, subprocess, shutil, glob

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
UNENCRYPTED_DIR = "/Volumes/500GB/千恋万花/(無修正ゲーム) Senren Banka Steam Edition/unencrypted"
OUT_CG_DIR = os.path.join(PROJECT_DIR, "assets", "cg")
OUT_BG_DIR = os.path.join(PROJECT_DIR, "assets", "bg")

for d in (OUT_CG_DIR, OUT_BG_DIR):
    os.makedirs(d, exist_ok=True)

DECOMPILER = os.path.join(HERE, "FreeMote", "PsbDecompile.exe")
TLG2BMP = os.path.join(HERE, "tlg2bmp")

TARGETS = [
    ("ev112a.pimg", "ev112a_1.png"),
    ("ev214a.pimg", "ev214a_1.png"),
    ("ev317a.pimg", "ev317a_1.png"),
    ("ev414a.pimg", "ev414a_1.png"),
    ("ev505a.pimg", "ev505a_1.png"),
    ("ev604a.pimg", "ev604a_1.png"),
]

TMP_ROOT = "/Volumes/500GB/千恋万花/.tmp_extract"
os.makedirs(TMP_ROOT, exist_ok=True)

for pimg_name, out_png in TARGETS:
    pimg_path = os.path.join(UNENCRYPTED_DIR, pimg_name)
    if not os.path.exists(pimg_path):
        print("Skip missing:", pimg_name)
        continue
    
    stem = pimg_name.replace(".pimg", "")
    tmp_out = os.path.join(TMP_ROOT, stem)
    shutil.rmtree(tmp_out, ignore_errors=True)
    os.makedirs(tmp_out, exist_ok=True)
    
    print(f"[*] Decompiling {pimg_name}...")
    subprocess.run(["mono", DECOMPILER, "-raw", pimg_path, "-o", tmp_out], capture_output=True)
    
    layer_dir = os.path.join(tmp_out, stem)
    bins = glob.glob(os.path.join(layer_dir, "*.bin"))
    if not bins:
        shutil.rmtree(tmp_out, ignore_errors=True)
        continue
    bins.sort(key=lambda x: os.path.getsize(x), reverse=True)
    base_bin = bins[0]
    
    tmp_bmp = os.path.join(tmp_out, "base.bmp")
    subprocess.run([TLG2BMP, base_bin, tmp_bmp], capture_output=True)
    
    dst_png = os.path.join(OUT_CG_DIR, out_png)
    # 944x532 (2x 词典笔物理 16:9 尺寸，兼顾放大清晰度与加载速度)
    subprocess.run(["sips", "-s", "format", "png", "--resampleHeightWidth", "532", "944", tmp_bmp, "--out", dst_png], capture_output=True)
    shutil.rmtree(tmp_out, ignore_errors=True)
    print(f"    [+] Generated: {dst_png} ({os.path.getsize(dst_png) / 1024:.1f} KB)")

shutil.rmtree(TMP_ROOT, ignore_errors=True)

# 分配不同场景背景
bg_map = {
    "shrine_day.png": "ev112a_1.png",
    "village_day.png": "ev214a_1.png",
    "shrine_sword.png": "ev317a_1.png",
    "room_night.png": "ev414a_1.png",
}
for bg_name, cg_name in bg_map.items():
    src = os.path.join(OUT_CG_DIR, cg_name)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(OUT_BG_DIR, bg_name))
