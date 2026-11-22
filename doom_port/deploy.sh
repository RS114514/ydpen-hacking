#!/bin/sh
set -e
ROOT=/Volumes/500GB/Ydpen/doom_port
ADB=/opt/homebrew/bin/adb
SERIAL=${SERIAL:-9DA2200007506350}

"$ADB" -s "$SERIAL" wait-for-device
"$ADB" -s "$SERIAL" shell 'mkdir -p /userdisk/doom'
"$ADB" -s "$SERIAL" push "$ROOT/build/doom_ydpen" /userdisk/doom/doom_ydpen
"$ADB" -s "$SERIAL" push "$ROOT/assets/doom1.wad" /userdisk/doom/doom1.wad
"$ADB" -s "$SERIAL" push "$ROOT/device/run.sh" /userdisk/doom/run.sh
"$ADB" -s "$SERIAL" shell 'chmod 755 /userdisk/doom/doom_ydpen /userdisk/doom/run.sh && ls -la /userdisk/doom && md5sum /userdisk/doom/doom1.wad'
