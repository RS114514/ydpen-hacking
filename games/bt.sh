#!/bin/sh
# 词典笔蓝牙耳机连接管理工具

case "$1" in
    on)
        hciconfig hci0 up 2>/dev/null
        echo "蓝牙已开启。"
        ;;
    off)
        hciconfig hci0 down 2>/dev/null
        echo "蓝牙已关闭。"
        ;;
    scan)
        echo "正在扫描附近蓝牙设备 (持续 8 秒)..."
        hciconfig hci0 up 2>/dev/null
        bluetoothctl scan on >/tmp/bt_scan.log 2>&1 &
        SCAN_PID=$!
        sleep 8
        kill "$SCAN_PID" 2>/dev/null
        bluetoothctl scan off >/dev/null 2>&1
        echo "================ 扫描到的设备 ================"
        grep "Device" /tmp/bt_scan.log | sort -u
        echo "=============================================="
        echo "配对命令: bt pair <MAC地址>"
        echo "连接命令: bt connect <MAC地址>"
        ;;
    pair)
        mac="$2"
        if [ -z "$mac" ]; then echo "用法: bt pair <MAC地址>"; exit 1; fi
        echo "正在配对 $mac..."
        bluetoothctl pair "$mac"
        bluetoothctl trust "$mac"
        ;;
    connect)
        mac="$2"
        if [ -z "$mac" ]; then echo "用法: bt connect <MAC地址>"; exit 1; fi
        echo "正在连接 $mac..."
        bluetoothctl connect "$mac"
        ;;
    disconnect)
        mac="$2"
        if [ -z "$mac" ]; then bluetoothctl disconnect; else bluetoothctl disconnect "$mac"; fi
        ;;
    status)
        bluetoothctl info 2>/dev/null || hciconfig hci0
        ;;
    *)
        echo "=================================="
        echo "       词典笔蓝牙耳机助手"
        echo "=================================="
        echo " 用法:"
        echo "   bt on              开启蓝牙"
        echo "   bt scan            扫描附近蓝牙耳机"
        echo "   bt pair <MAC>      配对蓝牙设备"
        echo "   bt connect <MAC>   连接蓝牙耳机"
        echo "   bt disconnect      断开蓝牙连接"
        echo "   bt status          查看蓝牙状态"
        echo "=================================="
        ;;
esac
