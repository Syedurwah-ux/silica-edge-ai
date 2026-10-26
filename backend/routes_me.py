
from fastapi import APIRouter, Depends

from backend.dependencies import get_current_staff
from backend.models import Staff

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me")
def get_me(current_staff: Staff = Depends(get_current_staff)):
    return {
        "staff_id": current_staff.id,
        "clinic_id": current_staff.clinic_id,
        "username": current_staff.username,
        "full_name": current_staff.full_name,
        "role": current_staff.role,
    }
