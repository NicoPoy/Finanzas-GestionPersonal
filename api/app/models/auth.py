from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Datos que enviara el formulario de login cuando conectemos autenticacion real."""

    email: str
    password: str


class LoginResponse(BaseModel):
    """Respuesta esperada para una sesion autenticada."""

    access_token: str
    token_type: str = "bearer"
