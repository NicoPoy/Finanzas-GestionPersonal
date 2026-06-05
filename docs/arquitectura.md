# Arquitectura del proyecto

Este documento explica que es cada parte del proyecto y por que esta ubicada ahi.

## Objetivo funcional

La app administra gastos mensuales. Hoy tiene estas secciones:

- Tarjetas: bancos, tarjetas y consumos.
- Departamento: gastos fijos del hogar.
- Suscripciones: gastos recurrentes.
- Actividades: gimnasios, cursos o planes.
- Extras: gastos variables.
- Proyeccion: cuanto se pagara en tarjetas los proximos meses.
- Registro: matriz anual de pagos, con meses como columnas y cosas a pagar como filas.
- Configuracion: sueldo y restante.

## Frontend

El frontend esta dentro de `frontend/`. Esa carpeta contiene todo lo necesario para la app React: el `index.html` de Vite y el codigo fuente en `frontend/src/`.

```text
frontend/
  index.html
  public/
    logo_app_finanzas.png
  src/
    main.jsx
    App.jsx
    styles.css
    components/
    data/
    domain/
    features/
    utils/
```

La raiz del repo sigue teniendo `package.json` y `vite.config.js` para que los comandos se ejecuten desde la carpeta principal, pero Vite tiene configurado `root: "frontend"`.

`capacitor.config.json` queda en la raiz porque Capacitor lo busca desde el proyecto principal. Usa `webDir: "dist"`, el mismo directorio que genera Vite para Vercel.

La carpeta `android/` es el proyecto nativo que abre Android Studio. Se genera con Capacitor y se sincroniza con `npm run android:sync`.

La carpeta `assets/` contiene fuentes para los iconos nativos:

- `assets/icon.png`: base para el icono Android.
- `assets/splash.png`: base para la pantalla de carga Android.

### `frontend/index.html`

HTML base de Vite. Define el `div#root` donde React monta la aplicacion, referencia `/src/main.jsx` desde la raiz interna de Vite y declara el favicon publico de la pagina.

### `frontend/public/`

Assets publicos que Vite copia sin procesar y sirve desde la raiz del sitio.

- `logo_app_finanzas.png`: icono principal de la pagina. Se usa como favicon y como icono para accesos directos compatibles.

### `frontend/src/main.jsx`

Punto de entrada de Vite. Solo monta React en el `div#root` definido por `index.html`.

Debe mantenerse chico porque no representa reglas de negocio ni pantallas.

Tambien llama a `applyPlatformClass()` para agregar la clase `native-app` cuando la app corre dentro de Capacitor. Esa clase permite hacer ajustes visuales exclusivos para Android sin alterar la web.

### `frontend/src/App.jsx`

Componente raiz de React. Decide si mostrar:

- `LoginScreen`, cuando no hay sesion.
- `FinanceApp`, cuando el usuario entra.

Hoy la sesion se valida con un token guardado en `localStorage`. Si el token no existe o `/api/auth/me` lo rechaza, solo se muestra el login.

El logout tambien se maneja en `App.jsx`: elimina `finanzas_access_token` de `localStorage`, limpia el estado `accessToken` y vuelve inmediatamente a `LoginScreen`. El boton visual vive en `FinanceApp` porque pertenece a la pantalla privada.

La identidad visual usa `logo_app_finanzas.png` de `frontend/public/` como marca chica en el login y en el encabezado principal. Se referencia con ruta absoluta (`/logo_app_finanzas.png`) porque Vite sirve `public/` desde la raiz del sitio.

### `frontend/src/styles.css`

Estilos globales de la app. Se mantiene como un unico archivo porque el proyecto todavia es chico y no tiene design system. Si crece mucho mas, el siguiente paso razonable es separar estilos por feature o migrar a CSS Modules.

### `frontend/src/components/`

Componentes reutilizables que no pertenecen a una pantalla especifica.

```text
components/
  auth/
    LoginScreen.jsx
  common/
    Metric.jsx
  forms/
    AddInlineForm.jsx
```

- `auth/LoginScreen.jsx`: pantalla de login. No incluye registro; los usuarios se crean desde Swagger.
- `common/Metric.jsx`: tarjeta chica usada en el resumen superior.
- `forms/AddInlineForm.jsx`: formulario compacto para agregar bancos y tarjetas.

Se ubican aca porque pueden reutilizarse sin depender de una seccion concreta.

### `frontend/src/data/`

Datos iniciales y constantes estaticas.

```text
data/
  initialData.js
```

Contiene:

- `INITIAL_DATA`: estructura vacia del perfil financiero. No contiene gastos, bancos ni categorias precargadas.
- colores disponibles para tarjetas.
- categorias permitidas para gastos fijos pagados con tarjeta.

La razon de aislar esto es que los datos base cambian por migraciones o defaults, no por cambios visuales.

### `frontend/src/domain/`

Reglas de negocio puras.

```text
domain/
  financeCalculations.js
  storage.js
```

`financeCalculations.js` calcula:

- ahorro aplicable a una cuota.
- monto neto de una cuota.
- si un consumo de tarjeta es fijo.
- totales por banco y tarjeta.
- servicios que aparecen en el registro anual.
- claves de pago por anio/mes/servicio.

Estas funciones no renderizan UI. Eso permite probarlas o moverlas al backend mas adelante.

`storage.js` normaliza el perfil recibido desde la API. Ya no lee ni escribe gastos en `localStorage`.

### `frontend/src/utils/`

Utilidades generales.

```text
utils/
  formatters.js
```

`formatters.js` centraliza el formato de moneda ARS. Asi toda la app muestra importes de la misma manera.

### `frontend/src/services/`

Servicios transversales que conectan la app con el entorno donde corre.

```text
services/
  platform.js
```

`platform.js` contiene:

- `PRODUCTION_API_BASE_URL`: URL publica de la API en Vercel.
- `isNativeApp()`: detecta si la app corre dentro de Capacitor.
- `apiUrl(path)`: en web devuelve la ruta relativa; en Android devuelve la URL absoluta contra Vercel.
- `applyPlatformClass()`: agrega o quita la clase `native-app` en el documento para estilos especificos de app.

### `frontend/src/features/`

Pantallas o funcionalidades completas de negocio.

```text
features/
  finance/
  cards/
  projection/
  registry/
  settings/
  simpleExpenses/
```

#### `features/finance/FinanceApp.jsx`

Orquestador de la app privada.

Responsabilidades:

- mantener el estado principal.
- cargar y guardar el perfil con `/api/profile`.
- calcular totales derivados con helpers del dominio.
- decidir que modulo mostrar segun la pestaña activa.
- pasar callbacks a cada feature.

No contiene formularios grandes ni tablas completas. Es el punto que conecta estado + pantallas.

#### `features/cards/`

Todo lo relacionado con bancos, tarjetas y consumos.

```text
cards/
  CardsModule.jsx
  CardExpenseForm.jsx
  CardExpenseList.jsx
```

- `CardsModule.jsx`: layout de bancos/tarjetas y detalle de tarjeta.
- `CardExpenseForm.jsx`: carga consumos en cuotas, compra unica o gasto fijo.
- `CardExpenseList.jsx`: lista consumos, permite editar ahorro y eliminar.

Esta separacion permite modificar el formulario sin tocar la tabla ni el layout.

La accion `Registrar pago` vive visualmente en `CardsModule`, pero la actualizacion real se ejecuta en `FinanceApp`: marca el mes actual como pagado en Registro para esa tarjeta, descuenta una cuota de cada consumo no fijo y elimina los consumos que llegan a cero cuotas. Los gastos fijos de tarjeta no se descuentan porque son recurrentes hasta que el usuario los elimine.

#### `features/simpleExpenses/`

Pantalla generica para Departamento, Suscripciones, Actividades y Extras.

```text
simpleExpenses/
  SimpleExpenseModule.jsx
```

Se usa un modulo generico porque esas secciones comparten la misma estructura: nombre, monto, lista y total.

Tambien muestra gastos fijos pagados con tarjeta, pero aclarando que ya estan incluidos en Tarjetas para no duplicar el total.

#### `features/projection/`

```text
projection/
  ProjectionModule.jsx
```

Calcula una tabla de proximos meses segun las cuotas pendientes y gastos fijos de tarjeta.

La proyeccion distingue:

- compra unica: aparece una vez.
- cuotas: aparece hasta agotar cuotas pendientes.
- fijo: aparece todos los meses.

#### `features/registry/`

```text
registry/
  RegistryModule.jsx
```

Muestra el registro anual. Las columnas son meses y las filas son cosas a pagar.

El estado se guarda con una clave estable:

```text
anio-mes-serviceId
```

Esto permite cambiar de anio sin perder marcas de meses anteriores.

#### `features/settings/`

```text
settings/
  SettingsModule.jsx
  SalaryForm.jsx
```

`SettingsModule` muestra sueldo, gastos y restante.

`SalaryForm` maneja el input editable del sueldo hasta que el usuario guarda.

## Backend

El backend esta en `api/` y usa FastAPI.

```text
api/
  index.py
  app/
    main.py
    core/
    db/
    models/
    routers/
```

### `api/index.py`

Entrada que usa Vercel para encontrar la app Python.

Importa `app` desde `api/app/main.py`.

### `api/app/main.py`

Crea la instancia de FastAPI, configura Swagger y registra routers.

Swagger queda en:

```text
/api/docs
```

### `api/app/routers/`

Endpoints HTTP agrupados por tema.

- `system.py`: health check y metadata basica.
- `auth.py`: registro desde Swagger, login y usuario autenticado.

El registro no aparece en el frontend. Por ahora los usuarios se crean desde Swagger con `POST /api/auth/register` para mantener la pantalla publica solamente con login.

### `api/app/models/`

Modelos Pydantic. Documentan la forma esperada de los datos y preparan el contrato con MongoDB.

- `user.py`: usuario.
- `auth.py`: request/response de login.
- `finance.py`: bancos, tarjetas, gastos y registro.

### `api/app/db/`

Conexion e indices para MongoDB.

- `mongodb.py`: cliente de MongoDB via `motor`.
- `indexes.py`: indices recomendados.

El endpoint `/api/db/ping` solo ejecuta un ping administrativo contra Atlas. No crea colecciones, no inserta documentos y mantiene la base vacia.

MongoDB esta conectado al frontend a traves del backend. El navegador no habla directo con Atlas: carga con `GET /api/profile` y guarda con `PUT /api/profile`.

## Vercel

`vercel.json` solo reescribe rutas `/api` hacia Python.

No debe reescribir todas las rutas del frontend durante desarrollo, porque Vite necesita servir archivos como:

```text
/@vite/client
/src/main.jsx
```

Esas rutas existen dentro de la raiz interna de Vite (`frontend/`). Si se mandan a `index.html` desde una rewrite global, React no carga y queda pantalla blanca.

## Desarrollo Local

Para desarrollo local normal se levanta solo Vite:

- Vite para el frontend.
- Las llamadas `/api` se redirigen al backend de produccion en Vercel.

`vite.config.js` solo aplica al servidor de desarrollo de Vite y redirige `/api` a `https://finanzas-gestion.vercel.app`. Esto permite trabajar el frontend en localhost usando la API real ya configurada en Vercel.

Si se necesita probar backend local, se puede levantar Uvicorn manualmente y cambiar temporalmente el target del proxy a `http://127.0.0.1:8000`.

## Persistencia actual

Hoy el frontend solo usa `localStorage` para guardar el token de sesion. La informacion financiera se carga desde MongoDB con `GET /api/profile` y se guarda con `PUT /api/profile`.

## Modelo MongoDB

El modelo propuesto esta documentado en [modelo-mongodb.md](modelo-mongodb.md).

La decision principal es separar:

- `users`: identidad y login.
- `finance_profiles`: estado financiero del usuario.

Eso evita mezclar seguridad con datos operativos.
