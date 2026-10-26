
from datetime import datetime, timezone
import math

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import PatientVisit, SensorAssessment
from backend.dependencies import get_current_staff


router = APIRouter(
    prefix="/sensor-assessments",
    tags=["Sensor Assessments"],
)


class SensorSample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sampleNumber: int = Field(ge=1)
    timestamp: int = Field(gt=0)
    impedance: float = Field(ge=0, allow_inf_nan=False)
    phase: float = Field(ge=-360, le=360, allow_inf_nan=False)


class SensorAssessmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    visit_id: int = Field(gt=0)
    impedance_ohms: float = Field(ge=0, allow_inf_nan=False)
    phase_degrees: float = Field(ge=-360, le=360, allow_inf_nan=False)
    samples: list[SensorSample] = Field(min_length=1, max_length=1000)
    started_at: datetime
    completed_at: datetime

    @field_validator("started_at", "completed_at")
    @classmethod
    def require_timezone(cls, value):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Datetime values must include a timezone.")
        return value

    @field_validator("completed_at")
    @classmethod
    def require_valid_duration(cls, value, info):
        started_at = info.data.get("started_at")
        if started_at and value < started_at:
            raise ValueError("completed_at cannot be before started_at.")
        return value


class SensorAssessmentResponse(BaseModel):
    id: int
    clinic_id: int
    visit_id: int
    source: str
    impedance_ohms: float
    phase_degrees: float
    samples: list[dict]
    started_at: datetime
    completed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.post("", response_model=SensorAssessmentResponse, status_code=201)
def create_sensor_assessment(
    payload: SensorAssessmentCreate,
    db: Session = Depends(get_db),
    current_staff=Depends(get_current_staff),
):
    visit = (
        db.query(PatientVisit)
        .filter(
            PatientVisit.id == payload.visit_id,
            PatientVisit.clinic_id == current_staff.clinic_id,
        )
        .first()
    )

    if not visit:
        raise HTTPException(
            status_code=404,
            detail="Visit not found in your clinic.",
        )

    assessment = SensorAssessment(
        clinic_id=current_staff.clinic_id,
        visit_id=visit.id,
        source="SIMULATED",
        impedance_ohms=payload.impedance_ohms,
        phase_degrees=payload.phase_degrees,
        samples=[sample.model_dump() for sample in payload.samples],
        started_at=payload.started_at,
        completed_at=payload.completed_at,
    )

    try:
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the sensor assessment.",
        )

    return assessment


@router.get("", response_model=list[SensorAssessmentResponse])
def list_sensor_assessments(
    visit_id: int | None = Query(default=None, gt=0),
    patient_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_staff=Depends(get_current_staff),
):
    query = (
        db.query(SensorAssessment)
        .join(
            PatientVisit,
            SensorAssessment.visit_id == PatientVisit.id,
        )
        .filter(
            SensorAssessment.clinic_id == current_staff.clinic_id,
            PatientVisit.clinic_id == current_staff.clinic_id,
        )
    )

    if visit_id is not None:
        query = query.filter(SensorAssessment.visit_id == visit_id)

    if patient_id is not None:
        query = query.filter(PatientVisit.patient_id == patient_id)

    return (
        query.order_by(SensorAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
