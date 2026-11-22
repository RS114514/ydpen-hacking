#!/bin/sh
# 桌面图标入口：先清掉残留进程，再启动新实例
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
