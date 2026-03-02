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
