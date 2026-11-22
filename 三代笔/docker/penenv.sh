#!/bin/sh
# 在虚拟笔环境里执行命令（镜像：ydpen-dict3:env-v3.4.5）
#
#   ./penenv.sh                       -> 进交互 shell（自动带无头 weston）
#   ./penenv.sh -c "ls /usr/lib"      -> 用 /bin/sh -c 执行一段命令
#   ./penenv.sh /usr/bin/weston-info  -> 直接跑某个程序
#
# 常用环境变量：
#   PEN_COMPOSITOR=0   不启动 weston（纯命令行/单元测试更快）
#   PEN_SCREEN_W/H     无头输出分辨率，默认 960x480（笔横屏）
#   WORKSPACE          挂载到 /userdisk 的目录，默认 /Volumes/500GB/Ydpen
#   IMG                换镜像，默认 ydpen-dict3:env-v3.4.5
set -e

IMG="${IMG:-ydpen-dict3:env-v3.4.5}"
WORKSPACE="${WORKSPACE:-/Volumes/500GB/Ydpen}"

# 只有真的在终端里才分配 tty，否则 docker 会报 "the input device is not a TTY"
TTY=""
if [ -t 0 ] && [ -t 1 ]; then
    TTY="-it"
fi

run() {
    # shellcheck disable=SC2086
    exec docker run --rm $TTY --platform linux/arm64 \
        -v "$WORKSPACE:/userdisk" \
        -w /userdisk \
        -e PEN_COMPOSITOR="${PEN_COMPOSITOR:-1}" \
        -e PEN_SCREEN_W="${PEN_SCREEN_W:-960}" \
        -e PEN_SCREEN_H="${PEN_SCREEN_H:-480}" \
        "$IMG" "$@"
}

if [ "$1" = "-c" ]; then
    shift
    run /bin/sh -c "$*"
fi

if [ $# -eq 0 ]; then
    run /bin/sh
fi

run "$@"
