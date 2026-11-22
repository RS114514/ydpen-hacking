#!/bin/sh
# Automated on-device verification for the PvZ Youdao pen port.
# Deploys, launches, injects real touches, captures cropped frames + logs.
set -u
ADB=${ADB:-/opt/homebrew/bin/adb}
SERIAL=${SERIAL:-9DA2200007506350}
ROOT=${ROOT:-/Volumes/500GB/Ydpen/pvz_port}
OUT=${OUT:-/Volumes/500GB/qoder_cache/pvz_verify/$(date +%Y%m%d_%H%M%S)}
TAP_MT=${TAP_MT:-/Volumes/500GB/Ydpen/doom_port/build/tap_mt}
BIN=${BIN:-/Volumes/500GB/qoder_cache/pvz_deps/build/game/pvz-portable}
DO_TAPS=${DO_TAPS:-0}
mkdir -p "$OUT"
LOG="$OUT/verify.log"
say() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }
sh_dev() { "$ADB" -s "$SERIAL" shell "$@" 2>&1; }

# ui(960x266 band) -> raw touch coords
tap_ui() {
  ux=$1; uy=$2
  rx=$((107 + uy)); ry=$((959 - ux))
  sh_dev "/userdisk/pvz/tap_mt /dev/input/event1 $rx $ry" >> "$LOG" 2>&1
  sleep 0.4
}
pull_shot() {
  name=$1
  sh_dev 'cd /tmp; export XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0; timeout 15 weston-screenshooter >/dev/null 2>&1; ls -t /tmp/wayland-screenshot-*.png 2>/dev/null | head -1' > "$OUT/${name}_path.txt"
  path=$(tr -d '\r' < "$OUT/${name}_path.txt" | tail -1)
  if [ -n "$path" ]; then
    "$ADB" -s "$SERIAL" pull "$path" "$OUT/${name}_raw.png" >> "$LOG" 2>&1
    if [ -f "$OUT/${name}_raw.png" ]; then
      ffmpeg -y -loglevel error -i "$OUT/${name}_raw.png" -vf 'crop=266:960:107:0,transpose=1' "$OUT/${name}.png" >> "$LOG" 2>&1
      say "screenshot $name"
    fi
  else
    say "screenshot $name: no file"
  fi
}

say "device online: $SERIAL"
sh_dev 'mkdir -p /userdisk/pvz/assets /userdisk/pvz/save /userdisk/pvz/libs' >> "$LOG" 2>&1
for pair in \
  "$BIN:/userdisk/pvz/pvz-portable" \
  "$ROOT/device/run.sh:/userdisk/pvz/run.sh" \
  "$TAP_MT:/userdisk/pvz/tap_mt"; do
  src=${pair%%:*}; dst=${pair#*:}
  [ -f "$src" ] || { say "missing $src"; exit 4; }
  "$ADB" -s "$SERIAL" push "$src" "$dst" >> "$LOG" 2>&1 || { say "push failed $src"; exit 3; }
done
sh_dev 'chmod 755 /userdisk/pvz/pvz-portable /userdisk/pvz/run.sh /userdisk/pvz/tap_mt' >> "$LOG" 2>&1

sh_dev 'for p in $(pidof pvz-portable); do kill $p; done' >> "$LOG" 2>&1
sleep 1
say "=== launch ==="
sh_dev 'cd /userdisk/pvz && /sbin/start-stop-daemon -S -b -x /userdisk/pvz/run.sh' >> "$LOG" 2>&1
sleep 6
pull_shot title
if [ "$DO_TAPS" = "1" ]; then
  say "=== tap adventure / confirm path ==="
  tap_ui 480 133     # scene center -> preview
  tap_ui 744 225     # confirm
  sleep 2
  pull_shot after_confirm
  tap_ui 60 85       # card slot 0
  tap_ui 480 133
  tap_ui 744 225
  sleep 2
  pull_shot planted
fi
sh_dev 'p=$(pidof pvz-portable); echo pid=$p; [ -n "$p" ] && grep -E "VmRSS|Threads" /proc/$p/status' > "$OUT/status.txt" 2>&1
sh_dev 'cat /userdisk/pvz/game.log' > "$OUT/game.log" 2>&1
say "log lines: $(wc -l < "$OUT/game.log")"
say "=== done, evidence in $OUT ==="
