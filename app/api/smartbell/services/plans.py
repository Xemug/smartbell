"""What the caller's plan allows. Billing itself is parked (`plans-billing`): this is the one place
that answers "has Pro", so the purchase flow can replace it later without touching callers.
"""

from enum import StrEnum

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.models import Ranch, User

MAX_OWNED_RANCHES = 20  # Keeps one account from filling the database; far above any real herd.


class RanchCreation(StrEnum):
    ALLOWED = "allowed"
    UPSELL = "upsell"  # Creating another owned ranch is a Pro feature: show See Plans.
    LIMIT = "limit"  # Even Pro can't own more than MAX_OWNED_RANCHES.


async def has_pro(session: AsyncSession, user: User) -> bool:
    """A ranch the user owns carries the RevenueCat Pro entitlement."""
    owned_with_plan = await session.scalar(
        select(func.count())
        .select_from(Ranch)
        .where(Ranch.owner_user_id == user.id, Ranch.plan_id.is_not(None))
    )
    return bool(owned_with_plan)


async def ranch_creation(session: AsyncSession, user: User) -> RanchCreation:
    """Whether the user may create another ranch of their own (plans-billing, 2026-11-03).

    Only owned ranches count, not ones they belong to as a member. A free user who already owns
    several (legacy accounts) keeps them all; only creating a new one is gated.
    """
    owned = await session.scalar(
        select(func.count()).select_from(Ranch).where(Ranch.owner_user_id == user.id)
    )
    owned = owned or 0
    if owned >= MAX_OWNED_RANCHES:
        return RanchCreation.LIMIT
    if owned == 0 or await has_pro(session, user):
        return RanchCreation.ALLOWED
    return RanchCreation.UPSELL
