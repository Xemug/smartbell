"""WhatsApp support config and fake-door taps (docs/roadmap/whatsapp-support.md)."""

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from pydantic import AfterValidator, AnyUrl, BaseModel, ConfigDict, Field, UrlConstraints
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import FakeDoorFeature
from smartbell.models import FakeDoorTap, SupportSettings, User
from smartbell.models.support import DEFAULT_WHATSAPP_NUMBER, SUPPORT_SETTINGS_ID
from smartbell.security import TokenClaims, get_admin_claims, get_current_user

router = APIRouter(tags=["support"])

FEATURE_PLACEHOLDER = "{nombre}"
# A second tap on the same door this soon is a double-click or a re-render, not more demand.
TAP_DEBOUNCE = dt.timedelta(seconds=10)

MAX_URL = 500
Message = Annotated[str, Field(min_length=1, max_length=500)]
HttpsUrl = Annotated[
    AnyUrl, UrlConstraints(max_length=MAX_URL, allowed_schemes=["https"], host_required=True)
]


def _fits_column(url: AnyUrl | None) -> AnyUrl | None:
    # Normalising (a trailing slash, punycode) can lengthen the URL past what was checked.
    if url is not None and len(str(url)) > MAX_URL:
        raise ValueError(f"must be at most {MAX_URL} characters")
    return url


def _utc(when: dt.datetime | None) -> dt.datetime | None:
    """A `since` without an offset is UTC, not whatever zone the API host runs in."""
    if when is not None and when.tzinfo is None:
        return when.replace(tzinfo=dt.UTC)
    return when


def _has_placeholder(message: str | None) -> str | None:
    if message is not None and FEATURE_PLACEHOLDER not in message:
        raise ValueError(f"must contain {FEATURE_PLACEHOLDER}")
    return message


class SupportConfigOut(BaseModel):
    """A null message means the app shows its own translated default."""

    whatsapp_number: str
    support_message: str | None
    payment_message: str | None
    feature_message: str | None
    community_url: str | None


class SupportConfigIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    # Digits only, country code first, as wa.me takes it: 523334056398.
    whatsapp_number: str = Field(pattern=r"^[1-9]\d{7,14}$")
    support_message: Message | None = None
    payment_message: Message | None = None
    feature_message: Annotated[Message | None, AfterValidator(_has_placeholder)] = None
    # The WhatsApp community invite (inventory §1.15).
    community_url: Annotated[HttpsUrl | None, AfterValidator(_fits_column)] = None


class FakeDoorTapIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feature: FakeDoorFeature


class FakeDoorCount(BaseModel):
    feature: FakeDoorFeature
    taps: int
    users: int  # Distinct accounts that tapped it.
    last_tapped_at: dt.datetime | None


class FakeDoorReport(BaseModel):
    since: dt.datetime | None
    features: list[FakeDoorCount]


def _config_out(row: SupportSettings | None) -> SupportConfigOut:
    if row is None:
        return SupportConfigOut(
            whatsapp_number=DEFAULT_WHATSAPP_NUMBER,
            support_message=None,
            payment_message=None,
            feature_message=None,
            community_url=None,
        )
    return SupportConfigOut(
        whatsapp_number=row.whatsapp_number,
        support_message=row.support_message,
        payment_message=row.payment_message,
        feature_message=row.feature_message,
        community_url=row.community_url,
    )


@router.get("/support/config", operation_id="getSupportConfig")
async def get_support_config(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SupportConfigOut:
    """Public: the support link also serves people who can't sign in."""
    return _config_out(await session.get(SupportSettings, SUPPORT_SETTINGS_ID))


@router.post(
    "/support/fake-door-taps",
    operation_id="recordFakeDoorTap",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def record_fake_door_tap(
    body: FakeDoorTapIn,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    recent = await session.scalar(
        select(FakeDoorTap.id)
        .where(
            FakeDoorTap.user_id == user.id,
            FakeDoorTap.feature == body.feature,
            FakeDoorTap.created_at > dt.datetime.now(dt.UTC) - TAP_DEBOUNCE,
        )
        .limit(1)
    )
    if recent is None:
        session.add(FakeDoorTap(feature=body.feature, user_id=user.id))
        await session.commit()


@router.get("/admin/fake-door-taps", operation_id="getFakeDoorReport", tags=["admin"])
async def fake_door_report(
    _: Annotated[TokenClaims, Depends(get_admin_claims)],
    session: Annotated[AsyncSession, Depends(get_session)],
    since: Annotated[dt.datetime | None, Query(), AfterValidator(_utc)] = None,
) -> FakeDoorReport:
    """Taps per feature, most wanted first. Features nobody tapped are listed with zero."""
    query = select(
        FakeDoorTap.feature,
        func.count(),
        func.count(FakeDoorTap.user_id.distinct()),
        func.max(FakeDoorTap.created_at),
    ).group_by(FakeDoorTap.feature)
    if since is not None:
        query = query.where(FakeDoorTap.created_at >= since)
    counts = {
        feature: FakeDoorCount(feature=feature, taps=taps, users=users, last_tapped_at=last)
        for feature, taps, users, last in (await session.execute(query)).all()
    }
    features = [
        counts.get(feature, FakeDoorCount(feature=feature, taps=0, users=0, last_tapped_at=None))
        for feature in FakeDoorFeature
    ]
    features.sort(key=lambda count: count.taps, reverse=True)  # Stable: ties keep enum order.
    return FakeDoorReport(since=since, features=features)


@router.put("/admin/support/config", operation_id="updateSupportConfig", tags=["admin"])
async def update_support_config(
    body: SupportConfigIn,
    _: Annotated[TokenClaims, Depends(get_admin_claims)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SupportConfigOut:
    """Replaces the whole config: a message left out goes back to the app's default."""
    row = await session.get(SupportSettings, SUPPORT_SETTINGS_ID)
    if row is None:
        row = SupportSettings(id=SUPPORT_SETTINGS_ID)
        session.add(row)
    row.whatsapp_number = body.whatsapp_number
    row.support_message = body.support_message
    row.payment_message = body.payment_message
    row.feature_message = body.feature_message
    row.community_url = str(body.community_url) if body.community_url else None
    row.updated_at = dt.datetime.now(dt.UTC)
    await session.commit()
    return _config_out(row)
