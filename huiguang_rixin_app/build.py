#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py —— 《晖光日新》正统文字冒险游戏 miniapp 构建与打包工具"""

import argparse, json, os, re, shutil, subprocess, sys, time, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(HERE, "app")
SERIAL = os.environ.get("PEN_SERIAL", "9DA2200007506350")
APPID = "8002026110100088"
APP_NAME = "晖光日新"
VERSION = "1.0.0"
MAX_H, MAX_W = 220, 800

MODULES = [
    ("common.js", ["Common.js"]),
    ("storage.js", ["Storage.js"]),
    ("Styles.js", ["Styles.js"]),
    ("data/story_data.js", ["StoryData.js"]),
    ("pages/title/title.js", ["TitleView.js"]),
    ("pages/game/game.js", ["GameView.js"]),
    ("pages/caseboard/caseboard.js", ["CaseboardView.js"]),
    ("root.js", ["Component.js"]),
    ("base-page.js", ["BasePage.js"]),
    ("page-entry.js", ["index.js", "shell.js"]),
    ("app.js", ["app.js"]),
]

IMPORT_MAP = {
    "../../common.js": "./Common.js",
    "./common.js": "./Common.js",
    "../../storage.js": "./Storage.js",
    "./storage.js": "./Storage.js",
    "../../data/story_data.js": "./StoryData.js",
    "./data/story_data.js": "./StoryData.js",
    "./Styles.js": "./Styles.js",
    "./pages/title/title.js": "./TitleView.js",
    "./pages/game/game.js": "./GameView.js",
    "./pages/caseboard/caseboard.js": "./CaseboardView.js",
    "./root.js": "./Component.js",
}

def flatten(src):
    for a, b in IMPORT_MAP.items():
        src = src.replace("'%s'" % a, "'%s'" % b).replace('"%s"' % a, '"%s"' % b)
    return src.replace("\r\n", "\n")

def calc_md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        while True:
            b = f.read(65536)
            if not b: break
            h.update(b)
    return h.hexdigest()

def build(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    print(f"[*] 打包构建目标目录: {out_dir}")

    # 1. 扁平化 JS 模块
    cert_map = {}
    for rel_src, targets in MODULES:
        src_path = os.path.join(APP_DIR, rel_src)
        if not os.path.exists(src_path):
            print(f"[!] 警告: 源文件不存在 {src_path}")
            continue
        with open(src_path, "r", encoding="utf-8") as f:
            code = flatten(f.read())
        for tgt in targets:
            dst_path = os.path.join(out_dir, tgt)
            with open(dst_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(code)
            sz = os.path.getsize(dst_path)
            md5 = calc_md5(dst_path)
            cert_map[tgt] = {"size": sz, "md5": md5}
            print(f"    - {rel_src} -> {tgt} ({sz} bytes)")

    # 2. 复制 app.json
    shutil.copyfile(os.path.join(APP_DIR, "app.json"), os.path.join(out_dir, "app.json"))
    cert_map["app.json"] = {
        "size": os.path.getsize(os.path.join(out_dir, "app.json")),
        "md5": calc_md5(os.path.join(out_dir, "app.json"))
    }

    # 3. 复制静态资源 assets 与 app_icon.png
    assets_src = os.path.join(HERE, "assets")
    assets_dst = os.path.join(out_dir, "assets")
    if os.path.exists(assets_src):
        if os.path.exists(assets_dst):
            subprocess.run(["rm", "-rf", assets_dst])
        shutil.copytree(assets_src, assets_dst)
        print(f"[+] 静态资源 assets 已同步打包")

    icon_src = os.path.join(APP_DIR, "app_icon.png")
    if os.path.exists(icon_src):
        icon_dst = os.path.join(out_dir, "app_icon.png")
        shutil.copyfile(icon_src, icon_dst)
        cert_map["app_icon.png"] = {
            "size": os.path.getsize(icon_dst),
            "md5": calc_md5(icon_dst)
        }
        print(f"[+] 应用图标 app_icon.png 已就绪 ({os.path.getsize(icon_dst)} bytes)")

    # 4. 生成 manifest.json
    manifest = {
        "appName": APP_NAME,
        "version": VERSION,
        "appid": APPID,
        "icon": "app_icon.png",
        "quickjs": {"version": "20200705", "bigNum": False},
        "cert": cert_map
    }
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"[✓] 构建完成！manifest.json 校验项: {len(cert_map)}")

    # 5. 自动打包生成最终 AMR 安装包
    sys.path.insert(0, os.path.dirname(HERE))
    try:
        import build_amr_offline as b
        dist_amr = os.path.join(HERE, "dist", f"{APPID}.amr")
        b.pack_amr(out_dir, dist_amr, APPID, APP_NAME, VERSION)
        print(f"[✓] AMR 安装包打包完成: {dist_amr} ({os.path.getsize(dist_amr)} bytes)")
    except Exception as e:
        print(f"[!] 打包 AMR 出错: {e}")

if __name__ == "__main__":
    out = os.path.join(HERE, "build", "dist")
    build(out)
