param(
    [string]$AppBinary = "",
    [string]$MediaTmxBinary = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

New-Item -ItemType Directory -Force -Path (Join-Path $root "data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "data/recordings") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root "data/cache") | Out-Null

if (-not $MediaTmxBinary) {
    $candidate = Join-Path $root "bin/mediamtx.exe"
    if (Test-Path $candidate) {
        $MediaTmxBinary = $candidate
    }
}

if ($MediaTmxBinary) {
    $env:MEDIAMTX_BIN = $MediaTmxBinary
}

if (-not $AppBinary) {
    $candidate = Join-Path $root "bin/bouvideoserv.exe"
    if (Test-Path $candidate) {
        $AppBinary = $candidate
    }
}

if ($AppBinary) {
    Write-Host "Starting BouVideoServ from binary: $AppBinary"
    & $AppBinary
    exit $LASTEXITCODE
}

if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Host "Starting BouVideoServ with go run"
    go run ./cmd/bouvideoserv
    exit $LASTEXITCODE
}

throw "BouVideoServ binary not found and Go is not installed. Place bin/bouvideoserv.exe or install Go."

