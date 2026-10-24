#!/bin/sh
# ==============================================================================
# install_on_pen.sh —— 有道词典笔独立 Web 投屏与操控服务「一键安装到笔端」脚本
#
# 功能：
#   1. 自动检测已连接的词典笔（支持 USB / Wi-Fi）
#   2. 将预编译好的 aarch64 原生单文件服务推送到 /userdisk/bin/ydpen_screensrv
#   3. 部署手动开关脚本 screen_on / screen_off（不开机自启）
#   4. 立即启动笔端服务，并获取词典笔的局域网 IP
#   5. 电脑端无需安装任何程序，直接在浏览器打开即可开始投屏与控制！
# ==============================================================================

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
BIN="$DIR/ydpen_screensrv"

echo "=================================================================="
echo "    🖊️ 有道词典笔原生 Web 投屏与触控服务 · 一键部署程序"
echo "=================================================================="

if [ ! -f "$BIN" ]; then
    echo "[错误] 未找到编译产物: $BIN"
    echo "[提示] 正在重新交叉编译..."
    (cd "$DIR" && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o ydpen_screensrv .)
fi

# 1. 检测 ADB 工具
ADB="adb"
if ! command -v adb >/dev/null 2>&1; then
    for cand in "$DIR/../tools/platform-tools/adb" "/usr/local/bin/adb" "/opt/homebrew/bin/adb" "$HOME/Library/Android/sdk/platform-tools/adb"; do
        if [ -x "$cand" ]; then
            ADB="$cand"
            break
        fi
    done
fi

if ! command -v "$ADB" >/dev/null 2>&1 && [ ! -x "$ADB" ]; then
    echo "[错误] 未检测到 adb 命令，请确保电脑已安装 Android platform-tools 或将其置于 PATH。"
    exit 1
fi

# 2. 检测在线设备
DEVICES=$("$ADB" devices | grep -E '\b(device)\b' | awk '{print $1}')
DEV_COUNT=$(echo "$DEVICES" | grep -v '^$' | wc -l | tr -d ' ')

if [ "$DEV_COUNT" -eq 0 ]; then
    echo "[错误] 未检测到任何已连接的词典笔！"
    echo ""
    echo "请按以下步骤操作："
    echo "  1. 使用 USB 数据线将词典笔连接到电脑"
    echo "  2. 在词典笔上打开 ADB 调试（设置 -> 法律与监管/关于 -> 连续点击版本号/法律信息开启）"
    echo "  3. 重新运行本脚本：./install_on_pen.sh"
    exit 1
fi

# 优先挑选 USB 设备
TARGET_DEV=""
for d in $DEVICES; do
    if ! echo "$d" | grep -q ":"; then
        TARGET_DEV="$d"
        break
    fi
done
if [ -z "$TARGET_DEV" ]; then
    TARGET_DEV=$(echo "$DEVICES" | head -n 1)
fi

echo "[1/4] 目标词典笔已连接: $TARGET_DEV"

# 3. 推送二进制程序到持久化分区 /userdisk/bin/
echo "[2/4] 部署应用文件到 /userdisk/bin/ydpen_screensrv ..."
"$ADB" -s "$TARGET_DEV" shell "mkdir -p /userdisk/bin"
"$ADB" -s "$TARGET_DEV" push "$BIN" /userdisk/bin/ydpen_screensrv
"$ADB" -s "$TARGET_DEV" shell "chmod +x /userdisk/bin/ydpen_screensrv"

# 4. 部署手动开关脚本（不配置开机自启，需要时手动开启）
echo "[3/4] 部署手动开关脚本 screen_on / screen_off ..."
"$ADB" -s "$TARGET_DEV" push "$DIR/screen_on" /userdisk/bin/screen_on >/dev/null
"$ADB" -s "$TARGET_DEV" push "$DIR/screen_off" /userdisk/bin/screen_off >/dev/null
"$ADB" -s "$TARGET_DEV" shell "chmod +x /userdisk/bin/screen_on /userdisk/bin/screen_off"

# 5. 本次先启动一次
echo "[4/4] 启动笔端服务进程..."
"$ADB" -s "$TARGET_DEV" shell "pkill -9 -f ydpen_screensrv 2>/dev/null || true"
"$ADB" -s "$TARGET_DEV" shell "start-stop-daemon -S -b -x /userdisk/bin/ydpen_screensrv -- -p 8088"
sleep 1

# 检查运行状态
RUNNING=$("$ADB" -s "$TARGET_DEV" shell "ps | grep -v grep | grep -c ydpen_screensrv || true" | tr -d '\r\n ')
if [ "$RUNNING" -gt 0 ]; then
    echo "  [✓] 笔端服务已成功在后台运行！"
else
    echo "  [!] 提示：尝试通过 nohup 备用方式拉起..."
    "$ADB" -s "$TARGET_DEV" shell "nohup /userdisk/bin/ydpen_screensrv -p 8088 >/dev/null 2>&1 &"
fi

# 获取笔端 Wi-Fi IP 地址
PEN_IP=$("$ADB" -s "$TARGET_DEV" shell "ip -4 addr show wlan0 2>/dev/null | grep -o 'inet [0-9.]*' | awk '{print \$2}' | head -n 1" | tr -d '\r\n ')

# 自动建立一个端口映射，保证 USB 直连用户无论 Wi-Fi 通不通都能秒开
"$ADB" -s "$TARGET_DEV" forward tcp:8088 tcp:8088 2>/dev/null || true

echo "=================================================================="
echo "                   🎉 部署安装完成！"
echo "=================================================================="
echo "服务已完全驻留于词典笔内部，电脑无需运行任何后台程序。"
echo ""
if [ -n "$PEN_IP" ]; then
    echo "🌐 同一局域网 (Wi-Fi) 无线访问网址："
    echo "    http://$PEN_IP:8088"
    echo ""
fi
echo "🔌 USB 连线访问网址 (即使笔没有连 Wi-Fi 也可用)："
echo "    http://127.0.0.1:8088"
echo "=================================================================="

# 尝试在浏览器打开
if [ -n "$PEN_IP" ]; then
    if which open >/dev/null 2>&1; then
        echo "正在为您在默认浏览器中打开操作界面..."
        open "http://$PEN_IP:8088" 2>/dev/null || open "http://127.0.0.1:8088" 2>/dev/null || true
    fi
else
    if which open >/dev/null 2>&1; then
        open "http://127.0.0.1:8088" 2>/dev/null || true
    fi
fi
