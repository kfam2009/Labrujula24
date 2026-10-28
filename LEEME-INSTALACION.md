# Panel La Brujula Radio

Carpeta lista para llevar a la PC de la radio o usar desde otra PC conectada por ZeroTier.

## Archivos necesarios

- `server.js`: servidor local del panel y puente hacia vMix.
- `package.json`: comandos de Node.js.
- `public/index.html`: estructura del panel.
- `public/app.js`: logica de botones, zocalos, overlays y monitores.
- `public/styles.css`: diseno visual.
- `start-radio-local.ps1`: arranque recomendado en la PC donde corre vMix.
- `start-por-zerotier.ps1`: arranque desde otra PC apuntando al vMix de la radio por ZeroTier.

No hacen falta `node_modules`, porque el panel no usa dependencias externas.

## Requisitos

1. vMix abierto.
2. vMix Web Controller/API activo en `Settings > Web Controller`.
3. Node.js LTS instalado en la PC donde se ejecuta el panel.
4. Si se entra desde otra PC/tablet/celular, abrir el puerto `3000` en el firewall de Windows de la PC que ejecuta el panel.

## Modo recomendado: panel en la PC de la radio

En la PC de la radio:

```powershell
cd "C:\Ruta\al\panel"
.\start-radio-local.ps1
```

En esa misma PC se abre:

```text
http://localhost:3000
```

Desde otra PC por ZeroTier:

```text
http://IP-ZEROTIER-DE-LA-RADIO:3000
```

Este modo es el mejor para Program fluido, porque puede capturar `vMix Video` localmente.

## Modo remoto: panel en otra PC y vMix en la radio

En tu PC:

```powershell
cd "C:\Ruta\al\panel"
.\start-por-zerotier.ps1 -RadioZeroTierIp "IP-ZEROTIER-DE-LA-RADIO"
```

Para esta radio ya queda preparado:

```powershell
.\start-radio-zerotier-172.ps1
```

Ese script apunta a:

```text
172.25.182.175
```

Abrir:

```text
http://localhost:3000
```

En este modo los botones funcionan por la API de vMix. Program fluido no es prioridad aca, porque `vMix Video` existe en la PC de la radio, no en la PC remota.

## Firewall

Para que otros equipos entren al panel:

```powershell
New-NetFirewallRule -DisplayName "Panel vMix Radio 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

Para controlar vMix remoto por API desde otra PC:

```powershell
New-NetFirewallRule -DisplayName "vMix API 8088" -Direction Inbound -Protocol TCP -LocalPort 8088 -Action Allow
```

## Prueba rapida

Panel:

```text
http://localhost:3000
```

vMix API:

```text
http://127.0.0.1:8088/api/
```

Por ZeroTier:

```text
http://IP-ZEROTIER-DE-LA-RADIO:8088/api/
```
