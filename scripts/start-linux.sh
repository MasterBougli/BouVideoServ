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

if command -v go >/dev/null 2>&1; then
  echo "Starting BouVideoServ with go run"
  exec go run ./cmd/bouvideoserv
fi

echo "BouVideoServ binary not found and Go is not installed. Place bin/bouvideoserv or install Go." >&2
exit 1

