# BouVideoServ

[English](README.md) | [Français](README.fr.md)

![Version](https://img.shields.io/badge/version-v0.2.0-31d0aa)

BouVideoServ es un servidor de video local ligero pensado para una ingestion
RTMP fiable, una configuracion local sencilla y una evolucion gradual hacia
RTSP, WebRTC y HLS.

## Version

- Version actual: `v0.2.0`
- Estado: reimplementacion en Rust de la capa de control y del arranque

## Vista rapida

- solo red local
- prioridad RTMP
- Windows y Linux primero
- interfaz web de configuracion en frances
- objetivo minimo de 3 camaras
- cache objetivo de 30 segundos
- retencion objetivo de 24 horas
- flujo publico de codigo abierto con issues y pull requests

## Enfoque de la V1

- solo ingestión RTMP
- interfaz de configuracion en frances
- al menos 3 camaras
- objetivo de cache de 30 segundos
- conservacion de grabaciones durante 24 horas
- uso solo en red local

## Stack base

- MediaMTX para el enrutamiento de medios
- Rust con Axum y Tokio para la capa de control
- FFmpeg para futuros procesos y flujos de grabacion

## Documentacion

- [Acerca de](docs/about.md)
- [Arquitectura](docs/architecture.md)
- [Guia de instalacion](tutorials/install.md)
- [Guia de uso](tutorials/usage.md)
- [Wiki](wiki/Home.md)
- [Inicio rapido](wiki/Quick-Start.md)
- [Estructura de desarrollo](docs/development.md)
- [Alcance V1 RTMP](docs/v1-rtmp.md)
- [Ejemplos de entrada RTMP](docs/rtmp-ingest.md)
- [Changelog](CHANGELOG.md)

## Apoyar el proyecto

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

## Nota de desarrollo

El repositorio esta organizado para evolucionar paso a paso sin perder la
simplicidad de la primera version.
