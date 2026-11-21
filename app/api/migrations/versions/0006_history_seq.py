"""History entries keep their insert order when `created_at` ties.

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Adding the identity numbers existing rows in no particular order; renumber them in the
    # order they were listed before (created_at, then id). The numbers stay 1..N, so the
    # identity's next value is still past every row.
    op.add_column(
        "history_entries",
        sa.Column("seq", sa.BigInteger(), sa.Identity(always=False), nullable=False),
    )
    op.execute(
        """
        UPDATE history_entries AS h SET seq = ordered.n
        FROM (
            SELECT id, row_number() OVER (ORDER BY created_at, id) AS n FROM history_entries
        ) AS ordered
        WHERE h.id = ordered.id
        """
    )
    op.drop_index("ix_history_entries_ranch_id_created_at", table_name="history_entries")
    op.create_index(
        "ix_history_entries_ranch_id_created_at_seq",
        "history_entries",
        ["ranch_id", "created_at", "seq"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_history_entries_ranch_id_created_at_seq", table_name="history_entries")
    op.create_index(
        "ix_history_entries_ranch_id_created_at",
        "history_entries",
        ["ranch_id", "created_at"],
        unique=False,
    )
    op.drop_column("history_entries", "seq")
