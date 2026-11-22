@echo off
cd /d "%~dp0"
echo Checking dictionary pen connection...
"%~dp0tools\python\python.exe" "%~dp0scripts\installer.py" --check-only %*
if errorlevel 1 pause
