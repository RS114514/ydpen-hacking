#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""generate_all_fg.py —— 批量生成角色立绘差分 PNG 并缩放至词典笔舞台区规格 (height 220px)"""
import os, sys, subprocess, json

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(HERE)
OUT_DIR = os.path.join(PROJECT_DIR, "assets", "fg")
os.makedirs(OUT_DIR, exist_ok=True)

# 芦花图层表
ROKA_DIR = "/Volumes/500GB/千恋万花_移植资源库/assets_ready/characters/fgimage/６芦花"
ROKA_BODY = os.path.join(ROKA_DIR, "芦花a_0_683.tlg")
ROKA_HAIR = os.path.join(ROKA_DIR, "芦花a_0_678.tlg")
ROKA_BLUSH = os.path.join(ROKA_DIR, "芦花a_0_689.tlg")

roka_faces = {
    "01": (275, 848, 807, 167, 131),
    "02": (300, 856, 816, 154, 127),
    "03": (326, 850, 813, 161, 129),
    "04": (347, 848, 806, 164, 134),
    "06": (411, 849, 816, 158, 126),
    "07h": (437, 852, 816, 156, 125),
    "08": (463, 849, 806, 162, 247),
    "09": (489, 854, 822, 153, 120),
    "10": (521, 851, 818, 158, 121),
    "11": (547, 848, 820, 164, 122),
    "12": (573, 854, 813, 156, 132),
    "13": (599, 851, 801, 155, 140),
    "14": (625, 851, 801, 155, 143),
    "15": (651, 851, 801, 155, 144),
    "17": (691, 856, 807, 159, 131),
    "18": (692, 848, 816, 162, 127),
    "19": (693, 854, 807, 161, 131),
    "20": (694, 851, 816, 159, 126),
    "21": (695, 848, 822, 159, 116),
    "22": (696, 856, 822, 151, 120),
    "23": (697, 851, 822, 156, 121),
    "24": (698, 848, 801, 158, 140),
    "25": (699, 848, 806, 164, 135),
    "25h": (699, 848, 806, 164, 135),
    "26": (700, 854, 816, 154, 125),
    "28": (702, 854, 816, 154, 122),
    "29": (703, 854, 801, 152, 140),
    "30": (704, 848, 801, 158, 147),
    "31": (705, 848, 822, 159, 119),
    "32": (706, 849, 822, 158, 231),
    "34": (708, 848, 807, 167, 132),
}

# 芳乃图层表
YOSH_DIR = "/Volumes/500GB/千恋万花_移植资源库/assets_ready/characters/fgimage/１芳乃"
YOSH_BODY = os.path.join(YOSH_DIR, "芳乃a_0_1855.tlg")
YOSH_HAIR = os.path.join(YOSH_DIR, "芳乃a_0_1890.tlg")

yosh_faces = {
    "01": (1867, 767, 892, 165, 125),
    "04": (1870, 770, 894, 162, 122),
    "05": (1871, 770, 895, 162, 125),
    "06": (1872, 769, 893, 164, 129),
    "09": (1875, 767, 900, 167, 118),
    "10": (1876, 766, 891, 166, 125),
    "11": (1877, 766, 891, 167, 125),
    "17": (1883, 771, 892, 162, 125),
    "18": (1884, 769, 893, 163, 122),
    "20": (1886, 771, 897, 163, 120),
    "22": (1888, 768, 895, 164, 121),
    "30": (1915, 767, 900, 166, 117),
    "33": (1918, 769, 893, 161, 122),
}

specs = []

# 芦花半身立绘：原画 X: 650..1130 (w: 480), Y: 680..1700 (h: 1020) -> 缩放至 104x220
for code, info in roka_faces.items():
    lid, fx, fy, fw, fh = info
    face_file = os.path.join(ROKA_DIR, f"芦花a_0_{lid}.tlg")
    layers = [
        {"file": ROKA_BODY, "x": 666, "y": 687, "w": 446, "h": 1706},
        {"file": face_file, "x": fx, "y": fy, "w": fw, "h": fh},
        {"file": ROKA_HAIR, "x": 838, "y": 830, "w": 175, "h": 79},
    ]
    if "h" in code:
        layers.append({"file": ROKA_BLUSH, "x": 860, "y": 855, "w": 140, "h": 97})
    
    out_path = os.path.join(OUT_DIR, f"芦花_私服_{code}.png")
    specs.append({
        "out": out_path,
        "cropX": 650.0,
        "cropY": 680.0,
        "cropW": 480.0,
        "cropH": 1020.0,
        "outW": 104,
        "outH": 220,
        "layers": layers
    })

# 芳乃半身立绘：原画 X: 560..1040 (w: 480), Y: 730..1750 (h: 1020) -> 缩放至 104x220
for code, info in yosh_faces.items():
    lid, fx, fy, fw, fh = info
    face_file = os.path.join(YOSH_DIR, f"芳乃a_0_{lid}.tlg")
    layers = [
        {"file": YOSH_BODY, "x": 328, "y": 753, "w": 953, "h": 1632},
        {"file": face_file, "x": fx, "y": fy, "w": fw, "h": fh},
        {"file": YOSH_HAIR, "x": 768, "y": 907, "w": 168, "h": 82},
    ]
    out_path = os.path.join(OUT_DIR, f"芳乃_舞服_{code}.png")
    specs.append({
        "out": out_path,
        "cropX": 560.0,
        "cropY": 730.0,
        "cropW": 480.0,
        "cropH": 1020.0,
        "outW": 104,
        "outH": 220,
        "layers": layers
    })

spec_file = "/tmp/fg_specs.json"
with open(spec_file, "w", encoding="utf-8") as f:
    json.dump(specs, f)

print(f"Generated spec for {len(specs)} character sprites. Running Swift compositor...")
swift_bin = os.path.join(HERE, "composite.swift")
ret = subprocess.run(["swift", swift_bin, spec_file], capture_output=True, text=True)
if ret.returncode != 0:
    print("Swift compositor error:", ret.stderr)
    sys.exit(1)

print(f"Successfully generated {len(specs)} standing sprites in {OUT_DIR}!")
