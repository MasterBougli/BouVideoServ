#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p bin

if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust et Cargo sont requis pour construire BouVideoServ." >&2
  exit 1
fi

cargo build --release --bin bouvideoserv
cp target/release/bouvideoserv bin/bouvideoserv
