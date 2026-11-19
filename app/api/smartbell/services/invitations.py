"""Inviting people to a ranch and accepting an invite link (`user-admin`).

The inviter picks the role and codes up front; the invitee signs up (or in) with the invited
email and opens the link, which makes them a member with exactly those codes. The link carries a
random token; only its sha256 is stored, so a database leak can't be turned into invites.
"""

import datetime as dt
import hashlib
import secrets
import uuid
from dataclasses import dataclass

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import HistoryKey, Role
from smartbell.models import Invitation, Membership, Ranch, User
from smartbell.schemas.history import HistoryRefs
from smartbell.security.permissions import Permission, effective
from smartbell.security.ranch import RanchContext
from smartbell.services import history, plans
from smartbell.services.ranches import MembershipRefused, check_grant

INVITATION_TTL = dt.timedelta(days=7)
MAX_PENDING_INVITATIONS = 50  # Per ranch: far above a real team, low enough to stop a spammer.


@dataclass(frozen=True)
class InviteData:
    email: str
    first_name: str
    last_name: str | None
    phone: str | None
    role: Role
    permissions: list[Permission]


@dataclass(frozen=True)
class InvitationPreview:
    """What the link shows before sign-in: enough to know who invites you where, nothing more."""

    ranch_name: str
    invited_by: str | None
    email: str
    role: Role
    status: str  # "pending", "accepted" or "expired"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _now() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def _expired(invitation: Invitation) -> bool:
    expires = invitation.expires_at
    if expires.tzinfo is None:  # SQLite hands back naive datetimes.
        expires = expires.replace(tzinfo=dt.UTC)
    return expires <= _now()


def _status(invitation: Invitation) -> str:
    if invitation.accepted_at is not None:
        return "accepted"
    return "expired" if _expired(invitation) else "pending"


def _check_codes(ctx: RanchContext, role: Role, codes: frozenset[Permission]) -> None:
    if role is Role.DUENO:
        raise MembershipRefused("owner_role_reserved", 403)
    if not codes:
        raise MembershipRefused("permissions_required", 422)
    check_grant(ctx, role, codes)


async def list_pending(session: AsyncSession, ranch_id: uuid.UUID) -> list[Invitation]:
    rows = await session.scalars(
        select(Invitation)
        .where(
            Invitation.ranch_id == ranch_id,
            Invitation.accepted_at.is_(None),
            Invitation.expires_at > _now(),
        )
        .order_by(Invitation.created_at, Invitation.id)
    )
    return list(rows)


async def create(
    session: AsyncSession, ctx: RanchContext, data: InviteData
) -> tuple[Invitation, str]:
    """A new invite and its raw token, which is shown once and never stored.

    Inviting is a Pro feature: without Pro this refuses with `plan_required`, which the screens
    turn into the upsell. A new invite to the same email replaces the pending one.
    """
    if not await plans.has_pro(session, ctx.ranch_id):
        raise MembershipRefused("plan_required", 402)
    codes = frozenset(data.permissions)
    _check_codes(ctx, data.role, codes)
    email = data.email.strip().lower()
    already = await session.scalar(
        select(Membership.user_id)
        .join(User, User.id == Membership.user_id)
        .where(Membership.ranch_id == ctx.ranch_id, func.lower(User.email) == email)
    )
    if already is not None:
        raise MembershipRefused("already_member", 409)
    await session.execute(
        delete(Invitation).where(
            Invitation.ranch_id == ctx.ranch_id,
            Invitation.email == email,
            Invitation.accepted_at.is_(None),
        )
    )
    if len(await list_pending(session, ctx.ranch_id)) >= MAX_PENDING_INVITATIONS:
        raise MembershipRefused("invitation_limit", 409)
    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        id=uuid.uuid4(),
        ranch_id=ctx.ranch_id,
        email=email,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        role=data.role,
        permissions=[code.value for code in Permission if code in codes],
        token_hash=hash_token(token),
        invited_by_user_id=ctx.user.id,
        expires_at=_now() + INVITATION_TTL,
    )
    session.add(invitation)
    await session.commit()
    return invitation, token


async def revoke(session: AsyncSession, ctx: RanchContext, invitation_id: uuid.UUID) -> None:
    invitation = await session.get(Invitation, invitation_id)
    if invitation is None or invitation.ranch_id != ctx.ranch_id or invitation.accepted_at:
        raise MembershipRefused("invitation_not_found", 404)
    await session.delete(invitation)
    await session.commit()


async def _by_token(session: AsyncSession, token: str) -> Invitation:
    invitation = await session.scalar(
        select(Invitation).where(Invitation.token_hash == hash_token(token))
    )
    if invitation is None:
        raise MembershipRefused("invitation_not_found", 404)
    return invitation


async def preview(session: AsyncSession, token: str) -> InvitationPreview:
    invitation = await _by_token(session, token)
    ranch = await session.get(Ranch, invitation.ranch_id)
    assert ranch is not None  # noqa: S101 - the foreign key cascades.
    inviter = (
        await session.get(User, invitation.invited_by_user_id)
        if invitation.invited_by_user_id
        else None
    )
    return InvitationPreview(
        ranch_name=ranch.name,
        invited_by=inviter.first_name if inviter else None,
        email=invitation.email,
        role=invitation.role,
        status=_status(invitation),
    )


async def _check_still_grantable(session: AsyncSession, invitation: Invitation) -> None:
    """The invite is only as good as its sender is now: still a member who may add users and
    grant every invited code, in a ranch that still has Pro. Otherwise a removed or trimmed
    member's invites would outlive them."""
    if not await plans.has_pro(session, invitation.ranch_id):
        raise MembershipRefused("plan_required", 402)
    sender = (
        await session.get(Membership, (invitation.invited_by_user_id, invitation.ranch_id))
        if invitation.invited_by_user_id
        else None
    )
    if sender is None:
        raise MembershipRefused("invitation_revoked", 410)
    held = effective(sender.role, sender.permissions)
    codes = frozenset(Permission(code) for code in invitation.permissions)
    if Permission.USERS_ADD not in held or not codes <= held:
        raise MembershipRefused("invitation_revoked", 410)


async def accept(
    session: AsyncSession, user: User, token: str, *, email_verified: bool
) -> uuid.UUID:
    """Makes `user` a member with the invited role and codes; returns the ranch id.

    The token proves the link reached someone, and the signed-in email must be the invited one
    and *verified*: Firebase lets anyone register an unconfirmed address, so without that check a
    forwarded link plus a sign-up with the invitee's email would take the seat.
    """
    invitation = await _by_token(session, token)
    if invitation.accepted_at is not None:
        raise MembershipRefused("invitation_used", 409)
    if _expired(invitation):
        raise MembershipRefused("invitation_expired", 410)
    if user.email.lower() != invitation.email:
        raise MembershipRefused("email_mismatch", 403)
    if not email_verified:
        raise MembershipRefused("email_unverified", 403)
    ranch_id = invitation.ranch_id
    await _check_still_grantable(session, invitation)
    invitation.accepted_at = _now()
    try:
        if await session.get(Membership, (user.id, ranch_id)) is None:
            session.add(
                Membership(
                    user_id=user.id,
                    ranch_id=ranch_id,
                    role=invitation.role,
                    permissions=list(invitation.permissions),
                )
            )
            # record() flushes, so a lost race surfaces here, not only at commit.
            await history.record(
                session,
                ranch_id,
                invitation.invited_by_user_id,
                HistoryKey.USERS_ADDED,
                HistoryRefs(user_ids=[user.id]),
            )
        await session.commit()
    except IntegrityError:
        # Another tab accepted the same link first; its transaction made the membership.
        await session.rollback()
        raise MembershipRefused("invitation_used", 409) from None
    return ranch_id
