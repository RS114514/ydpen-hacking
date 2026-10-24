#!/usr/bin/env python3
import os
import sys
import re
import json
import hashlib
import zipfile
import subprocess

QJSC = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen/better_video_player/aiot-vue-cli/cli-libs/aiot-qjsc-tool/assets/bin/darwin/arm64/qjsc20200705"

def md5(b: bytes) -> str:
    return hashlib.md5(b).hexdigest()

def compile_js_to_bin(js_path: str, bin_path: str, is_module: bool = True, ext_modules=None) -> bool:
    """用 qjsc 将 JS 源码编译为 QuickJS 20200705 字节码 .js.bin"""
    js_dir = os.path.dirname(os.path.abspath(js_path))
    js_name = os.path.basename(js_path)
    c_out = os.path.abspath(bin_path + ".tmp.c")
    
    cmd = [QJSC]
    if is_module:
        cmd.append("-m")
    for em in (ext_modules or []):
        cmd.extend(["-M", em])
    cmd.extend(["-c", "-o", c_out, "-N", "qjsc_data", js_name])
    
    ret = subprocess.run(cmd, cwd=js_dir, capture_output=True, text=True)
    if ret.returncode != 0:
        print(f"qjsc compile failed for {js_path}: {ret.stderr}")
        return False
        
    with open(c_out, "r", encoding="utf-8") as f:
        c_txt = f.read()
    if os.path.exists(c_out):
        os.remove(c_out)
        
    m = re.search(r"const uint8_t qjsc_data\[\d+\] = \{([^}]+)\};", c_txt)
    if not m:
        print(f"Failed to find bytecode array in {c_out}")
        return False
        
    byte_vals = [int(x.strip(), 16) for x in m.group(1).split(",") if x.strip()]
    bin_bytes = bytes(byte_vals)
    with open(bin_path, "wb") as f:
        f.write(bin_bytes)
    return True

def pack_amr(app_dir: str, out_amr: str, appid: str, app_name: str, version: str = "1.0.0", extra_libs: dict = None) -> bool:
    """将应用目录打包为符合 PenOS 规范且包含完整 cert 签名的 .amr 文件"""
    os.makedirs(os.path.dirname(out_amr), exist_ok=True)
    
    files = {}
    
    # 扫描 app_dir 下的所有文件（除去临时文件和 manifest）
    for root, dirs, filenames in os.walk(app_dir):
        for fn in filenames:
            if fn.endswith(".tmp.c") or fn == "manifest.json":
                continue
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, app_dir).replace("\\", "/")
            with open(p, "rb") as f:
                files[rel] = f.read()
                
    # 加入额外 native 库
    if extra_libs:
        for pkg_rel, local_path in extra_libs.items():
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    files[pkg_rel] = f.read()
                    
    # 构建 cert 校验和（manifest.json 与 app_icon.png 以外的所有文件）
    cert = {}
    for rel, data in sorted(files.items()):
        if rel in ("manifest.json", "app_icon.png"):
            continue
        cert[rel] = {
            "size": len(data),
            "md5": md5(data)
        }
        
    manifest = {
        "appName": app_name,
        "version": version,
        "appid": str(appid),
        "icon": "app_icon.png",
        "quickjs": {"version": "20200705", "bigNum": False},
        "meta": {"otaVersion": "3.4.0"},
        "props": {
            "supportUnInstall": True,
            "addDesktop": {
                "coco_platform": True,
                "almond_platform": True,
                "x3s_platform": False,
                "apollo_platform": False,
                "plum_platform": False,
                "melon_platform": True
            }
        },
        "cert": cert
    }
    
    manifest_bytes = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")
    files["manifest.json"] = manifest_bytes
    
    order = ["manifest.json"] + sorted(k for k in files if k != "manifest.json")
    with zipfile.ZipFile(out_amr, "w", zipfile.ZIP_DEFLATED) as z:
        for rel in order:
            z.writestr(rel, files[rel])
            
    print(f"成功打包 AMR: {out_amr} ({os.path.getsize(out_amr)} 字节, {len(files)} 个文件)")
    return True
