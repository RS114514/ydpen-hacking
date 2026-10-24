#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py —— 视频播放器 miniapp 构建脚本

1) 把 pages/*/*.css 转成 Styles.js，并校验：任何元素 height/top+height 不得超过 220px，width/left+width 不得超过 800px
2) 源码扁平化（改写 import 到框架使用的块文件名）
3) 用笔上的 jsfmc 编译成 .js.bin（笔需 adb 在线且已 shell auth）
4) 调用 ydpen-toolkit 的 pack_amr.py 打包 .amr（带 libs/arm64 与 libs/arm64-orange）

用法： python3 build.py [--install]
"""
import argparse, json, os, re, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLKIT = os.path.join(HERE, "..", "ydpen-toolkit", "scripts")
SERIAL = os.environ.get("PEN_SERIAL", "192.168.31.30:5555")
APPID = "8002026102300004"
VERSION = "1.0.0"
PEN_LIB = "/oem/YoudaoDictPen/output/libs:/usr/lib:/lib"
JSFMC = "/userdisk/skip_re/tools/jsfmc"
MAX_H, MAX_W = 220, 800

# 源文件 -> 框架块文件名（可对应多个）
MODULES = [
    ("common.js", ["Common.js"]),
    ("pages/index/index.js", ["ListView.js"]),
    ("pages/player/player.js", ["PlayerView.js"]),
    ("root.js", ["Component.js"]),
    ("base-page.js", ["BasePage.js"]),
    ("page-entry.js", ["index.js", "shell.js"]),
    ("app.js", ["app.js"]),
]
IMPORT_MAP = {
    "../../common.js": "./Common.js",
    "./common.js": "./Common.js",
    "./pages/index/index.js": "./ListView.js",
    "./pages/player/player.js": "./PlayerView.js",
}


def run(cmd, **kw):
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore", **kw)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def adb(*a, timeout=180):
    return run(["adb", "-s", SERIAL] + list(a), timeout=timeout)[1]


def px(v):
    m = re.fullmatch(r"(-?\d+(?:\.\d+)?)px", v.strip())
    return float(m.group(1)) if m else None


def css_to_obj(path):
    txt = re.sub(r"/\*.*?\*/", "", open(path, encoding="utf-8").read(), flags=re.S)
    rules = {}
    for sel, body in re.findall(r"\.([A-Za-z0-9_-]+)\s*\{([^}]*)\}", txt):
        obj = {}
        for decl in body.split(";"):
            if ":" not in decl:
                continue
            k, v = decl.split(":", 1)
            k = re.sub(r"-([a-z])", lambda m: m.group(1).upper(), k.strip())
            v = v.strip().replace(", ", ",")
            obj[k] = int(v) if re.fullmatch(r"\d+", v) else v
        rules[sel] = obj
    return rules


def check_bounds(name, r):
    errs = []
    def g(k):
        v = r.get(k)
        return px(v) if isinstance(v, str) else None
    h, w, t, l = g("height"), g("width"), g("top"), g("left")
    if h is not None and h > MAX_H: errs.append("height %s > %d" % (h, MAX_H))
    if w is not None and w > MAX_W: errs.append("width %s > %d" % (w, MAX_W))
    if h is not None and t is not None and h + t > MAX_H: errs.append("top+height %s > %d" % (h + t, MAX_H))
    if w is not None and l is not None and w + l > MAX_W: errs.append("left+width %s > %d" % (w + l, MAX_W))
    return ["  .%s: %s" % (name, e) for e in errs]


def build_styles(out_dir):
    styles, errs = {}, []
    for css in ("pages/index/index.css", "pages/player/player.css"):
        rules = css_to_obj(os.path.join(HERE, css))
        for n, r in rules.items():
            errs += check_bounds(n, r)
        styles.update(rules)
    if errs:
        print("[x] CSS 尺寸越界:\n" + "\n".join(errs))
        sys.exit(1)
    src = "// 由 build.py 从 CSS 生成，勿手改\nvar ST = %s;\nexport default ST;\n" % json.dumps(styles, ensure_ascii=False, indent=1)
    open(os.path.join(out_dir, "Styles.js"), "w", encoding="utf-8", newline="\n").write(src)
    print("[1/4] CSS 校验通过，%d 个样式类 -> Styles.js" % len(styles))


def flatten(src):
    for a, b in IMPORT_MAP.items():
        src = src.replace("'%s'" % a, "'%s'" % b).replace('"%s"' % a, '"%s"' % b)
    return src.replace("\r\n", "\n")


def compile_all(stage, bins):
    print("[2/4] 用笔上 jsfmc 编译 .js.bin")
    if "login" in adb("shell", "uptime"):
        subprocess.run(["adb", "-s", SERIAL, "shell", "auth"], input="ydpen2026\n", capture_output=True, text=True, timeout=60)
    adb("shell", "mkdir -p /userdisk/skip_re/tools /tmp/vpb")
    mods = [("Styles.js", os.path.join(stage, "Styles.js"))]
    for srcrel, names in MODULES:
        s = flatten(open(os.path.join(HERE, srcrel), encoding="utf-8").read())
        for n in names:
            p = os.path.join(stage, "src_" + n)
            open(p, "w", encoding="utf-8", newline="\n").write(s)
            mods.append((n, p))
    for mod, local in mods:
        stem = mod[:-3]
        adb("push", local, "/tmp/vpb/%s.js" % stem)
        out = adb("shell", "export LD_LIBRARY_PATH=%s; %s -o /tmp/vpb/%s.bin -n %s /tmp/vpb/%s.js" % (PEN_LIB, JSFMC, stem, mod, stem))
        line = [l for l in out.splitlines() if "源码)" in l]
        if not line:
            print("      [x] 编译 %s 失败:\n%s" % (mod, out.strip()[:600]))
            sys.exit(1)
        dst = os.path.join(bins, mod + ".bin")
        adb("pull", "/tmp/vpb/%s.bin" % stem, dst)
        print("      %-16s %s" % (mod, line[0].strip()))
    for n in ("index.js.bin", "shell.js.bin"):
        os.makedirs(os.path.join(bins, "pages", "index"), exist_ok=True)
        shutil.copy(os.path.join(bins, n), os.path.join(bins, "pages", "index", n))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true")
    a = ap.parse_args()
    b = os.path.join(HERE, "build")
    stage, bins = os.path.join(b, "stage"), os.path.join(b, "bins")
    for d in (stage, bins):
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d)
    build_styles(stage)
    compile_all(stage, bins)
    shutil.copy(os.path.join(HERE, "app_icon.png"), bins)
    print("[3/4] 打包 .amr")
    dist = os.path.join(HERE, "dist")
    os.makedirs(dist, exist_ok=True)
    out = os.path.join(dist, "video_player-%s.amr" % VERSION)
    lib = os.path.join(HERE, "libs", "libjsapi_player.so")
    rc, log = run([sys.executable, os.path.join(TOOLKIT, "pack_amr.py"), "--src", bins, "--out", out,
                   "--appid", APPID, "--name", "视频播放器", "--version", VERSION,
                   "--lib", "arm64=" + lib, "--lib", "arm64-orange=" + lib])
    print(log.strip()[-900:])
    if rc != 0:
        sys.exit(rc)
    if a.install:
        print("[4/4] 安装并启动")
        adb("push", out, "/tmp/video_player.amr")
        adb("shell", "miniapp_cli uninstall %s >/dev/null 2>&1" % APPID)
        time.sleep(2)
        print("      " + adb("shell", "miniapp_cli install /tmp/video_player.amr").strip()[:120])
        time.sleep(3)
        adb("shell", "miniapp_cli start %s index" % APPID)
    print("完成:", out)


if __name__ == "__main__":
    main()
