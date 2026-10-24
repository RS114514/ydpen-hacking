#!/usr/bin/env bash
# 为每个支持的笔型号交叉编译原生模块并打包 AMR。
# 工具链来源与 miniapp-creater.sh 一致（penosext/Cloudpan）。
#
# 用法:
#   tools/build-all-releases.sh                # 全部机型: x5 s6p a6p p5 x7
#   tools/build-all-releases.sh x5 p5          # 指定机型
#
# 产物: dist/releases/better-video-<版本>-<机型>.amr
# 需要: node/pnpm（打包 AMR）、curl、tar、以及 Linux 宿主（工具链为 x86_64 Linux 程序）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEVICES=("$@")
if [ ${#DEVICES[@]} -eq 0 ]; then
  DEVICES=(x5 s6p a6p p5 x7)
fi

BASE="https://github.com/penosext/Cloudpan/releases/download"
declare -A TOOLCHAIN_URL=(
  [x5]="$BASE/toolchains/armv7-eabihf--glibc--stable-2018.11-1.tar.bz2"
  [s6p]="$BASE/toolchains/armv7-eabihf--glibc--stable-2018.11-1.tar.bz2"
  [a6p]="$BASE/toolchains/armv7-eabihf--uclibc--bleeding-edge-2018.11-1.tar.bz2"
  [p5]="$BASE/toolchains/aarch64--glibc--stable-2018.11-1.tar.bz2"
  [x7]="$BASE/toolchains/aarch64--glibc--stable-2018.11-1.tar.bz2"
)
# armv7-glibc 机型可以使用 langningchen 原生 scan 模块（custom.scan 文件枚举更快）；
# 其他机型只带 better_video 模块（自带 fs 扫描）。
declare -A SHIP_LANGNING=(
  [x5]=1 [s6p]=1
)

VERSION=$(node -p "require('./ui/package.json').version")
mkdir -p dist/releases .toolchains

echo "== 更好的视频 $VERSION 多机型构建: ${DEVICES[*]} =="

stash_libs() {
  if [ -d ui/libs ] && [ ! -d ui/libs.bak ]; then mv ui/libs ui/libs.bak; fi
  mkdir -p ui/libs
}
restore_libs() {
  rm -rf ui/libs
  if [ -d ui/libs.bak ]; then mv ui/libs.bak ui/libs; fi
}
trap restore_libs EXIT

for dev in "${DEVICES[@]}"; do
  echo ""
  echo "==== [$dev] 工具链 ===="
  url="${TOOLCHAIN_URL[$dev]:-}"
  [ -n "$url" ] || { echo "未知机型 $dev，跳过"; continue; }
  tc_dir=".toolchains/$dev"
  if [ ! -d "$tc_dir" ]; then
    mkdir -p .toolchains "$tc_dir"
    tarball=".toolchains/$(basename "$url")"
    if [ ! -s "$tarball" ]; then
      echo "下载 $url"
      curl -sL --retry 3 -o "$tarball" "$url"
    fi
    echo "解压到 $tc_dir"
    tar -xjf "$tarball" -C "$tc_dir"
  fi
  cxx="$(find -L "$tc_dir" -name '*-g++' 2>/dev/null | head -n 1)"
  [ -n "$cxx" ] || cxx="$(find -L "$tc_dir" -name '*-c++' 2>/dev/null | head -n 1)"
  if [ -z "$cxx" ]; then
    echo "错误: 工具链里没有 *-g++ ($dev)，目录结构:"
    find "$tc_dir" -maxdepth 3 -type d | head -8
    find -L "$tc_dir" \( -name '*g++*' -o -name '*gcc*' \) 2>/dev/null | head -8
    exit 1
  fi
  prefix="$(dirname "$cxx")/$(basename "$cxx" | sed 's/g++$//')"
  echo "工具链前缀: $prefix"

  echo "==== [$dev] 编译原生 video+fs 模块 ===="
  chmod +x tools/build-native.sh
  tools/build-native.sh --prefix "$prefix" --abi "$dev"

  echo "==== [$dev] 打包 AMR ===="
  stash_libs
  cp dist/native/$dev/libjsapi_better_video*.so ui/libs/libjsapi_better_video.so
  if [ -n "${SHIP_LANGNING[$dev]:-}" ] && [ -f "$ROOT/ui/libs.bak/libjsapi_langningchen.so" ]; then
    cp "$ROOT/ui/libs.bak/libjsapi_langningchen.so" ui/libs/
    echo "含 langningchen(custom.scan) + better_video(video+fs)"
  else
    echo "仅 better_video(video+fs)"
  fi
  rm -f ui/*.amr
  pnpm -C ui package >/dev/null
  src_amr=$(ls ui/*.amr | head -n 1)
  out_amr="dist/releases/better-video-$VERSION-$dev.amr"
  mv "$src_amr" "$out_amr"
  echo "产物: $out_amr ($(du -h "$out_amr" | cut -f1))"
  restore_libs
done

echo ""
echo "== 全部完成 =="
ls -la dist/releases/
