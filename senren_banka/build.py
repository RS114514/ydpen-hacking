#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build.py —— 《千恋＊万花》miniapp 构建脚本

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
APPID = "8002026102400099"
VERSION = "1.0.0"
PEN_LIB = "/oem/YoudaoDictPen/output/libs:/usr/lib:/lib"
JSFMC = "/userdisk/skip_re/tools/jsfmc"
MAX_H, MAX_W = 220, 800

if "/opt/homebrew/bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = os.environ.get("PATH", "") + ":/opt/homebrew/bin:/usr/local/bin"


MODULES = [
    ("common.js", ["Common.js"]),
    ("storage.js", ["Storage.js"]),
    ("data/chapter_all.js", ["ChapterAll.js"]),
    ("data/flowchart_data.js", ["FlowchartData.js"]),
    ("data/choices_all.js", ["ChoicesAll.js"]),
    ("data/fx_events.js", ["FxEvents.js"]),
    ("data/gallery_cgs.js", ["GalleryCgs.js"]),
    ("data/gallery_scenes.js", ["GalleryScenes.js"]),
    ("data/after_yoshino.js", ["AfterYoshino.js"]),
    ("data/after_mako.js", ["AfterMako.js"]),
    ("data/after_murasame.js", ["AfterMurasame.js"]),
    ("data/after_rena.js", ["AfterRena.js"]),
    ("data/after_koharu.js", ["AfterKoharu.js"]),
    ("data/after_roka.js", ["AfterRoka.js"]),
    ("data/scn_yoshino.js", ["ScnYoshino.js"]),
    ("data/scn_mako.js", ["ScnMako.js"]),
    ("data/scn_murasame.js", ["ScnMurasame.js"]),
    ("data/scn_rena.js", ["ScnRena.js"]),
    ("data/scn_koharu.js", ["ScnKoharu.js"]),
    ("data/scn_roka.js", ["ScnRoka.js"]),
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
    "../../data/chapter_all.js": "./ChapterAll.js",
    "./data/chapter_all.js": "./ChapterAll.js",
    "../../data/chapter001.js": "./ChapterAll.js",
    "./data/chapter001.js": "./ChapterAll.js",
    "../../data/flowchart_data.js": "./FlowchartData.js",
    "../../data/choices_all.js": "./ChoicesAll.js",
    "./data/choices_all.js": "./ChoicesAll.js",
    "../../data/fx_events.js": "./FxEvents.js",
    "./data/fx_events.js": "./FxEvents.js",
    "../../data/gallery_cgs.js": "./GalleryCgs.js",
    "./data/gallery_cgs.js": "./GalleryCgs.js",
    "../../data/gallery_scenes.js": "./GalleryScenes.js",
    "./data/gallery_scenes.js": "./GalleryScenes.js",
    "../../data/after_yoshino.js": "./AfterYoshino.js",
    "../../data/after_mako.js": "./AfterMako.js",
    "../../data/after_murasame.js": "./AfterMurasame.js",
    "../../data/after_rena.js": "./AfterRena.js",
    "../../data/after_koharu.js": "./AfterKoharu.js",
    "../../data/after_roka.js": "./AfterRoka.js",
    "../../data/scn_yoshino.js": "./ScnYoshino.js",
    "../../data/scn_mako.js": "./ScnMako.js",
    "../../data/scn_murasame.js": "./ScnMurasame.js",
    "../../data/scn_rena.js": "./ScnRena.js",
    "../../data/scn_koharu.js": "./ScnKoharu.js",
    "../../data/scn_roka.js": "./ScnRoka.js",
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
        # 解析逗号分隔的选择器组：".a, .b { }" 中每个 class 各得一份样式；
        # 复合/后代选择器 ".a.b" / ".a .b" 落到最末 class（修饰态），运行时由 S() 按 class 顺序叠加。
        for sel in sel_group.split(","):
            parts = sel.split()
            if not parts or any(not re.fullmatch(r"(?:\.[A-Za-z0-9_-]+)+", p) for p in parts):
                continue  # 跳过伪类、标签、@ 规则等，避免样式被误套用
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
        print("[x] CSS 尺寸越界:\n" + "\n".join(errs))
        sys.exit(1)
    src = "// 由 build.py 从 CSS 生成，勿手改\nvar ST = %s;\nexport default ST;\n" % json.dumps(styles, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, "Styles.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write(src)
    print("[1/4] CSS 校验通过，%d 个样式类 -> Styles.js" % len(styles))


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
    adb("shell", "mkdir -p /userdisk/skip_re/tools /tmp/senren_b")
    mods = [("Styles.js", os.path.join(stage, "Styles.js"))]
    for srcrel, names in MODULES:
        s = flatten(open(os.path.join(APP_DIR, srcrel), encoding="utf-8").read())
        for n in names:
            p = os.path.join(stage, "src_" + n)
            open(p, "w", encoding="utf-8", newline="\n").write(s)
            mods.append((n, p))
    for mod, local in mods:
        stem = mod[:-3]
        adb("push", local, "/tmp/senren_b/%s.js" % stem)
        out = adb("shell", "export LD_LIBRARY_PATH=%s; %s -o /tmp/senren_b/%s.bin -n %s /tmp/senren_b/%s.js" % (PEN_LIB, JSFMC, stem, mod, stem))
        line = [l for l in out.splitlines() if "源码)" in l]
        if not line:
            print("      [x] 编译 %s 失败:\n%s" % (mod, out.strip()[:600]))
            sys.exit(1)
        dst = os.path.join(bins, mod + ".bin")
        adb("pull", "/tmp/senren_b/%s.bin" % stem, dst)
        print("      %-16s %s" % (mod, line[0].strip()))

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
    native_so = os.path.join(HERE, "libs", "libjsapi_gal.so")
    for sub in ("arm64", "arm64-orange"):
        d = os.path.join(amr_dir, "libs", sub)
        os.makedirs(d, exist_ok=True)
        shutil.copy(native_so, d)

    print("[4/4] 打包 .amr")
    dist = os.path.join(HERE, "dist")
    os.makedirs(dist, exist_ok=True)
    amr_path = os.path.join(dist, "senren_banka-%s.amr" % VERSION)
    native_so = os.path.join(HERE, "libs", "libjsapi_gal.so")
    
    icon_path = os.path.join(APP_DIR, "app_icon.png")
    shutil.copy(icon_path, bins)

    ret, out = run([
        sys.executable, os.path.join(TOOLKIT, "pack_amr.py"),
        "--src", bins,
        "--out", amr_path,
        "--appid", APPID,
        "--name", "千恋＊万花",
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

    if a.install:
        print("[+] 安装到词典笔 (appid=%s)" % APPID)
        adb("push", amr_path, "/tmp/senren_banka.amr")
        adb("push", amr_path, "/userdisk/skip_re/amr/senren_banka-1.0.0.amr")
        adb("shell", "miniapp_cli uninstall %s >/dev/null 2>&1" % APPID)
        time.sleep(1)
        res_inst = adb("shell", "miniapp_cli install /tmp/senren_banka.amr")
        print("      " + res_inst.strip())
        time.sleep(1)
        print("[+] 启动《千恋＊万花》...")
        out_start = adb("shell", "miniapp_cli start %s" % APPID)
        print("      " + out_start.strip())


if __name__ == "__main__":
    main()
