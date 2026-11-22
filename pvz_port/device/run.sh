#!/bin/sh
cd /userdisk/pvz || exit 1
export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0
export HOME=/userdisk/pvz
export LD_LIBRARY_PATH=/userdisk/pvz/libs:/usr/lib:/lib
export PVZ_PEN=1
if [ "$PVZ_SILENT" = "1" ]; then
  export SDL_AUDIODRIVER=dummy
else
  export SDL_AUDIODRIVER=alsa
  export SDL_AUDIO_ALSA_DEFAULT_PLAYBACK_DEVICE=plughw:1,0
fi
exec ./pvz-portable -resdir /userdisk/pvz/assets -savedir /userdisk/pvz/save > /userdisk/pvz/game.log 2>&1
