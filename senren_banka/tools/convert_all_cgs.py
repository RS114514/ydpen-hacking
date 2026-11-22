#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""convert_all_cgs.py —— 把资源库里的全部 pimg CG 转成 16:9 PNG。"""

import glob
import os
import re
import shutil
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
DECOMPILER = os.path.join(HERE, "FreeMote", "PsbDecompile.exe")
TLG2BMP = os.path.join(HERE, "tlg2bmp")
SOURCE = "/Volumes/500GB/千恋万花_移植资源库/assets_ready/cg/evimage"
OUT = "/Volumes/500GB/qoder_cache/senren_banka/cg_png"
TMP = "/Volumes/500GB/qoder_cache/senren_banka/cg_tmp"


def canonical(stem):
    stem = stem.replace("_censored", "")
    m = re.match(r"(ev\d{3}[a-z]?)", stem)
    return m.group(1) if m else None


def convert_one(pimg, name):
    out_png = os.path.join(OUT, name + ".png")
    if os.path.exists(out_png) and os.path.getsize(out_png) > 10000:
        return "exists"
    tmp_out = os.path.join(TMP, name)
    shutil.rmtree(tmp_out, ignore_errors=True)
    os.makedirs(tmp_out, exist_ok=True)
    subprocess.run(
        ["mono", DECOMPILER, "-raw", pimg, "-o", tmp_out],
        capture_output=True,
    )
    bins = glob.glob(os.path.join(tmp_out, "**", "*.bin"), recursive=True)
    if not bins:
        shutil.rmtree(tmp_out, ignore_errors=True)
        return "no-bin"
    bins.sort(key=os.path.getsize, reverse=True)
    base = bins[0]
    with open(base, "rb") as f:
        head = f.read(16)
    if head.startswith(b"RIFF") and b"WEBP" in head:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", base, "-vf", "scale=944:532", out_png, "-y"],
            capture_output=True,
        )
    elif head.startswith(b"TLG"):
        tmp_bmp = os.path.join(tmp_out, "base.bmp")
        subprocess.run([TLG2BMP, base, tmp_bmp], capture_output=True)
        subprocess.run(
            ["sips", "-s", "format", "png", "--resampleHeightWidth", "532", "944", tmp_bmp, "--out", out_png],
            capture_output=True,
        )
    else:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", base, "-vf", "scale=944:532", out_png, "-y"],
            capture_output=True,
        )
    shutil.rmtree(tmp_out, ignore_errors=True)
    if os.path.exists(out_png) and os.path.getsize(out_png) > 10000:
        return "ok"
    return "fail"


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    done = 0
    for pimg in sorted(glob.glob(os.path.join(SOURCE, "*.pimg"))):
        stem = os.path.basename(pimg)[:-5]
        name = canonical(stem)
        if not name:
            continue
        status = convert_one(pimg, name)
        print(name, status, flush=True)
        if status in ("ok", "exists"):
            done += 1
    shutil.rmtree(TMP, ignore_errors=True)
    print("DONE", done, flush=True)


if __name__ == "__main__":
    main()
