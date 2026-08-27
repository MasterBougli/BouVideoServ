# Demarrage rapide

Ce guide rassemble le chemin le plus court pour lancer BouVideoServ en local.

## Avant de commencer

- Windows ou Linux
- Rust et Cargo
- un binaire `MediaMTX`
- au moins une source RTMP, par exemple OBS

## Lancer le serveur

### Windows

1. lance `scripts/build-windows.ps1`
2. place `mediamtx.exe` dans `bin/`
3. lance `scripts/start-windows.ps1`
4. ouvre l'interface locale depuis l'adresse affichee dans la console

### Linux

1. lance `scripts/build-linux.sh`
2. place `mediamtx` dans `bin/`
3. lance `scripts/start-linux.sh`
4. ouvre l'interface locale depuis l'adresse affichee dans la console

## Premiere camera

Exemple OBS:

- Serveur: `rtmp://127.0.0.1:1935`
- Cle de flux: `camera1`

URL complete:

```text
rtmp://127.0.0.1:1935/camera1
```

## Ce que tu verras

- la page de configuration
- le bouton pour ouvrir le tableau de bord
- le bouton pour ouvrir l'ecran de connexion camera
- le bouton pour ouvrir le profil LAN
- l'etat du moteur RTMP
- les liens vers les exemples d'entree
- la detection LAN recommandee pour partager le bon lien

## Liens utiles

- [Installation](Installation.md)
- [Utilisation](Utilisation.md)
- [Architecture](../docs/architecture.md)
- [Perimetre V1 RTMP](../docs/v1-rtmp.md)
