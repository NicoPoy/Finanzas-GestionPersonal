# Explicacion de la estructura Python

Este documento es el mapa vivo del backend Python. Cada vez que se agregue, elimine o modifique una carpeta, archivo, clase, variable o funcion del backend, este archivo debe actualizarse en el mismo cambio.

El backend esta dentro de la carpeta `api/` porque Vercel detecta funciones serverless desde esa ubicacion. La aplicacion usa FastAPI y se expone desde `api/index.py`.

## `api/`

Carpeta raiz del backend Python.

Contiene la entrada que Vercel ejecuta y el paquete real de la aplicacion.

### `api/index.py`

Archivo de entrada para Vercel.

Contenido principal:

- `app`: se importa desde `api.app.main`.

Funcion:

- Permitir que Vercel encuentre la instancia ASGI de FastAPI.
- Mantener la raiz `api/` liviana y delegar la configuracion real a `api/app/main.py`.

### `api/__init__.py`

Marca `api` como paquete Python.

Funcion:

- Permitir imports absolutos como `from api.app.main import app`.

### `api/health/`

Carpeta presente en el proyecto, pero no contiene logica versionable relevante actualmente.

Nota:

- Los health checks reales estan implementados en `api/app/routers/system.py`.

### `api/__pycache__/`

Carpeta generada automaticamente por Python al compilar/importar modulos.

Funcion:

- Guardar bytecode `.pyc` para acelerar imports.

Nota:

- No forma parte del diseno del proyecto.
- No debe documentarse archivo por archivo ni editarse manualmente.

## `api/app/`

Paquete principal del backend.

Agrupa configuracion, seguridad, conexion a base de datos, modelos y routers.

### `api/app/main.py`

Crea y configura la aplicacion FastAPI.

Variables:

- `app`: instancia principal de `FastAPI`.

Configuracion de `app`:

- `title="Finanzas API"`: nombre visible en Swagger.
- `description`: descripcion publica de la API.
- `version="0.2.0"`: version actual del contrato backend.
- `docs_url="/api/docs"`: URL de Swagger.
- `redoc_url="/api/redoc"`: URL alternativa de documentacion.
- `openapi_url="/api/openapi.json"`: JSON OpenAPI usado por Swagger.

Routers incluidos:

- `system.router`: endpoints de estado general.
- `auth.router`: registro, login y usuario autenticado.
- `database.router`: ping de conexion con MongoDB.

Funcion:

- Ser el punto unico donde se arma la API.
- Mantener rutas separadas en routers para evitar un archivo monolitico.

### `api/app/__init__.py`

Marca `api/app` como paquete Python.

Funcion:

- Permitir imports desde `api.app`.

## `api/app/core/`

Carpeta para configuracion transversal y seguridad.

Se llama `core` porque contiene piezas centrales que no pertenecen a una ruta especifica ni a una coleccion de MongoDB.

### `api/app/core/config.py`

Centraliza variables de entorno.

Imports:

- `os`: lee variables del entorno.
- `dataclass`: crea una clase simple e inmutable de configuracion.

Clases:

- `Settings`: configuracion leida desde variables de entorno.

Variables de `Settings`:

- `mongodb_uri`: valor de `MONGODB_URI`. Es la URI completa de MongoDB Atlas.
- `mongodb_db_name`: valor de `MONGODB_DB_NAME`. Por defecto usa `finanzas`.
- `jwt_secret`: valor de `JWT_SECRET`. Firma y valida tokens.
- `jwt_algorithm`: algoritmo indicado para JWT. Actualmente `HS256`.

Variables del modulo:

- `settings`: instancia unica de `Settings`.

Funcion:

- Evitar leer `os.getenv(...)` en muchos archivos.
- Centralizar nombres de variables de entorno.
- Separar secretos del codigo fuente.

### `api/app/core/security.py`

Contiene funciones de password y token.

Imports:

- `base64`: codifica bytes para incluirlos en hashes/JWT.
- `hashlib`: genera hash seguro de password con PBKDF2.
- `hmac`: compara hashes y firma tokens.
- `json`: serializa header/payload JWT.
- `secrets`: genera salts aleatorios.
- `datetime`, `timedelta`, `timezone`: calcula expiracion del token.
- `settings`: usa `JWT_SECRET` y algoritmo configurado.

Funciones publicas:

- `hash_password(password: str) -> str`
  - Genera un salt aleatorio.
  - Hashea la password con `pbkdf2_hmac("sha256")`.
  - Devuelve un string con formato `pbkdf2_sha256$salt$hash`.
  - Sirve para guardar passwords sin texto plano.

- `verify_password(password: str, stored_hash: str) -> bool`
  - Recibe una password ingresada y el hash guardado.
  - Extrae algoritmo, salt y hash esperado.
  - Vuelve a calcular el hash con la password ingresada.
  - Usa `hmac.compare_digest` para comparar sin filtrar timing.
  - Sirve para validar login.

- `create_access_token(payload: dict, expires_minutes: int = 60 * 24 * 7) -> str`
  - Crea un token tipo JWT.
  - Agrega `exp` al payload.
  - Firma con `JWT_SECRET`.
  - Por defecto expira en 7 dias.
  - Sirve para devolver una sesion despues del login.

- `decode_access_token(token: str) -> dict`
  - Divide el token en header, payload y firma.
  - Recalcula la firma con `JWT_SECRET`.
  - Verifica expiracion.
  - Devuelve el payload si el token es valido.
  - Sirve para proteger endpoints como `/api/auth/me`.

Funciones privadas:

- `_json_b64(value: dict) -> str`
  - Convierte un diccionario a JSON compacto.
  - Luego lo codifica en Base64 URL-safe.
  - Se usa para header y payload del token.

- `_b64encode(value: bytes) -> str`
  - Codifica bytes en Base64 URL-safe sin padding.
  - Se usa en passwords y tokens.

- `_b64decode(value: str) -> bytes`
  - Restaura padding si falta.
  - Decodifica Base64 URL-safe a bytes.
  - Se usa para leer hashes y tokens.

### `api/app/core/__init__.py`

Marca `core` como paquete Python.

## `api/app/db/`

Carpeta para conexion e infraestructura de MongoDB.

Se separa de routers para que las rutas no conozcan detalles de conexion.

### `api/app/db/mongodb.py`

Administra el cliente MongoDB.

Imports:

- `lru_cache`: cachea el cliente para no abrir conexiones repetidas.
- `AsyncIOMotorClient`: cliente async de MongoDB.
- `ServerApi`: fuerza uso de Server API version 1 de Atlas.
- `settings`: obtiene URI y nombre de base.

Funciones:

- `get_mongo_client() -> AsyncIOMotorClient`
  - Valida que `MONGODB_URI` exista.
  - Crea un cliente `AsyncIOMotorClient`.
  - Usa `server_api=ServerApi("1")`.
  - Esta decorada con `@lru_cache`, entonces se reutiliza dentro del runtime.

- `get_database()`
  - Obtiene la base configurada por `MONGODB_DB_NAME`.
  - Evita que routers y servicios tengan que conocer el nombre de la base.

### `api/app/db/indexes.py`

Define indices recomendados para MongoDB.

Funciones:

- `create_indexes() -> None`
  - Obtiene la base con `get_database()`.
  - Crea indice unico en `users.email`.
  - Crea indice unico en `finance_profiles.user_id`.

Uso actual:

- Todavia no se ejecuta automaticamente al iniciar la app.
- En `auth.register` se crea el indice de email antes de insertar usuarios.

### `api/app/db/__init__.py`

Marca `db` como paquete Python.

## `api/app/models/`

Carpeta para modelos Pydantic.

Los modelos describen la forma de datos que entra/sale por la API y la forma esperada de documentos MongoDB.

### `api/app/models/auth.py`

Modelos de autenticacion.

Clases:

- `RegisterRequest`
  - Payload para crear usuarios desde Swagger.
  - Campos:
    - `email`: email del usuario.
    - `password`: password plana enviada por unica vez al registro.
    - `display_name`: nombre visible opcional.

- `LoginRequest`
  - Payload del formulario de login.
  - Campos:
    - `email`: email ingresado.
    - `password`: password ingresada.

- `LoginResponse`
  - Respuesta de login exitoso.
  - Campos:
    - `access_token`: token firmado.
    - `token_type`: tipo de token. Por defecto `bearer`.

- `UserResponse`
  - Datos publicos del usuario.
  - Campos:
    - `id`: id Mongo convertido a string.
    - `email`: email del usuario.
    - `display_name`: nombre visible.
  - No incluye `password_hash`.

### `api/app/models/user.py`

Modelos de usuario.

Clases:

- `UserCreate`
  - Payload interno para crear usuario.
  - Campos:
    - `email`: email normalizado.
    - `password_hash`: hash ya generado.
    - `display_name`: nombre visible.

- `UserDocument`
  - Representa un documento de la coleccion `users`.
  - Campos:
    - `id`: alias de `_id`.
    - `email`: email del usuario.
    - `password_hash`: password hasheada.
    - `display_name`: nombre visible.
    - `is_active`: permite desactivar usuarios sin borrarlos.
    - `created_at`: fecha de creacion.
    - `updated_at`: fecha de ultima modificacion.

### `api/app/models/finance.py`

Modelos del dominio financiero.

Tipos:

- `ExpenseCategory`
  - Literal con categorias permitidas:
    - `department`
    - `subscriptions`
    - `activities`
    - `extras`

Clases:

- `CardExpense`
  - Consumo asociado a una tarjeta.
  - Campos:
    - `id`: id interno tipo UUID.
    - `card_id`: id de la tarjeta.
    - `origin`: origen del gasto.
    - `amount`: monto mensual/cuota.
    - `savings`: ahorro aplicado a la cuota actual.
    - `installments`: cuotas pendientes. `1` es compra unica; `0` con `is_fixed=True` es gasto fijo.
    - `is_fixed`: indica gasto mensual sin fin definido.
    - `fixed_category`: seccion donde se muestra si es fijo pagado con tarjeta.

- `Card`
  - Tarjeta dentro de un banco.
  - Campos:
    - `id`: id interno.
    - `name`: nombre visible.
    - `accent`: color visual.

- `Bank`
  - Banco con tarjetas.
  - Campos:
    - `id`: id interno.
    - `name`: nombre visible.
    - `cards`: lista de `Card`.

- `SimpleExpense`
  - Gasto simple de secciones como Departamento o Suscripciones.
  - Campos:
    - `id`: id interno.
    - `name`: nombre visible.
    - `amount`: monto mensual.

- `PaymentRegistryEntry`
  - Marca de pago mensual.
  - Campos:
    - `year`: anio.
    - `month`: mes.
    - `service_id`: id del servicio/gasto.
    - `paid`: si fue abonado.

- `FinanceProfileDocument`
  - Documento principal de finanzas por usuario.
  - Campos:
    - `id`: alias de `_id`.
    - `user_id`: id del usuario propietario.
    - `salary`: sueldo mensual.
    - `banks`: bancos y tarjetas.
    - `card_expenses`: consumos de tarjeta.
    - `department_expenses`: gastos de departamento.
    - `subscription_expenses`: suscripciones.
    - `activity_expenses`: actividades.
    - `extra_expenses`: extras.
    - `payment_registry`: registro anual de pagos.
    - `created_at`: fecha de creacion.
    - `updated_at`: fecha de ultima modificacion.

### `api/app/models/__init__.py`

Marca `models` como paquete Python.

## `api/app/routers/`

Carpeta para endpoints HTTP.

Cada archivo agrupa rutas por responsabilidad.

### `api/app/routers/system.py`

Endpoints generales de estado.

Variables:

- `router`: `APIRouter` con prefijo `/api` y tag `Sistema`.

Funciones:

- `api_root()`
  - Rutas:
    - `GET /api`
    - `GET /api/`
  - Devuelve si la API esta viva y donde esta Swagger.

- `health_check()`
  - Ruta:
    - `GET /api/health`
  - Devuelve un health check simple.

### `api/app/routers/database.py`

Endpoints de diagnostico de base de datos.

Variables:

- `router`: `APIRouter` con prefijo `/api/db` y tag `Base de datos`.
- `logger`: logger del modulo para registrar errores internos en Vercel.

Funciones:

- `ping_database()`
  - Ruta:
    - `GET /api/db/ping`
  - Ejecuta `database.client.admin.command("ping")`.
  - No inserta documentos.
  - No crea colecciones.
  - Devuelve `ok`, mensaje y nombre de base si conecta.
  - Devuelve `500` si falta configuracion.
  - Devuelve `502` si Atlas no responde o rechaza conexion.

### `api/app/routers/auth.py`

Endpoints y dependency de autenticacion.

Variables:

- `router`: `APIRouter` con prefijo `/api/auth` y tag `Autenticacion`.

Funciones:

- `register(payload: RegisterRequest)`
  - Ruta:
    - `POST /api/auth/register`
  - Crea usuarios desde Swagger.
  - Normaliza email a minusculas.
  - Valida password minima de 8 caracteres.
  - Hashea password con `hash_password`.
  - Crea indice unico en `users.email`.
  - Inserta en coleccion `users`.
  - Devuelve `UserResponse`.
  - Devuelve `409` si el email ya existe.

- `login(payload: LoginRequest)`
  - Ruta:
    - `POST /api/auth/login`
  - Busca usuario activo por email.
  - Verifica password con `verify_password`.
  - Crea token con `create_access_token`.
  - Devuelve `LoginResponse`.
  - Devuelve `401` si credenciales no coinciden.

- `me(current_user: dict = Depends(get_current_user))`
  - Ruta:
    - `GET /api/auth/me`
  - Devuelve datos publicos del usuario autenticado.
  - Usa `get_current_user` como dependency.

- `get_current_user(authorization: str | None = Header(default=None)) -> dict`
  - Dependency reusable para endpoints protegidos.
  - Lee header `Authorization`.
  - Exige formato `Bearer <token>`.
  - Decodifica token con `decode_access_token`.
  - Valida que `sub` sea un `ObjectId`.
  - Busca usuario activo en MongoDB.
  - Devuelve el documento de usuario.
  - Devuelve `401` si falta token, es invalido o el usuario no existe.
  - Debe estar definida antes de cualquier endpoint que la use con `Depends(...)`, porque Python evalua esa referencia al importar el modulo.

### `api/app/routers/__init__.py`

Marca `routers` como paquete Python.

## Convencion de mantenimiento

Cada vez que se toque backend Python:

1. Si se agrega una carpeta, documentarla en este archivo.
2. Si se agrega un archivo, explicar su responsabilidad.
3. Si se agrega una funcion, explicar entrada, salida y por que existe.
4. Si se agrega una variable global relevante, explicar su uso.
5. Si se modifica una funcion existente cambiando comportamiento, actualizar su descripcion.

Este archivo debe mantenerse sincronizado con el codigo para que sirva como guia de lectura del backend.
