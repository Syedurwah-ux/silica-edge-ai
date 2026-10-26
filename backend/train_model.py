
import csv
import math
from collections import Counter, defaultdict
from pathlib import Path

DATASET_PATH = Path(__file__).parent / "dataset_template.csv"

REQUIRED_COLUMNS = [
    "sample_id",
    "sample_group",
    "sample_type",
    "repeat_number",
    "frequency_hz",
    "impedance_ohms",
    "phase_degrees",
    "temperature_c",
    "measurement_notes",
]

PLACEHOLDER_LABELS = {"", "unknown", "placeholder", "pending"}


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
    placeholder_rows = 0
    invalid_rows = 0
    group_labels = defaultdict(set)
    label_counts = Counter()

    for line_number, row in enumerate(rows, start=2):
        label = (row.get("sample_type") or "").strip().lower()
        sample_id = (row.get("sample_id") or "").strip()
        sample_group = (row.get("sample_group") or "").strip()

        if (
            not label
            or label in PLACEHOLDER_LABELS
            or not sample_id
            or not sample_group
        ):
            placeholder_rows += 1
            continue

        try:
            repeat_number = int(row["repeat_number"])
            frequency = float(row["frequency_hz"])
            impedance = float(row["impedance_ohms"])
            phase = float(row["phase_degrees"])
            temperature = float(row["temperature_c"])
        except (ValueError, TypeError, KeyError):
            invalid_rows += 1
            print(f"Invalid or missing numeric value at CSV line {line_number}")
            continue

        measurements = [frequency, impedance, phase, temperature]

        if (
            not all(math.isfinite(value) for value in measurements)
            or repeat_number < 1
            or frequency <= 0
            or impedance < 0
            or not -360 <= phase <= 360
            or not -20 <= temperature <= 100
        ):
            invalid_rows += 1
            print(f"Out-of-range measurement at CSV line {line_number}")
            continue

        valid_rows += 1
        group_labels[sample_group].add(label)
        label_counts[label] += 1

    inconsistent_groups = [
        group for group, labels in group_labels.items()
        if len(labels) > 1
    ]

    print(f"Total dataset rows: {len(rows)}")
    print(f"Rows with complete measurements and labels: {valid_rows}")
    print(f"Placeholder or unlabeled rows: {placeholder_rows}")
    print(f"Invalid measurement rows: {invalid_rows}")
    print(f"Label counts: {dict(label_counts)}")

    if inconsistent_groups:
        print("WARNING: Groups with inconsistent labels:", inconsistent_groups)

    if valid_rows == 0:
        print("STATUS: NOT READY")
        print("Collect genuine, labelled sensor measurements before training.")
        print("No model has been trained.")
    elif inconsistent_groups:
        print("STATUS: REVIEW REQUIRED")
        print("Resolve inconsistent labels within sample groups.")
        print("No model has been trained.")
    else:
        print("STATUS: BASIC DATA VALIDATION PASSED")
        print("This does not establish dataset quality or ML readiness.")
        print("No model has been trained.")


if __name__ == "__main__":
    validate_dataset()
