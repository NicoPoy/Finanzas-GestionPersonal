from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

from api.app.core.config import settings


@lru_cache
def get_mongo_client() -> AsyncIOMotorClient:
    """Crea un cliente MongoDB reutilizable.
    lru_cache evita abrir una conexion nueva en cada request dentro del mismo runtime.
    """

    if not settings.mongodb_uri:
        raise RuntimeError("MONGODB_URI no esta configurada")

    return AsyncIOMotorClient(
        settings.mongodb_uri,
        server_api=ServerApi("1"),
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000,
    )


def get_database():
    """Devuelve la base configurada para que routers/repositorios no conozcan el URI."""
    return get_mongo_client()[settings.mongodb_db_name]
