#!/usr/bin/env python3
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(HERE, "src")
LIBS_DIR = os.path.join(HERE, "libs")
BUILD_DIR = os.path.join(HERE, "build")
STAGE_DIR = os.path.join(BUILD_DIR, "stage")
BINS_DIR = os.path.join(BUILD_DIR, "bins")
DIST_DIR = os.path.join(HERE, "dist")

TOOLKIT_PACK_AMR = "/Volumes/500GB/Ydpen/ydpen-toolkit/scripts/pack_amr.py"
QJSC = "/Volumes/500GB/Ydpen/better_video_player/aiot-vue-cli/cli-libs/aiot-qjsc-tool/assets/bin/darwin/x64/qjsc20200705"
QUICKJS_INC = "/Volumes/500GB/Ydpen/gwjcfls-ydpen-toolkit/assets/quickjs"

APPID = "8002026112200001"
NAME = "死神VS火影"
VERSION = "1.0.0"

MODULES = [
    ("root.js", ["Component.js"]),
    ("base-page.js", ["BasePage.js"]),
    ("page-entry.js", ["index.js", "shell.js"]),
    ("app.js", ["app.js"]),
]

IMPORT_MAP = {
    "./Component.js": "./Component.js",
    "./BasePage.js": "./BasePage.js",
}


def main():
    shutil.rmtree(STAGE_DIR, ignore_errors=True)
    shutil.rmtree(BINS_DIR, ignore_errors=True)
    os.makedirs(STAGE_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(DIST_DIR, exist_ok=True)
    os.makedirs(LIBS_DIR, exist_ok=True)

    for rel_path, out_names in MODULES:
        src_file = os.path.join(SRC_DIR, rel_path)
        with open(src_file, "r", encoding="utf-8") as f:
            code = f.read()
        for k, v in IMPORT_MAP.items():
            code = code.replace(f"'{k}'", f"'{v}'").replace(f'"{k}"', f'"{v}"')
        code = code.replace("\r\n", "\n")
        for name in out_names:
            with open(os.path.join(STAGE_DIR, name), "w", encoding="utf-8") as f:
                f.write(code)

    stage_files = [f for f in os.listdir(STAGE_DIR) if f.endswith(".js") and not f.startswith("._")]
    for js_file in stage_files:
        stem = js_file[:-3]
        c_out = os.path.join(STAGE_DIR, f"{stem}.c")
        res = subprocess.run([QJSC, "-o", c_out, "-c", "-m", "-M", "bvn", js_file], cwd=STAGE_DIR, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"qjsc failed on {js_file}: {res.stderr}")
        with open(c_out, "r") as fp:
            c_text = fp.read()
        os.remove(c_out)
        m = re.search(rf'qjsc_{stem}\[\d+\]\s*=\s*\{{([^}}]+)\}}', c_text)
        if not m:
            raise RuntimeError(f"failed to parse bytecode for {stem}")
        byte_data = bytes([int(x.strip(), 16) for x in m.group(1).replace("\n", " ").split(",") if x.strip()])
        with open(os.path.join(BINS_DIR, f"{js_file}.bin"), "wb") as fp:
            fp.write(byte_data)

    game_page_dir = os.path.join(BINS_DIR, "pages", "game")
    os.makedirs(game_page_dir, exist_ok=True)
    shutil.copy(os.path.join(BINS_DIR, "index.js.bin"), os.path.join(game_page_dir, "index.js.bin"))
    shutil.copy(os.path.join(BINS_DIR, "shell.js.bin"), os.path.join(game_page_dir, "shell.js.bin"))
    shutil.copy(os.path.join(SRC_DIR, "pages", "game", "game.json"), os.path.join(game_page_dir, "game.json"))
    shutil.copy(os.path.join(SRC_DIR, "app.json"), os.path.join(BINS_DIR, "app.json"))
    shutil.copy(os.path.join(SRC_DIR, "manifest.json"), os.path.join(BINS_DIR, "manifest.json"))

    icon_src = os.path.join(HERE, "assets", "app_icon.png")
    shutil.copy(icon_src, os.path.join(BINS_DIR, "app_icon.png"))

    so_out = os.path.join(LIBS_DIR, "libjsapi_bvn.so")
    native_dir = os.path.join(HERE, "native")
    cmd_docker = [
        "docker", "run", "--rm",
        "-v", f"{native_dir}:/native",
        "-v", f"{QUICKJS_INC}:/qjs",
        "-v", f"{LIBS_DIR}:/out",
        "bvn6_builder:ready",
        "gcc", "-shared", "-fPIC", "-O2", "-I/qjs", "/native/libjsapi_bvn.c", "-o", "/out/libjsapi_bvn.so"
    ]
    subprocess.run(cmd_docker, check=True)
    with open(so_out, "rb") as f:
        if not f.read(4) == b"\x7fELF":
            raise RuntimeError("libjsapi_bvn.so is not a valid ELF")

    out_amr = os.path.join(DIST_DIR, f"bvn-{VERSION}.amr")
    subprocess.run([
        sys.executable, TOOLKIT_PACK_AMR,
        "--src", BINS_DIR,
        "--out", out_amr,
        "--appid", APPID,
        "--name", NAME,
        "--version", VERSION,
        "--icon", icon_src,
        "--lib", f"arm64={so_out}",
        "--lib", f"arm64-orange={so_out}",
    ], check=True)
    print(f"Built AMR: {out_amr}")


if __name__ == "__main__":
    main()
