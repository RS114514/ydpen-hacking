#!/usr/bin/env python3
import datetime
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import zipfile

from pack_assets import CONFIG_DIR, CONFIG_FILES

HERE = Path(__file__).resolve().parents[1]
VERSION = '1.0.0'
APPID = '8002026110400001'
AMR_PATH = HERE / 'dist' / f'half-life-{VERSION}.amr'
ADB = '/opt/homebrew/bin/adb'
TARGET_DEVICE = os.environ.get('YDPEN_SERIAL', '9DA2200007506350')


def device_shell(command):
    # This device's legacy ADB transport does not propagate remote exit codes.
    wrapped = command + '; code=$?; printf "\\n__HL_EXIT__%s\\n" "$code"'
    output = subprocess.check_output([ADB, '-s', TARGET_DEVICE, 'shell', wrapped], text=True)
    match = re.search(r'__HL_EXIT__(\d+)\s*$', output)
    if not match or int(match[1]):
        raise RuntimeError(output.strip())
    return output[:match.start()].strip()


def deploy_configs():
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup = '/userdisk/halflife/valve/config-backup-' + stamp
    device_shell(f'mkdir {backup}')
    for name in CONFIG_FILES:
        remote = '/userdisk/halflife/valve/' + name
        device_shell(f'if test -f {remote}; then cp -p {remote} {backup}/; fi')
        if name == 'config.cfg':
            existing = device_shell(f'if test -f {remote}; then printf exists; fi')
            if existing:
                continue
        subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(Path(CONFIG_DIR) / name), remote], check=True)
    ucd_dir = Path(CONFIG_DIR) / 'userconfig.d'
    if ucd_dir.is_dir():
        device_shell('mkdir -p /userdisk/halflife/valve/userconfig.d')
        for cfg_file in ucd_dir.glob('*.cfg'):
            if not cfg_file.name.startswith('._'):
                subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(cfg_file), f'/userdisk/halflife/valve/userconfig.d/{cfg_file.name}'], check=True)
    for remote in ('/userdisk/halflife/valve/my_default', '/userdisk/halflife/valve/maps/c0a0_load.cfg'):
        device_shell(f'if test -f {remote}; then mv {remote} {backup}/; fi')
    print('配置备份: ' + backup)


def main():
    if not AMR_PATH.is_file():
        raise FileNotFoundError(AMR_PATH)
    with zipfile.ZipFile(AMR_PATH) as archive:
        namelist = set(archive.namelist())
        for arch in ('arm64', 'arm64-orange'):
            jsapi_path = f'libs/{arch}/libjsapi_hl.so'
            if jsapi_path not in namelist:
                raise RuntimeError(f'包内缺少必要原生库 {jsapi_path}，拒绝安装')
            if not archive.read(jsapi_path).startswith(b'\x7fELF'):
                raise RuntimeError(f'包内原生库 {jsapi_path} 无有效 ELF 头，拒绝安装')
            wl_path = f'libs/{arch}/libwl_center.so'
            if wl_path in namelist:
                raise RuntimeError(f'AMR 包内检测到违规包含 {wl_path}，违反动态库隔离规约，拒绝安装')
        actual_libs = {name for name in namelist if name.startswith('libs/') and not name.endswith('/')}
        expected_libs = {'libs/arm64/libjsapi_hl.so', 'libs/arm64-orange/libjsapi_hl.so'}
        if actual_libs != expected_libs:
            raise RuntimeError(f'AMR 包内 libs 目录内容异常：期望 {expected_libs}，实际包含 {actual_libs}')
    state = subprocess.check_output([ADB, '-s', TARGET_DEVICE, 'get-state'], text=True).strip()
    if state != 'device':
        raise RuntimeError('词典笔未连接')
    pids = device_shell('pidof xash3d || true')
    if pids:
        raise RuntimeError('游戏仍在运行，请先保存退出；安装器不会强杀游戏')
    deploy_configs()
    # 部署修复 NPC 姿态的服务器游戏库 hl.so 与客户端库 client.so
    hl_so_local = HERE / 'dist_assets' / 'valve' / 'dlls' / 'hl.so'
    if hl_so_local.is_file():
        device_shell('mkdir -p /userdisk/halflife/valve/dlls')
        subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(hl_so_local), '/userdisk/halflife/valve/dlls/hl.so'], check=True)
        subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(hl_so_local), '/userdisk/halflife/valve/dlls/hl_arm64.so'], check=True)
        print('[+] 部署服务器游戏库 hl.so 完成')

    client_so_local = HERE / 'dist_assets' / 'valve' / 'cl_dlls' / 'client.so'
    if client_so_local.is_file():
        device_shell('mkdir -p /userdisk/halflife/valve/cl_dlls')
        subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(client_so_local), '/userdisk/halflife/valve/cl_dlls/client.so'], check=True)
        subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(client_so_local), '/userdisk/halflife/valve/cl_dlls/client_arm64.so'], check=True)
        print('[+] 部署修复 NPC 直立姿态的客户端库 client.so 完成')

    # 部署高精度触控贴图（包括十字键 dpad.png）
    touch_gfx_dir = HERE / 'assets' / 'valve' / 'gfx' / 'touch'
    if touch_gfx_dir.is_dir():
        device_shell('mkdir -p /userdisk/halflife/valve/gfx/touch')
        for png_file in touch_gfx_dir.glob('*.png'):
            subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(png_file), f'/userdisk/halflife/valve/gfx/touch/{png_file.name}'], check=True)
        print('[+] 部署触控贴图资源完成')

    wl_center_local = HERE / 'libs' / 'libwl_center.so'
    if not wl_center_local.is_file():
        raise FileNotFoundError(f'本地未找到运行库 {wl_center_local}，请先执行 build_amr.py 进行编译')
    subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(wl_center_local), '/userdisk/halflife/libwl_center.so'], check=True)
    remote = f'/userdisk/halflife/half-life-{VERSION}.amr'
    subprocess.run([ADB, '-s', TARGET_DEVICE, 'push', str(AMR_PATH), remote], check=True)
    device_shell(f'miniapp_cli uninstall {APPID}')
    device_shell(f'rm -rf /userdisk/miniapp/data/mini_app/pkg/{APPID}')
    output = device_shell(f'miniapp_cli install {shlex.quote(remote)}')
    print(output)
    receipts = []
    for match in re.finditer(r'\{[^{}]*\}', output):
        try:
            receipts.append(json.loads(match[0]))
        except json.JSONDecodeError:
            pass
    if not any(str(receipt.get('appid')) == APPID and receipt.get('ret') == 0 for receipt in receipts):
        raise RuntimeError('设备未返回安装成功回执，不能视为已安装')
    keeper = '/userdisk/skip_re/amr'
    device_shell(f'if test -d {keeper}; then cp {remote} {keeper}/ && printf %s {APPID} > {keeper}/half-life-{VERSION}.appid; fi')
    print('安装指令已执行，存档未清理。')


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
