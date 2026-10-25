import json
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py —— 《小游戏全集》Minigames 独立打包构建脚本
全本地编译生成 QuickJS 20200705 字节码，签署 PenOS AMR 认证
"""
import os
import sys
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(HERE, "src")
BUILD_DIR = os.path.join(HERE, "build")
STAGE_DIR = os.path.join(BUILD_DIR, "stage")
BIN_DIR = os.path.join(BUILD_DIR, "bins")
AMR_DIR = os.path.join(BUILD_DIR, "amr_pkg")

# 引入本地离线编译工具
sys.path.append(os.path.join(HERE, ".."))
from build_amr_offline import compile_js_to_bin, pack_amr

APPID = "8002026102500001"
APP_NAME = "小游戏"
VERSION = "1.0.0"

def main():
    if os.path.exists(BUILD_DIR):
        shutil.rmtree(BUILD_DIR)
    os.makedirs(STAGE_DIR, exist_ok=True)
    os.makedirs(BIN_DIR, exist_ok=True)
    os.makedirs(AMR_DIR, exist_ok=True)

    # 1. 拷贝与扁平化模块源码
    modules = [
        ("game_minesweeper.js", "game_minesweeper.js"),
        ("game_flappy.js", "game_flappy.js"),
        ("game_watermelon.js", "game_watermelon.js"),
        ("game_tictactoe.js", "game_tictactoe.js"),
        ("game_match3.js", "game_match3.js"),
        ("game_miner.js", "game_miner.js"),
        ("game_runner.js", "game_runner.js"),
        ("game_tetris.js", "game_tetris.js"),
        ("game_snake.js", "game_snake.js"),
        ("game_jump.js", "game_jump.js"),
        ("game_klotski.js", "game_klotski.js"),
        ("game_sokoban.js", "game_sokoban.js"),
        ("game_gomoku.js", "game_gomoku.js"),
        ("game_dino.js", "game_dino.js"),
        ("game_mario.js", "game_mario.js"),
        ("game_pelican.js", "game_pelican.js"),
        ("game_hub.js", "game_hub.js"),
        ("root.js", "Component.js"),
        ("base-page.js", "BasePage.js"),
        ("page-entry.js", "index.js"),
        ("app.js", "app.js")
    ]

    for src_name, dst_name in modules:
        src_p = os.path.join(SRC_DIR, src_name)
        dst_p = os.path.join(STAGE_DIR, dst_name)
        with open(src_p, "r", encoding="utf-8") as f:
            content = f.read()

        # 改写相对引用路径为平铺路径
        content = content.replace("./game_minesweeper.js", "./game_minesweeper.js")
        content = content.replace("./game_hub.js", "./game_hub.js")

        with open(dst_p, "w", encoding="utf-8") as f:
            f.write(content)

    # 2. 依次用 qjsc 编译为 .js.bin
    bins_to_pack = []
    for _, dst_name in modules:
        stage_js = os.path.join(STAGE_DIR, dst_name)
        bin_out = os.path.join(AMR_DIR, dst_name + ".bin")
        print(f"Compiling {dst_name} -> {dst_name}.bin...")
        ok = compile_js_to_bin(stage_js, bin_out, is_module=True)
        if not ok:
            print(f"Compilation failed on {dst_name}")
            sys.exit(1)
        bins_to_pack.append(dst_name + ".bin")

    # 3. 创建 manifest.json
    manifest = {
        "appName": APP_NAME,
        "appid": APPID,
        "version": VERSION,
        "icon": "app_icon.png",
        "pages": ["pages/index/index"],
        "quickjs": {
            "version": "20200705",
            "bigNum": False,
            "targets": ["app.js.bin", "index.js.bin"]
        }
    }
    with open(os.path.join(AMR_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    # 复制页面目录模拟（PenOS 路由 pages/index/index.js.bin）
    pages_idx_dir = os.path.join(AMR_DIR, "pages", "index")
    os.makedirs(pages_idx_dir, exist_ok=True)
    shutil.copy(os.path.join(AMR_DIR, "index.js.bin"), os.path.join(pages_idx_dir, "index.js.bin"))

    # 复制应用图标
    shutil.copy(os.path.join(HERE, "app_icon.png"), os.path.join(AMR_DIR, "app_icon.png"))

    # 4. 打包为最终 AMR 安装包
    out_amr = os.path.join(HERE, f"Minigames-{VERSION}.amr")
    pack_amr(AMR_DIR, out_amr, APPID, APP_NAME, VERSION)
    print(f"🎉 AMR 打包成功: {out_amr} ({os.path.getsize(out_amr)} bytes)")

if __name__ == "__main__":
    main()
