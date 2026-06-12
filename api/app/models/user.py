from datetime import datetime

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    """Payload interno para crear usuarios cuando definamos registro."""

    email: str
    password_hash: str
    display_name: str = ""


class UserDocument(BaseModel):
    """Documento de identidad del usuario.

    Se separa del perfil financiero para no mezclar autenticacion con gastos.
    """

    id: str | None = Field(default=None, alias="_id")
    email: str
    password_hash: str
    display_name: str = ""
    dark_mode: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
