
import math

from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Silica Edge-AI ML Backend",
    description="Backend for sensor-data processing and ML integration.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class SensorReading(BaseModel):
    frequency_hz: float = Field(gt=0, allow_inf_nan=False)
    impedance_ohms: float = Field(ge=0, allow_inf_nan=False)
    phase_degrees: float = Field(allow_inf_nan=False)
    temperature_c: float = Field(allow_inf_nan=False)


@app.get("/")
def root():
    return {
        "project": "Silica Edge-AI",
        "status": "running",
        "model_status": "not_trained",
        "data_status": "waiting_for_hardware",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": False,
        "prediction_mode": "not_configured",
    }


@app.post("/predict")
def predict(reading: SensorReading):
    measurements = reading.model_dump()

    if not all(math.isfinite(value) for value in measurements.values()):
        return {
            "status": "invalid_measurements",
            "prediction": None,
            "message": "All measurements must be finite numbers.",
        }

    return {
        "status": "model_not_ready",
        "prediction": None,
        "message": (
            "Measurements received and validated. "
            "A trained and validated model is not available yet."
        ),
        "received_measurements": measurements,
    }
