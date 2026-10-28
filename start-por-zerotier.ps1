param(
  [Parameter(Mandatory = $true)]
  [string]$RadioZeroTierIp,

  [int]$Port = 3000,
  [int]$VmixPort = 8088
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Get-Command node -ErrorAction SilentlyContinue

if (-not $node) {
  Write-Host "No encontre Node.js instalado. Instala Node.js LTS o ejecuta con una ruta a node.exe." -ForegroundColor Red
  exit 1
}

$env:PORT = [string]$Port
$env:VMIX_HOST = $RadioZeroTierIp
$env:VMIX_PORT = [string]$VmixPort

Write-Host "Panel local: http://localhost:$Port" -ForegroundColor Green
Write-Host "vMix por ZeroTier: http://$RadioZeroTierIp`:$VmixPort/api/" -ForegroundColor Cyan
Write-Host "Nota: los botones funcionan por API. Program fluido requiere correr el panel en la PC de la radio." -ForegroundColor Yellow

Set-Location $root
node server.js
