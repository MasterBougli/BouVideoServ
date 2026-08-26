# Development structure

This document records the structure we want to keep as BouVideoServ grows on
Windows first and Linux right after.

## Principles

- keep one codebase for all platforms
- keep the same configuration model everywhere
- keep the media path lightweight
- keep platform-specific launch scripts small
- keep the web UI separate from the media engine

## Current layout

- `src/main.rs` for the executable entry point
- `src/state.rs` for server lifecycle and runtime state
- `src/config.rs` for saved settings and defaults
- `src/mediamtx.rs` for MediaMTX integration
- `src/lib.rs` for module exports
- `Cargo.toml` for the Rust package definition
- `web/` for the local interface
- `web/camera.html` and `web/camera.js` for the camera onboarding screen
- `scripts/` for Windows and Linux launch helpers
- `tutorials/` for setup and usage guides
- `wiki/` for Markdown wiki pages

## Windows path

- `scripts/build-windows.ps1` builds with Cargo and copies `bin/bouvideoserv.exe`
- `scripts/start-windows.ps1` starts the app and prepares `data/`
- `data/cache/` is the short buffer area
- `data/recordings/` stores long-retention capture files

## Linux path

- `scripts/build-linux.sh` builds with Cargo and copies `bin/bouvideoserv`
- `scripts/start-linux.sh` starts the app and prepares `data/`
- the same `data/` layout is reused
- Raspberry Pi follows the same Linux rules

## Next platform work

- keep the launch scripts aligned on both systems
- add packaging rules when releases become needed
- document platform-specific notes only when they diverge
