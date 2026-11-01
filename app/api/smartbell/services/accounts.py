"""Turns a verified Firebase identity into our user row and, on first sight, their first ranch."""

import datetime as dt
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import Role
from smartbell.models import Membership, Ranch, RanchSettings, User
from smartbell.security import TokenClaims

FIRST_RANCH_NAME = "Mi rancho"  # domain-model §7: auto-created at sign-up, editable later.
MAX_PHOTO_URL = 2048


class AccountConflict(Exception):
    """The token's email can't be tied to a user row. `code` is the API's error detail."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class Profile:
    """What sign-up collects that the token can't carry. Only read when the row is created."""

    first_name: str | None = None
    phone: str | None = None


async def _link_or_create(
    session: AsyncSession, claims: TokenClaims, email: str, profile: Profile
) -> tuple[User, bool]:
    existing = await session.scalar(select(User).where(User.email == email))
    if existing is not None:
        # Firebase lets anyone register an unconfirmed address, so an imported row is only claimed
        # with a verified one. Otherwise that sign-up would take over someone else's herd.
        if existing.firebase_uid is not None or not claims.email_verified:
            raise AccountConflict("email_in_use")
        existing.firebase_uid = claims.uid
        return existing, False

    picture = claims.picture if claims.picture and len(claims.picture) <= MAX_PHOTO_URL else None
    # Explicit ids because the models have no relationships. The caller handles a lost race.
    user = User(
        id=uuid.uuid4(),
        firebase_uid=claims.uid,
        first_name=(profile.first_name or claims.name or email.split("@")[0])[:100],
        phone=profile.phone,
        email=email,
        photo_url=picture,
    )
    ranch = Ranch(id=uuid.uuid4(), name=FIRST_RANCH_NAME, owner_user_id=user.id)
    session.add(user)
    await session.flush()
    session.add(ranch)
    await session.flush()
    session.add_all(
        [
            RanchSettings(ranch_id=ranch.id),
            Membership(user_id=user.id, ranch_id=ranch.id, role=Role.DUENO),
        ]
    )
    return user, True


async def open_session(
    session: AsyncSession, claims: TokenClaims, profile: Profile
) -> tuple[User, bool]:
    """Returns the user and whether this call created them. Safe to call twice at once."""
    if not claims.email:
        raise AccountConflict("email_required")
    email = claims.email.lower()
    created = False
    try:
        user = await session.scalar(select(User).where(User.firebase_uid == claims.uid))
        if user is None:
            user, created = await _link_or_create(session, claims, email, profile)
        user.last_active_at = dt.datetime.now(dt.UTC)
        await session.commit()
    except IntegrityError:
        # A tab, or React's strict mode, got there first. Its transaction made the whole account,
        # and the rollback drops this one's ranch with it.
        await session.rollback()
        user = await session.scalar(select(User).where(User.firebase_uid == claims.uid))
        if user is None:
            raise AccountConflict("email_in_use") from None
        return user, False
    return user, created


async def list_ranches(session: AsyncSession, user: User) -> list[tuple[Ranch, Role]]:
    rows = await session.execute(
        select(Ranch, Membership.role)
        .join(Membership, Membership.ranch_id == Ranch.id)
        .where(Membership.user_id == user.id)
        .order_by(Ranch.created_at, Ranch.id)
    )
    return [(ranch, role) for ranch, role in rows.tuples()]
