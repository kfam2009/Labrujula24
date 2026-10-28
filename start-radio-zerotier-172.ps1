$env:VMIX_HOST = "172.25.182.175"
$env:VMIX_PORT = "8088"
$env:PORT = "3000"

Write-Host "Panel local: http://localhost:3000" -ForegroundColor Green
Write-Host "vMix radio por ZeroTier: http://172.25.182.175:8088/api/" -ForegroundColor Cyan
Write-Host "Program fluido queda para cuando el panel corra en la PC de la radio." -ForegroundColor Yellow

node server.js
