#!/usr/bin/env python3
"""Install the PvZ launcher AMR onto the single authorized pen (9DA2200007506350)."""
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys
import zipfile

HERE = Path(__file__).resolve().parents[1]
VERSION = '1.0.0'
APPID = '8002026111200001'
SERIAL = '9DA2200007506350'
AMR_PATH = HERE / 'dist' / f'pvz-{VERSION}.amr'
ADB = '/opt/homebrew/bin/adb'


def adb(*args):
    return [ADB, '-s', SERIAL] + list(args)


def device_shell(command):
    wrapped = command + '; code=$?; printf "\\n__PVZ_EXIT__%s\\n" "$code"'
    output = subprocess.check_output(adb('shell', wrapped), text=True)
    match = re.search(r'__PVZ_EXIT__(\d+)\s*$', output)
    if not match or int(match[1]):
        raise RuntimeError(output.strip())
    return output[:match.start()].strip()


def main():
    if not AMR_PATH.is_file():
        raise FileNotFoundError(AMR_PATH)
    with zipfile.ZipFile(AMR_PATH) as archive:
        for arch in ('arm64', 'arm64-orange'):
            if not archive.read(f'libs/{arch}/libjsapi_pvz.so').startswith(b'\x7fELF'):
                raise RuntimeError('包内原生库 libjsapi_pvz.so 无有效 ELF 头，拒绝安装')
    devices = subprocess.check_output([ADB, 'devices'], text=True)
    if f'{SERIAL}\tdevice' not in devices:
        raise RuntimeError(f'目标词典笔 {SERIAL} 未连接')
    pids = device_shell('pidof pvz-portable || true')
    if pids:
        raise RuntimeError('游戏仍在运行，请先退出；安装器不会强杀游戏')
    device_shell('mkdir -p /userdisk/pvz')
    remote = f'/userdisk/pvz/pvz-{VERSION}.amr'
    subprocess.run(adb('push', str(AMR_PATH), remote), check=True)
    device_shell(f'miniapp_cli uninstall {APPID} || true')
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
    device_shell(f'if test -d {keeper}; then cp {remote} {keeper}/ && printf %s {APPID} > {keeper}/pvz-{VERSION}.appid; fi')
    print('PvZ 启动器安装完成（游戏数据需另行部署到 /userdisk/pvz）。')


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
