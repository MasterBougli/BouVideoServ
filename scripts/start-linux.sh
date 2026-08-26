#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p data data/recordings data/cache

if [ "${MEDIAMTX_BIN:-}" = "" ] && [ -x "$ROOT/bin/mediamtx" ]; then
  export MEDIAMTX_BIN="$ROOT/bin/mediamtx"
fi

if [ -x "$ROOT/bin/bouvideoserv" ]; then
  echo "Starting BouVideoServ from binary: $ROOT/bin/bouvideoserv"
  exec "$ROOT/bin/bouvideoserv"
fi

if command -v cargo >/dev/null 2>&1; then
  echo "Starting BouVideoServ with cargo run"
  exec cargo run --bin bouvideoserv
fi

echo "BouVideoServ binary not found and Rust/Cargo are not installed. Place bin/bouvideoserv or install Rust." >&2
exit 1
