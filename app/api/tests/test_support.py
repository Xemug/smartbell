"""WhatsApp support config and fake-door taps, through the real token check."""

import datetime as dt
from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from smartbell.db import Base, get_session, make_sessionmaker
from smartbell.main import create_app
from smartbell.models import FakeDoorTap
from smartbell.settings import Settings
from tests.test_auth import bearer, google_certs, make_token  # noqa: F401 - google_certs is autouse

ADMIN = "staff@smartbell.mx"
CONFIG = {
    "whatsapp_number": "5213312345678",
    "support_message": "Hola, necesito ayuda.",
    "payment_message": "Quiero pagar de otra forma.",
    "feature_message": "Me interesa {nombre}.",
    "community_url": "https://chat.whatsapp.com/AbCdEf123",
}


@pytest.fixture
async def schema(db_engine: AsyncEngine) -> AsyncEngine:
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return db_engine


@pytest.fixture
async def api(settings: Settings, schema: AsyncEngine) -> AsyncIterator[AsyncClient]:
    settings.admin_emails = [ADMIN]
    app: FastAPI = create_app(settings)
    sessions = make_sessionmaker(schema)

    async def session_override() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    app.dependency_overrides[get_session] = session_override
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
async def db(schema: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with make_sessionmaker(schema)() as session:
        yield session


async def _sign_in(api: AsyncClient, uid: str) -> dict[str, str]:
    headers = bearer(make_token(uid))
    assert (await api.post("/api/auth/session", headers=headers)).status_code == 200
    return headers


def _admin() -> dict[str, str]:
    return bearer(make_token("staff", email=ADMIN.upper()))


async def _tap(api: AsyncClient, headers: dict[str, str], feature: str) -> int:
    response = await api.post(
        "/api/support/fake-door-taps", headers=headers, json={"feature": feature}
    )
    return response.status_code


def _counts(report: dict[str, object]) -> dict[str, tuple[int, int]]:
    features = report["features"]
    assert isinstance(features, list)
    return {row["feature"]: (row["taps"], row["users"]) for row in features}


# --- Config ---------------------------------------------------------------------------------


async def test_config_defaults_to_the_inventory_number(api: AsyncClient) -> None:
    response = await api.get("/api/support/config")

    assert response.status_code == 200
    assert response.json() == {
        "whatsapp_number": "523334056398",
        "support_message": None,
        "payment_message": None,
        "feature_message": None,
        "community_url": None,
    }


async def test_admin_changes_the_config_without_a_deploy(api: AsyncClient) -> None:
    response = await api.put("/api/admin/support/config", headers=_admin(), json=CONFIG)

    assert response.status_code == 200
    assert (await api.get("/api/support/config")).json() == CONFIG

    # A message left out of the next save goes back to the app's default.
    trimmed = {"whatsapp_number": "523334056398"}
    await api.put("/api/admin/support/config", headers=_admin(), json=trimmed)
    after = (await api.get("/api/support/config")).json()
    assert after["whatsapp_number"] == "523334056398"
    assert after["support_message"] is None
    assert after["community_url"] is None


@pytest.mark.parametrize(
    "change",
    [
        pytest.param({"whatsapp_number": "+52 333 405 6398"}, id="number not digits"),
        pytest.param({"whatsapp_number": "1234"}, id="number too short"),
        pytest.param({"feature_message": "Me interesa."}, id="no {nombre}"),
        pytest.param({"support_message": ""}, id="empty message"),
        pytest.param({"support_message": "x" * 501}, id="long message"),
        pytest.param({"community_url": "http://chat.whatsapp.com/x"}, id="not https"),
        pytest.param({"community_url": "javascript:alert(1)"}, id="script url"),
        pytest.param({"community_url": "https://x.mx/" + "a" * 500}, id="long url"),
        # 500 characters as typed; the punycode host makes it longer once normalised.
        pytest.param({"community_url": "https://ñ.mx/" + "a" * 487}, id="long once normalised"),
        pytest.param({"extra": "field"}, id="unknown field"),
    ],
)
async def test_config_is_validated(api: AsyncClient, change: dict[str, str]) -> None:
    response = await api.put(
        "/api/admin/support/config", headers=_admin(), json={**CONFIG, **change}
    )

    assert response.status_code == 422


# --- Who may do what ------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("method", "path"),
    [("GET", "/api/admin/fake-door-taps"), ("PUT", "/api/admin/support/config")],
)
async def test_admin_routes_refuse_everyone_else(api: AsyncClient, method: str, path: str) -> None:
    json = CONFIG if method == "PUT" else None

    anonymous = await api.request(method, path, json=json)
    rancher = await api.request(method, path, json=json, headers=bearer(make_token("ana")))
    unverified = await api.request(
        method,
        path,
        json=json,
        headers=bearer(make_token("impostor", email=ADMIN, email_verified=False)),
    )

    assert anonymous.status_code == 401
    assert rancher.status_code == 403
    assert unverified.status_code == 403


async def test_a_tap_needs_an_account(api: AsyncClient) -> None:
    assert await _tap(api, {}, "GRUPOS") == 401
    # A valid token whose session was never opened has no user row yet.
    assert await _tap(api, bearer(make_token("no-session")), "GRUPOS") == 401


async def test_only_known_features_are_counted(api: AsyncClient) -> None:
    headers = await _sign_in(api, "ana")

    assert await _tap(api, headers, "TAREAS") == 422
    assert await _tap(api, headers, "grupos") == 422


# --- Counting -------------------------------------------------------------------------------


async def test_taps_are_counted_by_feature(api: AsyncClient, db: AsyncSession) -> None:
    ana = await _sign_in(api, "ana")
    luis = await _sign_in(api, "luis")

    for headers, feature in [(ana, "GRUPOS"), (luis, "GRUPOS"), (luis, "RANCHOS")]:
        assert await _tap(api, headers, feature) == 204
    # Ana taps Grupos again later: a second tap, still one user.
    for row in (await db.scalars(select(FakeDoorTap))).all():
        row.created_at = dt.datetime.now(dt.UTC) - dt.timedelta(minutes=5)
    await db.commit()
    assert await _tap(api, ana, "GRUPOS") == 204

    response = await api.get("/api/admin/fake-door-taps", headers=_admin())

    assert response.status_code == 200
    report = response.json()
    assert [row["feature"] for row in report["features"]] == [
        "GRUPOS",
        "RANCHOS",
        "REPORTES",
        "USUARIOS",
    ]
    assert _counts(report) == {
        "GRUPOS": (3, 2),
        "RANCHOS": (1, 1),
        "REPORTES": (0, 0),
        "USUARIOS": (0, 0),
    }
    assert report["features"][3]["last_tapped_at"] is None


async def test_a_double_tap_counts_once(api: AsyncClient) -> None:
    ana = await _sign_in(api, "ana")

    assert await _tap(api, ana, "REPORTES") == 204
    assert await _tap(api, ana, "REPORTES") == 204
    assert await _tap(api, ana, "USUARIOS") == 204

    report = (await api.get("/api/admin/fake-door-taps", headers=_admin())).json()
    assert _counts(report)["REPORTES"] == (1, 1)
    assert _counts(report)["USUARIOS"] == (1, 1)


async def test_the_report_can_start_from_a_date(api: AsyncClient, db: AsyncSession) -> None:
    ana = await _sign_in(api, "ana")
    await _tap(api, ana, "GRUPOS")
    old = await db.scalar(select(FakeDoorTap))
    assert old is not None
    old.created_at = dt.datetime(2026, 1, 1, tzinfo=dt.UTC)
    await db.commit()
    await _tap(api, ana, "GRUPOS")

    since = dt.datetime(2026, 6, 1, tzinfo=dt.UTC).isoformat()
    response = await api.get("/api/admin/fake-door-taps", headers=_admin(), params={"since": since})

    assert _counts(response.json())["GRUPOS"] == (1, 1)
