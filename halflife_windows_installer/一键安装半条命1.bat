@echo off
title 半条命 1 - 有道词典笔一键安装程序
cd /d "%~dp0"
echo 正在启动内置便携 Python 运行时，请稍候...
"%~dp0tools\python\python.exe" "%~dp0scripts\installer.py" %*
if errorlevel 1 pause
