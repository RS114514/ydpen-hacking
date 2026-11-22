#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCH="$(uname -m)"

case "$ARCH" in
  arm64|aarch64)
    PY_TGZ="$DIR/tools/macos/python-arm64.tar.gz"
    CACHE_KEY="macos_arm64"
    ;;
  x86_64|i386)
    PY_TGZ="$DIR/tools/macos/python-x64.tar.gz"
    CACHE_KEY="macos_x64"
    ;;
  *)
    echo "[!] Unsupported macOS arch: $ARCH"
    exit 1
    ;;
esac

PY_CACHE="${TMPDIR:-/tmp}/hl_ydpen_py_${CACHE_KEY}"
PY_BIN="$PY_CACHE/python/bin/python3"

if [ ! -f "$PY_CACHE/.ready" ] || [ ! -x "$PY_BIN" ]; then
  if [ ! -f "$PY_TGZ" ]; then
    echo "[x] Missing bundled Python runtime: $PY_TGZ"
    exit 1
  fi
  echo "[*] 首次运行，正在准备内置 Python 运行环境 ($ARCH)..."
  rm -rf "$PY_CACHE"
  mkdir -p "$PY_CACHE"
  tar -xzf "$PY_TGZ" -C "$PY_CACHE"
  xattr -dr com.apple.quarantine "$PY_CACHE" >/dev/null 2>&1 || true
  touch "$PY_CACHE/.ready"
fi

xattr -dr com.apple.quarantine "$DIR/tools/macos" >/dev/null 2>&1 || true

set +e
"$PY_BIN" "$DIR/scripts/installer.py" "$@"
RC=$?
set -e

if [ -t 0 ] && [ -z "${HL_NO_PAUSE:-}" ] && [ $# -eq 0 ]; then
  echo ""
  read -r -p "按回车键退出..." _ || true
fi
exit "$RC"
