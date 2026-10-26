
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.auth import create_access_token, verify_password
from backend.database import get_db
from backend.models import Clinic, Staff

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    clinic_code: str = Field(min_length=1, max_length=30)
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800
    staff_id: int
    clinic_id: int
    full_name: str
    role: str


@router.post("/login", response_model=LoginResponse)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    clinic = (
        db.query(Clinic)
        .filter(
            Clinic.clinic_code == request.clinic_code.strip(),
            Clinic.is_active.is_(True),
        )
        .first()
    )

    if clinic is None:
        raise HTTPException(status_code=401, detail="Invalid login credentials.")

    staff = (
        db.query(Staff)
        .filter(
            Staff.clinic_id == clinic.id,
            Staff.username == request.username.strip(),
            Staff.is_active.is_(True),
        )
        .first()
    )

    # Use the same public error for unknown users and wrong passwords.
    if staff is None or not verify_password(
        request.password, staff.password_hash
    ):
        raise HTTPException(status_code=401, detail="Invalid login credentials.")

    access_token = create_access_token(
        staff_id=staff.id,
        clinic_id=staff.clinic_id,
        role=staff.role,
    )

    return LoginResponse(
        access_token=access_token,
        staff_id=staff.id,
        clinic_id=staff.clinic_id,
        full_name=staff.full_name,
        role=staff.role,
    )
