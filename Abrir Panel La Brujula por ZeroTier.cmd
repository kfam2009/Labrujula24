@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-panel-local.ps1" -VmixHost 10.10.10.200
pause
