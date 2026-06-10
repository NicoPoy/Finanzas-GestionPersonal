import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from api.app.core.config import settings


def hash_password(password: str) -> str:
    """Genera un hash irreversible de password con salt unico.

    El formato guarda algoritmo, salt y hash para poder verificarlo despues.
    """

    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)

    return f"pbkdf2_sha256${_b64encode(salt)}${_b64encode(password_hash)}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Compara una password plana contra el hash guardado sin exponer timing."""

    try:
        algorithm, salt_value, hash_value = stored_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    salt = _b64decode(salt_value)
    expected_hash = _b64decode(hash_value)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)

    return hmac.compare_digest(password_hash, expected_hash)


def create_access_token(payload: dict, expires_minutes: int | None = None) -> str:
    """Crea un token JWT simple firmado con JWT_SECRET."""

    if not settings.jwt_secret:
        raise RuntimeError("JWT_SECRET no esta configurada")

    token_ttl_minutes = settings.jwt_expires_minutes if expires_minutes is None else expires_minutes
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=token_ttl_minutes)
    body = {
        **payload,
        "exp": int(expires_at.timestamp()),
    }
    signing_input = f"{_json_b64(header)}.{_json_b64(body)}"
    signature = hmac.new(settings.jwt_secret.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()

    return f"{signing_input}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict:
    """Valida firma y expiracion del token."""

    if not settings.jwt_secret:
        raise RuntimeError("JWT_SECRET no esta configurada")

    try:
        header_value, payload_value, signature_value = token.split(".")
    except ValueError as error:
        raise ValueError("Token invalido") from error

    signing_input = f"{header_value}.{payload_value}"
    expected_signature = hmac.new(
        settings.jwt_secret.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    if not hmac.compare_digest(_b64decode(signature_value), expected_signature):
        raise ValueError("Firma invalida")

    payload = json.loads(_b64decode(payload_value))

    if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        raise ValueError("Token expirado")

    return payload


def _json_b64(value: dict) -> str:
    return _b64encode(json.dumps(value, separators=(",", ":")).encode("utf-8"))


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")
