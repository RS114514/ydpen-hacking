#!/bin/sh
# 词典笔实时天气查询
loc="${1:-}"
if [ -z "$loc" ]; then
    echo "=================================="
    echo "       词典笔实时天气预报"
    echo "=================================="
    curl -s -m 8 "wttr.in/?lang=zh&0" 2>/dev/null || curl -s -m 5 "wttr.in/?lang=zh&format=3"
else
    echo "=================================="
    echo "       正在查询天气: $loc"
    echo "=================================="
    curl -s -m 8 "wttr.in/$loc?lang=zh&0" 2>/dev/null || curl -s -m 5 "wttr.in/$loc?lang=zh&format=3"
fi
