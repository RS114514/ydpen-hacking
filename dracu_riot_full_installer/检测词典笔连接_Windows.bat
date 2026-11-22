@echo off
chcp 65001 >nul
title 检测词典笔连接
cd /d "%~dp0"
echo ========================================================
echo              正在检测有道词典笔连接状态...
echo ========================================================
echo.
"%~dp0tools\win64\adb\adb.exe" devices
echo.
echo 若状态显示为 "device"，说明连接就绪，可直接运行一键安装脚本！
echo 若显示为 "unauthorized"，请点亮屏幕点击允许调试！
echo 若无输出，请确认数据线插紧并已开启 ADB！
echo.
pause
