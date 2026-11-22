#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""《DOOM》(doomgeneric) 有道词典笔 6 代 全平台通用离线一键安装器。

Windows / macOS / Linux 均可一键安装：
  - 内置三端便携 Python 与 ADB，玩家电脑无需预装任何开发环境；
  - 全程有限等待（设备检测、ADB 推送、miniapp 安装均有超时），不会卡死；
  - 升级安装自动备份设备存档与设置，不覆盖玩家进度。
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

def _init_console() -> None:
    """Windows 下由 Python 自己把控制台切到 UTF-8。

    刻意不在 .bat 里写 `chcp 65001`：Windows 7 的 cmd 在批处理中切换代码页会
    破坏文件读取位置，导致脚本执行到一半就退出（黑框一闪而过）。让 Python 来设，
    既避开这个坑，也让 .bat 保持纯 ASCII —— 中文只出现在 .py 里（UTF-8 源码），
    彻底断掉 UTF-8/GBK 互转导致乱码或跑不起来的问题。
    """
    if sys.platform != "win32":
        return
    try:
        import ctypes

        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleOutputCP(65001)
        kernel32.SetConsoleCP(65001)
    except Exception:
        pass


_init_console()

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

APPID = "8002026110100001"
VERSION = "1.0.0"
REMOTE_DIR = "/userdisk/doom"
REMOTE_SAVE_DIR = f"{REMOTE_DIR}/.savegame"
REMOTE_LIB_DIR = f"{REMOTE_DIR}/lib"
REMOTE_SKIP_RE = "/userdisk/skip_re/amr"
AMR_NAME = "Doom-1.0.0.amr"

# 固件补丁后的 adbd 登录口令（原厂是随机哈希，未打补丁的机器用不了）
ADB_AUTH_PASSWORD = "ydpen2026"

ROOT_DIR = Path(__file__).resolve().parent.parent
PAYLOAD_DIR = ROOT_DIR / "payload"
TOOLS_DIR = ROOT_DIR / "tools"
BACKUP_DIR = ROOT_DIR / "backup"
LOG_FILE = ROOT_DIR / "install.log"

# 运行期开关（由 main 写入）
ASSUME_YES = False
WAIT_SECONDS = 150


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
    print("=" * 70)
    print("      《DOOM》 有道词典笔 6 代 全平台通用离线一键安装器")
    print(f"        版本: v{VERSION}   |   电脑: Windows / macOS / Linux")
    print("=" * 70)
    print("  本包内置：DOOM 原生引擎 + 完整第一章素材 + 触控按键层 + 桌面图标")
    print("  修复要点：960x266 居中视口、暂停菜单触控十字键、存档自动续关、")
    print("            系统清理白名单登记（图标不会被自动清掉）")
    print("  安全设计：全过程有限等待，无需联网，不改动系统，只写入词典笔")
    print(f"            {REMOTE_DIR} 与桌面小程序")
    print("=" * 70)
    print()


# --------------------------------------------------------------------------
# ADB 工具定位
# --------------------------------------------------------------------------
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
            timeout=15,
            check=False,
        )
        return res.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def _stage_executable_to_temp(src: Path, name: str) -> Path:
    cache_dir = Path(tempfile.gettempdir()) / "doom_ydpen_adb_cache"
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
                # exFAT / noexec 挂载无法直接执行，复制到临时目录再运行
                staged = _stage_executable_to_temp(cand, "adb")
                if _test_adb_binary(staged):
                    return str(staged)

    sys_adb = shutil.which("adb")
    if sys_adb:
        log(f"    未使用内置 ADB，回退到系统 ADB: {sys_adb}")
        return sys_adb

    raise FileNotFoundError(
        "未找到可用的 ADB 工具。\n"
        "请确认已把压缩包【完整解压】到电脑本地文件夹后再运行，\n"
        "不要在压缩软件预览窗口里直接双击脚本。"
    )


# --------------------------------------------------------------------------
# ADB 调用（全部带超时，绝不无限等待）
# --------------------------------------------------------------------------
def run_adb(
    adb: str,
    args: list[str],
    serial: str | None = None,
    check: bool = True,
    timeout: int = 90,
) -> subprocess.CompletedProcess:
    cmd = [adb]
    if serial:
        cmd.extend(["-s", serial])
    cmd.extend(args)
    try:
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
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"ADB 指令超时（>{timeout}s）：{' '.join(args[:3])}\n"
            "请重新插拔数据线，或换一根支持数据传输的 Type-C 线后重试。"
        )


def device_shell(adb: str, serial: str, command: str, timeout: int = 120) -> str:
    wrapped = f'{command}; code=$?; printf "\\n__DOOM_EXIT__%s\\n" "$code"'
    res = run_adb(adb, ["shell", wrapped], serial=serial, check=False, timeout=timeout)
    output = res.stdout or ""

    # 该机型的 adbd 由 /usr/bin/adbd_auth.sh 把关：未认证时任何命令只回
    # `login with "adb shell auth" to continue.`，必须先用补丁后的口令登录一次。
    if "login with" in output:
        _adb_auth(adb, serial)
        res = run_adb(adb, ["shell", wrapped], serial=serial, check=False, timeout=timeout)
        output = res.stdout or ""
        if "login with" in output:
            raise RuntimeError(
                "词典笔未通过 ADB 认证 —— 这台设备很可能还没有打固件补丁。\n"
                "本安装包只能装在已解锁（adb shell auth 可用）的词典笔上。\n"
                "解锁方法见《安装方法教程.html》第 01 节。"
            )

    match = re.search(r"__DOOM_EXIT__(\d+)\s*$", output)
    if not match or int(match[1]) != 0:
        code = int(match[1]) if match else res.returncode
        err_msg = output[: match.start()].strip() if match else output.strip()
        if not err_msg:
            err_msg = (res.stderr or "").strip()
        raise RuntimeError(f"设备指令执行失败 [code {code}]: {err_msg}")
    return output[: match.start()].strip()


def _adb_auth(adb: str, serial: str) -> None:
    """用补丁后的口令过一次 adbd 认证。

    认证标记 /tmp/.adb_auth_verified 只在本次 adbd 会话内有效，重启即失效，
    所以每次运行都可能需要重新登录一次；这一步只登录，不改口令、不改固件。
    """
    log("    需要 ADB 认证，正在用已知口令登录...")
    cmd = [adb] + (["-s", serial] if serial else []) + ["shell", "auth"]
    try:
        res = subprocess.run(
            cmd,
            input=ADB_AUTH_PASSWORD + "\n",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=20,
            check=False,
        )
        out = ((res.stdout or "") + (res.stderr or "")).strip()
        if "success" in out.lower():
            log("    [√] ADB 认证成功（uid=0）。")
        else:
            log(f"    认证返回: {out[:160] or '无输出'}")
    except Exception as exc:
        log(f"    认证过程异常: {exc}")


def wait_for_device(adb: str, preferred_serial: str | None = None, wait_seconds: int = 150) -> str:
    """有限等待（默认 150 秒），超时即给出明确提示退出，不会卡住终端。"""
    deadline = time.time() + max(10, wait_seconds)
    last_hint = 0.0
    attempt = 0

    while True:
        attempt += 1
        try:
            run_adb(adb, ["start-server"], check=False, timeout=25)
            res = run_adb(adb, ["devices"], check=False, timeout=25)
            lines = [line.strip() for line in (res.stdout or "").splitlines() if line.strip()]
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
                    print()
                    log(f"    已连接目标词典笔: {preferred_serial}")
                    return preferred_serial
            elif ready:
                if len(ready) == 1 or ASSUME_YES:
                    print()
                    log(f"    已识别词典笔设备: {ready[0]}")
                    return ready[0]
                print("\n检测到多台 ADB 设备：")
                for idx, dev_id in enumerate(ready, start=1):
                    print(f"  {idx}. {dev_id}")
                choice = input(f"请选择设备编号 (1-{len(ready)}，回车默认 1): ").strip()
                selected = ready[int(choice) - 1] if choice.isdigit() and 1 <= int(choice) <= len(ready) else ready[0]
                print()
                log(f"    已选择设备: {selected}")
                return selected

            now = time.time()
            if now - last_hint > 40:
                last_hint = now
                if unauthorized:
                    print(f"\n[!] 设备 {', '.join(unauthorized)} 状态异常：请在笔上重开 ADB 开关（设置 → 法律监管连点 10~15 下）后重新插线。")
                elif offline:
                    print(f"\n[!] 设备 {', '.join(offline)} 离线，请重新插拔数据线。")
                else:
                    print("\n[!] 暂未检测到词典笔，正在等待（无需按键）...")
                    print("    请确认：① Type-C 数据线直连电脑；② 笔上 ADB 开关已开（设置 → 法律监管连点 10~15 下）")
                    print("           ③ Windows 首次连接若识别不到，请装通用 ADB 驱动。")
        except Exception as exc:  # 单次探测失败不致命，继续在时限内重试
            print(f"\n[!] 检测设备时出现提示: {exc}")

        remain = deadline - time.time()
        if remain <= 0:
            raise RuntimeError(
                "等待设备超时，安装已安全退出（未对词典笔做任何修改）。\n"
                "请依次检查：1) 数据线是否支持传输；2) 词典笔是否已开 USB 调试并授权；\n"
                "3) Windows 设备管理器是否出现 ADB 设备；然后重新运行本安装器。\n"
                "如需更久等待，可加参数：--wait 300"
            )
        print(".", end="", flush=True)
        time.sleep(2)


# --------------------------------------------------------------------------
# 本地安装包校验
# --------------------------------------------------------------------------
PAYLOAD_FILES = [
    "doom_ydpen",
    "doom1.wad",
    "run.sh",
    "run_game.sh",
    "launch_from_icon.sh",
    AMR_NAME,
]


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def verify_local_payload() -> None:
    log("[1/6] 正在校验安装包文件完整性...")
    for rel in PAYLOAD_FILES:
        f = PAYLOAD_DIR / rel
        if not f.is_file():
            raise FileNotFoundError(f"安装包缺少必要文件: {f}")

    manifest_path = PAYLOAD_DIR / "manifest.json"
    if not manifest_path.is_file():
        log("    [√] 文件齐全（无校验清单，跳过哈希校验）。")
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for rel_path, expected in manifest.get("files", {}).items():
        target = PAYLOAD_DIR / rel_path
        if not target.is_file():
            raise FileNotFoundError(f"安装包缺少校验文件: {target}")
        actual = _sha256(target)
        if actual != expected:
            raise RuntimeError(
                f"文件校验失败（{rel_path}），安装包可能损坏或下载不完整。\n"
                f"  期望: {expected}\n  实际: {actual}\n"
                "请重新解压原始压缩包后再试。"
            )
    log("    [√] 安装包校验通过。")


# --------------------------------------------------------------------------
# 设备检查
# --------------------------------------------------------------------------
def precheck_device(adb: str, serial: str) -> None:
    log("[2/6] 正在检查词典笔系统状态...")
    arch = device_shell(adb, serial, "uname -m")
    log(f"    设备架构: {arch}")
    if "aarch64" not in arch and "arm64" not in arch:
        raise RuntimeError(f"当前设备架构为 {arch}，本安装包仅支持 64 位 ARM (aarch64) 词典笔。")

    pids = device_shell(adb, serial, "pidof doom_ydpen || true")
    if pids.strip():
        log(f"    检测到 DOOM 正在运行 (PID {pids.strip()})，先安全退出...")
        device_shell(adb, serial, "kill -9 $(pidof doom_ydpen) 2>/dev/null; true")

    df_out = device_shell(adb, serial, "df -k /userdisk | tail -n 1")
    parts = df_out.split()
    if len(parts) >= 4 and parts[3].isdigit():
        avail_mb = int(parts[3]) / 1024.0
        log(f"    /userdisk 剩余空间: {avail_mb:.1f} MB")
        if avail_mb < 80:
            raise RuntimeError(
                f"词典笔内部空间不足（仅剩 {avail_mb:.1f} MB，需要约 80 MB）。\n"
                "请先清理词典笔中的其他游戏或录音文件后重试。"
            )


def backup_saves(adb: str, serial: str) -> None:
    log("[3/6] 正在备份词典笔上的 DOOM 存档与设置...")
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    target = BACKUP_DIR / f"backup_{stamp}"
    pulled = 0

    listing = device_shell(
        adb,
        serial,
        f"if test -d {REMOTE_SAVE_DIR}; then ls -1 {REMOTE_SAVE_DIR} 2>/dev/null || true; fi",
    )
    names = [n.strip() for n in listing.splitlines() if n.strip() and not n.strip().startswith("._")]
    if names:
        (target / "savegame").mkdir(parents=True, exist_ok=True)
        for name in names:
            res = run_adb(
                adb,
                ["pull", f"{REMOTE_SAVE_DIR}/{name}", str(target / "savegame" / name)],
                serial=serial,
                check=False,
                timeout=120,
            )
            if res.returncode == 0:
                pulled += 1

    has_cfg = device_shell(adb, serial, f"if test -f {REMOTE_DIR}/doomrc; then printf yes; fi")
    if has_cfg == "yes":
        target.mkdir(parents=True, exist_ok=True)
        run_adb(adb, ["pull", f"{REMOTE_DIR}/doomrc", str(target / "doomrc")], serial=serial, check=False, timeout=120)

    if pulled:
        log(f"    [√] 已备份 {pulled} 个存档到: {target}")
    else:
        log("    未发现已有存档（首次安装可忽略）。")


# --------------------------------------------------------------------------
# 部署
# --------------------------------------------------------------------------
def _push(adb: str, serial: str, local: Path, remote: str, label: str | None = None) -> None:
    size_mb = local.stat().st_size / (1024.0 * 1024.0)
    name = label or local.name
    log(f"    --> 推送 {name} ({size_mb:.1f} MB)...")
    t0 = time.time()
    timeout = int(90 + size_mb * 3)
    run_adb(adb, ["push", str(local), remote], serial=serial, check=True, timeout=timeout)
    cost = max(0.1, time.time() - t0)
    log(f"    [√] {name} 完成 ({cost:.1f}s, {size_mb / cost:.1f} MB/s)")


def _device_has_lib(adb: str, serial: str, soname: str) -> bool:
    # 注意：设备侧脚本里绝不能用 exit，否则会跳过回执标记导致误判失败
    probe = (
        "found=no; "
        "for d in /usr/lib /lib /usr/lib64 /lib64 /usr/lib/aarch64-linux-gnu "
        "/system/lib64 /usr/lib/arm-linux-gnueabihf; do "
        f"if test -e \"$d/{soname}\"; then found=yes; break; fi; done; "
        "if [ \"$found\" = no ] && command -v ldconfig >/dev/null 2>&1; then "
        f"if ldconfig -p 2>/dev/null | grep -q {soname}; then found=yes; fi; fi; "
        "printf %s \"$found\""
    )
    out = device_shell(adb, serial, probe)
    return "yes" in out


def deploy_game(adb: str, serial: str) -> None:
    log("[4/6] 正在部署 DOOM 引擎、素材与触控脚本...")
    device_shell(adb, serial, f"mkdir -p {REMOTE_DIR} {REMOTE_SAVE_DIR}")

    _push(adb, serial, PAYLOAD_DIR / "doom_ydpen", f"{REMOTE_DIR}/doom_ydpen")
    _push(adb, serial, PAYLOAD_DIR / "doom1.wad", f"{REMOTE_DIR}/doom1.wad")
    for script in ("run.sh", "run_game.sh", "launch_from_icon.sh"):
        _push(adb, serial, PAYLOAD_DIR / script, f"{REMOTE_DIR}/{script}")

    # 若固件缺少 wayland / alsa 运行库，则用包内自带库兜底（不改系统，只放游戏目录）
    missing_libs = [so for so in ("libwayland-client.so.0", "libasound.so.2") if not _device_has_lib(adb, serial, so)]
    if missing_libs:
        log(f"    固件缺少运行库 {', '.join(missing_libs)}，启用包内自带版本兜底...")
        device_shell(adb, serial, f"mkdir -p {REMOTE_LIB_DIR}")
        for lib in sorted((PAYLOAD_DIR / "lib").glob("*.so*")):
            if lib.is_symlink() or lib.name.startswith("._"):
                continue
            _push(adb, serial, lib, f"{REMOTE_LIB_DIR}/{lib.name}")
        device_shell(
            adb,
            serial,
            f"cd {REMOTE_LIB_DIR} && ln -sf libwayland-client.so.0.21.0 libwayland-client.so.0 && "
            f"ln -sf libasound.so.2.0.0 libasound.so.2 && "
            f"printf 'export LD_LIBRARY_PATH=%s:$LD_LIBRARY_PATH\\n' {REMOTE_LIB_DIR} > env.sh",
        )
    else:
        log("    固件自带 wayland / alsa 运行库，无需额外部署。")

    device_shell(
        adb,
        serial,
        f"chmod 755 {REMOTE_DIR}/doom_ydpen {REMOTE_DIR}/run.sh "
        f"{REMOTE_DIR}/run_game.sh {REMOTE_DIR}/launch_from_icon.sh",
    )

    # 关键文件与大小核对
    checks = {
        "doom_ydpen": (PAYLOAD_DIR / "doom_ydpen").stat().st_size,
        "doom1.wad": (PAYLOAD_DIR / "doom1.wad").stat().st_size,
    }
    for name, expect in checks.items():
        # 用 wc -c 而不是 stat -c，兼容 toybox/busybox 精简固件
        out = device_shell(adb, serial, f"wc -c < {REMOTE_DIR}/{name} 2>/dev/null || echo 0")
        try:
            actual = int(out.strip().splitlines()[-1])
        except (ValueError, IndexError):
            actual = -1
        if actual != expect:
            raise RuntimeError(
                f"设备端文件大小不一致（{name}: 期望 {expect}，实际 {actual}），传输可能中断。\n"
                "请重新插拔后再次运行安装器（支持重复安装，不会损坏存档）。"
            )
    log("    [√] 引擎、素材、脚本部署完成，文件大小核对一致。")


def install_miniapp(adb: str, serial: str) -> None:
    log("[5/6] 正在安装桌面图标小程序 (AMR)...")
    amr_local = PAYLOAD_DIR / AMR_NAME
    remote_amr = f"{REMOTE_DIR}/{AMR_NAME}"
    _push(adb, serial, amr_local, remote_amr)

    device_shell(adb, serial, f"miniapp_cli uninstall {APPID} || true")
    device_shell(adb, serial, f"rm -rf /userdisk/miniapp/data/mini_app/pkg/{APPID} || true")
    output = device_shell(adb, serial, f"miniapp_cli install '{remote_amr}'", timeout=180)
    log(f"    安装回执: {output}")

    receipts = []
    for match in re.finditer(r"\{[^{}]*\}", output):
        try:
            receipts.append(json.loads(match[0]))
        except json.JSONDecodeError:
            pass
    if not any(str(r.get("appid")) == APPID and r.get("ret") == 0 for r in receipts):
        raise RuntimeError(f"miniapp_cli 未返回成功回执，图标可能未装上: {output}")

    # 登记到系统清理白名单，避免图标被自动清理
    device_shell(
        adb,
        serial,
        f"if test -d {REMOTE_SKIP_RE}; then cp -p '{remote_amr}' {REMOTE_SKIP_RE}/ && "
        f"printf %s {APPID} > {REMOTE_SKIP_RE}/Doom-1.0.0.appid; fi",
    )
    log("    [√] 桌面图标安装完成并已登记防清理白名单。")


def final_check(adb: str, serial: str) -> None:
    log("[6/6] 正在做最后自检...")
    checks = [
        f"{REMOTE_DIR}/doom_ydpen",
        f"{REMOTE_DIR}/doom1.wad",
        f"{REMOTE_DIR}/run.sh",
        f"{REMOTE_DIR}/run_game.sh",
        f"{REMOTE_DIR}/launch_from_icon.sh",
    ]
    missing = [
        p for p in checks if device_shell(adb, serial, f"if test -f {p}; then printf yes; fi") != "yes"
    ]
    if missing:
        raise RuntimeError(f"自检失败，设备端缺少: {missing}")
    log("    [√] 全部文件就位，安装成功。")


def main() -> None:
    global ASSUME_YES, WAIT_SECONDS

    parser = argparse.ArgumentParser(description="《DOOM》有道词典笔通用一键安装器")
    parser.add_argument("--check-only", action="store_true", help="只检查电脑环境与词典笔连接，不安装")
    parser.add_argument("--verify-payload", action="store_true", help="只校验本安装包文件完整性（可离线运行）")
    parser.add_argument("--yes", "-y", action="store_true", help="全自动模式：不询问、自动选第一台设备")
    parser.add_argument("--serial", default=os.environ.get("YDPEN_SERIAL"), help="指定设备序列号")
    parser.add_argument("--wait", type=int, default=150, help="等待设备接入的秒数（默认 150）")
    parser.add_argument("--no-backup", action="store_true", help="跳过存档备份（不建议）")
    args = parser.parse_args()

    ASSUME_YES = args.yes or not sys.stdin.isatty()
    WAIT_SECONDS = args.wait

    banner()

    if args.verify_payload:
        verify_local_payload()
        print("\n[√] 安装包完整，可用于安装。\n")
        return

    verify_local_payload()

    adb = get_adb_path()
    log(f"Python 环境: {sys.executable} ({sys.version.split()[0]})")
    log(f"ADB 工具: {adb}")

    serial = wait_for_device(adb, preferred_serial=args.serial, wait_seconds=WAIT_SECONDS)
    precheck_device(adb, serial)

    if args.check_only:
        print("\n" + "=" * 70)
        print("  [√] 环境与词典笔连接正常，可以进行正式安装。")
        print("=" * 70 + "\n")
        return

    if not args.no_backup:
        backup_saves(adb, serial)
    else:
        log("[3/6] 已跳过存档备份（--no-backup）。")

    deploy_game(adb, serial)
    install_miniapp(adb, serial)
    final_check(adb, serial)

    print("\n" + "=" * 70)
    print("    安装全部完成！可以拔掉数据线，在词典笔桌面点击【DOOM】图标开玩。")
    print(f"    安装日志已保存在: {LOG_FILE}")
    print("=" * 70 + "\n")


def run() -> None:
    """统一的入口包装：把异常收敛成一句人话，绝不甩一堆 traceback 给玩家。"""
    try:
        main()
    except KeyboardInterrupt:
        print("\n用户已中断安装，未对词典笔做后续修改。")
        sys.exit(130)
    except Exception as exc:
        log(f"\n[错误] 安装失败: {exc}")
        if os.environ.get("DOOM_DEBUG"):
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    run()
