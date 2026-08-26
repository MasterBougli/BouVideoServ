# Architecture

BouVideoServ est organise en trois couches.

## 1. Couche media

- MediaMTX gere l'ingestion et la distribution des flux
- V1: RTMP uniquement
- V2: RTSP
- V3: WebRTC
- V4: HLS

## 2. Couche controle

- Le binaire Go fournit l'interface web locale
- La configuration est stockee en JSON
- Les reglages initiaux concernent le cache, l'enregistrement et les sources

## 3. Couche traitement

- FFmpeg sera utilise pour les traitements audio/video, l'enregistrement et les
  futures conversions
- La V1 vise la simplicite et la compatibilite avant tout

## Contraintes de la V1

- au moins 3 cameras
- interface francaise
- reseau local uniquement
- enregistrement 24h
- buffer 30s

## Support

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

