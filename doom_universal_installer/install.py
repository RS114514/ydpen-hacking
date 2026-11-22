#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""《DOOM》词典笔通用安装包 —— 顶层入口（已有 Python 3.8+ 时可直接运行）。"""

from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from installer import run


if __name__ == "__main__":
    run()
