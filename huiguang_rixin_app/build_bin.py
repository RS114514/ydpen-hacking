#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_bin.py —— 《晖光日新》真机版构建：用笔上 jsfmc 编译 .js.bin 并打 .amr

与旧 build.py 的区别：旧版只产明文 JS，框架入口只认 app.js.bin，装上去会 1 秒退桌面。
本脚本：
  1) 扁平化模块 + 改写 import 路径
  2) 通过 adb 调用设备 /userdisk/skip_re/tools/jsfmc 编译成 *.js.bin
  3) 组装 app 目录（含 assets 图片/音频）+ pages/<page>/index|shell.js.bin
  4) 调 tools/pack_amr.py 打 .amr，可选 --install 直接装机启动

用法：
    python3 build_bin.py              # 只构建
    python3 build_bin.py --install    # 构建 + 安装 + 启动
"""
import argparse, hashlib, json, os, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(HERE, "app")
BUILD = os.path.join(HERE, "build_bin")
STAGE = os.path.join(BUILD, "src")
BINS = os.path.join(BUILD, "bin")
CACHE = os.path.join(BUILD, "cache")
PACKER = os.path.join(HERE, "tools", "pack_amr.py")
JSFMC = os.environ.get("PEN_JSFMC", "/userdisk/skip_re/tools/jsfmc")
PEN_LIB = os.environ.get("PEN_LIB", "/oem/YoudaoDictPen/output/libs:/usr/lib:/lib")
APPID = "8002026110100088"
NAME = "晖光日新"
VERSION = "1.0.0"
ADB = shutil.which("adb") or "/opt/homebrew/bin/adb"
PAGES = ("title", "game", "caseboard")

MODULES = [
    ("Styles.js", ["Styles.js"]),
    ("common.js", ["Common.js"]),
    ("storage.js", ["Storage.js"]),
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
    "./pages/title/title.js": "./TitleView.js",
    "./pages/game/game.js": "./GameView.js",
    "./pages/caseboard/caseboard.js": "./CaseboardView.js",
    "./root.js": "./Component.js",
    "./base-page.js": "./BasePage.js",
    "./page-entry.js": "./index.js",
}


def run(cmd, timeout=900):
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore", timeout=timeout)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def adb(*args, timeout=300):
    return run([ADB] + list(args), timeout=timeout)


def flatten(src):
    for a, b in IMPORT_MAP.items():
        src = src.replace("'" + a + "'", "'" + b + "'").replace('"' + a + '"', '"' + b + '"')
    return src.replace("\r\n", "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--offline", action="store_true", help="复用已有 .js.bin，不连设备")
    args = ap.parse_args()

    shutil.rmtree(STAGE, ignore_errors=True)
    os.makedirs(STAGE, exist_ok=True)
    os.makedirs(BINS, exist_ok=True)
    os.makedirs(CACHE, exist_ok=True)

    # 1) 扁平化
    print("[1/4] 扁平化模块")
    mods = []
    for srcrel, names in MODULES:
        path = os.path.join(APP_DIR, srcrel)
        if not os.path.isfile(path):
            print("  [!] 缺少 " + path)
            sys.exit(1)
        code = flatten(open(path, encoding="utf-8").read())
        for n in names:
            p = os.path.join(STAGE, n)
            open(p, "w", encoding="utf-8", newline="\n").write(code)
            mods.append((n, p))
        print("  %-28s -> %s" % (srcrel, ",".join(names)))

    # 2) 编译
    print("[2/4] jsfmc 编译 .js.bin")
    if not args.offline:
        ret, out = adb("shell", "ls " + JSFMC)
        if "No such file" in out:
            print("  [!] 设备上没有 jsfmc: " + JSFMC)
            sys.exit(2)
    for mod, local in mods:
        stem = mod[:-3]
        dst = os.path.join(BINS, mod + ".bin")
        digest = hashlib.sha1(open(local, "rb").read()).hexdigest()
        stamp = os.path.join(CACHE, mod + ".sha1")
        cached = os.path.join(CACHE, mod + ".bin")
        if args.offline and os.path.isfile(dst):
            print("  %-18s [=] offline 复用" % mod)
            continue
        if os.path.isfile(cached) and os.path.isfile(stamp) and open(stamp).read().strip() == digest:
            shutil.copyfile(cached, dst)
            print("  %-18s [=] 源未变 %d B" % (mod, os.path.getsize(dst)))
            continue
        ok = False
        err = ""
        for attempt in range(1, 6):
            ret, out = adb("push", local, "/tmp/hg_%s.js" % stem)
            if ret != 0:
                err = out.strip()[:160]
            else:
                ret, out = adb("shell", "export LD_LIBRARY_PATH=%s; %s -o /tmp/hg_%s.bin -n %s /tmp/hg_%s.js"
                               % (PEN_LIB, JSFMC, stem, mod, stem))
                if "源码)" not in out:
                    err = out.strip()[:200]
                else:
                    ret, out = adb("pull", "/tmp/hg_%s.bin" % stem, dst)
                    if ret == 0 and os.path.isfile(dst):
                        ok = True
                        break
                    err = out.strip()[:160]
            print("  %-18s [!] 第%d次失败: %s" % (mod, attempt, err))
            time.sleep(2)
        if not ok:
            print("  [!] 编译失败: " + mod)
            sys.exit(3)
        shutil.copyfile(dst, cached)
        open(stamp, "w").write(digest)
        print("  %-18s %d B" % (mod, os.path.getsize(dst)))

    # 3) 组装
    print("[3/4] 组装包目录")
    for page in PAGES:
        d = os.path.join(BINS, "pages", page)
        os.makedirs(d, exist_ok=True)
        for n in ("index.js.bin", "shell.js.bin"):
            shutil.copyfile(os.path.join(BINS, n), os.path.join(d, n))
    shutil.copyfile(os.path.join(APP_DIR, "app_icon.png"), os.path.join(BINS, "app_icon.png"))
    src_assets = os.path.join(HERE, "assets")
    dst_assets = os.path.join(BINS, "assets")
    shutil.rmtree(dst_assets, ignore_errors=True)
    if not os.path.isdir(dst_assets):
        os.makedirs(dst_assets, exist_ok=True)
    shutil.copytree(src_assets, dst_assets, dirs_exist_ok=True)

    # 4) 打包
    out = os.path.join(HERE, "dist", APPID + ".amr")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ret, log = run([sys.executable, PACKER, "--src", BINS, "--out", out,
                    "--appid", APPID, "--name", NAME, "--version", VERSION,
                    "--icon", os.path.join(APP_DIR, "app_icon.png"), "--no-libs"])
    if ret != 0:
        print(log)
        sys.exit(4)
    print("[4/4] %s (%.1f KB)" % (out, os.path.getsize(out) / 1024))

    if args.install:
        print("[+] 安装到词典笔")
        adb("push", out, "/userdisk/tmp/hg.amr")
        adb("shell", "miniapp_cli uninstall %s >/dev/null 2>&1" % APPID)
        time.sleep(1)
        ret, log = adb("shell", "miniapp_cli install /userdisk/tmp/hg.amr")
        print("    " + log.strip())
        time.sleep(1)
        adb("shell", "mkdir -p /userdisk/hg_data")
        adb("push", os.path.join(HERE, "assets") + "/.", "/userdisk/hg_data/assets/", timeout=600)
        adb("shell", "mkdir -p /userdisk/hg_data")
        adb("push", os.path.join(HERE, "assets") + "/.", "/userdisk/hg_data/assets/", timeout=600)
        ret, log = adb("shell", "miniapp_cli start %s title" % APPID)
        print("    " + log.strip())


if __name__ == "__main__":
    main()
