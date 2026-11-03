"""The caller's ranches, and the members of the active ranch (`X-Ranch-Id`).

Renaming and deleting a ranch belong to `profile-ranch-config`; inviting members to `user-admin`.
"""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import Role
from smartbell.models import Membership, Ranch, User
from smartbell.security import get_current_user
from smartbell.security.permissions import Permission, effective
from smartbell.security.ranch import RanchContext, require
from smartbell.services import ranches
from smartbell.services.ranches import MembershipRefused

router = APIRouter(tags=["ranches"])


class RanchOut(BaseModel):
    id: uuid.UUID
    name: str
    role: Role
    permissions: list[Permission]  # What the caller may do there; the UI hides the rest.


def ranch_out(ranch: Ranch, membership: Membership) -> RanchOut:
    codes = effective(membership.role, membership.permissions)
    return RanchOut(
        id=ranch.id,
        name=ranch.name,
        role=membership.role,
        permissions=[code for code in Permission if code in codes],
    )


async def my_ranches(session: AsyncSession, user: User) -> list[RanchOut]:
    return [ranch_out(r, m) for r, m in await ranches.list_ranches(session, user)]


class RanchCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)


class MemberOut(BaseModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str | None
    email: str
    photo_url: str | None
    role: Role
    permissions: list[Permission]
    is_owner: bool


# Dueño is the owner's alone: it can't be handed out here.
MemberRole = Literal[Role.ADMINISTRADOR, Role.MEDICO, Role.NUTRIOLOGO, Role.TECNICO_CAMPO]


class MemberUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: MemberRole | None = None
    permissions: list[Permission] | None = Field(default=None, max_length=len(Permission))


def member_out(row: ranches.MemberRow) -> MemberOut:
    return MemberOut(
        user_id=row.user.id,
        first_name=row.user.first_name,
        last_name=row.user.last_name,
        email=row.user.email,
        photo_url=row.user.photo_url,
        role=row.role,
        permissions=[code for code in Permission if code in row.permissions],
        is_owner=row.is_owner,
    )


def _refused(error: MembershipRefused) -> HTTPException:
    return HTTPException(error.status, detail=error.code)


@router.get("/ranches", operation_id="listRanches")
async def list_ranches(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[RanchOut]:
    return await my_ranches(session, user)


@router.post("/ranches", operation_id="createRanch", status_code=status.HTTP_201_CREATED)
async def create_ranch(
    body: RanchCreate,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RanchOut:
    """Agregar Rancho: the caller becomes its Dueño."""
    try:
        ranch = await ranches.create_owned_ranch(session, user, body.name)
    except MembershipRefused as error:
        raise _refused(error) from error
    membership = await session.get(Membership, (user.id, ranch.id))
    assert membership is not None  # noqa: S101 - create_ranch just added it.
    return ranch_out(ranch, membership)


@router.get("/ranch/members", operation_id="listMembers")
async def list_members(
    ctx: Annotated[RanchContext, Depends(require(Permission.USERS_VIEW))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[MemberOut]:
    rows = await ranches.list_members(session, ctx.ranch_id)
    return [member_out(row) for row in rows]


@router.patch("/ranch/members/{user_id}", operation_id="updateMember")
async def update_member(
    user_id: uuid.UUID,
    body: MemberUpdate,
    ctx: Annotated[RanchContext, Depends(require(Permission.USERS_EDIT))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> MemberOut:
    if body.role is None and body.permissions is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="nothing_to_change")
    try:
        membership = await ranches.update_member(session, ctx, user_id, body.role, body.permissions)
    except MembershipRefused as error:
        raise _refused(error) from error
    user = await session.get(User, user_id)
    assert user is not None  # noqa: S101 - the membership's foreign key holds it.
    row = ranches.MemberRow(
        user=user,
        role=membership.role,
        permissions=effective(membership.role, membership.permissions),
        is_owner=False,  # The owner can't be edited.
    )
    return member_out(row)


@router.delete(
    "/ranch/members/{user_id}",
    operation_id="removeMember",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_member(
    user_id: uuid.UUID,
    ctx: Annotated[RanchContext, Depends(require(Permission.USERS_DELETE))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    try:
        await ranches.remove_member(session, ctx, user_id)
    except MembershipRefused as error:
        raise _refused(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
