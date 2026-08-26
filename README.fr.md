# BouVideoServ

[English](README.md) | [Español](README.es.md)

![Version](https://img.shields.io/badge/version-v0.1.6-31d0aa)

BouVideoServ est un serveur video local leger pense pour une reception RTMP
fiable, une configuration simple en local, et une evolution progressive vers
RTSP, WebRTC puis HLS.

## Version

- Version actuelle: `v0.1.6`
- Statut: simplification du README, du wiki et de la structure de developpement

## Apercu

- reseau local uniquement
- RTMP en priorite
- Windows et Linux d'abord
- interface web de configuration en francais
- objectif minimum de 3 cameras
- cache cible a 30 secondes
- conservation cible de 24 heures
- flux open source public avec issues et pull requests

## Cible de la V1

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
- [Guide d'installation](tutorials/install.md)
- [Guide d'utilisation](tutorials/usage.md)
- [Wiki](wiki/Home.md)
- [Demarrage rapide](wiki/Quick-Start.md)
- [Structure de developpement](docs/development.md)
- [Périmètre V1 RTMP](docs/v1-rtmp.md)
- [Exemples d'entree RTMP](docs/rtmp-ingest.md)
- [Changelog](CHANGELOG.md)

## Soutenir le projet

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Note de developpement

Le depot est structure pour evoluer par etapes sans compliquer la premiere
version.
