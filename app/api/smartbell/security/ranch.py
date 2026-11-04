"""The active ranch and the permission guard.

Every ranch-scoped request carries `X-Ranch-Id`. The guard loads the caller's membership in that
ranch and refuses the request unless it holds the permission the endpoint declares:

    @router.post("/animals", dependencies=[Depends(require(Permission.ANIMALS_CREATE))])

or, to read the ranch inside the handler:

    async def create(ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_CREATE))])

Queries then filter on `ctx.ranch_id`, never on an id taken from the body or the path.
"""

import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import Role
from smartbell.models import Membership, User
from smartbell.security import get_current_user
from smartbell.security.permissions import Permission, effective

RANCH_HEADER = "X-Ranch-Id"


@dataclass(frozen=True)
class RanchContext:
    user: User
    ranch_id: uuid.UUID
    role: Role
    permissions: frozenset[Permission]


def _forbidden(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, detail=detail)


async def get_ranch_context(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    x_ranch_id: Annotated[uuid.UUID | None, Header()] = None,
) -> RanchContext:
    """The caller's membership in the ranch named by `X-Ranch-Id`."""
    if x_ranch_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="ranch_required")
    membership = await session.get(Membership, (user.id, x_ranch_id))
    if membership is None:
        # The same answer whether the ranch exists or not, so ids can't be probed.
        raise _forbidden("not_a_member")
    return RanchContext(
        user=user,
        ranch_id=x_ranch_id,
        role=membership.role,
        permissions=effective(membership.role, membership.permissions),
    )


def require(permission: Permission) -> Callable[..., Awaitable[RanchContext]]:
    """A dependency that passes only members of the active ranch who hold `permission`."""

    async def guard(ctx: Annotated[RanchContext, Depends(get_ranch_context)]) -> RanchContext:
        if permission not in ctx.permissions:
            raise _forbidden("permission_denied")
        return ctx

    guard.__name__ = f"require_{permission.value.lower()}"
    return guard
