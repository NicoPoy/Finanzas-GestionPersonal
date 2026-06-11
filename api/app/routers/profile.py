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
    registration_date = get_registration_date(current_user)

    if not document:
        return FrontendFinanceProfile(monthZeroDate=registration_date, registrationDate=registration_date)

    profile = document.get("profile", {})
    month_zero_date = profile.get("monthZeroDate") or "2026-06-01T00:00:00"

    return FrontendFinanceProfile(
        **{
            **profile,
            "monthZeroDate": month_zero_date,
            "registrationDate": profile.get("registrationDate") or registration_date,
        }
    )


@router.put("", response_model=FrontendFinanceProfile)
async def save_profile(profile: FrontendFinanceProfile, current_user: dict = Depends(get_current_user)):
    """Guarda el estado financiero completo del usuario autenticado."""

    database = get_database()
    now = datetime.utcnow()
    document = await database.finance_profiles.find_one({"user_id": str(current_user["_id"])})
    saved_profile = document.get("profile", {}) if document else {}
    payload = profile.model_dump()
    payload["registrationDate"] = (
        saved_profile.get("registrationDate")
        or payload.get("registrationDate")
        or get_registration_date(current_user)
    )
    payload["monthZeroDate"] = saved_profile.get("monthZeroDate") or payload.get("monthZeroDate") or payload["registrationDate"]

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

    return FrontendFinanceProfile(**payload)


def get_registration_date(user: dict) -> str:
    registration_date = user.get("registration_date") or user.get("created_at") or datetime(2026, 6, 1)

    if isinstance(registration_date, datetime):
        return registration_date.isoformat()

    return str(registration_date)
