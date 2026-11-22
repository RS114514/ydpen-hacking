#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Top-level entry point for DRACU-RIOT! YDPEN installer."""

from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from installer import main

if __name__ == "__main__":
    main()
