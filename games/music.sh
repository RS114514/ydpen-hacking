#!/bin/sh
# 词典笔本地高清/无损音乐播放器 (GStreamer + ALSA)
MUSIC_DIR="/userdisk/Favorite/Music"
PID_FILE="/tmp/music_player.pid"

mkdir -p "$MUSIC_DIR"

stop_music() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null
        rm -f "$PID_FILE"
    fi
    pkill -9 -f "gst-launch-1.0.*playbin.*audio-sink" 2>/dev/null
    echo "已停止播放音乐。"
}

play_file() {
    f="$1"
    stop_music
    echo "=================================="
    echo " 正在播放: $(basename "$f")"
    echo " 按 Ctrl+C 停止"
    echo "=================================="
    gst-launch-1.0 playbin uri="file://$f" video-sink=fakesink audio-sink=alsasink >/dev/null 2>&1 &
    echo $! > "$PID_FILE"
    trap "stop_music; exit 0" INT TERM
    wait $(cat "$PID_FILE" 2>/dev/null) 2>/dev/null
}

case "$1" in
    stop)
        stop_music
        exit 0
        ;;
    play)
        shift
        target="$*"
        if [ -f "$target" ]; then
            play_file "$target"
        elif [ -f "$MUSIC_DIR/$target" ]; then
            play_file "$MUSIC_DIR/$target"
        else
            echo "未找到音频文件: $target"
        fi
        exit 0
        ;;
esac

echo "=================================="
echo "       词典笔本地无损音乐库"
echo " 目录: $MUSIC_DIR"
echo "=================================="

files=$(find "$MUSIC_DIR" -type f \( -name "*.mp3" -o -name "*.flac" -o -name "*.wav" -o -name "*.aac" -o -name "*.m4a" \) 2>/dev/null)

if [ -z "$files" ]; then
    echo "当前目录暂无音频文件。"
    echo "请通过网页互传 (http://192.168.31.31:8080) 上传歌曲到 Music/ 目录。"
    exit 0
fi

i=1
echo "$files" | while read -r line; do
    echo " $i. $(basename "$line")"
    i=$((i + 1))
done
echo " 0. 退出 / 停止播放"
echo "=================================="
printf "请选择播放曲目编号: "
read -r choice
case "$choice" in
    0|q|exit)
        stop_music
        exit 0
        ;;
    *)
        picked=$(echo "$files" | sed -n "${choice}p")
        if [ -n "$picked" ] && [ -f "$picked" ]; then
            play_file "$picked"
        else
            echo "无效选择。"
        fi
        ;;
esac
