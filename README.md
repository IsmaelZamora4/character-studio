# Character Studio · MVP 0.1

Editor React/TypeScript con vista previa en navegador y 3 modos: React TSX, Three.js (React Three Fiber) y Remotion.

## Requisitos

- Node.js 20.19+ (recomendado Node 24)
- npm
- Internet para instalar paquetes y para el runtime de Sandpack; `localhost` no implica funcionamiento 100% sin conexión.

## Ejecutar en Windows (PowerShell)

```powershell
cd C:\ruta\character-studio-mvp
npm install
npm run dev
```

Abrir http://127.0.0.1:5173

## Publicar más adelante

```powershell
npm run build
```

Publicar el directorio `dist/` en un hosting estático. Verifica antes las políticas de seguridad (CSP), aislamiento y límites del sandbox.

## Funciones

- React/TSX, Three/R3F y Remotion con ejemplos iniciales independientes.
- Editor y preview con recompilación retrasada.
- Vista libre / 9:16 / 1:1 (proporción del contenedor).
- Guarda automáticamente una versión por modo en `localStorage`.
- Importar un archivo de código de hasta 1 MB (incluidos `.txt` con TSX) o descargarlo como `.tsx`.
- En modo Remotion acepta entradas estándar con `RemotionRoot` y `registerRoot`, adaptándolas al reproductor del MVP.
- En modo Three.js adapta automáticamente `three/addons/controls/OrbitControls.js` a la ruta compatible con el bundler de Sandpack.
- Botón para restaurar ejemplo inicial.

## Límites importantes

- La importación admite un **único archivo** y no resuelve automáticamente los imports relativos de proyectos con varias dependencias locales.
- Debes exportar un componente React por defecto (`export default function App() { ... }`).
- El modo Three.js usa React Three Fiber, no un script Three.js imperativo `document.getElementById(...)` listo para pegar tal cual.
- El modo Remotion integra el reproductor dentro del sandbox y puede presentar incompatibilidades de paquetes/bundler. Si falla, migrar este modo a un runner Vite dedicado y aislado por iframe.
- El código del usuario se ejecuta dentro de Sandpack/iframe, **no es un límite de seguridad suficiente para código arbitrario no confiable**. No publiques una versión abierta a terceros sin endurecer aislamiento, permisos, CSP y acceso a red.
- Sandpack descarga bundles/dependencias; el MVP no es totalmente offline.
- La vista previa NO exporta MP4, PNG ni GIF. La descarga disponible es solo el código fuente.
- Remotion exige compatibilidad de versiones entre `remotion` y `@remotion/player`.
- Three.js está fijado a 0.185.1 por compatibilidad con el bundler en navegador de Sandpack.

## Próximos hitos

1. Importador multiarchivo (zip o carpeta).
2. Runner dedicado Remotion con timeline y controles externos.
3. Más presets y recursos, visor de logs, exportación PNG.
4. Publicación, autenticación opcional y restricciones de ejecución.
