#!/bin/sh
# Launcher used by the DOOM home-screen icon: stop any stale instance, then start fresh.
for p in $(pidof doom_ydpen); do
    kill "$p" 2>/dev/null
done
i=0
while [ $i -lt 10 ]; do
    pidof doom_ydpen >/dev/null 2>&1 || break
    sleep 0.2
    i=$((i+1))
done
for p in $(pidof doom_ydpen); do
    kill -9 "$p" 2>/dev/null
done
exec /sbin/start-stop-daemon -S -b -x /userdisk/doom/run_game.sh
