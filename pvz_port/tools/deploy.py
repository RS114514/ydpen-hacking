#!/usr/bin/env python3
"""Deploy PvZ binary + original assets + converted cache64 + runtime libs to the pen.

Only targets 9DA2200007506350. Does not install the AMR (launcher/tools/install_amr.py does).
"""
import argparse
import subprocess
import sys
from pathlib import Path

SERIAL = '9DA2200007506350'
ADB = '/opt/homebrew/bin/adb'
ROOT = Path(__file__).resolve().parents[1]
DEPS = Path('/Volumes/500GB/qoder_cache/pvz_deps/install')
BUILD = Path('/Volumes/500GB/qoder_cache/pvz_deps/build')
CONV = Path('/Volumes/500GB/qoder_cache/pvz_assets_conv')
DEPLOY_TREE = CONV / 'deploy'


def adb(*args):
    return subprocess.run([ADB, '-s', SERIAL] + list(args), check=True)


def push_dir(local: Path, remote: str):
    if not local.is_dir():
        raise FileNotFoundError(local)
    adb('push', str(local) + '/.', remote)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--binary', type=Path, default=BUILD / 'game/pvz-portable')
    ap.add_argument('--assets', type=Path, default=DEPLOY_TREE / 'assets', help='dir with main.pak+properties')
    ap.add_argument('--cache64', type=Path, default=DEPLOY_TREE / 'savedir/cache64')
    ap.add_argument('--libs', type=Path, default=DEPS / 'lib')
    args = ap.parse_args()

    devices = subprocess.check_output([ADB, 'devices'], text=True)
    if f'{SERIAL}\tdevice' not in devices:
        raise RuntimeError(f'target pen {SERIAL} not connected')

    adb('shell', 'mkdir -p /userdisk/pvz/assets /userdisk/pvz/save /userdisk/pvz/libs')
    if not args.binary.is_file():
        raise FileNotFoundError(args.binary)
    adb('push', str(args.binary), '/userdisk/pvz/pvz-portable')
    adb('push', str(ROOT / 'device/run.sh'), '/userdisk/pvz/run.sh')
    adb('shell', 'chmod 755 /userdisk/pvz/pvz-portable /userdisk/pvz/run.sh')

    # assets: main.pak + properties (original low-res)
    adb('push', str(args.assets / 'main.pak'), '/userdisk/pvz/assets/main.pak')
    push_dir(args.assets / 'properties', '/userdisk/pvz/assets/properties')

    # converted native caches under savedir
    push_dir(args.cache64, '/userdisk/pvz/save/cache64')

    # runtime shared libs (SDL3 etc.) if not static
    if args.libs.is_dir():
        for so in args.libs.glob('*.so*'):
            if so.is_file():
                adb('push', str(so), '/userdisk/pvz/libs/' + so.name)
    print('deployed to /userdisk/pvz on', SERIAL)


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
