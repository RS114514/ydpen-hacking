#!/bin/sh
# 侦察 miniapp 框架的 JSAPI 与权限配置
echo "=== /etc/miniapp/jsapis ==="
ls -la /etc/miniapp/jsapis/ 2>/dev/null

echo ""
echo "=== /etc/miniapp/cfg.json ==="
cat /etc/miniapp/cfg.json 2>/dev/null

echo ""
echo "=== /etc/miniapp/env.json ==="
cat /etc/miniapp/env.json 2>/dev/null

echo ""
echo "=== local_packages.json（系统内置包清单） ==="
head -c 4000 /etc/miniapp/resources/local_packages.json 2>/dev/null

echo ""
echo "=== presetpkgs ==="
ls -la /etc/miniapp/resources/presetpkgs/ 2>/dev/null

echo ""
echo "=== local_deviceinfo.json ==="
cat /etc/miniapp/resources/local_deviceinfo.json 2>/dev/null | head -c 1500
