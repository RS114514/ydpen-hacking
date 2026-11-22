#!/bin/sh
REC_DIR=/tmp/doom_record
rm -rf "$REC_DIR" /userdisk/doom/doom_collected.tar.gz
mkdir -p "$REC_DIR/shots" "$REC_DIR/frames"

export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0

TAP="/userdisk/doom/tap_mt /dev/input/event1"

tap_btn() {
    $TAP "$1" "$2" >/dev/null 2>&1
    sleep "${3:-0.4}"
}

take_shot() {
    name=$1
    cd /tmp
    rm -f wayland-screenshot-*.png
    weston-screenshooter >/dev/null 2>&1
    sleep 0.4
    latest=$(ls -t wayland-screenshot-*.png 2>/dev/null | head -1)
    if [ -n "$latest" ] && [ -s "$latest" ]; then
        mv "$latest" "$REC_DIR/shots/$name.png"
        echo "[SHOT] $name OK"
    fi
}

echo "=== 确保 DOOM 运行 ==="
if ! pidof doom_ydpen >/dev/null 2>&1; then
    cd /userdisk/doom && /sbin/start-stop-daemon -S -b -x /userdisk/doom/run_game.sh -- -warp 1 1
    sleep 5
fi

# 确保在游戏画面
tap_btn 143 50 0.4
tap_btn 143 50 0.4

echo "=== 采集静态画面 ==="
take_shot "01_spawn_room"

# 向前走几步
tap_btn 176 819 0.3
tap_btn 176 819 0.3
tap_btn 176 819 0.5
take_shot "02_walk_forward"

# 转向水池
tap_btn 176 729 0.3
tap_btn 176 729 0.4
take_shot "03_pool_view"

# 开火射击
tap_btn 304 80 0.05
take_shot "04_fire_pistol"

# 连续推进开火
tap_btn 304 80 0.2
tap_btn 304 80 0.2
tap_btn 176 819 0.3
take_shot "05_combat_push"

# 转向左侧通道
tap_btn 176 909 0.4
tap_btn 176 819 0.4
take_shot "06_hallway_angle"

# 呼出菜单
tap_btn 143 50 0.6
take_shot "07_pause_menu"

# 返回游戏
tap_btn 143 50 0.5
take_shot "08_back_to_game"

echo "=== 采集录像帧 ==="
touch /tmp/rec_doom_on
(
    cd /tmp
    i=0
    while [ -f /tmp/rec_doom_on ]; do
        rm -f wayland-screenshot-*.png
        weston-screenshooter >/dev/null 2>&1
        latest=$(ls -t wayland-screenshot-*.png 2>/dev/null | head -1)
        if [ -n "$latest" ] && [ -s "$latest" ]; then
            mv "$latest" "$REC_DIR/frames/f_$(printf "%04d" $i).png"
            i=$((i+1))
        fi
        usleep 150000
    done
) &
PID_REC=$!

# 连续游玩 10 秒
for s in 1 2 3 4; do
    tap_btn 176 819 0.15
done
tap_btn 304 80 0.1
tap_btn 304 80 0.1
tap_btn 176 729 0.2
for s in 1 2 3; do
    tap_btn 176 819 0.15
done
tap_btn 304 80 0.1
tap_btn 304 80 0.1
tap_btn 176 909 0.2
for s in 1 2; do
    tap_btn 176 819 0.15
done

rm -f /tmp/rec_doom_on
sleep 1

echo "=== 打包归档 ==="
cd /tmp
tar -czf /userdisk/doom/doom_collected.tar.gz doom_record
echo "FINISHED_TAR_SIZE: $(ls -lh /userdisk/doom/doom_collected.tar.gz)"
