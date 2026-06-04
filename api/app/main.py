from fastapi import FastAPI

from api.app.routers import auth, database, profile, system


# Instancia ASGI que usa Vercel para ejecutar FastAPI.
# Los paths de docs empiezan con /api para convivir con el frontend en el mismo dominio.
app = FastAPI(
    title="Finanzas API",
    description="API para el administrador mensual de finanzas personales.",
    version="0.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.include_router(system.router)
app.include_router(auth.router)
app.include_router(database.router)
app.include_router(profile.router)
