"""The ranch's plan. `plans-billing` is parked, so this is the one place that answers "has Pro".

Inviting users is a Pro feature, as in the live app (plans-billing, user decision 2026-11-03).
`Ranch.plan_id` holds the RevenueCat entitlement of the ranch's owner: `services/revenuecat`
sets it from webhooks and the legacy import, on every ranch the owner owns. Members never carry
Pro. Any value counts as Pro until `plans-billing` defines the plans. There is no purchase flow.
"""

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from smartbell.models import Ranch

PRO_ENTITLEMENT = "Pro"  # RevenueCat's entitlement id, as in the live app.


async def has_pro(session: AsyncSession, ranch_id: uuid.UUID) -> bool:
    """The ranch's owner holds Pro: an owner's Pro covers every ranch they own, new ones too."""
    owned = aliased(Ranch)
    plan_id = await session.scalar(
        select(owned.plan_id)
        .join(Ranch, Ranch.owner_user_id == owned.owner_user_id)
        .where(Ranch.id == ranch_id, owned.plan_id.is_not(None))
        .limit(1)
    )
    return bool(plan_id)


async def set_owner_pro(session: AsyncSession, owner_user_id: uuid.UUID, pro: bool) -> None:
    """Gives or takes Pro on every ranch the user owns. The caller commits."""
    await session.execute(
        update(Ranch)
        .where(Ranch.owner_user_id == owner_user_id)
        .values(plan_id=PRO_ENTITLEMENT if pro else None)
    )
