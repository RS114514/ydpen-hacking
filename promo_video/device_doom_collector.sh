#!/bin/sh
REC_DIR=/tmp/doom_record
rm -rf "$REC_DIR" /tmp/doom_record.tar.gz /tmp/wayland-screenshot-*.png
mkdir -p "$REC_DIR/shots" "$REC_DIR/frames"

export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0

TAP="/userdisk/doom/tap_mt /dev/input/event1"

tap_btn() {
    rx=$1
    ry=$2
    wait_s=${3:-0.4}
    $TAP "$rx" "$ry" >/dev/null 2>&1
    sleep "$wait_s"
}

take_shot() {
    name=$1
    cd /tmp
    rm -f wayland-screenshot-*.png
    weston-screenshooter >/dev/null 2>&1
    sleep 0.3
    latest=$(ls -t wayland-screenshot-*.png 2>/dev/null | head -1)
    if [ -n "$latest" ] && [ -s "$latest" ]; then
        mv "$latest" "$REC_DIR/shots/$name.png"
        echo "[SHOT] $name OK"
    else
        echo "[SHOT] $name FAILED"
    fi
}

echo "=== 1. 启动 DOOM (重置到 E1M1) ==="
for p in $(pidof doom_ydpen); do
    kill -9 "$p" 2>/dev/null
done
sleep 1
cd /userdisk/doom && /sbin/start-stop-daemon -S -b -x /userdisk/doom/run_game.sh -- -warp 1 1
sleep 5

echo "=== 2. 采集静态画面 ==="
# 画面 1: 出生点
take_shot "01_spawn_room"

# 画面 2: 向前移动
tap_btn 176 819 0.2
tap_btn 176 819 0.2
tap_btn 176 819 0.4
take_shot "02_walk_forward"

# 画面 3: 转向大厅水池
tap_btn 176 729 0.3
tap_btn 176 729 0.4
take_shot "03_pool_view"

# 画面 4: 开火射击
tap_btn 304 80 0.05
take_shot "04_fire_pistol"

# 画面 5: 连续交火推进
tap_btn 304 80 0.2
tap_btn 304 80 0.2
tap_btn 176 819 0.3
take_shot "05_combat_push"

# 画面 6: 大厅折角通道
tap_btn 176 909 0.4
tap_btn 176 819 0.4
take_shot "06_hallway_angle"

# 画面 7: 经典红字骷髅主菜单
tap_btn 143 50 0.6
take_shot "07_pause_menu"

# 画面 8: 返回游戏
tap_btn 143 50 0.5
take_shot "08_back_to_game"

echo "=== 3. 录制连续实机动态演示帧 ==="
touch /tmp/doom_rec_active
(
    cd /tmp
    i=0
    while [ -f /tmp/doom_rec_active ]; do
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
REC_PID=$!

echo "执行连续移动与交火..."
for step in 1 2 3; do
    tap_btn 176 819 0.15
done
tap_btn 304 80 0.1
tap_btn 304 80 0.1
for step in 1 2; do
    tap_btn 176 729 0.15
done
for step in 1 2 3; do
    tap_btn 176 819 0.15
done
tap_btn 304 80 0.1
tap_btn 304 80 0.1
tap_btn 304 80 0.1
for step in 1 2; do
    tap_btn 176 909 0.15
done
for step in 1 2; do
    tap_btn 176 819 0.15
done

rm -f /tmp/doom_rec_active
sleep 1
echo "录屏帧采集完成，共采集 $(ls $REC_DIR/frames | wc -l) 帧"

echo "=== 4. 打包资产 ==="
cd /tmp
tar -czf doom_record.tar.gz doom_record
echo "DOOM_COLLECTION_COMPLETE: $(ls -lh /tmp/doom_record.tar.gz)"
