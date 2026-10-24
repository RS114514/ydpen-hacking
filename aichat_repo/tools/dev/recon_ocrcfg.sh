#!/bin/sh
# 找 ocr appids 的配置来源，以及 lookup 服务的注册方式
echo "=== 全盘搜 occrappids / useOcrAppIds 的文本配置 ==="
for dir in /etc /oem /userdata/cfg /userdisk/miniapp/data; do
  echo "--- $dir ---"
  grep -rl "ocrappids\|useOcrAppIds\|UseOcrAppIds" "$dir" 2>/dev/null | head -10
done

echo ""
echo "=== miniapp 顶层配置 ==="
for f in /etc/miniapp/cfg.json /etc/miniapp/env.json /etc/miniapp/resources/cfg.json; do
  echo "--- $f ---"
  wc -c "$f" 2>/dev/null
  head -c 800 "$f" 2>/dev/null
  echo ""
done

echo ""
echo "=== 系统级配置文件里与 scan/ocr 有关的 ==="
grep -ril "scantrans\|scan_trans\|ocr" /etc/miniapp 2>/dev/null | head -20

echo ""
echo "=== 设置应用里与扫描有关的键（找找有没有可配项） ==="
grep -rl "ocrappids\|useOcr" /userdisk/miniapp/data/mini_app/pkg/8080272425914438 2>/dev/null | head

echo ""
echo "=== HOME 应用的 libjsapi_dictpen_home.so 里的相关符号 ==="
ls -la /userdisk/miniapp/data/mini_app/pkg/8080222437664451/*/libs/ 2>/dev/null
