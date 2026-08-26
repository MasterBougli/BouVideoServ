#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p bin

if ! command -v go >/dev/null 2>&1; then
  echo "Go is required to build BouVideoServ." >&2
  exit 1
fi

go build -o bin/bouvideoserv ./cmd/bouvideoserv

