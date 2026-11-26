"""Bulls say how they are available: on the ranch, semen only, or both.

Every male gets one; existing males read EN_RANCHO, which is what a bull record meant until now.

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("animals") as batch:
        batch.add_column(
            sa.Column(
                "bull_availability",
                sa.Enum(
                    "EN_RANCHO",
                    "SEMEN",
                    "AMBOS",
                    name="bull_availability",
                    native_enum=False,
                    create_constraint=True,
                    length=32,
                ),
                nullable=True,
            )
        )
    op.execute("UPDATE animals SET bull_availability = 'EN_RANCHO' WHERE sex = 'MACHO'")
    with op.batch_alter_table("animals") as batch:
        batch.create_check_constraint(
            op.f("ck_animals_bull_availability_iff_male"),
            "(sex = 'MACHO') = (bull_availability IS NOT NULL)",
        )


def downgrade() -> None:
    with op.batch_alter_table("animals") as batch:
        batch.drop_constraint(op.f("ck_animals_bull_availability_iff_male"), type_="check")
        batch.drop_column("bull_availability")
