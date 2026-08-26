$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

New-Item -ItemType Directory -Force -Path (Join-Path $root "bin") | Out-Null

if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    throw "Go is required to build BouVideoServ."
}

go build -o bin/bouvideoserv.exe ./cmd/bouvideoserv

