#!/bin/sh
# 找 history 服务/JSAPI 的实现与数据落盘位置
echo "=== 1) 找 libjsapi_history.so / history 相关库 ==="
find / -name 'libjsapi_*history*' -o -name '*history*.so' 2>/dev/null | head -10
echo "--- 历史记录应用(8080292157485624)的 libs ---"
find /userdisk/miniapp/data/mini_app/pkg/8080292157485624 -type f 2>/dev/null | head -30

echo ""
echo "=== 2) 历史记录应用的 bundle 清单 ==="
find /userdisk/miniapp/data/mini_app/pkg/8080292157485624 -name '*.bin' 2>/dev/null | head -30

echo ""
echo "=== 3) 全局 jsapis 目录里有什么模块 ==="
ls -la /etc/miniapp/jsapis/

echo ""
echo "=== 4) 哪些应用自带了 libs（说明各自扩展了 JSAPI） ==="
for d in /userdisk/miniapp/data/mini_app/pkg/*/; do
  id=$(basename "$d")
  so=$(find "$d" -name 'libjsapi_*.so' 2>/dev/null | head -3)
  if [ -n "$so" ]; then
    echo "$id:"
    echo "$so" | sed 's/^/    /'
  fi
done

echo ""
echo "=== 5) 历史记录数据文件（可能在 userdisk 下的 json/db） ==="
find /userdisk -iname '*history*' 2>/dev/null | head -20
find /userdata -iname '*history*' 2>/dev/null | head -10
