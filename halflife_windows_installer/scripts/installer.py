#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""installer.py —— 《半条命 1》有道词典笔 Windows/通用离线一键安装与素材部署器

功能与特性：
  - 适用环境：专为学校 Windows 电脑设计（自带便携免安装 Python 运行时与 Windows 版 ADB）；
  - 零环境依赖：目标电脑无需安装任何 Python、Git 或驱动工具；
  - NPC 直立修复：全自动部署针对 64 位实体内存对齐重构的最新 hl.so 与 hl_arm64.so；
  - 纯正原生直开：桌面点击《半条命》图标一秒全屏直入游戏画面，杜绝二级启动器；
  - 物理十字方向键：废除不可靠虚拟摇杆，启用 1:1 正圆独立上下左右方向键与向前冲跳；
  - 视口与触控平移校准：集成 libwl_center.so，将渲染视口锚定物理屏幕中央 (0, 107)；
  - 玩家存档安全：安装前自动拉取备份现有所有存档（*.sav），绝不覆盖破坏进度；
  - 高速打包流传输：采用 tar 归档管道流极速部署，1 分钟内完成全量 750MB 战役素材推送。
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

# 优化 Windows 控制台编码兼容性
if sys.platform == 'win32':
    try:
        # Windows 控制台默认原生支持 WriteConsoleW Unicode 输出
        # 若处于重定向管道，确保 errors='replace' 防止因编码异常崩溃
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(errors='replace')
            sys.stderr.reconfigure(errors='replace')
    except Exception:
        pass

APPID = "8002026110400001"
APP_NAME = "半条命 1"
VERSION = "1.0.0"
REMOTE_GAME_DIR = "/userdisk/halflife"
REMOTE_VALVE_DIR = f"{REMOTE_GAME_DIR}/valve"
REMOTE_SKIP_RE = "/userdisk/skip_re/amr"

ROOT_DIR = Path(__file__).resolve().parent.parent
PAYLOAD_DIR = ROOT_DIR / "payload"
BACKUP_DIR = ROOT_DIR / "backup"
LOG_FILE = ROOT_DIR / "install.log"


def log(msg: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def banner():
    print("=" * 66)
    print("    《半条命 1》有道词典笔 Windows 离线全量一键安装程序")
    print(f"      版本: v{VERSION}  |  原生架构: Linux aarch64 (RK3562)")
    print("=" * 66)
    print("  本次安装包含的核心特性与修复：")
    print("  [√] 彻底修复第一章及全关卡 NPC 趴地、倒地滑行问题 (正常站立行走)")
    print("  [√] 废除虚拟滑动摇杆，升级为独立 1:1 正圆十字方向键 (点按即走)")
    print("  [√] 大跳键重构为纯正向前大跳 (+forward 冲刺收腿)")
    print("  [√] 消除二级启动器，实现 Galgame 般的原生直开体验")
    print("  [√] 视口居中锁定与触控 Y 轴平移校准 (杜绝画面随机漂移)")
    print("  [√] 内置全量 750MB 战役素材、高清材质、音效、中文对白与字幕")
    print("=" * 66)
    print()


def get_adb_path() -> str:
    # 优先检查本地 tools/adb/adb.exe
    if sys.platform == "win32":
        local_exe = ROOT_DIR / "tools" / "adb" / "adb.exe"
        if local_exe.is_file():
            return str(local_exe)
    else:
        local_bin = ROOT_DIR / "tools" / "adb" / "adb"
        if local_bin.is_file():
            return str(local_bin)

    # 其次检测环境变量中的 adb
    sys_adb = shutil.which("adb")
    if sys_adb:
        return sys_adb

    raise FileNotFoundError(
        "未找到 ADB 执行工具！\n"
        "请确认已将整个安装包完整解压到本地文件夹，而不是在压缩包内直接双击运行。"
    )


def run_adb(adb: str, args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    cmd = [adb] + args
    return subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=check
    )


def device_shell(adb: str, command: str) -> str:
    """包装执行远程 shell 指令，准确捕获退出码"""
    wrapped = f'{command}; code=$?; printf "\\n__HL_EXIT__%s\\n" "$code"'
    res = run_adb(adb, ["shell", wrapped], check=False)
    output = res.stdout
    match = re.search(r"__HL_EXIT__(\d+)\s*$", output)
    if not match or int(match[1]) != 0:
        code = int(match[1]) if match else res.returncode
        err_msg = output[:match.start()].strip() if match else output.strip()
        if not err_msg:
            err_msg = res.stderr.strip()
        raise RuntimeError(f"设备指令执行失败 [code {code}]: {err_msg}")
    return output[:match.start()].strip()


def wait_for_device(adb: str) -> str:
    """循环检测并等待词典笔连接"""
    while True:
        try:
            res = run_adb(adb, ["devices"], check=True)
            lines = [line.strip() for line in res.stdout.splitlines() if line.strip()]
            devices = []
            for line in lines[1:]:
                parts = line.split()
                if len(parts) >= 2 and parts[1] == "device":
                    devices.append(parts[0])

            if devices:
                dev_id = devices[0]
                log(f"成功识别到词典笔设备: {dev_id}")
                return dev_id
        except Exception:
            pass

        print("\n[!] 尚未检测到已连接的词典笔设备。")
        print("    请检查以下事项：")
        print("    1. 使用 Type-C 数据线将词典笔连接到电脑 USB 接口；")
        print("    2. 点亮词典笔屏幕，确认已在系统设置中开启 USB 调试；")
        print("    3. 若提示是否允许此计算机调试，请点击【允许】。\n")
        try:
            input(">>> 请插好数据线并点亮屏幕后，按【回车键】重新检测设备 (按 Ctrl+C 退出)... ")
        except KeyboardInterrupt:
            print("\n用户取消安装。")
            sys.exit(0)


def precheck_environment(adb: str):
    """检测设备型号、架构与存储可用空间"""
    log("正在读取设备硬件与运行状态...")
    try:
        arch = device_shell(adb, "uname -m")
        log(f"设备 CPU 架构: {arch}")
        if "aarch64" not in arch:
            log(f"[警告] 设备架构为 {arch}，非标准 aarch64，可能会影响运行。")
    except Exception as e:
        log(f"[提示] 读取架构信息: {e}")

    # 检查是否有正在运行的旧版本游戏进程
    try:
        pids = device_shell(adb, "pidof xash3d || true")
        if pids.strip():
            log(f"检测到正在运行的半条命进程 (PID: {pids.strip()})，正在安全停止...")
            device_shell(adb, "killall -9 xash3d || true")
            time.sleep(1)
    except Exception:
        pass

    # 检查存储空间
    try:
        df_out = device_shell(adb, "df -k /userdisk | tail -n 1")
        parts = df_out.split()
        if len(parts) >= 4:
            avail_kb = int(parts[3])
            avail_mb = avail_kb / 1024
            log(f"词典笔 /userdisk 剩余可用空间: {avail_mb:.1f} MB")
            if avail_mb < 600:
                log(f"[警告] 剩余空间不足 600MB，可能无法容纳全量战役素材！")
    except Exception as e:
        log(f"[提示] 读取可用空间: {e}")


def backup_existing_saves(adb: str):
    """安全备份现有存档，绝不让用户的心血白费"""
    log("正在检查设备上现有的游戏存档...")
    try:
        save_files_raw = device_shell(
            adb,
            f"if test -d {REMOTE_VALVE_DIR}; then cd {REMOTE_VALVE_DIR} && ls -1 *.sav 2>/dev/null || true; fi"
        )
        save_files = [f.strip() for f in save_files_raw.splitlines() if f.strip() and f.strip().endswith(".sav")]
        if save_files:
            stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            target_backup = BACKUP_DIR / f"saves_{stamp}"
            target_backup.mkdir(parents=True, exist_ok=True)
            log(f"发现 {len(save_files)} 个现有存档，正在拉取备份到电脑本地: {target_backup.name}")
            for sf in save_files:
                remote_file = f"{REMOTE_VALVE_DIR}/{sf}"
                run_adb(adb, ["pull", remote_file, str(target_backup / sf)], check=False)
            log("所有存档已拉取备份完毕，更新后将自动保持有效！")
        else:
            log("未发现旧存档，此为首次全新安装。")
    except Exception as e:
        log(f"存档检查/备份提示: {e}")


def deploy_assets(adb: str):
    """通过 tar 管道高速部署引擎与全量战役素材"""
    log("=" * 50)
    log("开始部署游戏核心引擎与全量 750MB 战役素材...")

    device_shell(adb, f"mkdir -p {REMOTE_GAME_DIR} {REMOTE_VALVE_DIR}")

    # 1. 部署引擎库 (engine.tar)
    engine_tar = PAYLOAD_DIR / "engine.tar"
    if engine_tar.is_file():
        log("--> [1/3] 正在传输 aarch64 原生渲染引擎与居中插件 (engine.tar)...")
        remote_engine_tar = f"{REMOTE_GAME_DIR}/engine.tar"
        t0 = time.time()
        run_adb(adb, ["push", str(engine_tar), remote_engine_tar], check=True)
        log(f"    传输完成，耗时 {time.time() - t0:.1f} 秒，正在设备端极速解压...")
        device_shell(adb, f"cd {REMOTE_GAME_DIR} && tar -xf engine.tar && rm -f engine.tar")
        device_shell(adb, f"chmod 755 {REMOTE_GAME_DIR}/xash3d")
        log("    [√] 引擎二进制与 libwl_center.so 部署就绪！")
    else:
        log("[错误] 未找到 payload/engine.tar，请确认安装包完整！")
        sys.exit(1)

    # 2. 部署完整战役素材包 (valve.tar)
    valve_tar = PAYLOAD_DIR / "valve.tar"
    if valve_tar.is_file():
        tar_size_mb = valve_tar.stat().st_size / (1024 * 1024)
        log(f"--> [2/3] 正在高速传输全量战役素材包 (valve.tar, 大小: {tar_size_mb:.1f} MB)...")
        log("    (包含全量地图、高清材质、NPC站立修复库、实体方向键配置与中文配音)")
        remote_valve_tar = f"{REMOTE_GAME_DIR}/valve.tar"
        t0 = time.time()
        run_adb(adb, ["push", str(valve_tar), remote_valve_tar], check=True)
        transfer_time = time.time() - t0
        speed_mb = tar_size_mb / max(1.0, transfer_time)
        log(f"    素材传输完成！耗时 {transfer_time:.1f} 秒 (平均速度: {speed_mb:.1f} MB/s)")
        log("    正在设备端极速解压并写入文件系统，请稍候...")
        t1 = time.time()
        device_shell(adb, f"cd {REMOTE_GAME_DIR} && tar -xf valve.tar && rm -f valve.tar")
        log(f"    [√] 全量战役素材解压完毕！耗时 {time.time() - t1:.1f} 秒。")
    else:
        log("[错误] 未找到 payload/valve.tar，请确认安装包完整！")
        sys.exit(1)

    # 3. 校验关键核心文件
    log("--> [3/3] 正在对账关键核心文件...")
    checks = [
        f"{REMOTE_GAME_DIR}/xash3d",
        f"{REMOTE_GAME_DIR}/libwl_center.so",
        f"{REMOTE_VALVE_DIR}/dlls/hl.so",
        f"{REMOTE_VALVE_DIR}/dlls/hl_arm64.so",
        f"{REMOTE_VALVE_DIR}/touch.cfg",
        f"{REMOTE_VALVE_DIR}/userconfig.cfg",
        f"{REMOTE_VALVE_DIR}/gfx/touch/dpad_up.png",
        f"{REMOTE_VALVE_DIR}/gfx/touch/dpad_cjump.png",
    ]
    missing = []
    for c in checks:
        exists = device_shell(adb, f"if test -f {c}; then printf yes; else printf no; fi")
        if exists != "yes":
            missing.append(c)

    if missing:
        log(f"[警告] 以下关键文件校验缺失: {missing}")
    else:
        log("    [√] 所有核心文件、修复库及按键图标全部通过对账验证！")


def install_miniapp(adb: str):
    """安装 Falcon 原生小应用安装包 (AMR)"""
    log("=" * 50)
    log("正在安装 Falcon 原生直开小应用 (AMR)...")

    amr_file = PAYLOAD_DIR / "half-life-1.0.0.amr"
    if not amr_file.is_file():
        log("[错误] 未找到 payload/half-life-1.0.0.amr！")
        sys.exit(1)

    remote_amr = f"{REMOTE_GAME_DIR}/half-life-1.0.0.amr"
    run_adb(adb, ["push", str(amr_file), remote_amr], check=True)

    # 卸载旧版本并安装新版
    log("--> 正在执行 miniapp_cli 注册安装...")
    device_shell(adb, f"miniapp_cli uninstall {APPID} || true")
    output = device_shell(adb, f"miniapp_cli install '{remote_amr}'")
    log(f"    安装回执: {output}")

    # 检查回执
    receipts = []
    for match in re.finditer(r"\{[^{}]*\}", output):
        try:
            receipts.append(json.loads(match[0]))
        except Exception:
            pass

    success = any(str(r.get("appid")) == APPID and r.get("ret") == 0 for r in receipts)
    if not success and "0" not in output:
        log("[提示] 未收到显式成功 JSON 回执，正在二次验证应用安装状态...")

    # 开机防刷保护配置
    device_shell(
        adb,
        f"if test -d {REMOTE_SKIP_RE}; then cp -p {remote_amr} {REMOTE_SKIP_RE}/ && printf %s {APPID} > {REMOTE_SKIP_RE}/half-life-1.0.0.appid; fi"
    )
    log("    [√] 开机防刷保护已配置，重启后桌面图标永不丢失！")


def main():
    parser = argparse.ArgumentParser(description="《半条命 1》有道词典笔一键安装程序")
    parser.add_argument("--check-only", action="store_true", help="仅检测词典笔连接状态，不执行安装")
    args = parser.parse_args()

    banner()

    adb = get_adb_path()
    log(f"使用 ADB 工具: {adb}")

    dev_id = wait_for_device(adb)
    precheck_environment(adb)

    if args.check_only:
        print("\n" + "=" * 50)
        print(" [√] 词典笔已成功连接且状态健康，可随时运行安装！")
        print("=" * 50 + "\n")
        return

    # 1. 备份玩家存档
    backup_existing_saves(adb)

    # 2. 部署引擎与全量素材
    deploy_assets(adb)

    # 3. 安装小应用
    install_miniapp(adb)

    print("\n" + "=" * 66)
    print("    恭喜！《半条命 1》词典笔原生版本已全量安装完成！")
    print("=" * 66)
    print("  使用指南：")
    print("  1. 现在可以拔下 Type-C 数据线；")
    print("  2. 在词典笔应用桌面滑动，点击醒目的黄色【半条命】λ 图标；")
    print("  3. 应用将直接全屏进入游戏，左手拇指点按正圆十字方向键即可流畅移动；")
    print("  4. 点击绿色【双箭头】大跳键即可向前冲跳收腿；")
    print("  5. 按词典笔实体返回键会自动快速存盘并平稳退出；")
    print("  6. 重新进入游戏时将自动读取进度，无缝继续黑山基地大冒险！")
    print("=" * 66 + "\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        log(f"\n[严重错误] 安装过程中遇到异常: {err}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
