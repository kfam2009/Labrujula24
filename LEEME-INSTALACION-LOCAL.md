# Panel La Brujula - instalacion local portable

Esta carpeta esta preparada para llevarla a la PC original donde corre vMix.
El panel se conecta por defecto a vMix local en 127.0.0.1:8088.

## Requisitos

1. vMix abierto en la misma PC.
2. Web Controller/API activo en vMix: Settings > Web Controller.
3. No hace falta instalar Node.js: esta carpeta trae `runtime/node.exe`.

## Como abrir

Opcion simple:

- Doble click en `Abrir Panel La Brujula.cmd`.
- O doble click en `Abrir Panel La Brujula.lnk`.

Luego abrir en el navegador:

```text
http://localhost:3000
```

## Archivos incluidos

- `server.js`: servidor local y puente hacia vMix.
- `package.json`: comando npm start.
- `public/`: interfaz del panel.
- `runtime/node.exe`: Node portable incluido.
- `tools/ffmpeg/`: ffmpeg portable para monitores fluidos.
- `start-panel-local.ps1`: arranque local recomendado.
- `Abrir Panel La Brujula.cmd`: arranque por doble click.
- `Abrir Panel La Brujula.lnk`: acceso directo.

## Notas

- Copiar la carpeta completa, incluyendo `runtime`.
- Si el puerto 3000 esta ocupado, ejecutar: `.\start-panel-local.ps1 -Port 3001` y abrir `http://localhost:3001`.
- Para conectarlo a un vMix remoto por ZeroTier, ejecutar: `.\start-panel-local.ps1 -VmixHost 10.10.10.200`.
- El arranque muestra tambien las URLs `http://IP-ZEROTIER:3000` para entrar al panel desde otros equipos de la misma red ZeroTier.
- Para que otros equipos entren al panel por red local, abrir el puerto TCP 3000 en el firewall de Windows.

## Monitores

- Preview y Program estan activos dentro del panel.
- Usan MJPEG fluido: `/monitor/preview.mjpg` y `/monitor/program.mjpg`.
- El paquete ya trae `tools/ffmpeg/ffmpeg.exe` para capturar `vMix Video` y `vMix Video External 2`.
- En vMix, `External 2` debe estar configurado para el Preview fluido.

