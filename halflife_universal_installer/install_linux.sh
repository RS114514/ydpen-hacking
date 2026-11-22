#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCH="$(uname -m)"

PY_BIN=""
if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then
  PY_TGZ="$DIR/tools/linux_x64/python-x64.tar.gz"
  PY_CACHE="${TMPDIR:-/tmp}/hl_ydpen_py_linux_x64"
  if [ -f "$PY_TGZ" ]; then
    if [ ! -f "$PY_CACHE/.ready" ] || [ ! -x "$PY_CACHE/python/bin/python3" ]; then
      echo "[*] 首次运行，正在准备内置 Python 运行环境 ($ARCH)..."
      rm -rf "$PY_CACHE"
      mkdir -p "$PY_CACHE"
      tar -xzf "$PY_TGZ" -C "$PY_CACHE"
      touch "$PY_CACHE/.ready"
    fi
    PY_BIN="$PY_CACHE/python/bin/python3"
  fi
fi

if [ -z "$PY_BIN" ]; then
  if command -v python3 >/dev/null 2>&1; then
    PY_BIN="$(command -v python3)"
  else
    echo "[x] 未找到可用 python3 且当前架构 ($ARCH) 无预置运行库。"
    exit 1
  fi
fi

"$PY_BIN" "$DIR/scripts/installer.py" "$@"
