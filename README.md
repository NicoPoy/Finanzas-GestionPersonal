# Finanzas Gestion Personal

Aplicacion React + API Python para administrar gastos mensuales personales.

El frontend permite cargar tarjetas por banco, gastos fijos por seccion, sueldo, restante mensual, proyeccion de cuotas y registro anual de pagos. El backend esta preparado con FastAPI para crecer hacia usuarios, login real y persistencia en MongoDB.

## Levantar el frontend

Para trabajar solo el front:

```powershell
cd C:\Users\prog32np\Desktop\Finanzas
npm install
npm run dev -- --host localhost --port 5173 --strictPort
```

Abrir:

```text
http://localhost:5173
```

## Levantar con Vercel dev

Para probar front y API como lo va a ejecutar Vercel:

```powershell
cd C:\Users\prog32np\Desktop\Finanzas
npx vercel dev
```

Vercel suele levantar en:

```text
http://localhost:3000
```

API:

```text
http://localhost:3000/api/health
http://localhost:3000/api/docs
http://localhost:3000/api/db/ping
```

`/api/db/ping` solo prueba la conexion con Atlas. No guarda datos ni crea colecciones.

## Estructura principal

```text
src/
  App.jsx
  main.jsx
  styles.css
  components/
  data/
  domain/
  features/
  utils/
api/
  index.py
  app/
docs/
```

`src/App.jsx` quedo chico a proposito: decide si mostrar el login visual o la app privada. La logica de finanzas vive en `src/features/finance/FinanceApp.jsx`, y cada pantalla grande esta separada en su propia carpeta dentro de `src/features`.

La explicacion completa esta en [docs/arquitectura.md](docs/arquitectura.md).

## Build

```powershell
npm run build
```

Este comando valida que React/Vite compile correctamente para produccion.

## Auth

La pantalla publica muestra solo login. Los usuarios se crean desde Swagger:

```text
POST /api/auth/register
```

Luego el frontend inicia sesion con:

```text
POST /api/auth/login
```

El token se guarda en `localStorage` con la clave `finanzas_access_token` y se valida contra:

```text
GET /api/auth/me
```

.
