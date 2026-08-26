# BouVideoServ

[Français](README.fr.md) | [Español](README.es.md)

![Version](https://img.shields.io/badge/version-v0.2.0-31d0aa)

BouVideoServ is a lightweight local video server for reliable RTMP ingest,
simple on-prem configuration, and a clean path toward RTSP, WebRTC, and HLS.

## Version

- Current version: `v0.2.0`
- Status: Rust rewrite of the control layer and server bootstrap

## At a glance

- local network only
- RTMP first
- Windows and Linux first
- French web configuration UI
- minimum target of 3 cameras
- 30-second cache target
- 24-hour recording target
- public open source workflow with issues and pull requests

## Current V1 focus

- RTMP ingest only
- local configuration UI in French
- at least 3 cameras
- 30-second cache target
- 24-hour recording retention
- local network only

## Core stack

- MediaMTX for media routing
- Rust with Axum and Tokio for the control layer
- FFmpeg for future processing and recording workflows

## Documentation

- [About](docs/about.md)
- [Architecture](docs/architecture.md)
- [Installation guide](tutorials/install.md)
- [Usage guide](tutorials/usage.md)
- [Wiki](wiki/Home.md)
- [Quick Start](wiki/Quick-Start.md)
- [Development structure](docs/development.md)
- [V1 RTMP scope](docs/v1-rtmp.md)
- [RTMP ingest examples](docs/rtmp-ingest.md)
- [Changelog](CHANGELOG.md)

## Support the project

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Development note

The repository is structured so we can evolve it step by step without losing
the simplicity of the first release.
