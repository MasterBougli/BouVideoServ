# BouVideoServ

[English](README.md) | [Français](README.fr.md)

![Version](https://img.shields.io/badge/version-v0.1.3-31d0aa)

BouVideoServ es un proyecto de servidor de video local pensado para una
ingestion RTMP fiable, una configuracion local sencilla y una evolucion
gradual hacia RTSP, WebRTC y HLS.

## Version

- Version actual: `v0.1.3`
- Estado: ampliacion de documentacion, wiki y onboarding

## Lo que ofrece este repositorio

- una interfaz web local ligera
- una configuracion basada en archivos
- una primera version centrada en RTMP
- compatibilidad con Windows y Linux
- un flujo publico de codigo abierto con issues y pull requests

## Objetivos de la V1

- solo ingestión RTMP
- interfaz de configuracion en frances
- al menos 3 camaras
- objetivo de cache de 30 segundos
- conservacion de grabaciones durante 24 horas
- uso solo en red local

## Stack base

- MediaMTX para el enrutamiento de medios
- Go para la capa de control
- FFmpeg para futuros procesos y flujos de grabacion

## Documentacion

- [Acerca de](docs/about.md)
- [Arquitectura](docs/architecture.md)
- [Guia de instalacion](docs/install.md)
- [Guia de uso](docs/usage.md)
- [Wiki](wiki/Home.md)
- [Alcance V1 RTMP](docs/v1-rtmp.md)
- [Ejemplos de entrada RTMP](docs/rtmp-ingest.md)
- [Changelog](CHANGELOG.md)

## Apoyar el proyecto

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Nota de desarrollo

El repositorio esta organizado para evolucionar paso a paso sin perder la
simplicidad de la primera version.
