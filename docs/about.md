# About BouVideoServ

BouVideoServ is a practical local streaming platform for camera feeds and
live sources.

## What it is

- a local video server for LAN use
- a simple configuration tool for live sources
- a future-ready base for RTSP, WebRTC, and HLS
- a project designed for Windows and Linux first

## What the first version does

- receives RTMP streams
- saves the configuration locally
- keeps a 30-second buffer target
- keeps recordings for 24 hours
- shows the engine status in the web UI
- exposes sample RTMP URLs for OBS and other senders

## Why this structure

The goal is to keep the media path efficient while avoiding a heavy stack.
MediaMTX handles the media routing, Go handles the control layer, and FFmpeg
remains available for encoding, recording, and future conversions.

## Roadmap

- V1: RTMP ingest and configuration
- V2: RTSP support
- V3: WebRTC playback
- V4: HLS support
- later: more advanced camera and transport features

## Support

- [Donation Streamlabs](https://streamlabs.com/bouglitv)
