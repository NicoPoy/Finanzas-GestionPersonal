import os
from dataclasses import dataclass

from dotenv import load_dotenv


# En local, Uvicorn no inyecta variables de Vercel.
# Cargamos .env.local para que el backend local use la misma configuracion.
load_dotenv(".env.local")


@dataclass(frozen=True)
class Settings:
    """Configuracion leida desde variables de entorno.
    Los secretos nunca se guardan en Git; Vercel y el entorno local los inyectan.
    """

    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = int(os.getenv("JWT_EXPIRES_MINUTES", str(60 * 24)))


settings = Settings()
