#!/bin/sh
REC_DIR=/tmp/rec_doom
rm -rf "$REC_DIR" /tmp/doom_video.tar
mkdir -p "$REC_DIR"

export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0
TAP="/userdisk/doom/tap_mt /dev/input/event1"

tap_btn() {
    $TAP "$1" "$2" >/dev/null 2>&1
    sleep 0.2
}

# 确保离开菜单
tap_btn 143 50
tap_btn 143 50

# 启动录制循环
touch /tmp/doom_rec_run
(
    cd /tmp
    i=0
    while [ -f /tmp/doom_rec_run ] && [ $i -lt 40 ]; do
        rm -f wayland-screenshot-*.png
        weston-screenshooter >/dev/null 2>&1
        f=$(ls -t wayland-screenshot-*.png 2>/dev/null | head -1)
        if [ -n "$f" ] && [ -s "$f" ]; then
            mv "$f" "$REC_DIR/f_$(printf "%04d" $i).png"
            i=$((i+1))
        fi
        sleep 0.15
    done
) &
REC_PID=$!

echo "Playing DOOM..."
for step in 1 2 3; do
    tap_btn 176 819
done
tap_btn 304 80
tap_btn 304 80
for step in 1 2; do
    tap_btn 176 729
done
for step in 1 2 3; do
    tap_btn 176 819
done
tap_btn 304 80
tap_btn 304 80
tap_btn 304 80

sleep 1
rm -f /tmp/doom_rec_run
wait $REC_PID 2>/dev/null || true

cd /tmp
tar -cf /tmp/doom_video.tar rec_doom
echo "RECORD_DONE: $(ls -lh /tmp/doom_video.tar)"
