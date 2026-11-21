"""Reading the active ranch's groups (potreros)."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.models import Group


async def list_groups(session: AsyncSession, ranch_id: uuid.UUID) -> list[Group]:
    """Presets first, then the ranch's own groups, each by name."""
    query = (
        select(Group)
        .where(Group.ranch_id == ranch_id)
        .order_by(Group.preset.is_(None), Group.name, Group.id)
    )
    return list((await session.scalars(query)).all())
