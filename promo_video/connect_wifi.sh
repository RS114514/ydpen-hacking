#!/bin/bash
SERIAL="9DA2200007506350"
WIFI_IP="192.168.31.31"

echo "Waiting for device $SERIAL..."
for i in {1..30}; do
    devs=$(adb devices)
    if echo "$devs" | grep -q "$SERIAL.*device"; then
        echo "Device online via USB. Authenticating..."
        printf 'ydpen2026\n' | adb -s "$SERIAL" shell auth
        echo "Switching to tcpip 5555..."
        adb -s "$SERIAL" tcpip 5555
        sleep 2
        echo "Connecting to $WIFI_IP:5555..."
        adb connect "$WIFI_IP:5555"
        sleep 1
        adb -s "$WIFI_IP:5555" shell "touch /tmp/audio_key_active && screen_onoff on"
        echo "SUCCESS: Wi-Fi ADB connected!"
        exit 0
    fi
    sleep 1
done

echo "Device did not appear in 30s."
exit 1
