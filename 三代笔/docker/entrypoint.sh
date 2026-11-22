#!/bin/sh
# 容器入口：可选拉起一个无头 weston（笔上原生用的就是 weston），然后执行传入的命令
set -e

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/xdg}"
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"

if [ "${PEN_COMPOSITOR:-1}" = "1" ]; then
    WESTON_ARGS="--backend=headless-backend.so --socket=${WAYLAND_DISPLAY:-wayland-0}"
    WESTON_ARGS="$WESTON_ARGS --width=${PEN_SCREEN_W:-480} --height=${PEN_SCREEN_H:-800}"
    WESTON_ARGS="$WESTON_ARGS --idle-time=0 --config=/etc/xdg/weston/weston-headless.ini"
    # shellcheck disable=SC2086
    weston $WESTON_ARGS >/tmp/weston.log 2>&1 &
    i=0
    while [ "$i" -lt 60 ] && [ ! -S "$XDG_RUNTIME_DIR/${WAYLAND_DISPLAY:-wayland-0}" ]; do
        sleep 0.1
        i=$((i + 1))
    done
    if [ ! -S "$XDG_RUNTIME_DIR/${WAYLAND_DISPLAY:-wayland-0}" ]; then
        echo "[entrypoint] weston 没起来，日志：" >&2
        tail -20 /tmp/weston.log >&2
    fi
fi

exec "$@"
