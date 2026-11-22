#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""《半条命 1》有道词典笔 6 代全平台通用离线一键安装器。

支持 Windows / macOS (Apple Silicon & Intel) / Linux 一键安装，
内置便携 Python 与 ADB 运行环境，无需额外配置开发环境。
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

APPID = "8002026110400001"
VERSION = "1.0.0"
REMOTE_GAME_DIR = "/userdisk/halflife"
REMOTE_VALVE_DIR = f"{REMOTE_GAME_DIR}/valve"
REMOTE_SAVE_DIR = f"{REMOTE_VALVE_DIR}/save"
REMOTE_SKIP_RE = "/userdisk/skip_re/amr"

ROOT_DIR = Path(__file__).resolve().parent.parent
PAYLOAD_DIR = ROOT_DIR / "payload"
TOOLS_DIR = ROOT_DIR / "tools"
BACKUP_DIR = ROOT_DIR / "backup"
LOG_FILE = ROOT_DIR / "install.log"


def log(msg: str) -> None:
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def banner() -> None:
    print("=" * 68)
    print("    《半条命 1》有道词典笔 6 代 全平台通用离线一键安装器")
    print(f"      版本: v{VERSION}  |  支持电脑: Windows / macOS / Linux")
    print("=" * 68)
    print("  包含内容与核心修复：")
    print("  [1] 完整 Half-Life 单人战役地图、高清材质与官方简体中文配音")
    print("  [2] 简体中文游戏主菜单 (TrueType 字体渲染) 与防乱码字幕")
    print("  [3] 暂停菜单触控十字方向键与 ESC/OK 叠层 (libwl_center.so)")
    print("  [4] 全关卡 NPC 正常直立行走修复 (64 位重构 hl.so / client.so)")
    print("  [5] 训练室与动态光黑屏防护 (userconfig.d/00-pen-render.cfg)")
    print("  [6] 自动备份设备既有存档，升级或重装不丢进度")
    print("=" * 68)
    print()


def _test_adb_binary(adb_path: Path) -> bool:
    if not adb_path.is_file():
        return False
    if sys.platform != "win32":
        try:
            os.chmod(adb_path, 0o755)
        except OSError:
            pass
    if sys.platform == "darwin":
        subprocess.run(
            ["xattr", "-d", "com.apple.quarantine", str(adb_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    try:
        res = subprocess.run(
            [str(adb_path), "version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10,
            check=False,
        )
        return res.returncode == 0
    except OSError:
        return False


def _stage_executable_to_temp(src: Path, name: str) -> Path:
    cache_dir = Path(tempfile.gettempdir()) / "hl_ydpen_adb_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    dst = cache_dir / name
    need_copy = not dst.is_file() or dst.stat().st_size != src.stat().st_size
    if need_copy:
        shutil.copy2(src, dst)
    os.chmod(dst, 0o755)
    if sys.platform == "darwin":
        subprocess.run(
            ["xattr", "-d", "com.apple.quarantine", str(dst)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    return dst


def get_adb_path() -> str:
    candidates: list[Path] = []
    if sys.platform == "win32":
        candidates.append(TOOLS_DIR / "win64" / "adb" / "adb.exe")
        candidates.append(TOOLS_DIR / "adb" / "adb.exe")
    elif sys.platform == "darwin":
        candidates.append(TOOLS_DIR / "macos" / "adb" / "adb")
        candidates.append(TOOLS_DIR / "adb" / "adb")
    else:
        candidates.append(TOOLS_DIR / "linux_x64" / "adb" / "adb")
        candidates.append(TOOLS_DIR / "adb" / "adb")

    for cand in candidates:
        if cand.is_file():
            if _test_adb_binary(cand):
                return str(cand)
            if sys.platform != "win32":
                # exFAT/FAT32 or noexec mount cannot run ELF/Mach-O directly; stage to temp.
                staged = _stage_executable_to_temp(cand, "adb")
                if _test_adb_binary(staged):
                    return str(staged)

    sys_adb = shutil.which("adb")
    if sys_adb:
        return sys_adb

    raise FileNotFoundError(
        "未找到可用的 ADB 工具。\n"
        "请确保已完整解压整个安装包目录后再运行，不要在压缩包预览窗口中直接双击。"
    )


def run_adb(
    adb: str,
    args: list[str],
    serial: str | None = None,
    check: bool = True,
    timeout: int | None = None,
) -> subprocess.CompletedProcess:
    cmd = [adb]
    if serial:
        cmd.extend(["-s", serial])
    cmd.extend(args)
    return subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=check,
        timeout=timeout,
    )


def device_shell(adb: str, serial: str, command: str, timeout: int = 180) -> str:
    wrapped = f'{command}; code=$?; printf "\\n__HL_EXIT__%s\\n" "$code"'
    res = run_adb(adb, ["shell", wrapped], serial=serial, check=False, timeout=timeout)
    output = res.stdout or ""
    if 'login with "adb shell auth"' in output:
        cmd_auth = [adb] + (["-s", serial] if serial else []) + ["shell", "auth"]
        subprocess.run(
            cmd_auth,
            input="ydpen2026\n",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=15,
            check=False,
        )
        res = run_adb(adb, ["shell", wrapped], serial=serial, check=False, timeout=timeout)
        output = res.stdout or ""
    match = re.search(r"__HL_EXIT__(\d+)\s*$", output)
    if not match or int(match[1]) != 0:
        code = int(match[1]) if match else res.returncode
        err_msg = output[: match.start()].strip() if match else output.strip()
        if not err_msg:
            err_msg = (res.stderr or "").strip()
        raise RuntimeError(f"设备指令执行失败 [code {code}]: {err_msg}")
    return output[: match.start()].strip()


def wait_for_device(adb: str, preferred_serial: str | None = None) -> str:
    while True:
        try:
            run_adb(adb, ["start-server"], check=False, timeout=15)
            res = run_adb(adb, ["devices"], check=True, timeout=15)
            lines = [line.strip() for line in res.stdout.splitlines() if line.strip()]
            ready: list[str] = []
            unauthorized: list[str] = []
            offline: list[str] = []
            for line in lines[1:]:
                parts = line.split()
                if len(parts) < 2:
                    continue
                dev_id, state = parts[0], parts[1]
                if state == "device":
                    ready.append(dev_id)
                elif state == "unauthorized":
                    unauthorized.append(dev_id)
                elif state == "offline":
                    offline.append(dev_id)

            if preferred_serial:
                if preferred_serial in ready:
                    log(f"已连接目标词典笔设备: {preferred_serial}")
                    return preferred_serial
            elif ready:
                if len(ready) == 1:
                    log(f"成功识别词典笔设备: {ready[0]}")
                    return ready[0]
                print("\n检测到多台设备：")
                for idx, dev_id in enumerate(ready, start=1):
                    print(f"  {idx}. {dev_id}")
                choice = input("请输入要安装的设备编号 (直接回车默认选第 1 台): ").strip()
                if choice.isdigit() and 1 <= int(choice) <= len(ready):
                    selected = ready[int(choice) - 1]
                else:
                    selected = ready[0]
                log(f"已选择词典笔设备: {selected}")
                return selected

            if unauthorized:
                print(f"\n[!] 设备 {', '.join(unauthorized)} 等待授权：请在词典笔屏幕上点击【允许 USB 调试】。")
            elif offline:
                print(f"\n[!] 设备 {', '.join(offline)} 处于离线状态，请重新插拔数据线。")
        except Exception as exc:
            print(f"\n[!] 检测设备时出现提示: {exc}")

        print("\n[!] 尚未检测到可用的词典笔设备。")
        print("    请确认：")
        print("    1. 用 Type-C 数据线将词典笔直连电脑 USB 口（尽量避免松动扩展坞）；")
        print("    2. 点亮词典笔屏幕，确认已开启 USB 调试；")
        print("    3. Windows 若首次接入识别不到，请检查系统更新/通用 Android ADB 驱动。")
        try:
            input("\n>>> 准备好后请按【回车键】重新检测 (按 Ctrl+C 取消)... ")
        except KeyboardInterrupt:
            print("\n用户已取消安装。")
            sys.exit(0)


def verify_local_payload() -> None:
    manifest_path = PAYLOAD_DIR / "manifest.json"
    required = [
        PAYLOAD_DIR / "engine.tar",
        PAYLOAD_DIR / "valve.tar",
        PAYLOAD_DIR / "half-life-1.0.0.amr",
    ]
    for item in required:
        if not item.is_file():
            raise FileNotFoundError(f"安装包缺少必要文件: {item}")

    if not manifest_path.is_file():
        return

    log("[1/5] 正在校验本地安装包文件完整性...")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for rel_path, expected_sha in manifest.get("files", {}).items():
        target = PAYLOAD_DIR / rel_path
        if not target.is_file():
            raise FileNotFoundError(f"安装包缺少校验文件: {target}")
        h = hashlib.sha256()
        with open(target, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                h.update(chunk)
        actual_sha = h.hexdigest()
        if actual_sha != expected_sha:
            raise RuntimeError(
                f"文件校验失败 ({rel_path})，安装包可能损坏或下载不完整。\n"
                f"  期望: {expected_sha}\n  实际: {actual_sha}"
            )
    log("    [√] 本地安装包校验通过。")


def precheck_environment(adb: str, serial: str) -> None:
    log("[2/5] 正在检查词典笔系统与可用空间...")
    arch = device_shell(adb, serial, "uname -m")
    log(f"    设备架构: {arch}")
    if "aarch64" not in arch and "arm64" not in arch:
        log(f"    [警告] 检测到架构为 {arch}，非 standard aarch64，继续安装可能无法启动。")

    pids = device_shell(adb, serial, "pidof xash3d || true")
    if pids.strip():
        log(f"    检测到游戏正在运行 (PID: {pids.strip()})，先安全退出进程...")
        device_shell(adb, serial, "killall -9 xash3d || true")
        time.sleep(1)

    df_out = device_shell(adb, serial, "df -k /userdisk | tail -n 1")
    parts = df_out.split()
    if len(parts) >= 4 and parts[3].isdigit():
        avail_mb = int(parts[3]) / 1024.0
        log(f"    /userdisk 剩余空间: {avail_mb:.1f} MB")
        if avail_mb < 500:
            log("    [警告] 剩余空间不足 500 MB，安装可能因空间不足失败。")


def backup_existing_saves(adb: str, serial: str) -> None:
    log("[3/5] 正在检查并备份词典笔现有存档与配置...")
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    target_backup = BACKUP_DIR / f"backup_{stamp}"
    pulled_count = 0

    save_list = device_shell(
        adb,
        serial,
        f"if test -d {REMOTE_SAVE_DIR}; then ls -1 {REMOTE_SAVE_DIR} 2>/dev/null || true; fi",
    )
    save_files = [
        line.strip()
        for line in save_list.splitlines()
        if line.strip() and not line.strip().startswith("._")
    ]
    if save_files:
        save_dst = target_backup / "save"
        save_dst.mkdir(parents=True, exist_ok=True)
        for name in save_files:
            res = run_adb(
                adb,
                ["pull", f"{REMOTE_SAVE_DIR}/{name}", str(save_dst / name)],
                serial=serial,
                check=False,
            )
            if res.returncode == 0:
                pulled_count += 1

    for cfg_name in ("config.cfg", "opengl.cfg", "video.cfg"):
        exists = device_shell(
            adb,
            serial,
            f"if test -f {REMOTE_VALVE_DIR}/{cfg_name}; then printf yes; fi",
        )
        if exists == "yes":
            target_backup.mkdir(parents=True, exist_ok=True)
            run_adb(
                adb,
                ["pull", f"{REMOTE_VALVE_DIR}/{cfg_name}", str(target_backup / cfg_name)],
                serial=serial,
                check=False,
            )

    if pulled_count > 0:
        log(f"    [√] 已备份 {pulled_count} 个存档文件到本地目录: {target_backup}")
    else:
        log("    未发现已有存档（如保留目录已有 config.cfg 也会自动保留）。")


def deploy_assets(adb: str, serial: str) -> None:
    log("[4/5] 正在部署核心引擎、触控模块与全量战役素材...")
    device_shell(adb, serial, f"mkdir -p {REMOTE_GAME_DIR} {REMOTE_VALVE_DIR} {REMOTE_SAVE_DIR}")

    # 1. 部署 engine.tar
    engine_tar = PAYLOAD_DIR / "engine.tar"
    remote_engine_tar = f"{REMOTE_GAME_DIR}/engine.tar"
    log("    --> 推送核心引擎与居中/中文菜单模块 (engine.tar)...")
    t0 = time.time()
    run_adb(adb, ["push", str(engine_tar), remote_engine_tar], serial=serial, check=True)
    device_shell(
        adb,
        serial,
        (
            f"cd {REMOTE_GAME_DIR} && tar -xf engine.tar && rm -f engine.tar && "
            f"chmod 755 xash3d && "
            f"if test -e /usr/lib/libmali.so; then "
            f"ln -sf /usr/lib/libmali.so libEGL.so.1 && "
            f"ln -sf /usr/lib/libmali.so libwayland-egl.so.1; fi && "
            f"ln -sf libSDL2-2.0.so.0.3200.10 libSDL2-2.0.so.0 && "
            f"ln -sf libSDL2-2.0.so.0 libSDL2-2.0.so && "
            f"ln -sf libSDL2-2.0.so libSDL2.so"
        ),
        timeout=120,
    )
    log(f"    [√] 引擎部署完成 ({time.time() - t0:.1f}s)")

    # 2. 部署 valve.tar
    valve_tar = PAYLOAD_DIR / "valve.tar"
    tar_mb = valve_tar.stat().st_size / (1024.0 * 1024.0)
    remote_valve_tar = f"{REMOTE_GAME_DIR}/valve.tar"
    log(f"    --> 推送战役资源与中文配音包 (valve.tar, {tar_mb:.1f} MB)...")
    t1 = time.time()
    run_adb(adb, ["push", str(valve_tar), remote_valve_tar], serial=serial, check=True)
    push_sec = max(0.5, time.time() - t1)
    log(f"    --> 传输完成 ({push_sec:.1f}s, {tar_mb / push_sec:.1f} MB/s)，正在设备端解压...")
    t2 = time.time()
    device_shell(
        adb,
        serial,
        f"cd {REMOTE_VALVE_DIR} && tar -xf ../valve.tar && rm -f ../valve.tar && rm -f userconfig.d/._*",
        timeout=300,
    )
    log(f"    [√] 战役资源解压完成 ({time.time() - t2:.1f}s)")

    # 3. 初次安装时补充默认 config.cfg（已存在则不覆盖用户按键配置）
    default_cfg = PAYLOAD_DIR / "defaults" / "config.cfg"
    if default_cfg.is_file():
        has_cfg = device_shell(
            adb,
            serial,
            f"if test -f {REMOTE_VALVE_DIR}/config.cfg; then printf yes; fi",
        )
        if has_cfg != "yes":
            run_adb(
                adb,
                ["push", str(default_cfg), f"{REMOTE_VALVE_DIR}/config.cfg"],
                serial=serial,
                check=True,
            )

    # 4. 校验关键文件存在
    checks = [
        f"{REMOTE_GAME_DIR}/xash3d",
        f"{REMOTE_GAME_DIR}/libxash.so",
        f"{REMOTE_GAME_DIR}/libref_gles2.so",
        f"{REMOTE_GAME_DIR}/filesystem_stdio.so",
        f"{REMOTE_GAME_DIR}/libSDL2-2.0.so.0.3200.10",
        f"{REMOTE_GAME_DIR}/libmenu.so",
        f"{REMOTE_GAME_DIR}/libwl_center.so",
        f"{REMOTE_VALVE_DIR}/dlls/hl.so",
        f"{REMOTE_VALVE_DIR}/dlls/hl_arm64.so",
        f"{REMOTE_VALVE_DIR}/cl_dlls/client.so",
        f"{REMOTE_VALVE_DIR}/cl_dlls/client_arm64.so",
        f"{REMOTE_VALVE_DIR}/resource/mainui_schinese.txt",
        f"{REMOTE_VALVE_DIR}/titles.txt",
        f"{REMOTE_VALVE_DIR}/autoexec.cfg",
        f"{REMOTE_VALVE_DIR}/userconfig.cfg",
        f"{REMOTE_VALVE_DIR}/userconfig.d/00-pen-render.cfg",
        f"{REMOTE_VALVE_DIR}/touch.cfg",
    ]
    missing: list[str] = []
    for path in checks:
        ok = device_shell(adb, serial, f"if test -f {path}; then printf yes; else printf no; fi")
        if ok != "yes":
            missing.append(path)
    if missing:
        raise RuntimeError(f"设备端校验缺失以下关键文件: {missing}")
    log("    [√] 所有核心二进制、修复库与防黑屏配置文件校验通过。")


def install_miniapp(adb: str, serial: str) -> None:
    log("[5/5] 正在安装词典笔桌面应用 (AMR)...")
    amr_file = PAYLOAD_DIR / "half-life-1.0.0.amr"
    remote_amr = f"{REMOTE_GAME_DIR}/half-life-1.0.0.amr"
    run_adb(adb, ["push", str(amr_file), remote_amr], serial=serial, check=True)

    device_shell(adb, serial, f"miniapp_cli uninstall {APPID} || true")
    device_shell(adb, serial, f"rm -rf /userdisk/miniapp/data/mini_app/pkg/{APPID}")
    output = device_shell(adb, serial, f"miniapp_cli install '{remote_amr}'")
    log(f"    安装回执: {output}")

    receipts = []
    for match in re.finditer(r"\{[^{}]*\}", output):
        try:
            receipts.append(json.loads(match[0]))
        except json.JSONDecodeError:
            pass
    if not any(str(r.get("appid")) == APPID and r.get("ret") == 0 for r in receipts):
        raise RuntimeError(f"miniapp_cli 未返回成功回执: {output}")

    device_shell(
        adb,
        serial,
        f"if test -d {REMOTE_SKIP_RE}; then cp -p '{remote_amr}' {REMOTE_SKIP_RE}/ && printf %s {APPID} > {REMOTE_SKIP_RE}/half-life-1.0.0.appid; fi",
    )
    log("    [√] 桌面应用安装与防清理登记完成。")


def main() -> None:
    parser = argparse.ArgumentParser(description="《半条命 1》有道词典笔通用一键安装器")
    parser.add_argument("--check-only", action="store_true", help="仅检查电脑环境与词典笔连接状态")
    parser.add_argument("--serial", default=os.environ.get("YDPEN_SERIAL"), help="指定设备序列号")
    args = parser.parse_args()

    banner()
    adb = get_adb_path()
    log(f"Python 环境: {sys.executable} ({sys.version.split()[0]})")
    log(f"ADB 工具: {adb}")

    serial = wait_for_device(adb, preferred_serial=args.serial)
    precheck_environment(adb, serial)

    if args.check_only:
        print("\n" + "=" * 68)
        print("  [√] 环境与词典笔连接检测正常，可以运行正式安装。")
        print("=" * 68 + "\n")
        return

    verify_local_payload()
    backup_existing_saves(adb, serial)
    deploy_assets(adb, serial)
    install_miniapp(adb, serial)

    print("\n" + "=" * 68)
    print("    安装全部完成！可以拔掉数据线，在词典笔桌面点击【半条命】图标游玩。")
    print("=" * 68 + "\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        log(f"\n[错误] 安装失败: {exc}")
        traceback.print_exc()
        sys.exit(1)
