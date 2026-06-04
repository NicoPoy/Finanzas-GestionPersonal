from datetime import datetime

from fastapi import APIRouter, Depends

from api.app.db.mongodb import get_database
from api.app.models.finance import FrontendFinanceProfile
from api.app.routers.auth import get_current_user


router = APIRouter(prefix="/api/profile", tags=["Perfil financiero"])


@router.get("", response_model=FrontendFinanceProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Devuelve el perfil financiero del usuario autenticado.

    Si todavia no existe en Mongo, devuelve una estructura vacia sin escribir datos.
    """

    database = get_database()
    document = await database.finance_profiles.find_one({"user_id": str(current_user["_id"])})

    if not document:
        return FrontendFinanceProfile()

    return FrontendFinanceProfile(**document.get("profile", {}))


@router.put("", response_model=FrontendFinanceProfile)
async def save_profile(profile: FrontendFinanceProfile, current_user: dict = Depends(get_current_user)):
    """Guarda el estado financiero completo del usuario autenticado."""

    database = get_database()
    now = datetime.utcnow()
    payload = profile.model_dump()

    await database.finance_profiles.update_one(
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

    return profile
