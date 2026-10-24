import os
import subprocess
import time

ADB = "/opt/homebrew/bin/adb"
WORKSPACE = "/Users/fuzihao/.gemini/antigravity/scratch/ydpen"
MINIAPPS_DIR = os.path.join(WORKSPACE, "miniapps")
TOOLKIT_DIR = os.path.join(WORKSPACE, "ydpen-toolkit")
PLUGINS_DIR = os.path.join(TOOLKIT_DIR, "assets", "plugins")
PENBILI_DIR = os.path.join(TOOLKIT_DIR, "assets", "penbili")
TERMINAL_DIR = os.path.join(TOOLKIT_DIR, "assets", "terminal")
KEEPER_SRC = os.path.join(TOOLKIT_DIR, "scripts", "sideload-keeper.sh")

def run_adb(args, stdin=None, timeout=60):
    cmd = [ADB] + args
    p = subprocess.run(cmd, input=stdin, text=True, capture_output=True, timeout=timeout)
    return p.stdout.strip() + " " + p.stderr.strip()

def run_sh(cmd, timeout=60):
    return run_adb(["shell", cmd], timeout=timeout)

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def wait_for_device():
    log("等待词典笔 ADB 连线中...")
    while True:
        out = run_adb(["devices"])
        lines = [l for l in out.splitlines() if "\tdevice" in l]
        if lines:
            serial = lines[0].split()[0]
            log(f"检测到设备在线: {serial}")
            return serial
        time.sleep(1)

def authenticate():
    log("正在验证 Root 权限 (密码: ydpen2026)...")
    out = run_sh("uptime")
    if "login" in out:
        auth_out = run_adb(["shell", "auth"], stdin="ydpen2026\n")
        log(f"auth 输出: {auth_out}")
    uid_out = run_sh("id")
    log(f"当前用户身份: {uid_out}")
    if "uid=0" in uid_out:
        log("✅ 成功获取 uid=0(root) 权限！")
        return True
    return False

def get_active_slot():
    out = run_sh("cat /userdisk/miniapp/resources/slot_info.sh 2>/dev/null")
    if "_b" in out:
        return "b"
    return "a"

def install_app(amr_path, appid=None):
    fname = os.path.basename(amr_path)
    remote_amr = f"/userdisk/Favorite/miniapps/{fname}"
    log(f"推送应用包: {fname} -> {remote_amr}")
    run_sh(f"mkdir -p /userdisk/Favorite/miniapps /userdisk/skip_re/amr")
    run_adb(["push", amr_path, remote_amr])
    run_adb(["push", amr_path, f"/userdisk/skip_re/amr/{fname}"])
    
    if appid:
        log(f"尝试卸载旧版 (appid: {appid})...")
        run_sh(f"miniapp_cli uninstall {appid}")
    
    log(f"执行安装: {fname}...")
    inst_out = run_sh(f"miniapp_cli install {remote_amr}")
    log(f"安装结果: {inst_out}")
    return inst_out

def inject_libs(appid, slot, lib_files):
    dst_dir = f"/userdisk/miniapp/data/mini_app/pkg/{appid}/{slot}/libs"
    run_sh(f"mkdir -p {dst_dir}")
    for lf in lib_files:
        fname = os.path.basename(lf)
        log(f"写入原生插件: {fname} -> {dst_dir}")
        run_adb(["push", lf, f"{dst_dir}/{fname}"])
        run_sh(f"chmod 755 {dst_dir}/{fname}")

def main():
    wait_for_device()
    if not authenticate():
        log("❌ 认证未通过，请检查是否已刷入固件。")
        return
    
    slot = get_active_slot()
    log(f"检测到当前活跃应用槽位: slot_{slot}")
    
    # 1. Doge 阅读
    log("\n=== 安装 Doge 阅读 ===")
    reader_amr = os.path.join(MINIAPPS_DIR, "doge-reader-1.1.2.amr")
    install_app(reader_amr, "8001145141919811")
    inject_libs("8001145141919811", slot, [os.path.join(PLUGINS_DIR, "libjsapi_fs_1000000001.so")])
    
    # 2. Doge 漫画
    log("\n=== 安装 Doge 漫画 ===")
    comic_amr = os.path.join(MINIAPPS_DIR, "doge-comic-1.3.1.amr")
    install_app(comic_amr, "8001145141919812")
    inject_libs("8001145141919812", slot, [os.path.join(PLUGINS_DIR, "libjsapi_fs_1000000001.so")])
    
    # 3. PenTerm 虚拟终端
    log("\n=== 安装 PenTerm 虚拟终端 ===")
    term_amr = os.path.join(TERMINAL_DIR, "PenTerm-9.3.6.amr")
    install_app(term_amr, "8001999000000001")
    
    # 4. PenBili 视频播放器 (aarch64 插件)
    log("\n=== 安装 PenBili 视频播放器 ===")
    penbili_amr = os.path.join(MINIAPPS_DIR, "PenBili-2.9.5.amr")
    install_app(penbili_amr, "8002026091900004")
    inject_libs("8002026091900004", slot, [
        os.path.join(PENBILI_DIR, "libjsapi_player.so"),
        os.path.join(PENBILI_DIR, "libjsapi_httpjson.so")
    ])
    
    # 5. 部署 Sideload Keeper 保活守护
    log("\n=== 部署 Sideload Keeper 保活守护 ===")
    run_sh("mkdir -p /userdisk/skip_re")
    run_adb(["push", KEEPER_SRC, "/userdisk/skip_re/skip_login.sh"])
    run_sh("chmod +x /userdisk/skip_re/skip_login.sh")
    run_sh("sh /userdisk/skip_re/skip_login.sh >/dev/null 2>&1 &")
    log("✅ 保活守护部署完成 (开机自动恢复侧载应用)")
    
    log("\n🎉 所有应用与插件安装全部完成！")

if __name__ == "__main__":
    main()
