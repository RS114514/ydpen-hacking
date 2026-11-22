@echo off
cd /d "%~dp0"
echo Starting portable Python runtime...
"%~dp0tools\python\python.exe" "%~dp0scripts\installer.py" %*
if errorlevel 1 pause
