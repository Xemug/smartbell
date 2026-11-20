"""The ranch's plan. `plans-billing` is parked, so this is the one place that answers "has Pro".

Inviting users is a Pro feature, as in the live app (plans-billing, user decision 2026-11-03).
`Ranch.plan_id` holds the RevenueCat entitlement the legacy import copies over; any value counts
as Pro until `plans-billing` defines the plans. There is no purchase flow here.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.models import Ranch


async def has_pro(session: AsyncSession, ranch_id: uuid.UUID) -> bool:
    plan_id = await session.scalar(select(Ranch.plan_id).where(Ranch.id == ranch_id))
    return bool(plan_id)
