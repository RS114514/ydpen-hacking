#!/bin/sh
# ==========================================================
# 有道词典笔 X6 Pro 电视直播播放器 (GStreamer + Wayland)
# ==========================================================

export XDG_RUNTIME_DIR=/var/run
export WAYLAND_DISPLAY=wayland-0

PID_FILE="/tmp/tv_player.pid"

stop_tv() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
    fi
    pkill -9 -f "gst-launch-1.0.*playbin" 2>/dev/null
    echo "已停止电视播放。"
}

play_channel() {
    name="$1"
    url="$2"
    stop_tv
    echo "=================================="
    echo " 正在连接并播放: $name"
    echo " 按 Ctrl+C 退出播放"
    echo "=================================="
    gst-launch-1.0 playbin uri="$url" video-sink="videoscale add-borders=true ! waylandsink" audio-sink=alsasink >/dev/null 2>&1 &
    echo $! > "$PID_FILE"
    
    # 捕获 Ctrl+C
    trap "stop_tv; exit 0" INT TERM
    wait $(cat "$PID_FILE" 2>/dev/null) 2>/dev/null
}

case "$1" in
    stop|quit|exit|0)
        stop_tv
        exit 0
        ;;
    1|cctv1)
        play_channel "CCTV-1 综合频道" "http://120.198.95.220:9901/tsfile/live/1015_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    2|cctv2)
        play_channel "CCTV-2 财经频道" "http://120.198.95.220:9901/tsfile/live/1016_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    3|cctv3)
        play_channel "CCTV-3 综艺频道" "http://120.198.95.220:9901/tsfile/live/1017_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    4|cctv4)
        play_channel "CCTV-4 中文国际" "http://120.198.95.220:9901/tsfile/live/1018_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    5|cctv5)
        play_channel "CCTV-5 体育频道" "http://120.198.95.220:9901/tsfile/live/1019_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    6|cctv6)
        play_channel "CCTV-6 电影频道" "http://120.198.95.220:9901/tsfile/live/1020_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    7|cctv7)
        play_channel "CCTV-7 国防军事" "http://120.198.95.220:9901/tsfile/live/1021_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    8|cctv8)
        play_channel "CCTV-8 电视剧" "http://120.198.95.220:9901/tsfile/live/1022_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    9|cctv9)
        play_channel "CCTV-9 纪录频道" "http://120.198.95.220:9901/tsfile/live/1023_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    10|cctv10)
        play_channel "CCTV-10 科教频道" "http://120.198.95.220:9901/tsfile/live/1024_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    11|cctv13|news)
        play_channel "CCTV-13 新闻频道" "http://120.198.95.220:9901/tsfile/live/1027_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    12|hunan|hn)
        play_channel "湖南卫视" "http://120.198.95.220:9901/tsfile/live/1044_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    13|zhejiang|zj)
        play_channel "浙江卫视" "http://120.198.95.220:9901/tsfile/live/1045_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    14|jiangsu|js)
        play_channel "江苏卫视" "http://120.198.95.220:9901/tsfile/live/1046_1.m3u8?key=txiptv&playlive=1&down=1"
        exit 0
        ;;
    15|dongfang|df)
        play_channel "东方卫视" "http://119.129.172.236:9901/tsfile/live/0107_1.m3u8?key=txiptv&playlive=1&authid=0"
        exit 0
        ;;
esac

# 交互式菜单
while true; do
    echo "=================================="
    echo "       有道词典笔 电视直播"
    echo "=================================="
    echo " 1. CCTV-1 综合     2. CCTV-2 财经"
    echo " 3. CCTV-3 综艺     4. CCTV-4 中文国际"
    echo " 5. CCTV-5 体育     6. CCTV-6 电影"
    echo " 7. CCTV-7 国防     8. CCTV-8 电视剧"
    echo " 9. CCTV-9 纪录    10. CCTV-10 科教"
    echo "11. CCTV-13 新闻   12. 湖南卫视"
    echo "13. 浙江卫视       14. 江苏卫视"
    echo "15. 东方卫视        0. 退出/停止播放"
    echo "=================================="
    printf "请选择频道 (0-15): "
    read -r choice
    case "$choice" in
        0|q|exit)
            stop_tv
            break
            ;;
        1) play_channel "CCTV-1 综合频道" "http://120.198.95.220:9901/tsfile/live/1015_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        2) play_channel "CCTV-2 财经频道" "http://120.198.95.220:9901/tsfile/live/1016_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        3) play_channel "CCTV-3 综艺频道" "http://120.198.95.220:9901/tsfile/live/1017_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        4) play_channel "CCTV-4 中文国际" "http://120.198.95.220:9901/tsfile/live/1018_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        5) play_channel "CCTV-5 体育频道" "http://120.198.95.220:9901/tsfile/live/1019_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        6) play_channel "CCTV-6 电影频道" "http://120.198.95.220:9901/tsfile/live/1020_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        7) play_channel "CCTV-7 国防军事" "http://120.198.95.220:9901/tsfile/live/1021_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        8) play_channel "CCTV-8 电视剧" "http://120.198.95.220:9901/tsfile/live/1022_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        9) play_channel "CCTV-9 纪录频道" "http://120.198.95.220:9901/tsfile/live/1023_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        10) play_channel "CCTV-10 科教频道" "http://120.198.95.220:9901/tsfile/live/1024_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        11) play_channel "CCTV-13 新闻频道" "http://120.198.95.220:9901/tsfile/live/1027_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        12) play_channel "湖南卫视" "http://120.198.95.220:9901/tsfile/live/1044_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        13) play_channel "浙江卫视" "http://120.198.95.220:9901/tsfile/live/1045_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        14) play_channel "江苏卫视" "http://120.198.95.220:9901/tsfile/live/1046_1.m3u8?key=txiptv&playlive=1&down=1" ;;
        15) play_channel "东方卫视" "http://119.129.172.236:9901/tsfile/live/0107_1.m3u8?key=txiptv&playlive=1&authid=0" ;;
        *) echo "无效选择，请重新输入" ;;
    esac
done
