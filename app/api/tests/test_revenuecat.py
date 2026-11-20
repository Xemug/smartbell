"""RevenueCat's Pro entitlement into `Ranch.plan_id` (sync-the-pro-entitlement-from-revenuecat).

The event rules are ported from legacy/firebase/test/functions.test.mjs, with its fixtures.
Nothing here calls RevenueCat: subscribers are fixtures, or an httpx MockTransport.
"""

import datetime as dt
import json
import uuid
from typing import Any

import httpx
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import Role
from smartbell.models import Ranch, User
from smartbell.routes.webhooks import get_subscriber_fetcher
from smartbell.security.permissions import preset
from smartbell.services import plans, ranches, revenuecat
from smartbell.services.revenuecat import FetchSubscriber, Subscriber, has_active_pro
from smartbell.settings import Settings
from tests.conftest import FIREBASE_PROJECT_ID, TEST_DATABASE_URL, Account, add_member, sign_up

NOW = dt.datetime(2026, 11, 20, 12, tzinfo=dt.UTC)
FUTURE = "2099-01-01T00:00:00Z"
PAST = "2020-01-01T00:00:00Z"
SECRET = "Bearer s3cret"

PRO: Subscriber = {"entitlements": {"Pro": {"expires_date": FUTURE}}}
LAPSED: Subscriber = {"entitlements": {"Pro": {"expires_date": PAST}}}
FREE: Subscriber = {"entitlements": {}}


def fixed(subscriber: Subscriber | None) -> FetchSubscriber:
    async def fetch(uid: str) -> Subscriber | None:
        return subscriber

    return fetch


async def owned_plans(db: AsyncSession, user_id: uuid.UUID) -> list[str | None]:
    db.expire_all()
    rows = await db.scalars(select(Ranch.plan_id).where(Ranch.owner_user_id == user_id))
    return list(rows)


async def second_ranch(db: AsyncSession, account: Account) -> Ranch:
    owner = await db.get(User, account.user_id)
    assert owner is not None
    ranch = await ranches.create_ranch(db, owner, "Rancho Dos")
    await db.commit()
    return ranch


async def apply(
    db: AsyncSession, event: dict[str, Any], subscriber: Subscriber | None, **opts: Any
) -> dict[str, Any]:
    return await revenuecat.apply_event(db, event, fixed(subscriber), now=NOW, **opts)


# --- hasActivePro --------------------------------------------------------------------------------


def test_reads_the_pro_entitlement_only() -> None:
    assert has_active_pro(PRO, NOW)
    assert has_active_pro({"entitlements": {"Pro": {"expires_date": None}}}, NOW), "lifetime"
    assert not has_active_pro(LAPSED, NOW)
    grace = {"expires_date": PAST, "grace_period_expires_date": FUTURE}
    assert has_active_pro({"entitlements": {"Pro": grace}}, NOW)
    assert not has_active_pro({"entitlements": {"User": {"expires_date": None}}}, NOW), "seat"
    assert not has_active_pro(FREE, NOW)
    assert not has_active_pro(None, NOW)


def test_a_sandbox_purchase_counts_only_when_sandbox_is_allowed() -> None:
    entitlements = {"Pro": {"expires_date": FUTURE, "product_identifier": "m"}}
    subscription = {"entitlements": entitlements, "subscriptions": {"m": {"is_sandbox": True}}}
    assert not has_active_pro(subscription, NOW)
    assert has_active_pro(subscription, NOW, allow_sandbox=True)
    one_time = {
        "entitlements": {"Pro": {"expires_date": None, "product_identifier": "l"}},
        "non_subscriptions": {"l": [{"is_sandbox": True}]},
    }
    assert not has_active_pro(one_time, NOW)
    real = {"entitlements": entitlements, "subscriptions": {"m": {"is_sandbox": False}}}
    assert has_active_pro(real, NOW)
    both = {**one_time, "non_subscriptions": {"l": [{"is_sandbox": True}, {"is_sandbox": False}]}}
    assert has_active_pro(both, NOW), "a real purchase after a test purchase counts"


# --- Events --------------------------------------------------------------------------------------


async def test_a_purchase_gives_every_ranch_the_owner_owns_pro(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    second_id = (await second_ranch(tenant_db, owner)).id

    await apply(tenant_db, {"type": "INITIAL_PURCHASE", "app_user_id": "owner"}, PRO)

    assert await owned_plans(tenant_db, owner.user_id) == ["Pro", "Pro"]
    assert await plans.has_pro(tenant_db, owner.ranch_id)
    assert await plans.has_pro(tenant_db, second_id)


async def test_a_ranch_made_after_buying_pro_is_pro_too(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await apply(tenant_db, {"type": "INITIAL_PURCHASE", "app_user_id": "owner"}, PRO)

    later_id = (await second_ranch(tenant_db, owner)).id

    assert await plans.has_pro(tenant_db, later_id)


@pytest.mark.parametrize(
    ("event", "subscriber"),
    [
        ({"type": "EXPIRATION"}, LAPSED),
        ({"type": "CANCELLATION", "cancel_reason": "CUSTOMER_SUPPORT"}, FREE),  # refund
        ({"type": "RENEWAL"}, LAPSED),  # a late, out-of-order event can't restore a lapsed user
    ],
    ids=["lapse", "refund", "out-of-order"],
)
async def test_a_lapse_or_refund_removes_pro(
    tenant_api: AsyncClient,
    tenant_db: AsyncSession,
    event: dict[str, Any],
    subscriber: Subscriber,
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await second_ranch(tenant_db, owner)
    await plans.set_owner_pro(tenant_db, owner.user_id, True)
    await tenant_db.commit()

    await apply(tenant_db, {**event, "app_user_id": "owner"}, subscriber)

    assert await owned_plans(tenant_db, owner.user_id) == [None, None]
    assert not await plans.has_pro(tenant_db, owner.ranch_id)


@pytest.mark.parametrize(
    ("event", "subscriber"),
    [
        ({"type": "CANCELLATION", "cancel_reason": "UNSUBSCRIBE"}, PRO),  # renewal off
        ({"type": "EXPIRATION"}, {"entitlements": {"Pro": {"expires_date": None}}}),  # lifetime
    ],
    ids=["renewal-off-keeps-pro-until-period-ends", "old-plan-expiring-keeps-lifetime"],
)
async def test_pro_stays_while_revenuecat_still_grants_it(
    tenant_api: AsyncClient,
    tenant_db: AsyncSession,
    event: dict[str, Any],
    subscriber: Subscriber,
) -> None:
    owner = await sign_up(tenant_api, "owner")
    await plans.set_owner_pro(tenant_db, owner.user_id, True)
    await tenant_db.commit()

    await apply(tenant_db, {**event, "app_user_id": "owner"}, subscriber)

    assert await owned_plans(tenant_db, owner.user_id) == ["Pro"]


async def test_a_transfer_updates_both_accounts(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    old = await sign_up(tenant_api, "old")
    new = await sign_up(tenant_api, "new")
    await plans.set_owner_pro(tenant_db, old.user_id, True)
    await tenant_db.commit()
    subscribers = {"old": FREE, "new": PRO}

    async def fetch(uid: str) -> Subscriber | None:
        return subscribers[uid]

    event = {"type": "TRANSFER", "transferred_from": ["old"], "transferred_to": ["new"]}
    await revenuecat.apply_event(tenant_db, event, fetch, now=NOW)

    assert await owned_plans(tenant_db, old.user_id) == [None]
    assert await owned_plans(tenant_db, new.user_id) == ["Pro"]


async def test_anonymous_ids_are_skipped_and_aliases_are_followed(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    seen: list[str] = []

    async def fetch(uid: str) -> Subscriber | None:
        seen.append(uid)
        return PRO

    anon = "$RCAnonymousID:abc"
    event = {"type": "INITIAL_PURCHASE", "app_user_id": anon, "aliases": [anon, "owner"]}
    await revenuecat.apply_event(tenant_db, event, fetch, now=NOW)

    assert seen == ["owner"]
    assert await owned_plans(tenant_db, owner.user_id) == ["Pro"]


async def test_an_unknown_user_is_ignored_and_no_user_is_created(tenant_db: AsyncSession) -> None:
    result = await apply(tenant_db, {"type": "INITIAL_PURCHASE", "app_user_id": "ghost"}, PRO)

    assert result["action"] == "ignored"
    assert (await tenant_db.scalars(select(User))).all() == []


async def test_sandbox_events_are_ignored_unless_allowed(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    event = {"type": "INITIAL_PURCHASE", "environment": "SANDBOX", "app_user_id": "owner"}

    await apply(tenant_db, event, PRO)
    assert await owned_plans(tenant_db, owner.user_id) == [None]

    await apply(tenant_db, event, PRO, allow_sandbox=True)
    assert await owned_plans(tenant_db, owner.user_id) == ["Pro"]


async def test_members_never_carry_pro(tenant_api: AsyncClient, tenant_db: AsyncSession) -> None:
    owner = await sign_up(tenant_api, "owner")
    member = await sign_up(tenant_api, "member")
    await add_member(tenant_db, member, owner.ranch_id, Role.MEDICO)

    await apply(tenant_db, {"type": "INITIAL_PURCHASE", "app_user_id": "member"}, PRO)

    assert not await plans.has_pro(tenant_db, owner.ranch_id)
    assert await plans.has_pro(tenant_db, member.ranch_id)  # their own "Mi rancho" only


# --- The webhook route ---------------------------------------------------------------------------


def webhook_settings(**overrides: Any) -> Settings:
    values: dict[str, Any] = {
        "_env_file": None,
        "env": "test",
        "database_url": TEST_DATABASE_URL or "sqlite+aiosqlite:///:memory:",
        "secret_key": "test-secret",
        "firebase_project_id": FIREBASE_PROJECT_ID,
        "firebase_auth_emulator_host": "",
        "revenuecat_webhook_auth": SECRET,
        "revenuecat_secret_key": "sk_test_fixture",
    }
    return Settings(**{**values, **overrides})


@pytest.fixture
def settings() -> Settings:
    return webhook_settings()


@pytest.fixture
def subscriber_state() -> dict[str, Any]:
    """What the fake RevenueCat returns; set `error` to make it fail."""
    return {"subscriber": PRO, "error": False}


@pytest.fixture
def hooked_app(tenant_app: FastAPI, subscriber_state: dict[str, Any]) -> FastAPI:
    async def fetch(uid: str) -> Subscriber | None:
        if subscriber_state["error"]:
            raise revenuecat.RevenueCatUnavailable("down")
        subscriber: Subscriber | None = subscriber_state["subscriber"]
        return subscriber

    tenant_app.dependency_overrides[get_subscriber_fetcher] = lambda: fetch
    return tenant_app


def event_body(uid: str = "owner", type_: str = "RENEWAL") -> dict[str, Any]:
    return {"api_version": "1.0", "event": {"type": type_, "app_user_id": uid}}


async def post_hook(
    api: AsyncClient, body: Any = None, auth: str | None = SECRET
) -> httpx.Response:
    headers = {"Authorization": auth} if auth is not None else {}
    return await api.post("/api/webhooks/revenuecat", headers=headers, json=body or event_body())


async def test_the_correct_secret_is_accepted(
    hooked_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")

    response = await post_hook(tenant_api)

    assert response.status_code == 200, response.text
    assert response.json() == {"action": "updated"}
    assert await owned_plans(tenant_db, owner.user_id) == ["Pro"]


@pytest.mark.parametrize("auth", ["Bearer nope", "s3cret", "", None], ids=repr)
async def test_a_wrong_or_missing_secret_is_refused_and_changes_nothing(
    hooked_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession, auth: str | None
) -> None:
    owner = await sign_up(tenant_api, "owner")

    response = await post_hook(tenant_api, auth=auth)

    assert response.status_code == 401
    assert await owned_plans(tenant_db, owner.user_id) == [None]


@pytest.mark.parametrize(
    "missing", ["revenuecat_webhook_auth", "revenuecat_secret_key"], ids=lambda name: name
)
async def test_it_fails_closed_when_not_configured(
    tenant_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession, missing: str
) -> None:
    owner = await sign_up(tenant_api, "owner")
    tenant_app.state.settings = webhook_settings(**{missing: ""})
    tenant_app.dependency_overrides[get_subscriber_fetcher] = lambda: fixed(PRO)

    # Even a caller sending an empty header, matching the empty secret, is refused.
    for auth in (SECRET, ""):
        response = await post_hook(tenant_api, auth=auth)
        assert response.status_code == 503

    assert await owned_plans(tenant_db, owner.user_id) == [None]


@pytest.mark.parametrize(
    "body", [{}, {"event": None}, {"event": {"app_user_id": "owner"}}, [1, 2], "x"], ids=repr
)
async def test_malformed_bodies_are_refused(
    hooked_app: FastAPI, tenant_api: AsyncClient, body: Any
) -> None:
    response = await tenant_api.post(
        "/api/webhooks/revenuecat", headers={"Authorization": SECRET}, content=json.dumps(body)
    )
    assert response.status_code == 400


async def test_a_non_json_body_is_refused(hooked_app: FastAPI, tenant_api: AsyncClient) -> None:
    response = await tenant_api.post(
        "/api/webhooks/revenuecat", headers={"Authorization": SECRET}, content=b"not json"
    )
    assert response.status_code == 400


async def test_get_is_not_allowed(hooked_app: FastAPI, tenant_api: AsyncClient) -> None:
    response = await tenant_api.get("/api/webhooks/revenuecat", headers={"Authorization": SECRET})
    assert response.status_code == 405


async def test_a_revenuecat_outage_is_retried_and_changes_nothing(
    hooked_app: FastAPI,
    tenant_api: AsyncClient,
    tenant_db: AsyncSession,
    subscriber_state: dict[str, Any],
) -> None:
    owner = await sign_up(tenant_api, "owner")
    subscriber_state["error"] = True

    response = await post_hook(tenant_api)

    assert response.status_code == 503
    assert await owned_plans(tenant_db, owner.user_id) == [None]


async def test_a_transfer_is_all_or_nothing_when_revenuecat_fails_midway(
    hooked_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    old = await sign_up(tenant_api, "old")
    new = await sign_up(tenant_api, "new")
    await plans.set_owner_pro(tenant_db, old.user_id, True)
    await tenant_db.commit()

    async def fetch(uid: str) -> Subscriber | None:
        if uid == "new":
            raise revenuecat.RevenueCatUnavailable("down")
        return FREE

    hooked_app.dependency_overrides[get_subscriber_fetcher] = lambda: fetch
    body = {"event": {"type": "TRANSFER", "transferred_from": ["old"], "transferred_to": ["new"]}}
    response = await post_hook(tenant_api, body=body)

    assert response.status_code == 503
    assert await owned_plans(tenant_db, old.user_id) == ["Pro"]
    assert await owned_plans(tenant_db, new.user_id) == [None]


# --- The HTTP fetcher ----------------------------------------------------------------------------


async def test_the_fetcher_reads_the_subscriber_with_the_secret_key() -> None:
    seen: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json={"subscriber": PRO})

    fetch = revenuecat.http_subscriber_fetcher(
        "https://rc.test/", "sk_fixture", transport=httpx.MockTransport(handler)
    )

    assert await fetch("a/../b") == PRO
    assert seen[0].url.raw_path == b"/v1/subscribers/a%2F..%2Fb"  # the uid can't change the path
    assert seen[0].headers["authorization"] == "Bearer sk_fixture"


@pytest.mark.parametrize("status", [401, 404, 500])
async def test_the_fetcher_raises_on_an_error_status(status: int) -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(status))
    fetch = revenuecat.http_subscriber_fetcher("https://rc.test", "sk", transport=transport)

    with pytest.raises(revenuecat.RevenueCatUnavailable):
        await fetch("owner")


async def test_the_fetcher_raises_when_revenuecat_is_unreachable() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("refused")

    fetch = revenuecat.http_subscriber_fetcher(
        "https://rc.test", "sk", transport=httpx.MockTransport(handler)
    )

    with pytest.raises(revenuecat.RevenueCatUnavailable):
        await fetch("owner")


# --- The legacy import ---------------------------------------------------------------------------


async def imported_owner(db: AsyncSession, uid: str) -> User:
    """What `legacy-firestore-import` leaves behind: a user keyed by Firebase uid, and a ranch."""
    user = User(id=uuid.uuid4(), firebase_uid=uid, first_name="Ana", email=f"{uid}@example.com")
    db.add(user)
    await db.flush()
    await ranches.create_ranch(db, user, "Rancho Legado")
    await db.commit()
    return user


async def first_sign_in(api: AsyncClient, uid: str) -> dict[str, str]:
    response = await api.post("/api/auth/session", headers={"Authorization": f"Bearer {uid}"})
    assert response.status_code == 200, response.text
    ranch_id = response.json()["ranches"][0]["id"]
    return {"Authorization": f"Bearer {uid}", "X-Ranch-Id": ranch_id}


INVITE = {
    "email": "vet@example.com",
    "first_name": "Juan",
    "role": "MEDICO",
    "permissions": preset(Role.MEDICO),
}


async def test_an_imported_paying_owner_can_invite_on_first_sign_in(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await imported_owner(tenant_db, "legacy-paying")

    # The legacy `premium` flag is client-writable, so only RevenueCat's state is used.
    pro = await revenuecat.import_pro_entitlement(tenant_db, "legacy-paying", fixed(PRO), now=NOW)
    await tenant_db.commit()
    headers = await first_sign_in(tenant_api, "legacy-paying")

    assert pro is True
    assert (await tenant_api.get("/api/ranch/plan", headers=headers)).json() == {"has_pro": True}
    response = await tenant_api.post("/api/ranch/invitations", headers=headers, json=INVITE)
    assert response.status_code == 201, response.text


async def test_an_imported_free_owner_sees_the_upsell(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    await imported_owner(tenant_db, "legacy-free")

    pro = await revenuecat.import_pro_entitlement(tenant_db, "legacy-free", fixed(LAPSED), now=NOW)
    await tenant_db.commit()
    headers = await first_sign_in(tenant_api, "legacy-free")

    assert pro is False
    assert (await tenant_api.get("/api/ranch/plan", headers=headers)).json() == {"has_pro": False}
    response = await tenant_api.post("/api/ranch/invitations", headers=headers, json=INVITE)
    assert response.status_code == 402
    assert response.json()["detail"] == "plan_required"


async def test_the_import_skips_an_unknown_uid(tenant_db: AsyncSession) -> None:
    assert await revenuecat.import_pro_entitlement(tenant_db, "nobody", fixed(PRO)) is None
