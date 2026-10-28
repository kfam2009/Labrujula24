@echo off
cd /d "%~dp0"
set PORT=3010
set VMIX_HOST=172.25.182.175
set VMIX_PORT=8088
start "" chrome "http://localhost:3010"
".\runtime\node.exe" ".\server.js"
