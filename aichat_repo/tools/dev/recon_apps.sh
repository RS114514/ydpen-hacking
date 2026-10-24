#!/bin/sh
# 识别笔上所有 miniapp：appid、名称、版本、起始页
# 用法: sh /tmp/recon_apps.sh

echo "=== 已安装的 miniapp ==="
for d in /userdisk/miniapp/data/mini_app/pkg/*/; do
  id=$(basename "$d")
  m=""
  for slot in a b; do
    if [ -f "$d/$slot/manifest.json" ]; then m="$d/$slot/manifest.json"; slot_used=$slot; break; fi
  done
  if [ -n "$m" ]; then
    name=$(sed -n 's/.*"appName"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$m" | head -1)
    ver=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$m" | head -1)
    echo "$id | $name | v$ver | slot=$slot_used"
  else
    echo "$id | (无 manifest)"
  fi
done

echo ""
echo "=== 系统内置 miniapp 资源目录 ==="
ls -la /etc/miniapp/ 2>/dev/null
echo "--- /etc/miniapp/resources ---"
ls /etc/miniapp/resources/ 2>/dev/null
echo "--- /etc/miniapp/resources/framework ---"
ls /etc/miniapp/resources/framework/ 2>/dev/null
echo "--- js_modules ---"
ls /etc/miniapp/resources/framework/js_modules/ 2>/dev/null

echo ""
echo "=== libfalcon 位置 ==="
ls -la /usr/lib/libfalcon* /lib/libfalcon* 2>/dev/null
find / -name 'libfalcon*' -maxdepth 5 2>/dev/null
