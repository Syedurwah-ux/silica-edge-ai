
import math

from fastapi import FastAPI
from pydantic import BaseModel, Field, ConfigDict
from fastapi.middleware.cors import CORSMiddleware

from backend.routes_auth import router as auth_router
from backend.routes_me import router as me_router
from backend.routes_patients import router as patients_router
from backend.routes_visits import router as visits_router
from backend.routes_sensor_assessments import router as sensor_assessments_router


app = FastAPI(
    title="AeroEdge AI Backend",
    description="Sensor-data validation and ML integration for the AeroEdge AI research prototype.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(patients_router)
app.include_router(visits_router)
app.include_router(sensor_assessments_router)


class SensorReading(BaseModel):
    model_config = ConfigDict(extra="forbid")

    frequency_hz: float = Field(gt=0, allow_inf_nan=False)
    impedance_ohms: float = Field(ge=0, allow_inf_nan=False)
    phase_degrees: float = Field(ge=-360, le=360, allow_inf_nan=False)
    temperature_c: float = Field(ge=-20, le=100, allow_inf_nan=False)


class SensorSweep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sample_id: str = Field(min_length=1, max_length=50)
    readings: list[SensorReading] = Field(min_length=90, max_length=90)


@app.get("/")
def root():
    return {
        "project": "AeroEdge AI",
        "status": "running",
        "model_status": "not_trained",
        "data_status": "waiting_for_hardware",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": False,
        "prediction_mode": "validation_only",
    }


@app.post("/predict")
def predict(reading: SensorReading):
    return {
        "status": "model_not_ready",
        "prediction": None,
        "message": (
            "One measurement was validated. "
            "A trained and validated model is not available yet."
        ),
        "received_measurements": reading.model_dump(),
    }


@app.post("/predict/sweep")
def predict_sweep(sweep: SensorSweep):
    readings = [reading.model_dump() for reading in sweep.readings]

    frequencies = [reading["frequency_hz"] for reading in readings]

    if any(
        frequencies[index] <= frequencies[index - 1]
        for index in range(1, len(frequencies))
    ):
        return {
            "status": "invalid_sweep",
            "prediction": None,
            "message": "Frequencies must be strictly increasing.",
        }

    if not all(
        math.isfinite(value)
        for reading in readings
        for value in reading.values()
    ):
        return {
            "status": "invalid_sweep",
            "prediction": None,
            "message": "All measurements must be finite numbers.",
        }

    return {
        "status": "model_not_ready",
        "sample_id": sweep.sample_id,
        "readings_received": len(readings),
        "frequency_start_hz": frequencies[0],
        "frequency_end_hz": frequencies[-1],
        "prediction": None,
        "message": (
            "The 90-point sweep passed basic validation. "
            "No trained, validated model is loaded, so no prediction was made."
        ),
    }
