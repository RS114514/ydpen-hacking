@echo off
chcp 65001 >nul
title DRACU-RIOT! - 有道词典笔一键安装器
cd /d "%~dp0"
echo 正在启动 DRACU-RIOT! 有道词典笔离线安装程序...
"%~dp0tools\win64\python\python.exe" "%~dp0scripts\installer.py" %*
echo.
pause
