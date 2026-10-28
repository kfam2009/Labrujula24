# Panel La Brújula

Panel web para controlar vMix (API en el puerto 8088). Corre en la misma PC que vMix
con un Node portable y muestra los monitores Preview/Program con ffmpeg.

## Qué hay en este repo

| Dónde | Qué es |
|---|---|
| `main` (raíz) | **Versión vigente**, la que corre en la PC del cliente (oct 2026) |
| `zocalos/` | Panel aparte, solo zócalos |
| rama `corcel-fiat-trailcar` | PUBLIC del 3/9/2026 (Codex) con Corcel / Fiat / Trailcar. No está en el cliente |
| tags `v2026-06-codex`, `v2026-08-solo-panel`, `v2026-08-amo-viajar` | Versiones viejas, como referencia |

## Instalar en una PC nueva

1. Bajar el repo (botón **Code → Download ZIP**) y descomprimirlo, por ejemplo en `C:\Panel La Brujula`.
2. Agregar los binarios que **no** están en GitHub:
   - `runtime\node.exe` → de <https://nodejs.org> (Windows Binary .zip, x64), sacar solo `node.exe`.
   - `tools\ffmpeg\ffmpeg.exe` (+ sus .dll) → build "full shared" de <https://www.gyan.dev/ffmpeg/builds/>.
     Si ffmpeg ya está instalado en Windows, el servidor lo encuentra solo.
3. En vMix: Settings → Web Controller activado. External 2 configurado para el Preview.
4. Doble click en `Abrir Panel La Brujula.cmd` y entrar a <http://localhost:3000>.

Para vMix en otra PC por ZeroTier: `Abrir Panel La Brujula por ZeroTier.cmd` (usa 10.10.10.200).
Más detalle en `LEEME-INSTALACION-LOCAL.md`.
