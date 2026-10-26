
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_staff
from backend.models import Patient, PatientIdCounter, Staff

router = APIRouter(prefix="/patients", tags=["Patients"])


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    age: int = Field(ge=0, le=130)
    occupation: str | None = Field(default=None, max_length=150)
    exposure_years: float | None = Field(
        default=None, ge=0, allow_inf_nan=False
    )
    patient_phone: str | None = Field(default=None, max_length=20)
    guardian_phone: str | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=2000)


class PatientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    age: int | None = Field(default=None, ge=0, le=130)
    occupation: str | None = Field(default=None, max_length=150)
    exposure_years: float | None = Field(
        default=None, ge=0, allow_inf_nan=False
    )
    patient_phone: str | None = Field(default=None, max_length=20)
    guardian_phone: str | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=2000)


class PatientResponse(BaseModel):
    id: int
    clinic_id: int
    patient_code: str
    full_name: str
    age: int
    occupation: str | None
    exposure_years: float | None
    patient_phone: str | None
    guardian_phone: str | None

    model_config = {"from_attributes": True}


def generate_patient_code(db: Session, clinic_id: int) -> str:
    statement = (
        insert(PatientIdCounter)
        .values(clinic_id=clinic_id, last_number=1)
        .on_conflict_do_update(
            index_elements=[PatientIdCounter.clinic_id],
            set_={"last_number": PatientIdCounter.last_number + 1},
        )
        .returning(PatientIdCounter.last_number)
    )

    number = db.execute(statement).scalar_one()
    return f"PAT-{number:06d}"


@router.post("", response_model=PatientResponse, status_code=201)
def create_patient(
    request: PatientCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    full_name = request.full_name.strip()

    if not full_name:
        raise HTTPException(
            status_code=422,
            detail="Patient name cannot be blank.",
        )

    occupation = (
        request.occupation.strip()
        if request.occupation and request.occupation.strip()
        else None
    )

    try:
        patient_code = generate_patient_code(db, current_staff.clinic_id)

        patient = Patient(
            clinic_id=current_staff.clinic_id,
            patient_code=patient_code,
            full_name=full_name,
            age=request.age,
            occupation=occupation,
            exposure_years=request.exposure_years,
            patient_phone=request.patient_phone,
            guardian_phone=request.guardian_phone,
            notes=request.notes,
        )

        db.add(patient)
        db.commit()
        db.refresh(patient)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Patient registration conflicted with an existing record. "
                "Please retry."
            ),
        )
    except Exception:
        db.rollback()
        raise

    return patient


@router.get("", response_model=list[PatientResponse])
def list_patients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    return (
        db.query(Patient)
        .filter(Patient.clinic_id == current_staff.clinic_id)
        .order_by(Patient.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.clinic_id == current_staff.clinic_id,
        )
        .first()
    )

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")

    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    request: PatientUpdate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.clinic_id == current_staff.clinic_id,
        )
        .first()
    )

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")

    changes = request.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one field to update.",
        )

    if "full_name" in changes:
        name = changes["full_name"]
        if name is None or not name.strip():
            raise HTTPException(status_code=422, detail="Name cannot be blank.")
        changes["full_name"] = name.strip()

    if "occupation" in changes and changes["occupation"] is not None:
        occupation = changes["occupation"].strip()
        changes["occupation"] = occupation or None

    for field, value in changes.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient
