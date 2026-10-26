
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clinic_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Staff(Base):
    __tablename__ = "staff"

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'staff')", name="ck_staff_role"),
        UniqueConstraint("clinic_id", "username", name="uq_staff_clinic_username"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.id"), nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="staff", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PatientIdCounter(Base):
    __tablename__ = "patient_id_counters"

    __table_args__ = (
        CheckConstraint(
            "last_number >= 0",
            name="ck_patient_id_counters_last_number",
        ),
    )

    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.id", ondelete="CASCADE"),
        primary_key=True,
    )
    last_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )


class Patient(Base):
    __tablename__ = "patients"

    __table_args__ = (
        CheckConstraint("age >= 0 AND age <= 130", name="ck_patients_age"),
        CheckConstraint(
            "exposure_years IS NULL OR exposure_years >= 0",
            name="ck_patients_exposure_years",
        ),
        UniqueConstraint(
            "clinic_id",
            "patient_code",
            name="uq_patients_clinic_patient_code",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.id"), nullable=False, index=True
    )
    patient_code: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)

    occupation: Mapped[str | None] = mapped_column(String(150), nullable=True)
    exposure_years: Mapped[float | None] = mapped_column(Float, nullable=True)

    patient_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Device(Base):
    __tablename__ = "devices"

    __table_args__ = (
        UniqueConstraint("clinic_id", "device_code", name="uq_device_clinic_code"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.id"), nullable=False, index=True
    )
    device_code: Mapped[str] = mapped_column(String(100), nullable=False)
    device_name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class PatientVisit(Base):
    __tablename__ = "patient_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.id"), nullable=False, index=True
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"), nullable=False, index=True
    )
    staff_id: Mapped[int] = mapped_column(
        ForeignKey("staff.id"), nullable=False, index=True
    )
    device_id: Mapped[int | None] = mapped_column(
        ForeignKey("devices.id"), nullable=True
    )
    assessment_status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )
    assessment_result: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    visited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )


class SensorAssessment(Base):
    __tablename__ = "sensor_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clinic_id: Mapped[int] = mapped_column(
        ForeignKey("clinics.id"), nullable=False, index=True
    )
    visit_id: Mapped[int] = mapped_column(
        ForeignKey("patient_visits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source: Mapped[str] = mapped_column(
        String(20), default="SIMULATED", nullable=False
    )
    impedance_ohms: Mapped[float] = mapped_column(Float, nullable=False)
    phase_degrees: Mapped[float] = mapped_column(Float, nullable=False)
    samples: Mapped[list] = mapped_column(JSON, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
