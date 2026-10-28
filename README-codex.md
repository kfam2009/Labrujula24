# Panel vMix

Panel web local para controlar vMix desde la API HTTP.

## Requisitos

- vMix abierto en la misma maquina.
- Web Controller / API de vMix activo en el puerto `8088`.

## Uso

### Opcion PowerShell

```powershell
.\start-panel.ps1
```

### Opcion Node.js

```powershell
npm start
```

Luego abre:

```text
http://localhost:3000
```

## Configuracion

Por defecto el panel se conecta a `127.0.0.1:8088`. Puedes cambiarlo con variables de entorno:

### PowerShell

```powershell
.\start-panel.ps1 -VmixHost "192.168.1.50" -VmixPort 8088 -Port 3000
```

### Node.js

```powershell
$env:VMIX_HOST="192.168.1.50"
$env:VMIX_PORT="8088"
$env:PORT="3000"
npm start
```

## Controles incluidos

- Monitores NDI de Preview y Program con nombres configurables.
- Cut, Fade, Merge y FTB.
- Start/Stop Recording.
- Start/Stop Streaming.
- Overlay 1 y 2 In/Out.
- Lista de inputs con botones para mandar a Preview o Program.

## Monitores NDI

El navegador no reproduce NDI nativo directamente. Para usar los dos monitores:

1. En vMix, abre `Settings > Outputs / NDI / SRT`.
2. Activa NDI para `Output 1` y dejalo como `Program`.
3. Activa NDI para `Output 2` y configuralo como `Preview`.
4. En el panel, usa los campos `Fuente NDI Preview` y `Fuente NDI Program` para guardar los nombres que vas a ver en NDI Studio Monitor u otro visor NDI.
5. Para ver video dentro del panel, deja las URLs por defecto:
   - `/monitor/program.mjpg`
   - `/monitor/preview.mjpg`

El servidor usa dos rutas:

- Program: `vMix Video` convertido a MJPEG por `ffmpeg`.
- Preview: snapshot del input que esta en Preview, refrescado desde la API de vMix.

El Preview tiene dos modos:

- `Preview seguro`: usa `/monitor/preview.jpg`, funciona siempre pero no es fluido.
- `Preview fluido`: usa `/monitor/preview.mjpg` con `vMix Video External 2`. Para que funcione, en vMix `Settings > External Output`, `External 2` debe estar configurado como `vMix Video / Streaming`.
