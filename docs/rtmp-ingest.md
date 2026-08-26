# Entree RTMP

Pour la V1, BouVideoServ accepte des sources RTMP.

## Exemple OBS

- Serveur: `rtmp://127.0.0.1:1935`
- Cle de stream: `camera1`

OBS peut alors publier vers:

```text
rtmp://127.0.0.1:1935/camera1
```

## Exemple pour plusieurs caméras

- `rtmp://127.0.0.1:1935/camera1`
- `rtmp://127.0.0.1:1935/camera2`
- `rtmp://127.0.0.1:1935/camera3`

## Notes

- Le moteur RTMP est pense pour le reseau local
- L'enregistrement est conserve 24h
- La V1 ne fait pas encore d'affichage complet des flux

## Donation

- [Donation Streamlabs](https://streamlabs.com/bouglitv)

