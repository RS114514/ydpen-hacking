#!/bin/zsh
# 用法: capture.sh <appid> <prefix> <startX> <startY> <extraX> <extraY> <chartX> <chartY> <afterX> <afterY>
cd "$(dirname $0)/shots"
ID=$1; P=$2
cap(){ adb shell "miniapp_cli capture /tmp/c.png" >/dev/null; adb pull /tmp/c.png ${P}_$1.png >/dev/null; echo "shot $1"; }
tap(){ adb shell "input tap $1 $2"; sleep ${3:-1.5}; }
home(){ adb shell "miniapp_cli start $ID title" >/dev/null; sleep 4; }
home; cap 00_title
# 新游戏 + 推进台词
tap $3 $4 4; cap 10_adv
for i in 1 2 3 4 5 6 7 8; do tap 550 110 2; cap 1${i}_adv; done
# 鉴赏
home; tap $5 $6 3; cap 20_extra
tap 280 110 3; cap 21_extra_cat
tap 200 120 3; cap 22_cg
tap 550 110 2; cap 23_cg
home; tap $5 $6 3; tap 530 18 3; cap 24_music
# 流程图
home; tap $7 $8 3; cap 30_chart
# 日后谈
home; tap $9 ${10} 3; cap 40_after
home
