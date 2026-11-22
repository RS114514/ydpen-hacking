#!/bin/sh
cd /userdisk/doom || exit 1
export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0
export HOME=/userdisk/doom
export DOOM_UI_TEST=1
export DOOM_TOUCH_DEBUG=1
exec ./doom_ydpen > /userdisk/doom/uitest.log 2>&1
