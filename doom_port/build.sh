#!/bin/sh
set -e
ROOT=/Volumes/500GB/Ydpen/doom_port
SRC=/tmp/doomsrc
BUILD=${BUILD:-/tmp/doombuild}
ZIG=${ZIG:-/Volumes/500GB/qoder_cache/senren_banka/zig_toolchain/ziglang/zig}

mkdir -p "$SRC" "$BUILD"
rm -rf "$SRC/src" "$SRC/doomgeneric" "$SRC/wl" "$SRC/alsa" "$SRC/lib"
mkdir -p "$SRC/src" "$SRC/doomgeneric" "$SRC/wl" "$SRC/alsa" "$SRC/lib"
cp -a "$ROOT/src/." "$SRC/src/"
cp -a "$ROOT/third_party/doomgeneric/." "$SRC/doomgeneric/"
cp -a "$ROOT/third_party/wayland/include/." "$SRC/wl/"
cp -a "$ROOT/third_party/wayland/src/xdg-shell-protocol.c" "$SRC/wl/"
cp -a "$ROOT/third_party/alsa/." "$SRC/alsa/"
cp -a "$ROOT/third_party/lib/." "$SRC/lib/"

make -f "$ROOT/Makefile" -j8 SRC_ROOT="$SRC" BUILD="$BUILD" PROJECT_ROOT="$ROOT" ZIG="$ZIG" "$@"
