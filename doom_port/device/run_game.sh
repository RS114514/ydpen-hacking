#!/bin/sh
cd /userdisk/doom || exit 1
export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0
export HOME=/userdisk/doom
export DOOM_TOUCH_DEBUG=1
SAVE=/userdisk/doom/.savegame/doomsav7.dsg
if [ $# -eq 0 ]; then
    if [ -f "$SAVE" ]; then
        set -- -loadgame 7
    else
        set -- -warp 1 1
    fi
fi
exec ./doom_ydpen -iwad /userdisk/doom/doom1.wad -config /userdisk/doom/doomrc -nomusic "$@" > /userdisk/doom/game.log 2>&1
