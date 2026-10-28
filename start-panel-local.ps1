param(
  [int]$Port = 3000,
  [string]$VmixHost = "127.0.0.1",
  [int]$VmixPort = 8088,
  [string]$ServerHost = "0.0.0.0"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portableNode = Join-Path $root "runtime\node.exe"
$node = $null

if (Test-Path -LiteralPath $portableNode -PathType Leaf) {
  $node = $portableNode
} else {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) {
    $node = $nodeCommand.Source
  }
}

if (-not $node) {
  Write-Host "No encontre Node.js." -ForegroundColor Red
  Write-Host "Esta entrega deberia traer runtime\node.exe. Copia la carpeta completa otra vez." -ForegroundColor Yellow
  Read-Host "Presiona Enter para cerrar"
  exit 1
}

$env:PORT = [string]$Port
$env:HOST = $ServerHost
$env:VMIX_HOST = $VmixHost
$env:VMIX_PORT = [string]$VmixPort

Write-Host "Panel La Brujula local: http://localhost:$Port" -ForegroundColor Green

if ($ServerHost -eq "0.0.0.0") {
  $zeroTierIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -like "ZeroTier One*" } |
    Select-Object -ExpandProperty IPAddress -Unique

  foreach ($ip in $zeroTierIps) {
    Write-Host "Panel La Brujula ZeroTier: http://$ip`:$Port" -ForegroundColor Green
  }
} else {
  Write-Host "Panel La Brujula host: http://$ServerHost`:$Port" -ForegroundColor Green
}

Write-Host "vMix API: http://$VmixHost`:$VmixPort/api/" -ForegroundColor Cyan
Write-Host "Node usado: $node" -ForegroundColor DarkGray
Write-Host "Presiona Ctrl+C para cerrar el panel." -ForegroundColor Yellow
Write-Host ""

Set-Location $root
& $node server.js
