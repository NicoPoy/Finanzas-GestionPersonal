from pydantic import BaseModel


class RegisterRequest(BaseModel):
    """Payload para crear usuarios desde Swagger.

    El registro no aparece en el frontend para mantener la pantalla publica solo con login.
    """

    email: str
    password: str
    display_name: str = ""


class LoginRequest(BaseModel):
    """Datos que enviara el formulario de login cuando conectemos autenticacion real."""

    email: str
    password: str


class LoginResponse(BaseModel):
    """Respuesta esperada para una sesion autenticada."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Datos publicos del usuario. Nunca devuelve password_hash."""

    id: str
    email: str
    display_name: str = ""
