$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

New-Item -ItemType Directory -Force -Path (Join-Path $root "bin") | Out-Null

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    throw "Rust et Cargo sont requis pour construire BouVideoServ."
}

cargo build --release --bin bouvideoserv
Copy-Item -Force -Path (Join-Path $root "target/release/bouvideoserv.exe") -Destination (Join-Path $root "bin/bouvideoserv.exe")
