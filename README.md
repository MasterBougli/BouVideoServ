# BouVideoServ

[Français](README.fr.md) | [Español](README.es.md)

![Version](https://img.shields.io/badge/version-v0.1.4-31d0aa)

BouVideoServ is a local video server project focused on reliable RTMP intake,
simple local configuration, and a clean path toward RTSP, WebRTC, and HLS.

## Version

- Current version: `v0.1.4`
- Status: docs, wiki, and tutorials reorganization

## What this repo provides

- a lightweight local web interface
- a configuration-driven media setup
- a first release centered on RTMP
- support for Windows and Linux
- a public open source workflow with issues and pull requests

## Current V1 goals

- RTMP ingest only
- local configuration UI in French
- at least 3 cameras
- 30-second cache target
- 24-hour recording retention
- local network only

## Core stack

- MediaMTX for media routing
- Go for the control layer
- FFmpeg for future processing and recording workflows

## Documentation

- [About](docs/about.md)
- [Architecture](docs/architecture.md)
- [Installation guide](tutorials/install.md)
- [Usage guide](tutorials/usage.md)
- [Wiki](wiki/Home.md)
- [V1 RTMP scope](docs/v1-rtmp.md)
- [RTMP ingest examples](docs/rtmp-ingest.md)
- [Changelog](CHANGELOG.md)

## Support the project

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Development note

The repository is structured so we can evolve it step by step without losing
the simplicity of the first release.
