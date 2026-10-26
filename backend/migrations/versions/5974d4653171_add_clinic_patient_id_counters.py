
"""Add clinic-specific patient ID counters."""

from alembic import op
import sqlalchemy as sa

revision = "add_patient_id_counters"
down_revision = "6ca5ccc2513e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "patient_id_counters",
        sa.Column(
            "clinic_id",
            sa.Integer(),
            sa.ForeignKey("clinics.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "last_number",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.CheckConstraint(
            "last_number >= 0",
            name="ck_patient_id_counters_last_number",
        ),
    )

    connection = op.get_bind()

    # Initialize counters from existing PAT-numeric IDs.
    connection.execute(
        sa.text("""
            INSERT INTO patient_id_counters (clinic_id, last_number)
            SELECT
                c.id,
                COALESCE(
                    MAX(
                        CASE
                            WHEN p.patient_code ~ '^PAT-[0-9]{1,9}$'
                            THEN substring(p.patient_code FROM 5)::INTEGER
                            ELSE NULL
                        END
                    ),
                    0
                )
            FROM clinics c
            LEFT JOIN patients p ON p.clinic_id = c.id
            GROUP BY c.id
        """)
    )

    # Replace global patient-code uniqueness with clinic-specific uniqueness.
    op.drop_index("ix_patients_patient_code", table_name="patients")

    op.create_index(
        "ix_patients_patient_code",
        "patients",
        ["patient_code"],
        unique=False,
    )

    op.create_unique_constraint(
        "uq_patients_clinic_patient_code",
        "patients",
        ["clinic_id", "patient_code"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_patients_clinic_patient_code",
        "patients",
        type_="unique",
    )

    op.drop_index("ix_patients_patient_code", table_name="patients")

    op.create_index(
        "ix_patients_patient_code",
        "patients",
        ["patient_code"],
        unique=True,
    )

    op.drop_table("patient_id_counters")
