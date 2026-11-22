#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py —— 《魔女的夜宴》miniapp 构建脚本

1) 把 pages/*/*.css 转成 Styles.js，校验：height <= 220px, width <= 800px
2) 源码扁平化与依赖改写
3) 用笔上 jsfmc 编译成 .js.bin
4) 随附 libs/libjsapi_gal.so 打包 .amr
5) 支持 --install 直接部署验证
"""
import argparse, json, os, re, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(HERE, "app")
TOOLKIT = os.path.join(HERE, "..", "ydpen-toolkit", "scripts")
SERIAL = os.environ.get("PEN_SERIAL", "9DA2200007506350")
APPID = "8002026102400098"
APP_NAME = "魔女的夜宴"
VERSION = "1.0.0"
PEN_LIB = "/oem/YoudaoDictPen/output/libs:/usr/lib:/lib"
JSFMC = "/userdisk/skip_re/tools/jsfmc"
MAX_H, MAX_W = 220, 800

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = os.environ.get("PATH", "") + ":/opt/homebrew/bin:/usr/local/bin"


MODULES = [
    ("common.js", ["Common.js"]),
    ("storage.js", ["Storage.js"]),
    ("media.js", ["Media.js"]),
    ("data/flowchart_data.js", ["FlowchartData.js"]),
    ("data/gallery_data.js", ["GalleryData.js"]),
    ("pages/title/title.js", ["TitleView.js"]),
    ("pages/game/game.js", ["GameView.js"]),
    ("pages/gallery/gallery.js", ["GalleryView.js"]),
    ("pages/flowchart/flowchart.js", ["FlowchartView.js"]),
    ("pages/afterstory/afterstory.js", ["AfterstoryView.js"]),
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
    "../../media.js": "./Media.js",
    "./media.js": "./Media.js",
    "../../data/story_data.js": "./StoryData.js",
    "./data/story_data.js": "./StoryData.js",
    "../../data/flowchart_data.js": "./FlowchartData.js",
    "./data/flowchart_data.js": "./FlowchartData.js",
    "../../data/gallery_data.js": "./GalleryData.js",
    "./data/gallery_data.js": "./GalleryData.js",
    "./pages/title/title.js": "./TitleView.js",
    "./pages/game/game.js": "./GameView.js",
    "./pages/gallery/gallery.js": "./GalleryView.js",
    "./pages/flowchart/flowchart.js": "./FlowchartView.js",
    "./pages/afterstory/afterstory.js": "./AfterstoryView.js",
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
    with open(path, encoding="utf-8") as f:
        txt = re.sub(r"/\*.*?\*/", "", f.read(), flags=re.S)
    rules = {}
    for sel_group, body in re.findall(r"([^{}]+)\{([^}]*)\}", txt):
        obj = {}
        for decl in body.split(";"):
            if ":" not in decl:
                continue
            k, v = decl.split(":", 1)
            k = re.sub(r"-([a-z])", lambda m: m.group(1).upper(), k.strip())
            v = v.strip().replace(", ", ",")
            obj[k] = int(v) if re.fullmatch(r"\d+", v) else v
        for sel in sel_group.split(","):
            parts = sel.split()
            if not parts or any(not re.fullmatch(r"(?:\.[A-Za-z0-9_-]+)+", p) for p in parts):
                continue
            rules[re.findall(r"\.([A-Za-z0-9_-]+)", parts[-1])[-1]] = obj
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
    for css in (
        "pages/title/title.css",
        "pages/game/game.css",
        "pages/gallery/gallery.css",
        "pages/flowchart/flowchart.css",
        "pages/afterstory/afterstory.css"
    ):
        rules = css_to_obj(os.path.join(APP_DIR, css))
        for n, r in rules.items():
            errs += check_bounds(n, r)
        styles.update(rules)
    if errs:
        print("[!] 样式越界警告 (<= 800x220):")
        for e in errs: print(e)
    code = "export default " + json.dumps(styles, ensure_ascii=False, indent=2) + ";\n"
    dst = os.path.join(out_dir, "Styles.js")
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write(code)
    print("[1/4] Styles.js (%d 个 class) -> %s" % (len(styles), dst))


def flatten(src):
    for a, b in IMPORT_MAP.items():
        src = src.replace("'%s'" % a, "'%s'" % b).replace('"%s"' % a, '"%s"' % b)
    return src.replace("\r\n", "\n")


def write_stage(stage):
    build_styles(stage)
    for srcrel, names in MODULES:
        s = flatten(open(os.path.join(APP_DIR, srcrel), encoding="utf-8").read())
        for n in names:
            with open(os.path.join(stage, n), "w", encoding="utf-8", newline="\n") as f:
                f.write(s)
    print("[stage] %d 个扁平化模块 -> %s" % (sum(len(n) for _, n in MODULES) + 1, stage))


def compile_all(stage, bins):
    print("[2/4] 用笔上 jsfmc 编译 .js.bin")
    adb("shell", "mkdir -p /userdisk/skip_re/tools /tmp/sanoba_b")
    
    # 1. 编译除 StoryData 外的全部模块
    mods = [("Styles.js", os.path.join(stage, "Styles.js"))]
    for srcrel, names in MODULES:
        s = flatten(open(os.path.join(APP_DIR, srcrel), encoding="utf-8").read())
        for n in names:
            p = os.path.join(stage, "src_" + n)
            open(p, "w", encoding="utf-8", newline="\n").write(s)
            mods.append((n, p))
            
    for mod, local in mods:
        stem = mod[:-3]
        adb("push", local, "/tmp/sanoba_b/%s.js" % stem)
        out = adb("shell", "export LD_LIBRARY_PATH=%s; %s -o /tmp/sanoba_b/%s.bin -n %s /tmp/sanoba_b/%s.js" % (PEN_LIB, JSFMC, stem, mod, stem))
        line = [l for l in out.splitlines() if "源码)" in l]
        if not line:
            print("      [x] 编译 %s 失败:\n%s" % (mod, out.strip()[:600]))
            sys.exit(1)
        dst = os.path.join(bins, mod + ".bin")
        adb("pull", "/tmp/sanoba_b/%s.bin" % stem, dst)
        print("      %-16s %s" % (mod, line[0].strip()))

    # 2. 编译 StoryData (优先复用已有的 StoryData.js.bin)
    story_dst = os.path.join(bins, "StoryData.js.bin")
    if os.path.exists(story_dst) and os.path.getsize(story_dst) > 1000000:
        print("      复用本地已有 StoryData.js.bin (%.1f MB)" % (os.path.getsize(story_dst) / 1024 / 1024))
    else:
        print("      从设备拉取已编译的 StoryData.js.bin...")
        adb("pull", "/tmp/sanoba_b/StoryData.js.bin", story_dst)
        if not os.path.exists(story_dst) or os.path.getsize(story_dst) < 1000000:
            adb("pull", "/tmp/story_test.bin", story_dst)
        print("      %-16s (%.1f MB)" % ("StoryData.js.bin", os.path.getsize(story_dst) / 1024 / 1024))

    for n in ("index.js.bin", "shell.js.bin"):
        for sub in ("title", "game", "gallery", "flowchart", "afterstory"):
            os.makedirs(os.path.join(bins, "pages", sub), exist_ok=True)
            shutil.copy(os.path.join(bins, n), os.path.join(bins, "pages", sub, n))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--stage-only", action="store_true")
    a = ap.parse_args()
    b = os.path.join(HERE, "build")
    stage, bins = os.path.join(b, "stage"), os.path.join(b, "bins")
    for d in (stage, bins):
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d, exist_ok=True)

    if a.stage_only:
        write_stage(stage)
        return

    build_styles(stage)
    compile_all(stage, bins)

    print("[3/4] 组装 .amr 目录")
    amr_dir = os.path.join(b, "amr")
    shutil.rmtree(amr_dir, ignore_errors=True)
    shutil.copytree(bins, amr_dir)

    for f in ("manifest.json", "app.json", "app_icon.png"):
        src = os.path.join(APP_DIR, f)
        if os.path.exists(src):
            shutil.copy(src, amr_dir)

    for page in ("title", "game", "gallery", "flowchart", "afterstory"):
        src_json = os.path.join(APP_DIR, "pages", page, "%s.json" % page)
        dst_dir = os.path.join(amr_dir, "pages", page)
        os.makedirs(dst_dir, exist_ok=True)
        if os.path.exists(src_json):
            shutil.copy(src_json, dst_dir)

    # 放入原生动态库 libjsapi_gal.so
    native_so = os.path.join(HERE, "libs", "arm64", "libjsapi_gal.so")
    for sub in ("arm64", "arm64-orange"):
        d = os.path.join(amr_dir, "libs", sub)
        os.makedirs(d, exist_ok=True)
        shutil.copy(native_so, d)

    print("[4/4] 打包 .amr")
    dist = os.path.join(HERE, "dist")
    os.makedirs(dist, exist_ok=True)
    amr_path = os.path.join(dist, "sanoba_witch-%s.amr" % VERSION)
    
    icon_path = os.path.join(APP_DIR, "app_icon.png")
    shutil.copy(icon_path, bins)

    pack_tool = os.path.join(HERE, "..", "sanoba_witch_windows_installer", "scripts", "pack_amr.py")
    ret, out = run([
        sys.executable, pack_tool,
        "--src", amr_dir,
        "--out", amr_path,
        "--appid", APPID,
        "--name", APP_NAME,
        "--version", VERSION,
        "--icon", icon_path,
        "--lib", "arm64=" + native_so,
        "--lib", "arm64-orange=" + native_so
    ])
    if ret != 0:
        print("[x] pack_amr.py 失败:\n" + out)
        sys.exit(1)
    sz = os.path.getsize(amr_path)
    print("      已生成 %s (%.1f KB)" % (amr_path, sz / 1024))

    # 更新 installer 里的 payload
    installer_payload = os.path.join(HERE, "..", "sanoba_witch_windows_installer", "payload", "sanoba_witch-%s.amr" % VERSION)
    shutil.copy(amr_path, installer_payload)
    print("      已同步更新 installer payload -> %s" % installer_payload)

    if a.install:
        print("[+] 安装到词典笔 (appid=%s)" % APPID)
        adb("push", amr_path, "/tmp/sanoba_witch.amr")
        adb("push", amr_path, "/userdisk/skip_re/amr/sanoba_witch-%s.amr" % VERSION)
        adb("shell", "miniapp_cli uninstall %s >/dev/null 2>&1" % APPID)
        time.sleep(1)
        res_inst = adb("shell", "miniapp_cli install /tmp/sanoba_witch.amr")
        print("      " + res_inst.strip())
        time.sleep(1)
        print("[+] 启动《魔女的夜宴》...")
        out_start = adb("shell", "miniapp_cli start %s title" % APPID)
        print("      " + out_start.strip())


if __name__ == "__main__":
    main()
