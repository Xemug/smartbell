"""The ranch's plan. `plans-billing` is parked, so this is the one place that answers "has Pro".

Inviting users and creating another owned ranch are Pro features, as in the live app
(plans-billing, user decision 2026-11-03). `Ranch.plan_id` holds the RevenueCat entitlement the
legacy import copies over; any value counts as Pro until `plans-billing` defines the plans. There is
no purchase flow here.
"""

import uuid
from enum import StrEnum

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.models import Ranch, User

MAX_OWNED_RANCHES = 20  # Keeps one account from filling the database; far above any real herd.


def _is_pro() -> ColumnElement[bool]:
    """The one rule for Pro: the ranch carries a plan."""
    return Ranch.plan_id.is_not(None) & (Ranch.plan_id != "")


async def has_pro(session: AsyncSession, ranch_id: uuid.UUID) -> bool:
    """This ranch is on Pro."""
    found = await session.scalar(select(Ranch.id).where(Ranch.id == ranch_id, _is_pro()))
    return found is not None


async def owns_pro_ranch(session: AsyncSession, user: User) -> bool:
    """A ranch the user owns is on Pro."""
    owned_with_plan = await session.scalar(
        select(func.count()).select_from(Ranch).where(Ranch.owner_user_id == user.id, _is_pro())
    )
    return bool(owned_with_plan)


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
