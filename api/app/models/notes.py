from datetime import datetime

from pydantic import BaseModel, Field


class ProductItem(BaseModel):
    id: str
    name: str
    quantity: str = ""
    unit: str = "unidad"
    note: str = ""


class ProductStore(BaseModel):
    id: str
    name: str
    products: list[ProductItem] = Field(default_factory=list)


class FrontendNotesProfile(BaseModel):
    """Estructura de Notas, separada del perfil financiero."""

    productStores: list[ProductStore] = Field(default_factory=list)


class NotesProfileDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    user_id: str
    profile: FrontendNotesProfile = Field(default_factory=FrontendNotesProfile)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
