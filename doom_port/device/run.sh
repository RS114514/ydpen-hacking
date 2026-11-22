#!/bin/sh
cd /userdisk/doom || exit 1
export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0
export HOME=/userdisk/doom
if [ "$1" = "uitest" ]; then
    shift
    DOOM_UI_TEST=1 exec ./doom_ydpen "$@"
fi
SAVE=/userdisk/doom/.savegame/doomsav7.dsg
if [ $# -eq 0 ] && [ -f "$SAVE" ]; then
    set -- -loadgame 7
fi
exec ./doom_ydpen -iwad /userdisk/doom/doom1.wad -config /userdisk/doom/doomrc -nomusic "$@"
