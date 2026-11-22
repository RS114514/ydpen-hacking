#!/bin/sh
# Automated on-device verification for the DOOM Youdao X6 Pro port.
# Waits for ADB (with device auth), deploys, runs UI test + E1M1, injects touches,
# and collects weston-screenshooter frames, ALSA state and RSS samples.
set -u
ADB=${ADB:-/opt/homebrew/bin/adb}
SERIAL=${SERIAL:-9DA2200007506350}
AUTH_PASS=${AUTH_PASS:-ydpen2026}
ROOT=${ROOT:-/Volumes/500GB/Ydpen/doom_port}
OUT=${OUT:-/tmp/doom_test/$(date +%Y%m%d_%H%M%S)}
mkdir -p "$OUT"
LOG="$OUT/verify.log"
say() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

wait_dev() {
    i=0
    while [ $i -lt 720 ]; do
        if "$ADB" devices 2>/dev/null | grep -q "^$SERIAL[[:space:]]*device"; then
            printf '%s\n' "$AUTH_PASS" | "$ADB" -s "$SERIAL" shell auth >/dev/null 2>&1
            return 0
        fi
        sleep 5
        i=$((i+1))
    done
    return 1
}

sh_dev() { "$ADB" -s "$SERIAL" shell "$@" 2>&1; }
kill_doom() { sh_dev 'for p in $(pidof doom_ydpen); do kill $p; done; for p in $(pidof wl_probe); do kill $p; done' >> "$LOG" 2>&1; }

pull_shot() {
    name=$1
    sh_dev 'cd /tmp; export XDG_RUNTIME_DIR=/var/run WAYLAND_DISPLAY=wayland-0; timeout 15 weston-screenshooter >/dev/null 2>&1; ls -t /tmp/wayland-screenshot-*.png 2>/dev/null | head -1' > "$OUT/${name}_path.txt"
    path=$(tr -d '\r' < "$OUT/${name}_path.txt" | tail -1)
    if [ -n "$path" ]; then
        "$ADB" -s "$SERIAL" pull "$path" "$OUT/${name}_raw.png" >> "$LOG" 2>&1
        if [ -f "$OUT/${name}_raw.png" ]; then
            ffmpeg -y -loglevel error -i "$OUT/${name}_raw.png" \
                -vf 'crop=266:960:107:0,transpose=1' "$OUT/${name}_visible.png" >> "$LOG" 2>&1
            say "screenshot $name: $path"
        fi
    else
        say "screenshot $name: no file"
    fi
}

wait_dev || { say "device never appeared"; exit 2; }
say "device online"

sh_dev 'mkdir -p /userdisk/doom' >> "$LOG" 2>&1
for pair in \
    "$ROOT/build/doom_ydpen:/userdisk/doom/doom_ydpen" \
    "$ROOT/assets/doom1.wad:/userdisk/doom/doom1.wad" \
    "$ROOT/build/tap_mt:/userdisk/doom/tap_mt" \
    "$ROOT/device/run_game.sh:/userdisk/doom/run_game.sh" \
    "$ROOT/device/run_uitest.sh:/userdisk/doom/run_uitest.sh"; do
    src=${pair%%:*}; dst=${pair#*:}
    ok=0
    for try in 1 2 3 4 5; do
        if "$ADB" -s "$SERIAL" push "$src" "$dst" >> "$LOG" 2>&1; then ok=1; break; fi
        say "push failed ($src), waiting for device"; wait_dev || exit 3
    done
    [ $ok -eq 1 ] || { say "cannot push $src"; exit 4; }
done
sh_dev 'chmod 755 /userdisk/doom/doom_ydpen /userdisk/doom/tap_mt /userdisk/doom/run_game.sh /userdisk/doom/run_uitest.sh' >> "$LOG" 2>&1

sh_dev 'echo === env ===; uname -a; cat /proc/uptime; cat /proc/asound/cards; ls -l /usr/lib/libwayland-client.so.0 /usr/lib/libasound.so.2; md5sum /userdisk/doom/doom1.wad /userdisk/doom/doom_ydpen' > "$OUT/system.txt" 2>&1
kill_doom
sleep 1

say "=== UI TEST ==="
sh_dev 'cd /userdisk/doom && /sbin/start-stop-daemon -S -b -x /userdisk/doom/run_uitest.sh' >> "$LOG" 2>&1
sleep 4
pull_shot uitest
sh_dev 'cd /userdisk/doom; ./tap_mt /dev/input/event1 176 819; sleep 0.3; ./tap_mt /dev/input/event1 304 94; sleep 0.3; ./tap_mt /dev/input/event1 143 50' >> "$LOG" 2>&1
sleep 1
pull_shot uitest_touch
sh_dev 'cat /userdisk/doom/uitest.log' > "$OUT/uitest.log" 2>&1
sh_dev 'p=$(pidof doom_ydpen); echo pid=$p; [ -n "$p" ] && grep -E "VmRSS|Threads" /proc/$p/status; cat /proc/asound/card1/pcm0p/sub0/status 2>/dev/null' > "$OUT/uitest_status.txt" 2>&1
kill_doom
sleep 1

say "=== GAME E1M1 ==="
sh_dev 'cd /userdisk/doom && /sbin/start-stop-daemon -S -b -x /userdisk/doom/run_game.sh -- -warp 1 1' >> "$LOG" 2>&1
sleep 8
pull_shot game
sh_dev 'cd /userdisk/doom; ./tap_mt /dev/input/event1 240 480; sleep 3; ./tap_mt /dev/input/event1 176 819; sleep 2; ./tap_mt /dev/input/event1 304 94; sleep 1' >> "$LOG" 2>&1
pull_shot game_fire
sh_dev 'cat /userdisk/doom/game.log' > "$OUT/game.log" 2>&1
sh_dev 'p=$(pidof doom_ydpen); echo pid=$p; [ -n "$p" ] && grep -E "VmRSS|VmSize|Threads" /proc/$p/status; echo ===fds===; [ -n "$p" ] && ls -l /proc/$p/fd | grep -E "event|snd"; echo ===pcm===; cat /proc/asound/card1/pcm0p/sub0/status 2>/dev/null; echo ===xml===; grep -E "physical side keys|checkpoint|xrun" /userdisk/doom/game.log | tail -8' > "$OUT/game_status.txt" 2>&1
say "game evidence: $(wc -l < "$OUT/game.log" 2>/dev/null) log lines"
kill_doom
say "=== done, evidence in $OUT ==="
ls -la "$OUT" | tee -a "$LOG"
