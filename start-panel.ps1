param(
  [int]$Port = 3000,
  [string]$VmixHost = "127.0.0.1",
  [int]$VmixPort = 8088
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$public = Join-Path $root "public"
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$ffmpegPath = "C:\Program Files\DownloadHelper CoApp\ffmpeg.exe"
$monitorDevices = @{
  "/monitor/program.mjpg" = "vMix Video"
  "/monitor/preview.mjpg" = "vMix Video External 2"
}
$previewSnapshotPath = Join-Path $root "preview-live.jpg"
$programSnapshotPath = Join-Path $root "program-live.jpg"
$programOutputSnapshotPath = Join-Path $root "program-output-live.jpg"
$inputSnapshotDir = Join-Path $root "input-snapshots"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml; charset=utf-8"
}

function Write-HttpResponse {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType
  )

  $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

function Write-TextResponse {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$Text,
    [string]$ContentType = "text/plain; charset=utf-8"
  )

  Write-HttpResponse -Stream $Stream -StatusCode $StatusCode -StatusText $StatusText -Body ([System.Text.Encoding]::UTF8.GetBytes($Text)) -ContentType $ContentType
}

function Write-StreamHeader {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType
  )

  $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
}

function Invoke-VmixCommand {
  param([string]$Path)

  try {
    Invoke-WebRequest -Uri "http://$VmixHost`:$VmixPort$Path" -UseBasicParsing -TimeoutSec 2 | Out-Null
  } catch {
  }
}

function Stream-Monitor {
  param(
    [System.IO.Stream]$Stream,
    [string]$Device
  )

  if (-not (Test-Path -LiteralPath $ffmpegPath -PathType Leaf)) {
    Write-TextResponse -Stream $Stream -StatusCode 500 -StatusText "Server Error" -Text "No encontre ffmpeg en $ffmpegPath"
    return
  }

  Invoke-VmixCommand -Path "/api/?Function=StartExternal"

  Write-StreamHeader -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType "multipart/x-mixed-replace; boundary=ffmpeg"

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $ffmpegPath
  $psi.Arguments = "-hide_banner -loglevel error -f dshow -framerate 50 -video_size 1280x720 -i video=""$Device"" -an -vf scale=640:360,fps=10 -c:v mjpeg -q:v 6 -f mpjpeg pipe:1"
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  $buffer = New-Object byte[] 8192

  try {
    while (-not $process.HasExited) {
      $read = $process.StandardOutput.BaseStream.Read($buffer, 0, $buffer.Length)
      if ($read -le 0) {
        break
      }
      $Stream.Write($buffer, 0, $read)
    }
  } finally {
    if (-not $process.HasExited) {
      $process.Kill()
    }
    $process.Dispose()
  }
}

function Get-VmixXml {
  return (Invoke-WebRequest -Uri "http://$VmixHost`:$VmixPort/api/" -UseBasicParsing -TimeoutSec 5).Content
}

function Stream-PreviewSnapshot {
  param([System.IO.Stream]$Stream)

  try {
    $xml = [xml](Get-VmixXml)
    $preview = $xml.vmix.preview

    if (-not $preview) {
      Write-TextResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found" -Text "Preview not found"
      return
    }

    $encodedPath = [System.Uri]::EscapeDataString($previewSnapshotPath)
    Invoke-WebRequest -Uri "http://$VmixHost`:$VmixPort/api/?Function=SnapshotInput&Input=$preview&Value=$encodedPath" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Start-Sleep -Milliseconds 500

    if (-not (Test-Path -LiteralPath $previewSnapshotPath -PathType Leaf)) {
      Write-TextResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found" -Text "Snapshot not found"
      return
    }

    Write-HttpResponse -Stream $Stream -StatusCode 200 -StatusText "OK" -Body ([System.IO.File]::ReadAllBytes($previewSnapshotPath)) -ContentType "image/jpeg"
  } catch {
    Write-TextResponse -Stream $Stream -StatusCode 502 -StatusText "Bad Gateway" -Text "No pude generar snapshot de Preview"
  }
}

function Stream-ProgramSnapshot {
  param([System.IO.Stream]$Stream)

  try {
    $encodedPath = [System.Uri]::EscapeDataString($programOutputSnapshotPath)
    Invoke-WebRequest -Uri "http://$VmixHost`:$VmixPort/api/?Function=Snapshot&Value=$encodedPath" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Start-Sleep -Milliseconds 180

    if (-not (Test-Path -LiteralPath $programOutputSnapshotPath -PathType Leaf)) {
      Write-TextResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found" -Text "Snapshot not found"
      return
    }

    Write-HttpResponse -Stream $Stream -StatusCode 200 -StatusText "OK" -Body ([System.IO.File]::ReadAllBytes($programOutputSnapshotPath)) -ContentType "image/jpeg"
  } catch {
    Write-TextResponse -Stream $Stream -StatusCode 502 -StatusText "Bad Gateway" -Text "No pude generar snapshot de Program"
  }
}

function Stream-InputSnapshot {
  param(
    [System.IO.Stream]$Stream,
    [string]$InputNumber
  )

  try {
    if (-not (Test-Path -LiteralPath $inputSnapshotDir -PathType Container)) {
      New-Item -ItemType Directory -Path $inputSnapshotDir | Out-Null
    }

    $snapshotPath = Join-Path $inputSnapshotDir "input-$InputNumber.jpg"
    $encodedPath = [System.Uri]::EscapeDataString($snapshotPath)
    Invoke-WebRequest -Uri "http://$VmixHost`:$VmixPort/api/?Function=SnapshotInput&Input=$InputNumber&Value=$encodedPath" -UseBasicParsing -TimeoutSec 5 | Out-Null
    Start-Sleep -Milliseconds 160

    if (-not (Test-Path -LiteralPath $snapshotPath -PathType Leaf)) {
      Write-TextResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found" -Text "Snapshot not found"
      return
    }

    Write-HttpResponse -Stream $Stream -StatusCode 200 -StatusText "OK" -Body ([System.IO.File]::ReadAllBytes($snapshotPath)) -ContentType "image/jpeg"
  } catch {
    Write-TextResponse -Stream $Stream -StatusCode 502 -StatusText "Bad Gateway" -Text "No pude generar snapshot del input"
  }
}

function Read-RequestLine {
  param([System.IO.Stream]$Stream)

  $buffer = New-Object byte[] 4096
  $count = $Stream.Read($buffer, 0, $buffer.Length)
  if ($count -le 0) {
    return $null
  }

  $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $count)
  return ($requestText -split "`r?`n")[0]
}

$listener.Start()

Write-Host "Panel vMix: http://localhost:$Port"
Write-Host "API vMix: http://$VmixHost`:$VmixPort/api/"
Write-Host "Presiona Ctrl+C para cerrar."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $requestLine = Read-RequestLine -Stream $stream

      if (-not $requestLine) {
        continue
      }

      $parts = $requestLine.Split(" ")
      if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
        Write-TextResponse -Stream $stream -StatusCode 405 -StatusText "Method Not Allowed" -Text "Method not allowed"
        continue
      }

      $rawTarget = $parts[1]
      $uri = [System.Uri]::new("http://localhost$rawTarget")

      if ($uri.AbsolutePath -eq "/vmix") {
        try {
          $target = "http://$VmixHost`:$VmixPort/api/$($uri.Query)"
          $vmixResponse = Invoke-WebRequest -Uri $target -UseBasicParsing -TimeoutSec 5
          Write-TextResponse -Stream $stream -StatusCode 200 -StatusText "OK" -Text $vmixResponse.Content -ContentType "text/xml; charset=utf-8"
        } catch {
          $json = @{
            error = "No pude conectar con vMix."
            host = $VmixHost
            port = $VmixPort
            hint = "Verifica que vMix este abierto y que Web Controller / API este activo."
          } | ConvertTo-Json -Compress
          Write-TextResponse -Stream $stream -StatusCode 502 -StatusText "Bad Gateway" -Text $json -ContentType "application/json; charset=utf-8"
        }
        continue
      }

      if ($monitorDevices.ContainsKey($uri.AbsolutePath)) {
        Stream-Monitor -Stream $stream -Device $monitorDevices[$uri.AbsolutePath]
        continue
      }

      if ($uri.AbsolutePath -eq "/monitor/preview.jpg") {
        Stream-PreviewSnapshot -Stream $stream
        continue
      }

      if ($uri.AbsolutePath -eq "/monitor/program.jpg") {
        Stream-ProgramSnapshot -Stream $stream
        continue
      }

      if ($uri.AbsolutePath -match "^/snapshot/input/(\d+)\.jpg$") {
        Stream-InputSnapshot -Stream $stream -InputNumber $Matches[1]
        continue
      }

      $relativePath = [System.Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }

      $filePath = Join-Path $public $relativePath
      $fullPath = [System.IO.Path]::GetFullPath($filePath)
      $publicFullPath = [System.IO.Path]::GetFullPath($public)

      if (-not $fullPath.StartsWith($publicFullPath)) {
        Write-TextResponse -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Text "Forbidden"
        continue
      }

      if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        Write-TextResponse -Stream $stream -StatusCode 404 -StatusText "Not Found" -Text "Not found"
        continue
      }

      $ext = [System.IO.Path]::GetExtension($fullPath)
      $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
      Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText "OK" -Body ([System.IO.File]::ReadAllBytes($fullPath)) -ContentType $contentType
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
