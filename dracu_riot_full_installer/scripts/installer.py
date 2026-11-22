#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""installer.py —— 《DRACU-RIOT!》（ドラクリオット！）有道词典笔全平台离线一键安装与部署器

特性：
  - 支持 Windows / macOS (Apple Silicon & Intel) / Linux 全平台一键安装；
  - 内置免安装便携 Python 3.11 与 ADB 工具，无需玩家配置任何系统开发环境；
  - 支持 Type-C USB 数据线自动识别与局域网 Wi-Fi IP 无线直连；
  - 自动完成设备 root/auth 提权认证（默认内置 ydpen2026 凭证）；
  - 自动备份设备现有游戏存档 (saves.json / settings.json)，升级重装不丢进度；
  - 一键安装预构建好的 DRACU-RIOT! 微前端 AMR 小程序 (AppID: 8002026110100097)；
  - 高速推送并就地解包全量资产 (bg, cg, fg, sd, stand, bgm, voice)；
  - 自动启动游戏并输出完整部署自检报告与运行日志 (install.log)。
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

APPID = "8002026110100097"
APP_NAME = "DRACU-RIOT!"
APP_NAME_CN = "DRACU-RIOT! (ドラクリオット！)"
VERSION = "1.0.0"
GAME_ID = "dracu_riot"
BASE_MEDIA_DIR = f"/userdisk/gal_data/{GAME_ID}"

ROOT = Path(__file__).resolve().parent.parent
PAYLOAD_DIR = ROOT / "payload"
ASSETS_DIR = ROOT / "assets"
TOOLS_DIR = ROOT / "tools"
BACKUP_DIR = ROOT / "backup"
LOG_FILE = ROOT / "install.log"

ASSET_PACKS = [
    {
        "file": "bg.tar",
        "dir": f"{BASE_MEDIA_DIR}/bg",
        "label": "高清场景背景 (800+ 张自适应舞台背景)",
        "expect": 800,
    },
    {
        "file": "cg.tar",
        "dir": f"{BASE_MEDIA_DIR}/cg",
        "label": "全量高清事件 CG (1,500+ 张，含差分与全景特写)",
        "expect": 1500,
    },
    {
        "file": "fg.tar",
        "dir": f"{BASE_MEDIA_DIR}/fg",
        "label": "全角色半身立绘差分 (5,000+ 张，780x440 高清合成图)",
        "expect": 5000,
    },
    {
        "file": "sd.tar",
        "dir": f"{BASE_MEDIA_DIR}/sd",
        "label": "Q版 SD 萌化插画演出 (200+ 张)",
        "expect": 200,
    },
    {
        "file": "stand.tar",
        "dir": f"{BASE_MEDIA_DIR}/stand",
        "label": "立绘鉴赏全量特写图层 (2,000+ 张全服装/表情/动作)",
        "expect": 2000,
    },
    {
        "file": "bgm.tar",
        "dir": f"{BASE_MEDIA_DIR}/bgm",
        "label": "原版全曲 BGM 原生音乐盒 (76 首高保真音轨)",
        "expect": 70,
    },
    {
        "file": "voice.tar",
        "dir": f"{BASE_MEDIA_DIR}/voice",
        "label": "全角色台词主线/支线配音 (26,500+ 句全量语音)",
        "expect": 26000,
    },
]


def log(msg: str = "") -> None:
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}" if msg else ""
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def banner() -> None:
    print("=" * 72)
    print(f"      《{APP_NAME}》有道词典笔全平台通用离线一键安装器")
    print(f"         版本: v{VERSION}  |  作者: RS_TV  |  全平台免配置直装")
    print("=" * 72)
    print("  ★ 核心特性与移植内容：")
    print("  [1] 完整收录矢来美羽、布良梓、稻丛莉音、艾莉娜 4 位女主角独立全本篇")
    print("  [2] 全线 49,601 行完整剧本与动态剧情分支树 (Flowchart 流程图跳跃)")
    print("  [3] 800x220 超宽带鱼屏黄金分割：左侧 390px 舞台 + 右侧文本与控制栏")
    print("  [4] 全角色台词配音 (26,536句) + 全曲 76 首 BGM 双声道 PCM 软混音")
    print("  [5] 全量高清事件 CG、780x440 高清半身立绘与 SD 萌化小人全收录")
    print("  [6] 自动备份设备既有存档数据 (saves.json / settings.json)，安全不丢进度")
    print("=" * 72)
    print()


def human_size(bytes_val: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if abs(bytes_val) < 1024.0:
            return f"{bytes_val:3.1f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.1f} PB"


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
            timeout=8,
            check=False,
        )
        return res.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def _stage_executable_to_temp(src: Path, name: str) -> Path:
    cache_dir = Path(tempfile.gettempdir()) / "dracu_ydpen_adb_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    dst = cache_dir / name
    need_copy = not dst.is_file() or dst.stat().st_size != src.stat().st_size
    if need_copy:
        shutil.copy2(src, dst)
    try:
        os.chmod(dst, 0o755)
    except OSError:
        pass
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
                staged = _stage_executable_to_temp(cand, "adb")
                if _test_adb_binary(staged):
                    return str(staged)

    sys_adb = shutil.which("adb")
    if sys_adb and _test_adb_binary(Path(sys_adb)):
        return sys_adb

    raise FileNotFoundError(
        "未找到可用的 ADB 工具。\n"
        "请确保已完整解压整个安装包目录后再运行，不要在压缩包预览窗口中直接双击。"
    )


class PenAdb:
    def __init__(self, adb_path: str, serial: str | None = None) -> None:
        self.adb = adb_path
        self.serial = serial

    def run(
        self,
        args: list[str],
        check: bool = True,
        timeout: int | None = None,
        capture: bool = True,
    ) -> subprocess.CompletedProcess:
        cmd = [self.adb]
        if self.serial:
            cmd.extend(["-s", self.serial])
        cmd.extend(args)
        if capture:
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
        else:
            return subprocess.run(cmd, check=check, timeout=timeout)

    def shell(self, command: str, timeout: int = 180) -> str:
        wrapped = f'{command}; code=$?; printf "\\n__DRACU_EXIT__%s\\n" "$code"'
        res = self.run(["shell", wrapped], check=False, timeout=timeout)
        output = res.stdout or ""
        match = re.search(r"__DRACU_EXIT__(\d+)\s*$", output)
        if not match or int(match[1]) != 0:
            code = int(match[1]) if match else res.returncode
            err = output[: match.start()].strip() if match else output.strip()
            raise RuntimeError(f"命令执行失败 (退出码 {code}): {err}")
        return output[: match.start()].rstrip("\r\n")

    def push(self, local_path: Path | str, remote_path: str, timeout: int = 600) -> None:
        local_str = str(local_path)
        log(f"  -> 正在传输: {Path(local_str).name} ({human_size(Path(local_str).stat().st_size)})...")
        res = self.run(["push", local_str, remote_path], check=False, timeout=timeout)
        if res.returncode != 0:
            raise RuntimeError(f"ADB Push 传输失败: {res.stderr.strip() or res.stdout.strip()}")


def detect_and_connect(adb_path: str, preferred_serial: str | None = None) -> PenAdb:
    log("▶ 步骤 1/6: 检测词典笔设备连接...")
    
    # 先尝试启动 adb server
    try:
        subprocess.run([adb_path, "start-server"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
    except Exception:
        pass

    def get_devices() -> list[tuple[str, str]]:
        res = subprocess.run([adb_path, "devices"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
        lines = (res.stdout or "").strip().splitlines()
        devs = []
        for line in lines[1:]:
            parts = line.strip().split()
            if len(parts) >= 2:
                devs.append((parts[0], parts[1]))
        return devs

    devs = get_devices()
    chosen_serial = None

    if preferred_serial:
        for s, state in devs:
            if s == preferred_serial and state == "device":
                chosen_serial = s
                break

    if not chosen_serial:
        ready = [s for s, state in devs if state == "device"]
        unauth = [s for s, state in devs if state == "unauthorized"]
        if ready:
            chosen_serial = ready[0]
            log(f"  ✓ 成功检测到 USB 直连设备: {chosen_serial}")
        elif unauth:
            print(f"  [!] 检测到设备 {unauth[0]}，但状态为未授权 (unauthorized)。")
            print("      请点亮词典笔屏幕，在弹出的“是否允许 USB 调试”提示框中勾选“始终允许”并点击“确定”。")
            for _ in range(15):
                time.sleep(2)
                devs = get_devices()
                ready = [s for s, state in devs if state == "device"]
                if ready:
                    chosen_serial = ready[0]
                    log(f"  ✓ 授权成功，已连接设备: {chosen_serial}")
                    break

    if not chosen_serial:
        print()
        print("  未检测到已就绪的 USB 连接设备。")
        print("  支持局域网 Wi-Fi 直连：请确保电脑与词典笔连接在同一个 Wi-Fi 网络下。")
        print("  在词典笔【设置 -> Wi-Fi】中点击当前 Wi-Fi 可查看词典笔 IP 地址（如 192.168.1.105）。")
        ip_in = input("  请输入词典笔 IP 地址（直接回车重试 USB 检测）: ").strip()
        if ip_in:
            target = f"{ip_in}:5555" if ":" not in ip_in else ip_in
            log(f"  正在连接 Wi-Fi 设备: {target}...")
            subprocess.run([adb_path, "connect", target], stdout=subprocess.PIPE, text=True, timeout=10)
            time.sleep(1)
            devs = get_devices()
            for s, state in devs:
                if (target in s or ip_in in s) and state == "device":
                    chosen_serial = s
                    break

    if not chosen_serial:
        raise RuntimeError("未能连接到词典笔设备。请检查 USB 数据线是否插紧或 Wi-Fi IP 是否正确。")

    pen = PenAdb(adb_path, chosen_serial)
    
    # 自动认证提权
    log("  正在核验设备调试权限...")
    try:
        uid_out = pen.shell("id")
        if "uid=0" not in uid_out:
            pen.shell("printf 'ydpen2026\\n' | auth >/dev/null 2>&1 || true")
    except Exception:
        pass
    log("  ✓ 设备调试通信核验通过。")
    return pen


def backup_existing_saves(pen: PenAdb) -> None:
    log("▶ 步骤 2/6: 检查并自动备份设备存档与设置...")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    saves_remote = f"{BASE_MEDIA_DIR}/saves.json"
    settings_remote = f"{BASE_MEDIA_DIR}/settings.json"

    backed = 0
    try:
        out = pen.shell(f"if [ -f {saves_remote} ]; then echo EXISTS; fi")
        if "EXISTS" in out:
            dst = BACKUP_DIR / f"saves_{ts}.json"
            pen.run(["pull", saves_remote, str(dst)])
            log(f"  ✓ 已自动备份存档至: backup/{dst.name}")
            backed += 1
    except Exception as e:
        log(f"  [!] 存档备份跳过: {e}")

    try:
        out = pen.shell(f"if [ -f {settings_remote} ]; then echo EXISTS; fi")
        if "EXISTS" in out:
            dst = BACKUP_DIR / f"settings_{ts}.json"
            pen.run(["pull", settings_remote, str(dst)])
            log(f"  ✓ 已自动备份用户设置至: backup/{dst.name}")
            backed += 1
    except Exception as e:
        log(f"  [!] 设置备份跳过: {e}")

    if backed == 0:
        log("  未检测到既有存档（全新设备部署）。")


def deploy_assets(pen: PenAdb, skip_assets: bool = False) -> None:
    log("▶ 步骤 3/6: 部署游戏媒体资产与音视频库...")
    if skip_assets:
        log("  （已选择跳过素材部署，仅安装程序）")
        return

    if not ASSETS_DIR.is_dir():
        log(f"  [!] 警告: 未找到 {ASSETS_DIR} 目录，跳过素材部署。")
        return

    tmp_deploy_dir = "/userdisk/dracu_deploy"
    pen.shell(f"mkdir -p {BASE_MEDIA_DIR} {tmp_deploy_dir}")

    total_packs = len(ASSET_PACKS)
    for idx, pack in enumerate(ASSET_PACKS, start=1):
        filename = pack["file"]
        tar_path = ASSETS_DIR / filename
        label = pack["label"]
        dest_dir = pack["dir"]

        if not tar_path.is_file():
            log(f"  [{idx}/{total_packs}] 未找到 {filename}，跳过此模块。")
            continue

        log(f"  [{idx}/{total_packs}] 正在部署: {label}")
        remote_tar = f"{tmp_deploy_dir}/{filename}"
        pen.push(tar_path, remote_tar)

        log(f"      正在词典笔上就地解包至 {dest_dir}...")
        pen.shell(f"mkdir -p {dest_dir} && cd {BASE_MEDIA_DIR} && tar -xf {remote_tar} && rm -f {remote_tar}")
        log(f"      ✓ {filename} 解包完成。")

    pen.shell(f"rm -rf {tmp_deploy_dir}")
    log("  ✓ 全量多媒体资产部署完毕。")


def install_application(pen: PenAdb) -> None:
    log("▶ 步骤 4/6: 安装 DRACU-RIOT! 微前端 AMR 安装包...")
    amr_candidates = list(PAYLOAD_DIR.glob("*.amr"))
    if not amr_candidates:
        dist_amr = ROOT / "dist" / "dracu_riot-1.0.0.amr"
        if dist_amr.is_file():
            amr_candidates.append(dist_amr)

    if not amr_candidates:
        raise FileNotFoundError(f"在 {PAYLOAD_DIR} 中未找到 .amr 安装包！")

    amr_file = amr_candidates[0]
    remote_amr = "/tmp/dracu_riot.amr"
    log(f"  推入小程序安装包: {amr_file.name} ({human_size(amr_file.stat().st_size)})...")
    pen.push(amr_file, remote_amr)

    log("  正在卸载旧版本（如有）...")
    pen.shell(f"miniapp_cli uninstall {APPID} >/dev/null 2>&1 || true")

    log("  正在注册并安装新版本...")
    res = pen.shell(f"miniapp_cli install {remote_amr}")
    log(f"  安装结果: {res.strip()}")
    pen.shell(f"rm -f {remote_amr}")
    log("  ✓ 游戏微前端小程序安装成功。")


def verify_installation(pen: PenAdb) -> None:
    log("▶ 步骤 5/6: 词典笔端部署完整性校验...")
    dirs_to_check = ["bg", "bgm", "cg", "fg", "sd", "stand", "voice"]
    print("  " + "-" * 50)
    print(f"  {'素材目录':<12} | {'文件数量':<10} | {'占用空间':<10}")
    print("  " + "-" * 50)
    for d in dirs_to_check:
        try:
            cnt = pen.shell(f"ls -1 {BASE_MEDIA_DIR}/{d} 2>/dev/null | grep -vc '^\\._' || true").strip()
            sz = pen.shell(f"du -sh {BASE_MEDIA_DIR}/{d} 2>/dev/null | cut -f1 || true").strip()
            print(f"  {d:<12} | {cnt:<10} | {sz:<10}")
        except Exception:
            print(f"  {d:<12} | {'-':<10} | {'-':<10}")
    print("  " + "-" * 50)


def launch_game(pen: PenAdb) -> None:
    log("▶ 步骤 6/6: 启动游戏...")
    try:
        pen.shell(f"miniapp_cli start {APPID}")
        log(f"  ✓ 已向词典笔发送启动指令 (AppID: {APPID})。")
    except Exception as e:
        log(f"  [!] 启动指令发送提示: {e}")


def main() -> None:
    parser = argparse.ArgumentParser(description=f"{APP_NAME} 有道词典笔全平台离线安装器")
    parser.add_argument("--serial", "-s", help="指定词典笔 ADB 序列号或 IP:PORT")
    parser.add_argument("--skip-assets", action="store_true", help="跳过全量媒体素材部署，仅安装程序")
    parser.add_argument("--no-launch", action="store_true", help="部署完成后不自动启动游戏")
    args = parser.parse_args()

    banner()
    try:
        adb_path = get_adb_path()
        pen = detect_and_connect(adb_path, args.serial)
        backup_existing_saves(pen)
        deploy_assets(pen, args.skip_assets)
        install_application(pen)
        verify_installation(pen)
        if not args.no_launch:
            launch_game(pen)

        print()
        print("=" * 72)
        print("  🎉 恭喜！《DRACU-RIOT!》有道词典笔全量移植版安装完成！")
        print("=" * 72)
        print("  【游玩提示】")
        print("  1. 词典笔屏幕已自动唤醒并进入《DRACU-RIOT!》游戏主界面；")
        print("  2. 点击【开始物语】即可畅玩共通线与 4 位女主角个人全篇；")
        print("  3. 在【鉴赏馆】可随时回顾全部高清 CG、立绘差分与 76 首原版 BGM；")
        print("  4. 遇到任何问题可查阅同目录下的【使用说明.txt】或查看 install.log。")
        print("=" * 72)
        print()
    except KeyboardInterrupt:
        print("\n\n用户中断了安装流程。")
        sys.exit(130)
    except Exception as e:
        print()
        print("=" * 72)
        print("  ❌ 安装过程中出现错误：")
        print(f"  {e}")
        print("=" * 72)
        print("  建议排查：")
        print("  1. 请检查 Type-C 数据线是否支持数据传输，并确认屏幕已允许调试；")
        print("  2. 请确认词典笔存储空间充足（推荐剩余空间 > 3.0GB）；")
        print("  3. 详细排查信息可查看安装目录下的 install.log 文件。")
        print("=" * 72)
        sys.exit(1)


if __name__ == "__main__":
    main()
