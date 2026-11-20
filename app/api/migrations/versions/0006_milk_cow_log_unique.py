"""One milk cow log per cow, day and destination (`milk-api`).

Re-entering a cow's litres overwrites the row, so the pair (cow, day, destination) is unique. The
new index leads with (animal_id, date) and replaces the plain index on those columns.

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-20
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_milk_cow_logs_animal_id_date_destination",
        "milk_cow_logs",
        ["animal_id", "date", "destination"],
        unique=True,
    )
    op.drop_index("ix_milk_cow_logs_animal_id_date", table_name="milk_cow_logs")


def downgrade() -> None:
    op.create_index("ix_milk_cow_logs_animal_id_date", "milk_cow_logs", ["animal_id", "date"])
    op.drop_index("uq_milk_cow_logs_animal_id_date_destination", table_name="milk_cow_logs")
