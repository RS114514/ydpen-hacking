#!/bin/sh
# 构建“三代笔虚拟环境”镜像
# 前置：先在 三代笔 目录生成/导入基础镜像 rootfs.tar.gz -> ydpen-dict3:3.4.5
#   docker import rootfs.tar.gz ydpen-dict3:3.4.5
set -e

BASE="${BASE_IMG:-ydpen-dict3:3.4.5}"
OUT="${OUT_IMG:-ydpen-dict3:env-v3.4.5}"
HERE=$(cd "$(dirname "$0")" && pwd)

# 500GB 盘是 exFAT，会带 ._ AppleDouble 文件，buildkit 处理 xattr 会失败，
# 所以先把构建上下文复制到本机磁盘再 build。
BUILD_DIR="${TMPDIR:-/tmp}/ydpen-env-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp "$HERE/Dockerfile" "$HERE/entrypoint.sh" "$HERE/weston-headless.ini" "$BUILD_DIR/"
mkdir -p "$BUILD_DIR/weston-mods/x_libweston/usr/lib/aarch64-linux-gnu/libweston-8"
cp "$HERE/weston-mods/x_libweston/usr/lib/aarch64-linux-gnu/libweston-8/headless-backend.so" \
   "$HERE/weston-mods/x_libweston/usr/lib/aarch64-linux-gnu/libweston-8/fbdev-backend.so" \
   "$BUILD_DIR/weston-mods/x_libweston/usr/lib/aarch64-linux-gnu/libweston-8/"

docker build --platform linux/arm64 --build-arg BASE="$BASE" -t "$OUT" "$BUILD_DIR"
rm -rf "$BUILD_DIR"
echo "已构建镜像：$OUT"
