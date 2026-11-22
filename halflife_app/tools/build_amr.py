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
QJSC = "/Volumes/500GB/Ydpen/better_video_player/aiot-vue-cli/cli-libs/aiot-qjsc-tool/assets/bin/darwin/x64/qjsc20200705"
ZIG = "/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig"
QUICKJS_INC = "/Volumes/500GB/Ydpen/gwjcfls-ydpen-toolkit/assets/quickjs"
ADB = "/opt/homebrew/bin/adb"
TARGET_DEVICE = os.environ.get("YDPEN_SERIAL", "9DA2200007506350")

APPID = "8002026110400001"
NAME = "半条命"
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
    ret, out = run_cmd(f"{ADB} -s {TARGET_DEVICE} get-state")
    return (ret == 0 and "device" in out.strip())

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
        cmd_compile = [QJSC, "-o", c_out, "-c", "-m", "-M", "hl", js_file]
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
    print("[3/5] 部署官方正版 Half-Life Lambda 图标...")
    icon_src = os.path.join(HERE, "assets", "app_icon.png")
    if not os.path.exists(icon_src):
        print(f"[!] 警告: 未找到 {icon_src}")
    else:
        shutil.copy(icon_src, os.path.join(BINS_DIR, "app_icon.png"))
        print("  [+] 正版 Lambda 图标已装配到应用包")

    # 4. 交叉编译 aarch64 原生插件
    print("[4/5] 交叉编译 aarch64-linux-gnu 原生插件 libjsapi_hl.so 与 libwl_center.so...")
    so_src = os.path.join(LIBS_DIR, "libjsapi_hl.so")
    c_src = os.path.join(HERE, "native", "libjsapi_hl.c")
    tmp_so = "/tmp/libjsapi_hl.so"
    cmd_zig = (
        f'"{ZIG}" cc -target aarch64-linux-gnu -shared -fPIC -O2 '
        f'-I "{QUICKJS_INC}" "{c_src}" -o "{tmp_so}" -lpthread'
    )
    ret, out = run_cmd(cmd_zig)
    if ret != 0:
        print(f"[x] Zig 编译原生插件失败: {out}")
        sys.exit(1)
    shutil.copyfile(tmp_so, so_src)

    with open(so_src, "rb") as native_file:
        native_bytes = native_file.read()
    if not native_bytes.startswith(b"\x7fELF"):
        raise RuntimeError("原生编译产物不是有效 ELF，停止打包与安装")

    # 交叉编译居中定位与触控校准插件 libwl_center.so
    wl_src = os.path.join(HERE, "native", "wl_center.c")
    xdg_src = "/Volumes/500GB/qoder_cache/doom_src/wayland_gen/xdg-shell-protocol.c"
    wl_so = os.path.join(LIBS_DIR, "libwl_center.so")

    dev_libs_dir = os.path.join(BUILD_DIR, "dev_libs")
    os.makedirs(dev_libs_dir, exist_ok=True)
    wayland_client_so = os.path.join(dev_libs_dir, "libwayland-client.so")
    if not os.path.exists(wayland_client_so) and is_device_connected():
        run_cmd(f"{ADB} -s {TARGET_DEVICE} pull /usr/lib/libwayland-client.so.0 {wayland_client_so}")

    tmp_wl_so = "/tmp/libwl_center.so"
    cmd_wl = (
        f'"{ZIG}" cc -target aarch64-linux-gnu -shared -fPIC -O2 '
        f'-I /Volumes/500GB/qoder_cache/doom_src/wayland_dev/x/usr/include '
        f'-I /Volumes/500GB/qoder_cache/doom_src/wayland_gen '
        f'"{wl_src}" "{xdg_src}" -L "{dev_libs_dir}" -lwayland-client -o "{tmp_wl_so}"'
    )
    ret_wl, out_wl = run_cmd(cmd_wl)
    if ret_wl == 0 and os.path.exists(tmp_wl_so):
        shutil.copyfile(tmp_wl_so, wl_so)
    elif os.path.exists(wl_so):
        print(f"[!] Zig 编译 libwl_center.so 提示: {out_wl}，复用现有产物")
    else:
        print(f"[x] Zig 编译 libwl_center.so 失败: {out_wl}")
        sys.exit(1)

    with open(wl_so, "rb") as wl_file:
        os.fsync(wl_file.fileno())
        wl_bytes = wl_file.read()
    if not wl_bytes.startswith(b"\x7fELF"):
        raise RuntimeError("libwl_center.so 不是有效 ELF，停止打包与安装")

    for arch in ["arm64", "arm64-orange"]:
        arch_dir = os.path.join(BINS_DIR, "libs", arch)
        os.makedirs(arch_dir, exist_ok=True)
        shutil.copy(so_src, os.path.join(arch_dir, "libjsapi_hl.so"))
    print("  [+] 原生插件 libjsapi_hl.so 准备就绪（libwl_center.so 保持独立外部运行库）")

    # 5. 调用 pack_amr.py 打包
    print("[5/5] 打包 AMR 应用安装包...")
    out_amr = os.path.join(DIST_DIR, f"half-life-{VERSION}.amr")
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
        namelist = set(archive.namelist())
        for arch in ("arm64", "arm64-orange"):
            jsapi_entry = f"libs/{arch}/libjsapi_hl.so"
            if jsapi_entry not in namelist:
                raise RuntimeError(f"包内缺少必要原生库 {jsapi_entry}，停止打包")
            if archive.read(jsapi_entry) != native_bytes:
                raise RuntimeError(f"包内原生库 {jsapi_entry} 与编译产物不一致，停止打包")
            wl_entry = f"libs/{arch}/libwl_center.so"
            if wl_entry in namelist:
                raise RuntimeError(f"AMR 包内检测到违规包含居中插件 {wl_entry}，必须隔离在包外，停止打包")

        actual_libs = {name for name in namelist if name.startswith("libs/") and not name.endswith("/")}
        expected_libs = {"libs/arm64/libjsapi_hl.so", "libs/arm64-orange/libjsapi_hl.so"}
        if actual_libs != expected_libs:
            raise RuntimeError(f"AMR 包内 libs 目录内容异常：期望 {expected_libs}，实际包含 {actual_libs}")

    amr_size_kb = os.path.getsize(out_amr) // 1024
    print(f"\n[√] 半条命 AMR 安装包本地构建成功！")
    print(f"    路径: {out_amr} ({amr_size_kb} KB)")

    # 6. 真机安装判断
    if is_device_connected():
        print("\n[*] 检测到词典笔已连接，正在自动安装...")
        tools_dir = os.path.join(HERE, "tools")
        if tools_dir not in sys.path:
            sys.path.insert(0, tools_dir)
        from install_amr import main as install
        install()
    else:
        print("\n[i] 词典笔当前未连接（离线模式）。")
        print("    待放学连接词典笔后，只需运行以下指令即可一秒安装：")
        print(f"    python3 {os.path.join(HERE, 'tools', 'install_amr.py')}\n")

if __name__ == "__main__":
    main()
