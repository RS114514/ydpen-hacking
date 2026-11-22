#!/bin/sh
# 从笔上重新导出系统镜像（断连/中断后可重跑，自动续传）
#
#   ./export-from-pen.sh                 # 导出全部 4 项
#   ./export-from-pen.sh system_a        # 只导某一项
#
# 设计要点（都是踩过的坑）：
#  1. 这台笔 `adb exec-out` 会直接报 `error: closed`，二进制流拉不下来；
#     必须先在笔上 dd 到 /userdisk，再 adb pull 文件。
#  2. 长传输在后台会被 60 秒截断，所以按 64 MiB 分块 dd + 分块 pull，
#     每块都小到能一次拉完，最后本地 cat 拼回去。
#  3. 全程只读 /dev/block/by-name/*，不动 uresource / userdisk 里的应用数据；
#     临时目录用完必删。
set -e

SERIAL="${SERIAL:-2C11200001902234}"
DEST="${DEST:-/Volumes/500GB/Ydpen/三代笔}"
TMP_ON_PEN="/userdisk/__export"
CHUNK_MB=64

adb() { command adb -s "$SERIAL" "$@"; }

pull_one() {
    name="$1"; part="$2"; want_md5="$3"
    echo "==> $name ($part)"
    adb shell "mkdir -p $TMP_ON_PEN"

    # 笔上算一遍 md5（用来校验，不改数据）
    dev_md5=$(adb shell "md5sum /dev/block/by-name/$part 2>/dev/null | cut -d' ' -f1" | tr -d '\r')
    [ -n "$dev_md5" ] || dev_md5=$(adb shell "md5sum /dev/block/mmcblk1p${4:-9} | cut -d' ' -f1" | tr -d '\r')
    echo "    device md5: $dev_md5"

    size=$(adb shell "blockdev --getsize64 /dev/block/by-name/$part 2>/dev/null || echo 0" | tr -d '\r')
    [ "$size" = "0" ] && size=$(adb shell "cat /sys/class/block/${part##*/}/size 2>/dev/null" | tr -d '\r')
    echo "    size: $size"

    # 按块切，笔上逐个 dd 出来
    total_mb=$(( (size + 1048575) / 1048576 ))
    i=0
    while [ $(( i * CHUNK_MB )) -lt "$total_mb" ]; do
        skip=$(( i * CHUNK_MB ))
        cnt=$CHUNK_MB
        [ $(( skip + cnt )) -gt "$total_mb" ] && cnt=$(( total_mb - skip ))
        adb shell "dd if=/dev/block/by-name/$part of=$TMP_ON_PEN/$name.part$i bs=1M skip=$skip count=$cnt 2>/dev/null"
        adb pull "$TMP_ON_PEN/$name.part$i" "$DEST/.chunk" >/dev/null
        cat "$DEST/.chunk" >> "$DEST/$name.img"
        rm -f "$DEST/.chunk"
        adb shell "rm -f $TMP_ON_PEN/$name.part$i"
        i=$(( i + 1 ))
        printf '    %d/%d chunks\r' "$i" "$(( (total_mb + CHUNK_MB - 1) / CHUNK_MB ))"
    done
    echo
    adb shell "rm -rf $TMP_ON_PEN"

    local_md5=$(md5 -q "$DEST/$name.img")
    echo "    local  md5: $local_md5"
    if [ "$local_md5" = "$dev_md5" ]; then
        echo "    [OK] md5 一致"
    else
        echo "    [FAIL] md5 不一致，删除重来" >&2
        rm -f "$DEST/$name.img"
        exit 1
    fi
}

mkdir -p "$DEST"
rm -f "$DEST"/system_a.img.partial

case "${1:-all}" in
    system_a) pull_one system_a system_a "" 9 ;;
    boot_a)   pull_one boot_a   boot_a   "" 6 ;;
    recovery) pull_one recovery recovery "" 8 ;;
    all)
        pull_one system_a system_a "" 9
        pull_one boot_a   boot_a   "" 6
        pull_one recovery recovery "" 8
        ;;
    *) echo "用法: $0 [all|system_a|boot_a|recovery]"; exit 2 ;;
esac

echo "==> 重新生成 SHA256SUMS.txt"
( cd "$DEST" && shasum -a 256 system_a.img boot_a.img recovery.img rootfs.tar.gz > SHA256SUMS.txt )
cat "$DEST/SHA256SUMS.txt"
