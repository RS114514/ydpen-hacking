@echo off
chcp 65001 >nul
title Half-Life 1 - YDPEN Installer
cd /d "%~dp0"
"%~dp0tools\win64\python\python.exe" "%~dp0scripts\installer.py" %*
echo.
pause
