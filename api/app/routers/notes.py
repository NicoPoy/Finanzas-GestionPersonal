from datetime import datetime

from fastapi import APIRouter, Depends

from api.app.db.mongodb import get_database
from api.app.models.notes import FrontendNotesProfile
from api.app.routers.auth import get_current_user


router = APIRouter(prefix="/api/notes", tags=["Notas"])


@router.get("", response_model=FrontendNotesProfile)
async def get_notes(current_user: dict = Depends(get_current_user)):
    """Devuelve las notas del usuario autenticado, separadas del perfil financiero."""

    database = get_database()
    document = await database.notes_profiles.find_one({"user_id": str(current_user["_id"])})

    if not document:
        return FrontendNotesProfile()

    return FrontendNotesProfile(**document.get("profile", {}))


@router.put("", response_model=FrontendNotesProfile)
async def save_notes(profile: FrontendNotesProfile, current_user: dict = Depends(get_current_user)):
    """Guarda el estado completo de la seccion Notas."""

    database = get_database()
    now = datetime.utcnow()
    payload = profile.model_dump()

    await database.notes_profiles.update_one(
        {"user_id": str(current_user["_id"])},
        {
            "$set": {
                "profile": payload,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": str(current_user["_id"]),
                "created_at": now,
            },
        },
        upsert=True,
    )

    return FrontendNotesProfile(**payload)
