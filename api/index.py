from fastapi import FastAPI


app = FastAPI(
    title="Finanzas API",
    description="API base para el administrador mensual de finanzas.",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


@app.get("/api", tags=["Sistema"])
@app.get("/", tags=["Sistema"])
def api_root():
    print("Backend Python funcionando: GET /api")

    return {
        "ok": True,
        "message": "Finanzas API funcionando",
        "docs": "/api/docs",
    }


@app.get("/api/health", tags=["Sistema"])
@app.get("/health", tags=["Sistema"])
def health_check():
    print("Backend Python funcionando: GET /api/health")

    return {
        "ok": True,
        "message": "Backend Python funcionando",
    }
