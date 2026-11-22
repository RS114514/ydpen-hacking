@echo off
title 检测词典笔连接状态
cd /d "%~dp0"
echo 正在检测词典笔连接状态，请稍候...
"%~dp0tools\python\python.exe" "%~dp0scripts\installer.py" --check-only %*
if errorlevel 1 pause
