#!/bin/sh
# 找 ocr appid 注册表存在哪里（文本配置里搜系统 appid 与角色名）
echo "=== 1) 文本配置里出现 SCANTRANS appid 的文件 ==="
for dir in /etc /userdata /userdisk/miniapp/data; do
  grep -rl "8080252464522508" "$dir" 2>/dev/null | grep -v '\.so$\|\.bin$' | head -15
done

echo ""
echo "=== 2) 出现 scantrans 角色名的文本文件 ==="
for dir in /etc /userdata /userdisk/miniapp/data; do
  grep -rl "scantrans" "$dir" 2>/dev/null | grep -v '\.so$\|\.bin$' | head -15
done

echo ""
echo "=== 3) sysconfig-manager 的配置（框架级设置很可能在这里） ==="
ls -la /userdata/cfg/ 2>/dev/null
find /userdata -maxdepth 3 -name '*.json' 2>/dev/null | head -20

echo ""
echo "=== 4) 共享偏好目录里都有什么 ==="
find /userdisk/miniapp/data/mini_app/pkg -maxdepth 4 -name 'preferences.json' 2>/dev/null | head
echo "--- 桌面(HOME)应用的偏好 ---"
cat /userdisk/miniapp/data/mini_app/pkg/8080222437664451/data/sharedpreferences/preferences.json 2>/dev/null | head -c 1200

echo ""
echo "=== 5) 系统 miniapp 的 data 目录（可能是框架级） ==="
ls -la /userdisk/miniapp/data/ 2>/dev/null
find /userdisk/miniapp -maxdepth 3 -name '*.json' 2>/dev/null | head -20
