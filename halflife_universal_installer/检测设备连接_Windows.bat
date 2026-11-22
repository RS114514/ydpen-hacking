@echo off
chcp 65001 >nul
title Half-Life 1 - Check YDPEN Connection
cd /d "%~dp0"
"%~dp0tools\win64\python\python.exe" "%~dp0scripts\installer.py" --check-only %*
echo.
pause
