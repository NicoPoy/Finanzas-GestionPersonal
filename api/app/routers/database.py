import logging

from fastapi import APIRouter, HTTPException, status

from api.app.db.mongodb import get_database


router = APIRouter(prefix="/api/db", tags=["Base de datos"])
logger = logging.getLogger(__name__)


@router.get("/ping")
async def ping_database():
    """Confirma que el backend puede conectarse a MongoDB Atlas. No devuelve datos sensibles: solo informa si el ping salio bien y que base esta configurada."""

    try:
        database = get_database()
        await database.client.admin.command("ping")
    except RuntimeError as error:
        logger.exception("MongoDB configuration error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error
    except Exception as error:
        logger.exception("MongoDB ping failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo conectar con MongoDB Atlas",
        ) from error

    return {
        "ok": True,
        "message": "MongoDB Atlas conectado",
        "database": database.name,
    }
