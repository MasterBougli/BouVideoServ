# Guide d'utilisation

Ce guide resume le fonctionnement de BouVideoServ en V1.

## Ouvrir l'interface

Lance le serveur, puis ouvre l'adresse affichee dans la console.

Tu verras:

- la page de configuration
- l'etat du moteur RTMP
- les exemples d'entree RTMP
- le bouton pour ouvrir le tableau de bord

## Configurer une camera

1. Ouvre la page de configuration
2. Renseigne la camera dans la liste des flux
3. Sauvegarde la configuration
4. Branche la source RTMP sur l'URL proposee

## Exemple OBS

- Serveur: `rtmp://127.0.0.1:1935`
- Cle de flux: `camera1`

URL complete:

```text
rtmp://127.0.0.1:1935/camera1
```

## Tableau de bord

Le tableau de bord sert pour la vue mosaïque des flux.
La V1 affiche surtout une structure de tableau de bord, le flux video complet
arrivera plus tard avec les evolutions RTSP, WebRTC et HLS.

## Conservation

- Cache cible: 30 secondes
- Enregistrements: 24 heures

## Support

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

