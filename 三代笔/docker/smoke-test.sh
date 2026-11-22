#!/bin/sh
# 冒烟测试：在虚拟环境里跑一个笔上的真实程序（doom 移植版），
# 并把 weston 日志、doom 日志、合成器场景图、Wayland 协议轨迹留档到 docker/artifacts/。
#
#   ./smoke-test.sh                 # 默认窗口模式
#   ARTIFACTS=/path ./smoke-test.sh # 自定义留档目录
set -e
IMG="${IMG:-ydpen-dict3:env-v3.4.5}"
WS="${WORKSPACE:-/Volumes/500GB/Ydpen}"
ART="${ARTIFACTS:-/Volumes/500GB/Ydpen/三代笔/docker/artifacts}"

mkdir -p "$ART"
rm -f "$ART"/weston.log "$ART"/doom.log "$ART"/scene-graph.txt "$ART"/wayland-trace.txt "$ART"/summary.txt

docker run --rm --platform linux/arm64 \
    -e PEN_COMPOSITOR=0 -e DOOM_LAYOUT=window \
    -v "$WS:/userdisk" -v "$ART:/art" "$IMG" /bin/sh -c '
    export XDG_RUNTIME_DIR=/tmp/x; mkdir -p $XDG_RUNTIME_DIR; chmod 700 $XDG_RUNTIME_DIR
    weston --backend=headless-backend.so --socket=wayland-0 --width=960 --height=480 \
           --idle-time=0 --debug >/tmp/w.log 2>&1 &
    sleep 3

    mkdir -p /tmp/d
    cp /userdisk/doom_port/build/doom_ydpen \
       /userdisk/doom_port/assets/doom1.wad \
       /userdisk/三代笔/docker/extra-libs/libffi.so.8 /tmp/d/
    cp /userdisk/doom_port/third_party/lib/libwayland-client.so.0.21.0 /tmp/d/libwayland-client.so.0
    cd /tmp/d
    # 先把程序跑起来，趁它活着抓一次场景图（证明窗口被合成器接管）
    LD_LIBRARY_PATH=/tmp/d ./doom_ydpen -iwad doom1.wad -nomusic >/tmp/doom.log 2>&1 &
    DOOM_PID=$!
    sleep 3
    weston-debug scene-graph >/tmp/scene.txt 2>&1 || true
    sleep 3
    kill $DOOM_PID 2>/dev/null || true
    wait $DOOM_PID 2>/dev/null || true

    # 协议轨迹：doom 在窗口模式下跑一遍，抓 toplevel/configure/commit
    LD_LIBRARY_PATH=/tmp/d WAYLAND_DEBUG=1 timeout 4 ./doom_ydpen -iwad doom1.wad -nomusic \
        >/tmp/trace.log 2>&1 || true
    grep -E "xdg_surface|xdg_toplevel|wl_surface@[0-9]+\.(attach|commit)|configure" /tmp/trace.log \
        | head -40 >/tmp/trace-excerpt.txt || true

    cp /tmp/w.log /art/weston.log
    cp /tmp/doom.log /art/doom.log
    cp /tmp/scene.txt /art/scene-graph.txt
    cp /tmp/trace-excerpt.txt /art/wayland-trace.txt

    {
        echo "=== doom_ydpen（笔上的真实程序）关键输出 ==="
        grep -E "\[doom\]|\[wl\]" /tmp/doom.log | head -12
        echo
        echo "=== 合成器场景图（节选） ==="
        grep -E "view|surface|Layer 0" /tmp/scene.txt | head -12
    } > /tmp/summary.txt
    cp /tmp/summary.txt /art/summary.txt
    cat /tmp/summary.txt

    if ! grep -q "layout=window" /tmp/doom.log; then
        echo "[FAIL] 没拿到 wayland configure"; tail -5 /tmp/doom.log; exit 1
    fi
    echo "[OK] 笔上的 doom_ydpen 在虚拟环境里完成 wayland 连接 / 建窗 / configure"
    if pidof weston >/dev/null; then echo "[OK] weston 全程存活"; else echo "[FAIL] weston 挂了"; exit 1; fi
'
echo "证据已留档：$ART"
ls -la "$ART"
