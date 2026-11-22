#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_amr.py —— 半条命 Falcon 原生小应用离线全量构建脚本

特性：
1. 源码扁平化与依赖规范映射；
2. 本地直接调用 QuickJS 交叉编译器（qjsc20200705）构建 .js.bin 字节码，无须联网与真机；
3. 本地调度 Zig 交叉编译器生成 aarch64 原生插件 libjsapi_hl.so；
4. 深度整合官方正版 Half-Life Lambda 图标与 960x266 居中视口配置；
5. 打包生成标准 AMR 安装包（dist/half-life-1.0.0.amr）；
6. 若检测到词典笔连接则自动安装，未连接则平滑生成离线就绪包。
"""

import os
import sys
import shutil
import subprocess
import re
import zipfile

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(HERE, "src")
LIBS_DIR = os.path.join(HERE, "libs")
BUILD_DIR = os.path.join(HERE, "build")
STAGE_DIR = os.path.join(BUILD_DIR, "stage")
BINS_DIR = os.path.join(BUILD_DIR, "bins")
DIST_DIR = os.path.join(HERE, "dist")
TOOLKIT_PACK_AMR = "/Volumes/500GB/Ydpen/ydpen-toolkit/scripts/pack_amr.py"
QJSC = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/better_video_player/aiot-vue-cli/cli-libs/aiot-qjsc-tool/assets/bin/darwin/arm64/qjsc20200705"
ZIG = "/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig"
QUICKJS_INC = "/Volumes/500GB/Ydpen/gwjcfls-ydpen-toolkit/assets/quickjs"
ADB = "/opt/homebrew/bin/adb"

APPID = "8002026111200001"
NAME = "植物大战僵尸"
VERSION = "1.0.0"

MODULES = [
    ("root.js", ["Component.js"]),
    ("base-page.js", ["BasePage.js"]),
    ("page-entry.js", ["index.js", "shell.js"]),
    ("app.js", ["app.js"]),
    ("pages/game/game.js", ["GameView.js"])
]

IMPORT_MAP = {
    "./Component.js": "./Component.js",
    "./BasePage.js": "./BasePage.js",
    "../../Component.js": "./Component.js",
    "./pages/game/game.js": "./GameView.js"
}

def run_cmd(cmd, cwd=None):
    p = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return p.returncode, p.stdout + p.stderr

def is_device_connected():
    if not os.path.exists(ADB):
        return False
    ret, out = run_cmd(f"{ADB} devices")
    return (ret == 0 and "9DA2200007506350\tdevice" in out)

def main():
    print("[*] 开始构建半条命 Falcon 原生小应用安装包...")

    shutil.rmtree(STAGE_DIR, ignore_errors=True)
    shutil.rmtree(BINS_DIR, ignore_errors=True)
    os.makedirs(STAGE_DIR, exist_ok=True)
    os.makedirs(BINS_DIR, exist_ok=True)
    os.makedirs(DIST_DIR, exist_ok=True)
    os.makedirs(LIBS_DIR, exist_ok=True)

    # 1. 扁平化源码映射
    print("[1/5] 扁平化源码映射...")
    for rel_path, out_names in MODULES:
        src_file = os.path.join(SRC_DIR, rel_path)
        with open(src_file, "r", encoding="utf-8") as f:
            code = f.read()
        for k, v in IMPORT_MAP.items():
            code = code.replace(f"'{k}'", f"'{v}'").replace(f'"{k}"', f'"{v}"')
        code = code.replace("\r\n", "\n")

        for name in out_names:
            dst = os.path.join(STAGE_DIR, name)
            with open(dst, "w", encoding="utf-8") as f:
                f.write(code)

    # 2. 本地 QuickJS 字节码编译
    print("[2/5] 本地 QuickJS 编译器 (qjsc20200705) 生成字节码...")
    stage_files = [f for f in os.listdir(STAGE_DIR) if f.endswith(".js") and not f.startswith("._")]
    for js_file in stage_files:
        stem = js_file[:-3]
        c_out = os.path.join(STAGE_DIR, f"{stem}.c")
        cmd_compile = [QJSC, "-o", c_out, "-c", "-m", "-M", "pvz", js_file]
        res = subprocess.run(cmd_compile, cwd=STAGE_DIR, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"[x] 编译 {js_file} 失败: {res.stderr}")
            sys.exit(1)

        with open(c_out, "r") as fp:
            c_text = fp.read()
        os.remove(c_out)

        # 匹配对应模块符号的字节数组
        pattern = rf'qjsc_{stem}\[\d+\]\s*=\s*\{{([^}}]+)\}}'
        m = re.search(pattern, c_text)
        if not m:
            print(f"[x] 解析 {stem} 字节码数组失败！")
            sys.exit(1)

        bytes_str = m.group(1).replace("\n", " ").replace("\r", " ")
        byte_data = bytes([int(x.strip(), 16) for x in bytes_str.split(",") if x.strip()])

        out_bin = os.path.join(BINS_DIR, f"{js_file}.bin")
        with open(out_bin, "wb") as fp:
            fp.write(byte_data)
        print(f"  [+] {js_file}.bin ({len(byte_data)} 字节)")

    # 建立 pages/game/ 页面镜像
    game_page_dir = os.path.join(BINS_DIR, "pages", "game")
    os.makedirs(game_page_dir, exist_ok=True)
    shutil.copy(os.path.join(BINS_DIR, "index.js.bin"), os.path.join(game_page_dir, "index.js.bin"))
    shutil.copy(os.path.join(BINS_DIR, "shell.js.bin"), os.path.join(game_page_dir, "shell.js.bin"))

    # 拷贝页面与应用元数据
    src_game_json = os.path.join(SRC_DIR, "pages", "game", "game.json")
    if os.path.exists(src_game_json):
        shutil.copy(src_game_json, os.path.join(game_page_dir, "game.json"))
    shutil.copy(os.path.join(SRC_DIR, "app.json"), os.path.join(BINS_DIR, "app.json"))
    shutil.copy(os.path.join(SRC_DIR, "manifest.json"), os.path.join(BINS_DIR, "manifest.json"))

    # 3. 部署官方正版游戏图标
    print("[3/5] 部署原版提取的植物大战僵尸图标...")
    icon_src = os.path.join(HERE, "assets", "app_icon.png")
    if not os.path.exists(icon_src):
        print(f"[!] 警告: 未找到 {icon_src}")
    else:
        shutil.copy(icon_src, os.path.join(BINS_DIR, "app_icon.png"))
        print("  [+] 原版 PvZ 图标已装配到应用包")

    # 4. 交叉编译 aarch64 原生插件
    print("[4/5] 交叉编译 aarch64-linux-gnu 原生插件 libjsapi_pvz.so...")
    so_src = os.path.join(LIBS_DIR, "libjsapi_pvz.so")
    c_src = os.path.join(HERE, "native", "libjsapi_pvz.c")
    cmd_zig = (
        f'"{ZIG}" cc -target aarch64-linux-gnu -shared -fPIC -O2 '
        f'-I "{QUICKJS_INC}" "{c_src}" -o "{so_src}" -lpthread'
    )
    ret, out = run_cmd(cmd_zig)
    if ret != 0:
        print(f"[x] Zig 编译原生插件失败: {out}")
        sys.exit(1)

    with open(so_src, "rb") as native_file:
        os.fsync(native_file.fileno())
        native_bytes = native_file.read()
    if not native_bytes.startswith(b"\x7fELF"):
        raise RuntimeError("原生编译产物不是有效 ELF，停止打包与安装")

    for arch in ["arm64", "arm64-orange"]:
        arch_dir = os.path.join(BINS_DIR, "libs", arch)
        os.makedirs(arch_dir, exist_ok=True)
        shutil.copy(so_src, os.path.join(arch_dir, "libjsapi_pvz.so"))
    print("  [+] 原生插件 libjsapi_pvz.so 编译就绪")

    # 5. 调用 pack_amr.py 打包
    print("[5/5] 打包 AMR 应用安装包...")
    out_amr = os.path.join(DIST_DIR, f"pvz-{VERSION}.amr")
    cmd_pack = [
        sys.executable, TOOLKIT_PACK_AMR,
        "--src", BINS_DIR,
        "--out", out_amr,
        "--appid", APPID,
        "--name", NAME,
        "--version", VERSION,
        "--icon", icon_src,
        "--lib", f"arm64={so_src}",
        "--lib", f"arm64-orange={so_src}"
    ]
    ret = subprocess.call(cmd_pack)
    if ret != 0:
        print("[x] 打包 AMR 失败！")
        sys.exit(1)

    with zipfile.ZipFile(out_amr) as archive:
        for arch in ("arm64", "arm64-orange"):
            if archive.read(f"libs/{arch}/libjsapi_pvz.so") != native_bytes:
                raise RuntimeError("包内原生库与编译产物不一致，停止安装")

    amr_size_kb = os.path.getsize(out_amr) // 1024
    print(f"\n[√] 植物大战僵尸 AMR 启动器构建成功！")
    print(f"    路径: {out_amr} ({amr_size_kb} KB)")

    # 6. 真机安装判断
    if is_device_connected():
        print("\n[*] 检测到词典笔已连接，正在自动安装...")
        from install_amr import main as install
        install()
    else:
        print("\n[i] 词典笔当前未连接（离线模式）。")
        print("    待放学连接词典笔后，只需运行以下指令即可一秒安装：")
        print(f"    python3 {os.path.join(HERE, 'tools', 'install_amr.py')}\n")

if __name__ == "__main__":
    main()
