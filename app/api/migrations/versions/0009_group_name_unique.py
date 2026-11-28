"""One potrero name per ranch, ignoring case, enforced by the database.

`services.groups._check_name` refuses a taken name, but two concurrent creates can both pass it.
Existing duplicates are renamed first ("Lote (2)"), so the upgrade can't fail on real data. A
preset keeps its name (it can't be renamed in the app), then the oldest group does.

Revision ID: 0009
Revises: 0008
Create Date: 2026-11-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NAME_LENGTH = 60  # groups.name is String(60)


def _free_name(name: str, taken: set[str]) -> str:
    """`name (n)` for the smallest n >= 2 not taken (case-insensitively), cut to fit."""
    n = 2
    while True:
        suffix = f" ({n})"
        candidate = name[: NAME_LENGTH - len(suffix)].rstrip() + suffix
        if candidate.lower() not in taken:
            return candidate
        n += 1


def upgrade() -> None:
    connection = op.get_bind()
    rows = connection.execute(
        sa.text(
            "SELECT id, ranch_id, name FROM groups ORDER BY ranch_id,"
            " CASE WHEN preset IS NULL THEN 1 ELSE 0 END, created_at, id"
        )
    ).all()
    taken: dict[object, set[str]] = {}
    for row in rows:
        taken.setdefault(row.ranch_id, set()).add(row.name.lower())
    seen: dict[object, set[str]] = {}
    for row in rows:
        mine = seen.setdefault(row.ranch_id, set())
        if row.name.lower() not in mine:
            mine.add(row.name.lower())
            continue
        new_name = _free_name(row.name, taken[row.ranch_id])
        taken[row.ranch_id].add(new_name.lower())
        mine.add(new_name.lower())
        connection.execute(
            sa.text("UPDATE groups SET name = :name WHERE id = :id"),
            {"name": new_name, "id": row.id},
        )
    op.create_index(
        "uq_groups_ranch_id_lower_name",
        "groups",
        ["ranch_id", sa.text("lower(name)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_groups_ranch_id_lower_name", table_name="groups")
