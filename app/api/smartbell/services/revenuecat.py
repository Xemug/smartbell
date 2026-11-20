"""RevenueCat's Pro entitlement, kept in step with `Ranch.plan_id` (ported from legacy/firebase).

The source of truth is RevenueCat's subscriber record for the ranch owner, whose app user id is
their Firebase uid. A webhook event only says *who* to look at: trusting event types would break
on retries and out-of-order delivery, and on a lifetime member whose old monthly plan expires
(that sends EXPIRATION while they are still entitled). So every event re-reads the subscriber.
"""

import datetime as dt
from collections.abc import Awaitable, Callable
from typing import Any
from urllib.parse import quote

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.models import User
from smartbell.services import plans

Subscriber = dict[str, Any]
FetchSubscriber = Callable[[str], Awaitable[Subscriber | None]]

ANONYMOUS_PREFIX = "$RCAnonymousID:"
MAX_UID_LENGTH = 128  # User.firebase_uid


class RevenueCatUnavailable(Exception):
    """RevenueCat didn't answer; the webhook returns non-2xx so RevenueCat retries later."""


def _parse_date(value: Any) -> dt.datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=dt.UTC)


def _dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _is_sandbox_purchase(subscriber: Subscriber, product_id: Any) -> bool:
    if not isinstance(product_id, str):
        return False
    subscription = _dict(_dict(subscriber.get("subscriptions")).get(product_id))
    one_time = _dict(subscriber.get("non_subscriptions")).get(product_id)
    one_time = one_time if isinstance(one_time, list) else []
    # One real purchase is enough, even if the same person also bought it while testing.
    return subscription.get("is_sandbox") is True or (
        len(one_time) > 0 and all(_dict(p).get("is_sandbox") is True for p in one_time)
    )


def has_active_pro(
    subscriber: Subscriber | None, now: dt.datetime, allow_sandbox: bool = False
) -> bool:
    """True when RevenueCat's subscriber record grants Pro right now."""
    if not isinstance(subscriber, dict):
        return False
    entitlement = _dict(subscriber.get("entitlements")).get(plans.PRO_ENTITLEMENT)
    if not isinstance(entitlement, dict):
        return False
    # A production event can arrive for a tester who also holds a sandbox purchase.
    if not allow_sandbox and _is_sandbox_purchase(
        subscriber, entitlement.get("product_identifier")
    ):
        return False
    # Lifetime is an explicit null; a record missing the key is malformed, not forever.
    if "expires_date" not in entitlement:
        return False
    if entitlement["expires_date"] is None:
        return True  # lifetime
    ends = [
        d
        for d in (
            _parse_date(entitlement.get("expires_date")),
            _parse_date(entitlement.get("grace_period_expires_date")),
        )
        if d is not None
    ]
    return bool(ends) and max(ends) > now


def _is_real_uid(uid: Any) -> bool:
    return (
        isinstance(uid, str)
        and 0 < len(uid) <= MAX_UID_LENGTH
        and not uid.startswith(ANONYMOUS_PREFIX)
    )


def _strings(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def uids_from_event(event: dict[str, Any]) -> list[str]:
    """Who an event concerns: both sides of a transfer, else the user and all their aliases."""
    if event.get("type") == "TRANSFER":
        ids = [*_strings(event.get("transferred_from")), *_strings(event.get("transferred_to"))]
    else:
        ids = [event.get("app_user_id"), event.get("original_app_user_id")]
        ids += _strings(event.get("aliases"))
    return list(dict.fromkeys(uid for uid in ids if _is_real_uid(uid)))


async def sync_user_pro(
    session: AsyncSession,
    user: User,
    fetch_subscriber: FetchSubscriber,
    *,
    allow_sandbox: bool = False,
    now: dt.datetime | None = None,
) -> bool:
    """Sets Pro on the user's owned ranches from RevenueCat's current state. The caller commits."""
    assert user.firebase_uid is not None  # noqa: S101 - callers look users up by it
    subscriber = await fetch_subscriber(user.firebase_uid)
    pro = has_active_pro(subscriber, now or dt.datetime.now(dt.UTC), allow_sandbox)
    await plans.set_owner_pro(session, user.id, pro)
    return pro


async def apply_event(
    session: AsyncSession,
    event: dict[str, Any],
    fetch_subscriber: FetchSubscriber,
    *,
    allow_sandbox: bool = False,
    now: dt.datetime | None = None,
) -> dict[str, Any]:
    """Applies one webhook event. All of its users change together, or none do."""
    if event.get("type") == "TEST":
        return {"action": "ignored", "reason": "test event"}
    if event.get("environment") == "SANDBOX" and not allow_sandbox:
        return {"action": "ignored", "reason": "sandbox"}

    # Never creates a user: an unknown id (not signed up, not imported) is skipped. The rows stay
    # locked until commit, so a second delivery for the same user waits and then reads RevenueCat
    # after this one wrote: the last write is always from the latest read. Sorted, so two
    # transfers in opposite directions can't deadlock.
    users = await session.scalars(
        select(User)
        .where(User.firebase_uid.in_(uids_from_event(event)))
        .order_by(User.firebase_uid)
        .with_for_update()
    )
    updated: list[dict[str, Any]] = []
    for user in users.all():
        pro = await sync_user_pro(
            session, user, fetch_subscriber, allow_sandbox=allow_sandbox, now=now
        )
        updated.append({"uid": user.firebase_uid, "pro": pro})
    if not updated:
        return {"action": "ignored", "reason": "no matching user"}
    await session.commit()
    return {"action": "updated", "updated": updated}


async def import_pro_entitlement(
    session: AsyncSession,
    firebase_uid: str,
    fetch_subscriber: FetchSubscriber,
    *,
    allow_sandbox: bool = False,
    now: dt.datetime | None = None,
) -> bool | None:
    """For `legacy-firestore-import`: call once per imported user, after their ranches exist.

    Reads RevenueCat's live state, never the legacy `Users.premium` field (any client could write
    that). Returns whether they have Pro, or None when no user has that uid. The caller commits.
    """
    user = await session.scalar(
        select(User).where(User.firebase_uid == firebase_uid).with_for_update()
    )
    if user is None:
        return None
    return await sync_user_pro(
        session, user, fetch_subscriber, allow_sandbox=allow_sandbox, now=now
    )


def http_subscriber_fetcher(
    api_url: str, secret_key: str, transport: httpx.AsyncBaseTransport | None = None
) -> FetchSubscriber:
    """Reads `GET /v1/subscribers/{uid}` with the project's secret key."""

    async def fetch(uid: str) -> Subscriber | None:
        url = f"{api_url.rstrip('/')}/v1/subscribers/{quote(uid, safe='')}"
        try:
            async with httpx.AsyncClient(transport=transport, timeout=10) as client:
                response = await client.get(url, headers={"Authorization": f"Bearer {secret_key}"})
        except httpx.HTTPError as err:
            raise RevenueCatUnavailable(type(err).__name__) from None
        # 201: RevenueCat created the subscriber just now, as it does for anyone who never paid.
        if response.status_code not in (200, 201):
            raise RevenueCatUnavailable(f"RevenueCat returned {response.status_code}")
        try:
            subscriber = response.json().get("subscriber")
        except (ValueError, AttributeError):
            raise RevenueCatUnavailable("RevenueCat sent an unreadable body") from None
        return subscriber if isinstance(subscriber, dict) else None

    return fetch
