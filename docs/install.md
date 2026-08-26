# Guide d'installation

Ce guide explique comment lancer BouVideoServ sur Windows ou Linux avec la
version V1 actuelle.

## Prerequis

- Windows 10/11 ou une distribution Linux recente
- le binaire `BouVideoServ`
- le binaire `MediaMTX`
- au moins une source RTMP, par exemple OBS

## Installation rapide sur Windows

1. Telecharge ou compile `bouvideoserv.exe`
2. Place `bouvideoserv.exe` dans `bin/`
3. Place `mediamtx.exe` dans `bin/`
4. Lance `scripts/start-windows.ps1`
5. Ouvre l'interface locale depuis l'adresse affichee dans la console

## Installation rapide sur Linux

1. Compile ou recupere le binaire `bouvideoserv`
2. Place `bouvideoserv` dans `bin/`
3. Place `mediamtx` dans `bin/`
4. Lance `scripts/start-linux.sh`
5. Ouvre l'interface locale depuis l'adresse affichee dans la console

## Dossier genere

Au premier lancement, BouVideoServ cree:

- `data/config.json`
- `data/recordings/`
- `data/cache/`
- `mediamtx/mediamtx.yml`

## Porte RTMP

Par defaut, le moteur RTMP ecoute sur `1935`.

## Support

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

