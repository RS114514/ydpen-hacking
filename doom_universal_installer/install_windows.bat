@echo off
title DOOM - YDPEN Installer
cd /d "%~dp0" 2>nul
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
if not exist "%~dp0tools\win64\python\python.exe" (
    echo [x] Bundled Python runtime not found.
    echo     Please extract the whole ZIP to a local folder, then run this file again.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
"%~dp0tools\win64\python\python.exe" "%~dp0scripts\installer.py" %*
set "RC=%ERRORLEVEL%"
echo.
echo Press any key to exit...
pause >nul
exit /b %RC%
