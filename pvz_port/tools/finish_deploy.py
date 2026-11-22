#!/usr/bin/env python3
"""Wait for the cross-build to finish, then deploy + launch + capture evidence.

Only targets 9DA2200007506350. Writes a summary to pvz_verify/finish_summary.txt.
"""
import subprocess
import time
from pathlib import Path

SERIAL = '9DA2200007506350'
ADB = '/opt/homebrew/bin/adb'
ROOT = Path('/Volumes/500GB/Ydpen/pvz_port')
DEPS = Path('/Volumes/500GB/qoder_cache/pvz_deps')
BINARY = DEPS / 'build/game/pvz-portable'
LOG = DEPS / 'build_game9.log'
OUT = Path('/Volumes/500GB/qoder_cache/pvz_verify')
OUT.mkdir(parents=True, exist_ok=True)
SUMMARY = OUT / 'finish_summary.txt'
TAP_MT = Path('/Volumes/500GB/Ydpen/doom_port/build/tap_mt')


def note(msg):
    line = time.strftime('%H:%M:%S') + ' ' + msg
    print(line, flush=True)
    with SUMMARY.open('a') as f:
        f.write(line + '\n')


def adb(*args):
    return subprocess.run([ADB, '-s', SERIAL] + list(args), capture_output=True, text=True)


def sh(cmd):
    return adb('shell', cmd).stdout


def main():
    note('waiting for build to finish...')
    deadline = time.time() + 1800
    while time.time() < deadline:
        text = LOG.read_text(errors='replace') if LOG.exists() else ''
        if 'EXIT=' in text:
            break
        time.sleep(10)
    text = LOG.read_text(errors='replace') if LOG.exists() else ''
    if 'EXIT=0' not in text or not BINARY.is_file():
        note('BUILD NOT SUCCESSFUL; aborting deploy. tail: ' + ' | '.join(text.splitlines()[-3:]))
        return
    note('build OK, binary size=%d' % BINARY.stat().st_size)
    head = BINARY.open('rb').read(20)
    if head[:4] != b'\x7fELF' or head[18] != 183:
        note('binary is not AArch64 ELF; aborting')
        return
    sh('mkdir -p /userdisk/pvz/assets /userdisk/pvz/save /userdisk/pvz/libs')
    for local, remote in [
        (BINARY, '/userdisk/pvz/pvz-portable'),
        (ROOT / 'device/run.sh', '/userdisk/pvz/run.sh'),
        (TAP_MT, '/userdisk/pvz/tap_mt'),
    ]:
        if local.is_file():
            adb('push', str(local), remote)
    for so in (DEPS / 'install/lib').glob('*.so*'):
        if so.is_file():
            adb('push', str(so), '/userdisk/pvz/libs/' + so.name)
    sh('chmod 755 /userdisk/pvz/pvz-portable /userdisk/pvz/run.sh /userdisk/pvz/tap_mt')
    note('deployed binary+libs; assets/cache64 already on device')
    sh('for p in $(pidof pvz-portable); do kill $p; done')
    time.sleep(1)
    sh('cd /userdisk/pvz && /sbin/start-stop-daemon -S -b -x /userdisk/pvz/run.sh')
    note('launched; waiting 8s')
    time.sleep(8)
    pid = sh('pidof pvz-portable').strip()
    note('pid=' + (pid or 'NONE'))
    sh('cd /tmp; export XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0; timeout 15 weston-screenshooter >/dev/null 2>&1')
    path = sh('ls -t /tmp/wayland-screenshot-*.png 2>/dev/null | head -1').strip()
    if path:
        adb('pull', path, str(OUT / 'finish_raw.png'))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(OUT / 'finish_raw.png'),
                        '-vf', 'crop=266:960:107:0,transpose=1', str(OUT / 'finish_title.png')])
        note('screenshot saved: ' + str(OUT / 'finish_title.png'))
    glog = sh('cat /userdisk/pvz/game.log')
    (OUT / 'finish_game.log').write_text(glog)
    note('game.log lines=%d' % len(glog.splitlines()))
    if pid:
        note('status: ' + sh('grep -E "VmRSS|Threads" /proc/%s/status' % pid).strip())
    note('DONE. evidence in ' + str(OUT))


if __name__ == '__main__':
    main()