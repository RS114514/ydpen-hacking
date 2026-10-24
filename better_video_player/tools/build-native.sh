#!/usr/bin/env bash
# 更好的视频播放器 · 原生模块（fs + video jsapi）交叉编译脚本
# 自动识别本机的交叉工具链 -> 编译 libjsapi_better_video.so -> ELF 校验 -> 可选安装。
#
# 用法:
#   tools/build-native.sh --list                 # 列出识别到的工具链
#   tools/build-native.sh                        # 自动选择最优工具链并编译
#   tools/build-native.sh --prefix arm-linux-gnueabihf-
#   tools/build-native.sh --abi armv7-glibc --install     # 编译并装入 ui/libs（随 AMR 打包）
#
# 环境变量: CROSS_TOOLCHAIN_PREFIX 可代替 --prefix。
# FFmpeg/ALSA 全部运行时 dlopen，无需目标 sysroot 提供头文件或链接库
# （FFmpeg 4.4 头文件已 vendor 到 native/jsapi/ffmpeg-include）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/native/jsapi/src"
INC="$ROOT/native/jsapi/iot-miniapp-sdk/include"
FFINC="$ROOT/native/jsapi/ffmpeg-include"
MODULE=libjsapi_better_video.so

LIST=0; INSTALL=0; PREFIX="${CROSS_TOOLCHAIN_PREFIX:-}"; ABI=""

while [ $# -gt 0 ]; do
  case "$1" in
    --list) LIST=1 ;;
    --install) INSTALL=1 ;;
    --prefix) PREFIX="$2"; shift ;;
    --abi) ABI="$2"; shift ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
  shift
done

# ---------- 工具链识别 ----------
TRIPLES="arm-buildroot-linux-gnueabihf arm-linux-gnueabihf arm-none-linux-gnueabihf arm-none-linux-gnueabi aarch64-linux-gnu arm-linux-musleabihf aarch64-linux-musl"

derive_abi() { # $1=triple -> ABI 名
  case "$1" in
    *aarch64*musl*) echo "aarch64-musl" ;;
    *aarch64*) echo "aarch64-glibc" ;;
    *musleabihf*) echo "armv7-musl" ;;
    *gnueabihf*|*armhf*) echo "armv7-glibc" ;;
    *gnueabi*) echo "arm-softfp-glibc" ;;
    *) echo "unknown" ;;
  esac
}

SEARCH_DIRS="$PATH"
for extra in /usr/bin /usr/local/bin /opt/*/bin "$HOME"/x-tools/*/bin "$HOME"/.local/bin; do
  [ -d "$extra" ] && SEARCH_DIRS="$SEARCH_DIRS:$extra"
done

detect_all() {
  for d in ${SEARCH_DIRS//:/ }; do
    for t in $TRIPLES; do
      if [ -x "$d/${t}g++" ]; then echo "$t|$d/${t}"; fi
    done
  done | sort -u
}

if [ "$LIST" = 1 ]; then
  echo "识别到的交叉工具链（按优先级）:"
  found=$(detect_all || true)
  if [ -z "$found" ]; then
    echo "  （没有找到。Ubuntu/Debian 可装: sudo apt install g++-arm-linux-gnueabihf g++-aarch64-linux-gnu）"
    exit 1
  fi
  while IFS='|' read -r t path; do echo "  $(derive_abi "$t")  <-  $path"; done <<< "$found"
  exit 0
fi

# 选定前缀
if [ -z "$PREFIX" ]; then
  first=$(detect_all | head -n 1 || true)
  if [ -z "$first" ]; then
    echo "错误: 未找到交叉工具链。Ubuntu/Debian 安装:" >&2
    echo "  sudo apt install g++-arm-linux-gnueabihf   # CoCo-1826 笔验证过的 ABI (armv7-glibc)" >&2
    echo "  sudo apt install g++-aarch64-linux-gnu     # 64 位笔" >&2
    exit 1
  fi
  bin="$(basename "${first#*|}")"
  PREFIX="${bin%g++}-"
fi
TRIPLE="${PREFIX%-}"
ABI="${ABI:-$(derive_abi "$TRIPLE")}"
CXX="${PREFIX}g++"
READELF="${PREFIX}readelf"
NM="${PREFIX}nm"

command -v "$CXX" >/dev/null 2>&1 || { echo "错误: 找不到 $CXX" >&2; exit 1; }
command -v "$READELF" >/dev/null 2>&1 || READELF=readelf
command -v "$NM" >/dev/null 2>&1 || NM=nm

OUT_DIR="$ROOT/dist/native/${ABI}"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$MODULE"

echo "== 工具链: $CXX  (ABI: $ABI) =="
SYSROOT=$("$CXX" -print-sysroot 2>/dev/null || true)
[ -n "$SYSROOT" ] && echo "== sysroot: $SYSROOT =="

# ---------- 编译 ----------
echo "== 编译 $MODULE =="
"$CXX" -shared -fPIC -std=c++11 -O2 -fvisibility=hidden \
  -I"$SRC" -I"$INC" -I"$FFINC" \
  -Wl,--no-undefined-version \
  "$SRC/JSAPI.cpp" "$SRC/FileSystem.cpp" "$SRC/VideoBridge.cpp" \
  -ldl -lpthread \
  -o "$OUT"
echo "== 输出: $OUT ($(du -h "$OUT" | cut -f1)) =="

# ---------- ELF 校验 ----------
fail=0
MACHINE=$("$READELF" -h "$OUT" | awk '/Machine:/{print $NF}')
case "$MACHINE" in
  ARM) if [ "${ABI#aarch64}" != "$ABI" ]; then echo "校验失败: 期望 AARCH64 得到 ARM"; fail=1; fi ;;
  AArch64) if [ "${ABI#aarch64}" = "$ABI" ]; then echo "校验失败: 期望 ARM 得到 AArch64"; fail=1; fi ;;
  *) echo "校验失败: 未知机器类型 '$MACHINE'"; fail=1 ;;
esac
if ! "$NM" -D "$OUT" 2>/dev/null | grep -q custom_init_jsapis; then
  echo "校验失败: 未导出 custom_init_jsapis"; fail=1
fi
NEEDED=$("$READELF" -d "$OUT" | grep NEEDED | awk '{print $NF}' | tr -d '[]' | tr '\n' ' ' || true)
echo "== NEEDED: $NEEDED =="
for lib in $NEEDED; do
  case "$lib" in
    libc.so*|libstdc++.so*|libgcc_s.so*|libm.so*|libdl.so*|libpthread.so*) ;;
    *) echo "警告: 依赖了非基础库 $lib（目标笔可能没有）"; ;;
  esac
done
[ "$fail" = 0 ] || { echo "ELF 校验未通过"; exit 1; }
echo "== ELF 校验通过 =="

SHA=$(sha256sum "$OUT" | cut -d' ' -f1)
echo "== SHA256: $SHA =="

# ---------- 安装 ----------
if [ "$INSTALL" = 1 ]; then
  cp "$OUT" "$ROOT/ui/libs/$MODULE"
  echo "== 已装入 ui/libs/$MODULE（下次 pnpm -C ui package 随 AMR 打包）=="
  echo "提示: FFmpeg(libav*)/ALSA(libasound) 由模块运行时 dlopen，目标笔 /usr/lib 必须存在："
  echo "      libavformat.so.58 libavcodec.so.58 libavutil.so.56 libswscale.so.5 libswresample.so.3 (可选 libasound.so.2)"
fi

echo "== 完成 =="
