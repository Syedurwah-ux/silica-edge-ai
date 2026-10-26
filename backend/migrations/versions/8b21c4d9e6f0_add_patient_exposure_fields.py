"""add patient occupation and exposure fields

Revision ID: 8b21c4d9e6f0
Revises: 7666d33845cc
"""

from alembic import op
import sqlalchemy as sa


revision = "8b21c4d9e6f0"
down_revision = "7666d33845cc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "patients",
        sa.Column("occupation", sa.String(length=150), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("exposure_years", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("patients", "exposure_years")
    op.drop_column("patients", "occupation")