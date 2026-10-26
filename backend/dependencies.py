
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.auth import decode_access_token
from backend.database import get_db
from backend.models import Staff

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_staff(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Staff:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        staff_id = int(payload["sub"])
        clinic_id = int(payload["clinic_id"])
        token_role = payload["role"]
    except (ValueError, KeyError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    staff = (
        db.query(Staff)
        .filter(
            Staff.id == staff_id,
            Staff.clinic_id == clinic_id,
            Staff.is_active.is_(True),
        )
        .first()
    )

    if staff is None or staff.role != token_role:
        raise HTTPException(
            status_code=401,
            detail="Account is inactive or token is no longer valid.",
        )

    return staff
