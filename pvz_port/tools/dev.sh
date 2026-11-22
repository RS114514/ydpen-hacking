#!/bin/sh
# Serial-locked device helper for iterative on-device testing.
# usage: dev.sh launch|stop|shot NAME|tap UX UY|log|status|push LOCAL REMOTE
set -u
ADB=${ADB:-/opt/homebrew/bin/adb}
SERIAL=9DA2200007506350
OUT=${OUT:-/Users/fuzihao/.cache/pvz_verify}
TAP_MT=${TAP_MT:-/Volumes/500GB/Ydpen/doom_port/build/tap_mt}
mkdir -p "$OUT"
sh_dev() { "$ADB" -s "$SERIAL" shell "$@" 2>&1; }

case ${1:-} in
  launch)
    sh_dev 'cd /userdisk/pvz && PVZ_SILENT=1 /sbin/start-stop-daemon -S -b -x /userdisk/pvz/run.sh'
    ;;
  launch-audio)
    sh_dev 'cd /userdisk/pvz && /sbin/start-stop-daemon -S -b -x /userdisk/pvz/run.sh'
    ;;
  stop)
    sh_dev 'for p in $(pidof pvz-portable); do kill $p; done'
    ;;
  tap)
    ux=$2; uy=$3
    rx=$((107 + uy)); ry=$((959 - ux))
    sh_dev "/userdisk/pvz/tap_mt /dev/input/event1 $rx $ry"
    ;;
  shot)
    name=$2
    sh_dev 'cd /tmp; export XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0; timeout 15 weston-screenshooter >/dev/null 2>&1; ls -t /tmp/wayland-screenshot-*.png 2>/dev/null | head -1' > "$OUT/.shot_path"
    path=$(tr -d '\r' < "$OUT/.shot_path" | tail -1)
    [ -n "$path" ] || { echo "no screenshot produced"; exit 2; }
    "$ADB" -s "$SERIAL" pull "$path" "$OUT/${name}_raw.png" >/dev/null 2>&1
    ffmpeg -y -loglevel error -i "$OUT/${name}_raw.png" -vf 'crop=266:960:107:0,transpose=1' "$OUT/${name}.png"
    echo "$OUT/${name}.png"
    ;;
  log)
    sh_dev 'cat /userdisk/pvz/game.log'
    ;;
  status)
    sh_dev 'p=$(pidof pvz-portable); echo pid=$p; [ -n "$p" ] && grep -E "VmRSS|Threads" /proc/$p/status'
    ;;
  push)
    "$ADB" -s "$SERIAL" push "$2" "$3"
    ;;
  *)
    echo "usage: dev.sh launch|stop|shot NAME|tap UX UY|log|status|push LOCAL REMOTE" >&2
    exit 1
    ;;
esac