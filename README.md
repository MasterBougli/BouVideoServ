# BouVideoServ

BouVideoServ est un projet de serveur video local pense pour la reception de flux
RTMP, la configuration simple depuis une interface web, et une evolution progressive
vers RTSP, WebRTC puis HLS.

## Vision

- D'abord Windows et Linux
- V1 centree sur l'ingestion RTMP, la configuration et l'enregistrement
- Interface web en francais
- Utilisation sur reseau local uniquement
- Base evolutive pour plusieurs flux simultanes

## Support

Si tu veux soutenir le projet:

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Architecture cible

- Moteur media: MediaMTX
- Couche de controle: Go
- Traitements audio/video: FFmpeg
- Configuration locale: fichiers JSON et interface web
- Config MediaMTX de base: [mediamtx.yml](mediamtx.yml)

## Roadmap courte

- V1: RTMP uniquement, configuration, cache 30s, enregistrement 24h
- V2: RTSP
- V3: WebRTC
- V4: HLS

## Debut du dev

Le projet est en cours de mise en place. Les premiers ecrans et la base de
configuration sont ajoutes dans ce depot pour servir de socle a la V1.
