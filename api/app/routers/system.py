from fastapi import APIRouter


router = APIRouter(prefix="/api", tags=["Sistema"])


@router.get("")
@router.get("/")
def api_root():
    """Respuesta humana para confirmar que la API esta viva."""

    return {
        "ok": True,
        "message": "Finanzas API funcionando",
        "docs": "/api/docs",
    }


@router.get("/health")
def health_check():
    """Health check simple para navegador, Vercel o monitoreo."""

    return {
        "ok": True,
        "message": "Backend Python funcionando",
    }
