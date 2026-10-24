
import csv
import math
from pathlib import Path

DATASET_PATH = Path(__file__).parent / "dataset_template.csv"

REQUIRED_COLUMNS = [
    "sample_id",
    "sample_type",
    "frequency_hz",
    "impedance_ohms",
    "phase_degrees",
    "temperature_c",
]


def validate_dataset():
    if not DATASET_PATH.exists():
        print(f"ERROR: Dataset not found: {DATASET_PATH}")
        return

    with DATASET_PATH.open("r", newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            print("ERROR: Dataset has no header.")
            return

        missing = [
            column for column in REQUIRED_COLUMNS
            if column not in reader.fieldnames
        ]

        if missing:
            print("ERROR: Missing columns:", ", ".join(missing))
            return

        rows = list(reader)

    valid_rows = 0

    for row in rows:
        label = (row.get("sample_type") or "").strip().lower()

        # Unknown labels and placeholders cannot be used for training.
        if not label or label == "unknown":
            continue

        try:
            frequency = float(row["frequency_hz"])
            impedance = float(row["impedance_ohms"])
            phase = float(row["phase_degrees"])
            temperature = float(row["temperature_c"])
        except (ValueError, TypeError, KeyError):
            continue

        measurements = [frequency, impedance, phase, temperature]

        if not all(math.isfinite(value) for value in measurements):
            continue

        if frequency <= 0 or impedance < 0:
            continue

        valid_rows += 1

    print(f"Total dataset rows: {len(rows)}")
    print(f"Rows with complete measurements and labels: {valid_rows}")

    if valid_rows == 0:
        print("STATUS: NOT READY")
        print("Real, labelled measurements are required before training.")
        print("No model has been trained.")
    else:
        print("STATUS: DATA CHECK PASSED FOR BASIC VALIDATION")
        print("This does not prove the data is sufficient for ML training.")


if __name__ == "__main__":
    validate_dataset()
