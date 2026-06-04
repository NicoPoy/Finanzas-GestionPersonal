from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pymongo.errors import DuplicateKeyError

from api.app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from api.app.db.mongodb import get_database
from api.app.models.auth import LoginRequest, LoginResponse, RegisterRequest, UserResponse


router = APIRouter(prefix="/api/auth", tags=["Autenticacion"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    """Crea usuarios desde Swagger.

    No hay pantalla de registro en el frontend: esta ruta es la unica entrada para altas por ahora.
    """

    email = payload.email.strip().lower()

    if not email or len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email y password de al menos 8 caracteres son obligatorios.",
        )

    database = get_database()
    now = datetime.utcnow()
    user = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "display_name": payload.display_name.strip(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    try:
        await database.users.create_index("email", unique=True)
        result = await database.users.insert_one(user)
    except DuplicateKeyError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese email.",
        ) from error

    return UserResponse(
        id=str(result.inserted_id),
        email=user["email"],
        display_name=user["display_name"],
    )


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """Valida credenciales y emite token JWT."""

    email = payload.email.strip().lower()
    database = get_database()
    user = await database.users.find_one({"email": email, "is_active": True})

    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password incorrectos.",
        )

    try:
        access_token = create_access_token(
            {
                "sub": str(user["_id"]),
                "email": user["email"],
            },
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    return LoginResponse(access_token=access_token)


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Dependency reusable para proteger endpoints futuros."""

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token requerido.",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = decode_access_token(token)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido.",
        ) from error

    user_id = payload.get("sub")

    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido.",
        )

    database = get_database()
    user = await database.users.find_one({"_id": ObjectId(user_id), "is_active": True})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
        )

    return user


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    """Devuelve el usuario autenticado segun el token enviado por Authorization."""

    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        display_name=current_user.get("display_name", ""),
    )
