
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_staff
from backend.models import Patient, PatientVisit, Staff

router = APIRouter(prefix="/visits", tags=["Patient Visits"])


class VisitCreate(BaseModel):
    patient_id: int = Field(gt=0)
    assessment_status: str = Field(default="pending", min_length=1, max_length=50)
    assessment_result: str | None = Field(default=None, max_length=5000)
    notes: str | None = Field(default=None, max_length=2000)
    device_id: int | None = Field(default=None, gt=0)


class VisitUpdate(BaseModel):
    assessment_status: str | None = Field(default=None, min_length=1, max_length=50)
    assessment_result: str | None = Field(default=None, max_length=5000)
    notes: str | None = Field(default=None, max_length=2000)


class VisitResponse(BaseModel):
    id: int
    clinic_id: int
    patient_id: int
    staff_id: int
    device_id: int | None
    assessment_status: str
    assessment_result: str | None
    notes: str | None
    visited_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=VisitResponse, status_code=201)
def create_visit(
    request: VisitCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == request.patient_id,
            Patient.clinic_id == current_staff.clinic_id,
        )
        .first()
    )

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")

    if request.device_id is not None:
        from backend.models import Device

        device = (
            db.query(Device)
            .filter(
                Device.id == request.device_id,
                Device.clinic_id == current_staff.clinic_id,
                Device.is_active.is_(True),
            )
            .first()
        )
        if device is None:
            raise HTTPException(
                status_code=404,
                detail="Active device not found in your clinic.",
            )

    visit = PatientVisit(
        clinic_id=current_staff.clinic_id,
        patient_id=patient.id,
        staff_id=current_staff.id,
        device_id=request.device_id,
        assessment_status=request.assessment_status.strip(),
        assessment_result=request.assessment_result,
        notes=request.notes,
    )

    if not visit.assessment_status:
        raise HTTPException(
            status_code=422,
            detail="Assessment status cannot be blank.",
        )

    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.get("", response_model=list[VisitResponse])
def list_visits(
    patient_id: int | None = Query(default=None, gt=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    query = db.query(PatientVisit).filter(
        PatientVisit.clinic_id == current_staff.clinic_id
    )

    if patient_id is not None:
        query = query.filter(PatientVisit.patient_id == patient_id)

    return (
        query.order_by(PatientVisit.visited_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit(
    visit_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    visit = (
        db.query(PatientVisit)
        .filter(
            PatientVisit.id == visit_id,
            PatientVisit.clinic_id == current_staff.clinic_id,
        )
        .first()
    )

    if visit is None:
        raise HTTPException(status_code=404, detail="Visit not found.")

    return visit


@router.patch("/{visit_id}", response_model=VisitResponse)
def update_visit(
    visit_id: int,
    request: VisitUpdate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    visit = (
        db.query(PatientVisit)
        .filter(
            PatientVisit.id == visit_id,
            PatientVisit.clinic_id == current_staff.clinic_id,
        )
        .first()
    )

    if visit is None:
        raise HTTPException(status_code=404, detail="Visit not found.")

    changes = request.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one field to update.",
        )

    if "assessment_status" in changes:
        status = changes["assessment_status"]
        if status is None or not status.strip():
            raise HTTPException(
                status_code=422,
                detail="Assessment status cannot be blank.",
            )
        changes["assessment_status"] = status.strip()

    for field, value in changes.items():
        setattr(visit, field, value)

    db.commit()
    db.refresh(visit)
    return visit
