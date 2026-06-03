import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Configuracion leida desde variables de entorno.

    Los secretos nunca se guardan en Git; Vercel y el entorno local los inyectan.
    """

    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "finanzas")
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = "HS256"


settings = Settings()
