param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Get-Command node -ErrorAction SilentlyContinue

if (-not $node) {
  Write-Host "No encontre Node.js instalado. Instala Node.js LTS o ejecuta con una ruta a node.exe." -ForegroundColor Red
  exit 1
}

$env:PORT = [string]$Port
$env:VMIX_HOST = "127.0.0.1"
$env:VMIX_PORT = "8088"

Write-Host "Panel Radio: http://localhost:$Port" -ForegroundColor Green
Write-Host "vMix API: http://127.0.0.1:8088/api/" -ForegroundColor Cyan
Write-Host "Desde otra PC por ZeroTier: http://IP-ZEROTIER-DE-LA-RADIO:$Port" -ForegroundColor Yellow

Set-Location $root
node server.js
