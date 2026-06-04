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

El frontend esta en `src/`.

```text
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

### `src/main.jsx`

Punto de entrada de Vite. Solo monta React en el `div#root` definido por `index.html`.

Debe mantenerse chico porque no representa reglas de negocio ni pantallas.

### `src/App.jsx`

Componente raiz de React. Decide si mostrar:

- `LoginScreen`, cuando no hay sesion.
- `FinanceApp`, cuando el usuario entra.

Hoy la sesion es un `useState` local porque el login es visual. Cuando exista login real, este archivo deberia consultar una sesion/token y no manejar datos financieros.

### `src/styles.css`

Estilos globales de la app. Se mantiene como un unico archivo porque el proyecto todavia es chico y no tiene design system. Si crece mucho mas, el siguiente paso razonable es separar estilos por feature o migrar a CSS Modules.

### `src/components/`

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

- `auth/LoginScreen.jsx`: pantalla de login visual. No autentica todavia.
- `common/Metric.jsx`: tarjeta chica usada en el resumen superior.
- `forms/AddInlineForm.jsx`: formulario compacto para agregar bancos y tarjetas.

Se ubican aca porque pueden reutilizarse sin depender de una seccion concreta.

### `src/data/`

Datos iniciales y constantes estaticas.

```text
data/
  initialData.js
```

Contiene:

- `INITIAL_DATA`: estado inicial mientras no hay base de datos real.
- claves de `localStorage`.
- colores disponibles para tarjetas.
- categorias permitidas para gastos fijos pagados con tarjeta.

La razon de aislar esto es que los datos base cambian por migraciones o defaults, no por cambios visuales.

### `src/domain/`

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

`storage.js` encapsula el uso de `localStorage`. Cuando MongoDB quede conectado, esta capa es una de las primeras que se reemplaza por llamadas HTTP.

### `src/utils/`

Utilidades generales.

```text
utils/
  formatters.js
```

`formatters.js` centraliza el formato de moneda ARS. Asi toda la app muestra importes de la misma manera.

### `src/features/`

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
- persistir en `localStorage`.
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
- `auth.py`: login placeholder. Devuelve 501 porque la autenticacion real todavia no esta implementada.

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

MongoDB todavia no esta conectado desde el frontend. La estructura queda preparada para el proximo paso.

## Vercel

`vercel.json` solo reescribe rutas `/api` hacia Python.

No debe reescribir todas las rutas del frontend durante desarrollo, porque Vite necesita servir archivos como:

```text
/@vite/client
/src/main.jsx
```

Si esas rutas se mandan a `index.html`, React no carga y queda pantalla blanca.

## Persistencia actual

Hoy el frontend guarda en `localStorage` bajo la clave:

```text
finanzas-app-data
```

Esto es temporal. Sirve para desarrollar la UI sin backend real. Cuando conectemos MongoDB:

1. `storage.js` deberia reemplazarse por un cliente HTTP.
2. `FinanceApp` deberia cargar datos desde `/api/...`.
3. Los cambios deberian persistir en MongoDB por usuario.

## Modelo MongoDB

El modelo propuesto esta documentado en [modelo-mongodb.md](modelo-mongodb.md).

La decision principal es separar:

- `users`: identidad y login.
- `finance_profiles`: estado financiero del usuario.

Eso evita mezclar seguridad con datos operativos.
