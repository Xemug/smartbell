"""Ranches and who belongs to them. Invitations live in `services/invitations.py`."""

import uuid
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import HistoryKey, Role
from smartbell.models import Membership, Ranch, RanchSettings, User
from smartbell.schemas.history import HistoryRefs
from smartbell.security.permissions import ROLE_PRESETS, Permission, effective, preset
from smartbell.security.ranch import RanchContext
from smartbell.services import history

MAX_OWNED_RANCHES = 20  # Keeps one account from filling the database; far above any real herd.


class MembershipRefused(Exception):
    """A change the rules forbid. `code` is the API's error detail, `status` its HTTP status."""

    def __init__(self, code: str, status: int) -> None:
        super().__init__(code)
        self.code = code
        self.status = status


@dataclass(frozen=True)
class MemberRow:
    user: User
    role: Role
    permissions: frozenset[Permission]
    is_owner: bool


def check_grant(ctx: RanchContext, role: Role, codes: frozenset[Permission]) -> None:
    """§7.8 limits: codes stay inside the role's preset, and the editor holds every one of them."""
    if not codes <= ROLE_PRESETS[role]:
        raise MembershipRefused("exceeds_role", 403)
    if not codes <= ctx.permissions:
        raise MembershipRefused("cannot_grant", 403)


async def create_ranch(session: AsyncSession, owner: User, name: str) -> Ranch:
    """A ranch with its default settings and the owner as its Dueño. The caller commits."""
    ranch = Ranch(id=uuid.uuid4(), name=name, owner_user_id=owner.id)
    session.add(ranch)
    await session.flush()  # The models have no relationships, so parents go first.
    session.add_all(
        [
            RanchSettings(ranch_id=ranch.id),
            Membership(
                user_id=owner.id, ranch_id=ranch.id, role=Role.DUENO, permissions=preset(Role.DUENO)
            ),
        ]
    )
    return ranch


async def create_owned_ranch(session: AsyncSession, owner: User, name: str) -> Ranch:
    owned = await session.scalar(
        select(func.count()).select_from(Ranch).where(Ranch.owner_user_id == owner.id)
    )
    if (owned or 0) >= MAX_OWNED_RANCHES:
        raise MembershipRefused("ranch_limit", 409)
    ranch = await create_ranch(session, owner, name)
    await session.commit()
    return ranch


async def list_ranches(session: AsyncSession, user: User) -> list[tuple[Ranch, Membership]]:
    rows = await session.execute(
        select(Ranch, Membership)
        .join(Membership, Membership.ranch_id == Ranch.id)
        .where(Membership.user_id == user.id)
        .order_by(Ranch.created_at, Ranch.id)
    )
    return [(ranch, membership) for ranch, membership in rows.all()]


async def list_members(session: AsyncSession, ranch_id: uuid.UUID) -> list[MemberRow]:
    owner_id = await session.scalar(select(Ranch.owner_user_id).where(Ranch.id == ranch_id))
    rows = await session.execute(
        select(User, Membership)
        .join(Membership, Membership.user_id == User.id)
        .where(Membership.ranch_id == ranch_id)
        .order_by(User.first_name, User.id)
    )
    return [
        MemberRow(
            user=user,
            role=m.role,
            permissions=effective(m.role, m.permissions),
            is_owner=user.id == owner_id,
        )
        for user, m in rows.all()
    ]


async def _editable_membership(
    session: AsyncSession, ctx: RanchContext, user_id: uuid.UUID
) -> Membership:
    membership = await session.get(Membership, (user_id, ctx.ranch_id))
    if membership is None:
        raise MembershipRefused("member_not_found", 404)
    owner_id = await session.scalar(select(Ranch.owner_user_id).where(Ranch.id == ctx.ranch_id))
    if user_id == owner_id:
        raise MembershipRefused("owner_protected", 403)
    if user_id == ctx.user.id:
        raise MembershipRefused("cannot_edit_self", 403)
    return membership


async def update_member(
    session: AsyncSession,
    ctx: RanchContext,
    user_id: uuid.UUID,
    role: Role | None,
    permissions: list[Permission] | None,
) -> Membership:
    """A new role resets the codes to its preset unless `permissions` says otherwise.

    The editor must hold every code the member has now and every code they get, so nobody hands
    out a code they lack (an Admin can't make anyone a billing manager) or strips one from a
    member who outranks them there.
    """
    membership = await _editable_membership(session, ctx, user_id)
    if role is Role.DUENO:
        raise MembershipRefused("owner_role_reserved", 403)
    current = effective(membership.role, membership.permissions)
    new_role = role or membership.role
    if permissions is not None:
        codes = frozenset(permissions)
    else:
        codes = frozenset(Permission(code) for code in preset(new_role))
    if not codes:
        raise MembershipRefused("permissions_required", 422)
    if not current <= ctx.permissions:
        raise MembershipRefused("cannot_grant", 403)
    check_grant(ctx, new_role, codes)
    membership.role = new_role
    membership.permissions = [code.value for code in Permission if code in codes]
    await history.record(
        session, ctx.ranch_id, ctx.user.id, HistoryKey.USERS_EDITED, HistoryRefs(user_ids=[user_id])
    )
    await session.commit()
    return membership


async def remove_member(session: AsyncSession, ctx: RanchContext, user_id: uuid.UUID) -> None:
    """Dar de baja: the member loses access; their user row and history entries stay.

    Only the Dueño removes members (§7.8). The owner can never be removed from their ranch;
    ownership moves first (not built yet).
    """
    if ctx.role is not Role.DUENO:
        raise MembershipRefused("permission_denied", 403)
    membership = await _editable_membership(session, ctx, user_id)
    await session.delete(membership)
    await history.record(
        session,
        ctx.ranch_id,
        ctx.user.id,
        HistoryKey.USERS_REMOVED,
        HistoryRefs(user_ids=[user_id]),
    )
    await session.commit()
