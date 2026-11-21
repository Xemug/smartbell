"""The ranch's plan. `plans-billing` is parked, so this is the one place that answers "has Pro".

Inviting users and creating another owned ranch are Pro features, as in the live app
(plans-billing, user decision 2026-11-03). `Ranch.plan_id` holds the RevenueCat entitlement of the
ranch's owner: `services/revenuecat` sets it from webhooks and the legacy import, on every ranch the
owner owns. Members never carry Pro. Any value counts as Pro until `plans-billing` defines the
plans. There is no purchase flow.
"""

import uuid
from enum import StrEnum

from sqlalchemy import ColumnElement, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from smartbell.models import Ranch, User

PRO_ENTITLEMENT = "Pro"  # RevenueCat's entitlement id, as in the live app.
MAX_OWNED_RANCHES = 20  # Keeps one account from filling the database; far above any real herd.


def _is_pro(ranch: type[Ranch] = Ranch) -> ColumnElement[bool]:
    """The one rule for Pro: the ranch carries a plan."""
    return ranch.plan_id.is_not(None) & (ranch.plan_id != "")


async def has_pro(session: AsyncSession, ranch_id: uuid.UUID) -> bool:
    """The ranch's owner holds Pro: an owner's Pro covers every ranch they own, new ones too."""
    owned = aliased(Ranch)
    found = await session.scalar(
        select(owned.id)
        .join(Ranch, Ranch.owner_user_id == owned.owner_user_id)
        .where(Ranch.id == ranch_id, _is_pro(owned))
        .limit(1)
    )
    return found is not None


async def owns_pro_ranch(session: AsyncSession, user: User) -> bool:
    """The user holds Pro as an owner (the same rule as `has_pro`, asked about a person)."""
    found = await session.scalar(
        select(Ranch.id).where(Ranch.owner_user_id == user.id, _is_pro()).limit(1)
    )
    return found is not None


async def set_owner_pro(session: AsyncSession, owner_user_id: uuid.UUID, pro: bool) -> None:
    """Gives or takes Pro on every ranch the user owns. The caller commits."""
    await session.execute(
        update(Ranch)
        .where(Ranch.owner_user_id == owner_user_id)
        .values(plan_id=PRO_ENTITLEMENT if pro else None)
    )


class RanchCreation(StrEnum):
    ALLOWED = "allowed"
    UPSELL = "upsell"  # Creating another owned ranch is a Pro feature: show See Plans.
    LIMIT = "limit"  # Even Pro can't own more than MAX_OWNED_RANCHES.


async def ranch_creation(session: AsyncSession, user: User) -> RanchCreation:
    """Whether the user may create another ranch of their own.

    Only owned ranches count, not ones they belong to as a member. A free user who already owns
    several (legacy accounts) keeps them all; only creating a new one is gated.
    """
    owned = await session.scalar(
        select(func.count()).select_from(Ranch).where(Ranch.owner_user_id == user.id)
    )
    owned = owned or 0
    if owned >= MAX_OWNED_RANCHES:
        return RanchCreation.LIMIT
    if owned == 0 or await owns_pro_ranch(session, user):
        return RanchCreation.ALLOWED
    return RanchCreation.UPSELL
