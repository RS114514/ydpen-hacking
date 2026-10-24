#!/bin/sh
# ==============================================================================
# uninstall_from_pen.sh —— 卸载笔端独立 Web 投屏与操控服务
# ==============================================================================

set -e

ADB="adb"
if ! command -v adb >/dev/null 2>&1; then
    for cand in "$(dirname "$0")/../tools/platform-tools/adb" "/usr/local/bin/adb" "/opt/homebrew/bin/adb"; do
        if [ -x "$cand" ]; then
            ADB="$cand"
            break
        fi
    done
fi

DEVICES=$("$ADB" devices | grep -E '\b(device)\b' | awk '{print $1}')
if [ -z "$DEVICES" ]; then
    echo "[错误] 未检测到连接的词典笔设备。"
    exit 1
fi

TARGET_DEV=$(echo "$DEVICES" | head -n 1)
echo "正在从词典笔 ($TARGET_DEV) 卸载服务..."

# 1. 停止进程
"$ADB" -s "$TARGET_DEV" shell "pkill -9 -f ydpen_screensrv 2>/dev/null || true"

# 2. 清理自启脚本中的配置
"$ADB" -s "$TARGET_DEV" shell '
if [ -f /userdisk/skip_re/skip_login.sh ]; then
    sed -i "/ydpen_screensrv/d" /userdisk/skip_re/skip_login.sh
fi
'

# 3. 删除二进制程序
"$ADB" -s "$TARGET_DEV" shell "rm -f /userdisk/bin/ydpen_screensrv"
"$ADB" -s "$TARGET_DEV" forward --remove tcp:8088 2>/dev/null || true

echo "[✓] 卸载完成，笔端后台进程与自启配置已全部移除。"
