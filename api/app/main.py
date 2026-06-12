from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.app.routers import auth, database, notes, profile, system


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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origins=[
        "capacitor://localhost",
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://localhost",
        "https://finanzas-gestion.vercel.app",
    ],
)

app.include_router(system.router)
app.include_router(auth.router)
app.include_router(database.router)
app.include_router(profile.router)
app.include_router(notes.router)
