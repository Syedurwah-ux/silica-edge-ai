
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

# Load .env from the project root before reading environment variables.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=False)

password_hash = PasswordHash.recommended()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def hash_password(password: str) -> str:
    """Return a secure hash of a password."""
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long.")
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored hash."""
    return password_hash.verify(password, stored_hash)


def create_access_token(
    staff_id: int,
    clinic_id: int,
    role: str,
) -> str:
    """Create a short-lived signed token for an authenticated staff member."""
    if not JWT_SECRET_KEY:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing. Configure it in the project-root .env file."
        )

    if role not in {"admin", "staff"}:
        raise ValueError("Invalid role.")

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(staff_id),
        "clinic_id": clinic_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Validate a token's signature and expiration."""
    if not JWT_SECRET_KEY:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing. Configure it in the project-root .env file."
        )

    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "clinic_id", "role", "exp", "iat"]},
    )
