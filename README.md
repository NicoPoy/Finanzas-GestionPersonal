# Finanzas Gestion Personal

Aplicacion React + API Python para administrar gastos mensuales personales.

El frontend permite cargar tarjetas por banco, gastos fijos por seccion, sueldo, restante mensual, proyeccion de cuotas y registro anual de pagos. El backend esta preparado con FastAPI para crecer hacia usuarios, login real y persistencia en MongoDB.

Desde la integracion con MongoDB, las categorias y datos financieros no vienen precargados en el frontend. Cada usuario carga y guarda su informacion en `finance_profiles`.

## Levantar el frontend

Para trabajar el frontend local usando la API de produccion:

```powershell
cd C:\Users\prog32np\Desktop\Finanzas
npm install
npm run dev -- --host localhost --port 5173 --strictPort
```

Abrir:

```text
http://localhost:5173
```

En local, `vite.config.js` redirige `/api` hacia `https://finanzas-gestion.vercel.app`. Asi el frontend corre en localhost y la API sale desde produccion.

Si alguna vez queres levantar backend local:

```powershell
npx vercel env pull .env.local --environment=production
python -m pip install -r requirements.txt
python -m uvicorn api.app.main:app --host 127.0.0.1 --port 8000 --reload
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
frontend/
  index.html
  public/
    logo_app_finanzas.png
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

`frontend/` contiene solamente la app React. `api/` queda en la raiz porque Vercel detecta desde ahi las funciones Python.

`frontend/src/App.jsx` quedo chico a proposito: decide si mostrar el login visual o la app privada. La logica de finanzas vive en `frontend/src/features/finance/FinanceApp.jsx`, y cada pantalla grande esta separada en su propia carpeta dentro de `frontend/src/features`.

La explicacion completa esta en [docs/arquitectura.md](docs/arquitectura.md).

## Build

```powershell
npm run build
```

Este comando valida que React/Vite compile correctamente para produccion.

## Android

El proyecto esta preparado con Capacitor para generar una app Android sin perder la web de Vercel.

Primera vez:

```powershell
npm install
npm run build
npm run android:add
npm run android:assets
```

Despues de cambios en React:

```powershell
npm run android:sync
npm run android:open
```

La web sigue publicada normalmente en Vercel. La app Android usa el mismo frontend compilado, pero las llamadas a `/api` se envian a `https://finanzas-gestion.vercel.app` cuando corre dentro de Capacitor.

Si cambia el logo de la app:

```powershell
npm run android:assets
npm run android:sync
```

Para actualizar el APK descargable desde la web:

```powershell
cd C:\Users\prog32np\Desktop\Finanzas
cd android
.\gradlew.bat assembleDebug
cd ..
npm run android:publish-apk
```

El boton de descarga del encabezado apunta a:

```text
/finanzas-debug.apk
```

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

Los datos financieros se leen y guardan con:

```text
GET /api/profile
PUT /api/profile
```

.
