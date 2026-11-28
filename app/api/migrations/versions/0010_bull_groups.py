"""Bull groups: a group type that holds the bulls on the ranch.

Only the CHECK on `groups.type` changes; no existing row is touched.

Revision ID: 0010
Revises: 0008
Create Date: 2026-11-27
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0010"
# Chains after the potrero-name card's 0009 once that merges; until then main's head is 0008.
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("groups") as batch:
        batch.drop_constraint(op.f("ck_groups_type"), type_="check")
        batch.create_check_constraint(
            op.f("ck_groups_type"), "type IN ('PRESET', 'CUSTOM', 'TORO')"
        )


def downgrade() -> None:
    op.execute("DELETE FROM groups WHERE type = 'TORO'")
    with op.batch_alter_table("groups") as batch:
        batch.drop_constraint(op.f("ck_groups_type"), type_="check")
        batch.create_check_constraint(op.f("ck_groups_type"), "type IN ('PRESET', 'CUSTOM')")
