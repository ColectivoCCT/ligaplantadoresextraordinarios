# Liga de los Plantadores Extraordinarios

Aplicación React + Vite para gestionar el juego de tribus, siembra y riego.

## Flujo recomendado para probar cambios (sin refrescar manualmente)

### 1) Desarrollo con recarga automática (HMR)
```bash
npm run dev
```
- Levanta el servidor local.
- Cada vez que guardas un archivo, la interfaz se actualiza sola en el navegador.

### 2) Verificación rápida de calidad
```bash
npm run check
```
Ejecuta en cadena:
- `npm run lint`
- `npm run build`

### 3) Build en modo watch (validación continua)
```bash
npm run check:watch
```
- Ejecuta `vite build --watch`.
- Recompila automáticamente cuando detecta cambios en el código.

## Scripts disponibles

- `npm run dev`: servidor de desarrollo con hot reload.
- `npm run lint`: revisión estática con ESLint.
- `npm run build`: build de producción.
- `npm run preview`: previsualiza el build.
- `npm run check`: lint + build.
- `npm run build:watch`: build en modo observación.
- `npm run check:watch`: alias de validación continua.

## Flujo sugerido para minijuegos (alumnos)

Estructura simple para que cada minijuego viva en su archivo y sea fácil de revisar:

1. Crear carpeta y archivo por reto:
   - `src/minigames/NombreReto.jsx`
2. Cada minijuego exporta un componente con interfaz común:
   - `onWin(seedsGanadas)`
   - `onExit()`
3. Registrar tarjeta/enlace en `src/views/RetosView.jsx`.
4. Al ganar, sumar semillas del usuario con una función central del motor (`useGameEngine`) para mantener reglas consistentes.
5. Checklist para alumnado antes de entregar:
   - `npm run lint`
   - `npm run build`
   - captura de pantalla del minijuego funcionando.

### Convención recomendada para ejercicios
- Un PR por minijuego.
- Nombre de rama: `reto/<curso>-<equipo>-<minijuego>`.
- En la descripción del PR incluir:
  - objetivo del minijuego,
  - mecánica,
  - puntos/semillas máximas,
  - evidencia visual.
