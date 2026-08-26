# About BouVideoServ

BouVideoServ is being built as a practical local streaming platform for
camera feeds and live sources.

## Project direction

- start with RTMP ingestion
- keep the local configuration clear and simple
- support at least 3 cameras from the beginning
- preserve a small buffer for near-live workflows
- record streams for a configurable period
- keep the project LAN-focused for V1

## Why this structure

The goal is to keep the media path efficient while avoiding a heavy stack.
MediaMTX handles the media routing, Go handles the control layer, and FFmpeg
remains available for encoding, recording, and future conversions.

## Roadmap

- V1: RTMP ingest + configuration
- V2: RTSP support
- V3: WebRTC playback
- V4: HLS support
- later: more advanced camera and transport features

## Support

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

