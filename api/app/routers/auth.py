from fastapi import APIRouter, HTTPException, status

from api.app.models.auth import LoginRequest, LoginResponse


router = APIRouter(prefix="/api/auth", tags=["Autenticacion"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """Endpoint reservado para login real.

    Existe para documentar el contrato en Swagger sin fingir autenticacion incompleta.
    """

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login pendiente: falta definir registro, hash de password y emision de token.",
    )
