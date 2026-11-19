"""SINIIGA is unique nationally among ACTIVE animals, not per ranch (domain-model §7.7).

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-03
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("uq_animals_ranch_id_siniiga", table_name="animals")
    op.create_index(
        "uq_animals_siniiga_active",
        "animals",
        ["siniiga"],
        unique=True,
        postgresql_where=sa.text("siniiga IS NOT NULL AND status = 'ACTIVE'"),
        sqlite_where=sa.text("siniiga IS NOT NULL AND status = 'ACTIVE'"),
    )


def downgrade() -> None:
    op.drop_index("uq_animals_siniiga_active", table_name="animals")
    op.create_index(
        "uq_animals_ranch_id_siniiga",
        "animals",
        ["ranch_id", "siniiga"],
        unique=True,
        postgresql_where=sa.text("siniiga IS NOT NULL"),
        sqlite_where=sa.text("siniiga IS NOT NULL"),
    )
