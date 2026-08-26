# BouVideoServ

[English](README.md) | [Español](README.es.md)

BouVideoServ est un projet de serveur video local pense pour une reception
RTMP fiable, une configuration simple en local, et une evolution progressive
vers RTSP, WebRTC puis HLS.

## Version

- Version actuelle: `v0.1.0`
- Statut: socle public initial

## Ce que fournit ce depot

- une interface web locale legere
- une configuration pilotee par fichiers
- une premiere version centree sur RTMP
- une compatibilite Windows et Linux
- un flux open source public avec issues et pull requests

## Objectifs de la V1

- ingestion RTMP uniquement
- interface de configuration en francais
- au moins 3 cameras
- cible de cache a 30 secondes
- conservation des enregistrements pendant 24h
- usage sur reseau local uniquement

## Stack de base

- MediaMTX pour le routage des flux
- Go pour la couche de controle
- FFmpeg pour les futurs traitements et flux d'enregistrement

## Documentation

- [A propos](docs/about.md)
- [Architecture](docs/architecture.md)
- [Périmètre V1 RTMP](docs/v1-rtmp.md)
- [Exemples d'entree RTMP](docs/rtmp-ingest.md)
- [Changelog](CHANGELOG.md)

## Soutenir le projet

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Note de developpement

Le depot est structure pour evoluer par etapes sans compliquer la premiere
version.
