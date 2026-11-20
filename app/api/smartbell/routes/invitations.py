"""Administrar usuarios: the ranch's plan state, invitations, and the invite link (`user-admin`).

Inviting is a Pro feature. Without Pro, `POST /ranch/invitations` answers 402 `plan_required`
and `GET /ranch/plan` says `has_pro: false`; the screens show the upsell instead of the form.
"""

import datetime as dt
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import Role
from smartbell.models import Invitation, User
from smartbell.routes.ranches import MemberRole
from smartbell.security import TokenClaims, get_current_user, get_token_claims
from smartbell.security.permissions import Permission, preset
from smartbell.security.ranch import RanchContext, get_ranch_context, require
from smartbell.services import invitations, plans
from smartbell.services.ranches import MembershipRefused

router = APIRouter(tags=["users"])


class PlanOut(BaseModel):
    has_pro: bool


class InvitationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    # A plain shape check: the invitee proves the address by signing in with it.
    email: str = Field(max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^\+[1-9]\d{7,14}$")  # E.164
    role: MemberRole
    permissions: list[Permission] = Field(min_length=1, max_length=len(Permission))


class InvitationOut(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str | None
    role: Role
    permissions: list[Permission]
    created_at: dt.datetime
    expires_at: dt.datetime


class InvitationCreated(InvitationOut):
    token: str  # Shown once; the screen builds the link /invitacion/{token} from it.


class InvitationPreviewOut(BaseModel):
    ranch_name: str
    invited_by: str | None
    email: str
    role: Role
    status: str


class AcceptedOut(BaseModel):
    ranch_id: uuid.UUID


def _out(invitation: Invitation) -> InvitationOut:
    return InvitationOut(
        id=invitation.id,
        email=invitation.email,
        first_name=invitation.first_name,
        last_name=invitation.last_name,
        role=invitation.role,
        permissions=[code for code in Permission if code.value in invitation.permissions],
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
    )


def _refused(error: MembershipRefused) -> HTTPException:
    return HTTPException(error.status, detail=error.code)


class RolePresetOut(BaseModel):
    role: Role
    permissions: list[Permission]  # The preset, which is also the most the role can be given.


@router.get("/role-presets", operation_id="listRolePresets")
async def role_presets(_: Annotated[User, Depends(get_current_user)]) -> list[RolePresetOut]:
    """§7.8, for the permission tabs: which toggles a role starts with and which it may have."""
    return [
        RolePresetOut(role=role, permissions=[Permission(code) for code in preset(role)])
        for role in Role
    ]


@router.get("/ranch/plan", operation_id="getRanchPlan")
async def get_plan(
    ctx: Annotated[RanchContext, Depends(get_ranch_context)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PlanOut:
    return PlanOut(has_pro=await plans.has_pro(session, ctx.ranch_id))


@router.get("/ranch/invitations", operation_id="listInvitations")
async def list_invitations(
    ctx: Annotated[RanchContext, Depends(require(Permission.USERS_VIEW))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[InvitationOut]:
    return [_out(row) for row in await invitations.list_pending(session, ctx.ranch_id)]


@router.post(
    "/ranch/invitations", operation_id="createInvitation", status_code=status.HTTP_201_CREATED
)
async def create_invitation(
    body: InvitationCreate,
    ctx: Annotated[RanchContext, Depends(require(Permission.USERS_ADD))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> InvitationCreated:
    data = invitations.InviteData(
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name or None,
        phone=body.phone,
        role=body.role,
        permissions=body.permissions,
    )
    try:
        invitation, token = await invitations.create(session, ctx, data)
    except MembershipRefused as error:
        raise _refused(error) from error
    return InvitationCreated(**_out(invitation).model_dump(), token=token)


@router.delete(
    "/ranch/invitations/{invitation_id}",
    operation_id="revokeInvitation",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_invitation(
    invitation_id: uuid.UUID,
    ctx: Annotated[RanchContext, Depends(require(Permission.USERS_ADD))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    try:
        await invitations.revoke(session, ctx, invitation_id)
    except MembershipRefused as error:
        raise _refused(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# The link itself. Its token is 256 random bits, so it can't be guessed; the preview is public so
# the invitee sees who invites them before creating an account.


@router.get("/invitations/{token}", operation_id="previewInvitation")
async def preview_invitation(
    token: str, session: Annotated[AsyncSession, Depends(get_session)]
) -> InvitationPreviewOut:
    try:
        found = await invitations.preview(session, token[:100])
    except MembershipRefused as error:
        raise _refused(error) from error
    return InvitationPreviewOut(**found.__dict__)


@router.post("/invitations/{token}/accept", operation_id="acceptInvitation")
async def accept_invitation(
    token: str,
    user: Annotated[User, Depends(get_current_user)],
    claims: Annotated[TokenClaims, Depends(get_token_claims)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AcceptedOut:
    """Needs the invited email, verified: 403 `email_unverified` until the invitee confirms it."""
    # The token's email must be the account's too, so a verified claim can't vouch for another.
    verified = claims.email_verified and (claims.email or "").lower() == user.email.lower()
    try:
        ranch_id = await invitations.accept(session, user, token[:100], email_verified=verified)
    except MembershipRefused as error:
        raise _refused(error) from error
    return AcceptedOut(ranch_id=ranch_id)
