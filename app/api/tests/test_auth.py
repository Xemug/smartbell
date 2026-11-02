"""Auth runs the real firebase-admin verification; only Google's cert download is replaced."""

import asyncio
import datetime as dt
import os
from collections.abc import AsyncIterator, Iterator
from typing import Any

import jwt
import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from smartbell.db import Base, get_session, make_sessionmaker
from smartbell.enums import Role
from smartbell.main import create_app
from smartbell.models import Membership, Ranch, RanchSettings, User
from smartbell.security import TokenClaims
from smartbell.services import accounts
from smartbell.settings import Settings
from tests.conftest import FIREBASE_PROJECT_ID

KID = "test-kid"


def _key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


SIGNING_KEY = _key()
FORGER_KEY = _key()


def _cert_pem(key: rsa.RSAPrivateKey) -> str:
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "securetoken")])
    now = dt.datetime.now(dt.UTC)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - dt.timedelta(days=1))
        .not_valid_after(now + dt.timedelta(days=1))
        .sign(key, hashes.SHA256())
    )
    return cert.public_bytes(serialization.Encoding.PEM).decode()


def make_token(
    uid: str = "uid-1",
    *,
    key: rsa.RSAPrivateKey = SIGNING_KEY,
    expires_in: int = 3600,
    audience: str = FIREBASE_PROJECT_ID,
    **claims: Any,
) -> str:
    now = int(dt.datetime.now(dt.UTC).timestamp())
    payload = {
        "iss": f"https://securetoken.google.com/{audience}",
        "aud": audience,
        "sub": uid,
        "user_id": uid,
        "auth_time": now - 10,
        "iat": now - 10,
        "exp": now + expires_in,
        "email": f"{uid}@example.com",
        "email_verified": True,
        "firebase": {"sign_in_provider": "password"},
        **claims,
    }
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    return jwt.encode(payload, pem, algorithm="RS256", headers={"kid": KID})


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def google_certs(monkeypatch: pytest.MonkeyPatch) -> None:
    certs = {KID: _cert_pem(SIGNING_KEY)}
    monkeypatch.setattr("google.oauth2.id_token._fetch_certs", lambda request, url: certs)


@pytest.fixture
async def schema(db_engine: AsyncEngine) -> AsyncEngine:
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return db_engine


@pytest.fixture
async def api(settings: Settings, schema: AsyncEngine) -> AsyncIterator[AsyncClient]:
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


# --- Rejections -----------------------------------------------------------------------------


async def test_missing_token_is_401(api: AsyncClient) -> None:
    response = await api.post("/api/auth/session")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "token",
    [
        pytest.param("not-a-jwt", id="garbage"),
        pytest.param(make_token(key=FORGER_KEY), id="forged signature"),
        pytest.param(make_token(expires_in=-60), id="expired"),
        pytest.param(make_token(audience="smartbell-app-2025"), id="another project"),
        pytest.param(
            jwt.encode({"sub": "uid-1", "aud": FIREBASE_PROJECT_ID}, "k" * 32, algorithm="HS256"),
            id="unsigned-style HS256",
        ),
    ],
)
@pytest.mark.parametrize("path", ["/api/auth/session", "/api/auth/me"])
async def test_bad_tokens_are_401(api: AsyncClient, token: str, path: str) -> None:
    method = api.post if path.endswith("session") else api.get

    response = await method(path, headers=bearer(token))

    assert response.status_code == 401


async def test_me_needs_an_opened_session(api: AsyncClient) -> None:
    response = await api.get("/api/auth/me", headers=bearer(make_token()))

    assert response.status_code == 401


async def test_a_token_without_email_is_403(api: AsyncClient) -> None:
    response = await api.post("/api/auth/session", headers=bearer(make_token(email=None)))

    assert response.status_code == 403
    assert response.json()["detail"] == "email_required"


@pytest.mark.parametrize(
    "body",
    [
        {"phone": "3334567890"},
        {"first_name": ""},
        {"first_name": "x" * 101},
        {"email": "someone-else@example.com"},
    ],
)
async def test_session_body_is_validated(api: AsyncClient, body: dict[str, str]) -> None:
    response = await api.post("/api/auth/session", headers=bearer(make_token()), json=body)

    assert response.status_code == 422


# --- Sign-up and log-in ---------------------------------------------------------------------


async def test_first_session_creates_the_user_and_mi_rancho(
    api: AsyncClient, db: AsyncSession
) -> None:
    response = await api.post(
        "/api/auth/session",
        headers=bearer(make_token("new-uid", email="New.User@Example.com")),
        json={"first_name": " Ana Pérez ", "phone": "+523334567890"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["user"]["first_name"] == "Ana Pérez"
    assert body["user"]["phone"] == "+523334567890"
    assert body["user"]["email"] == "new.user@example.com"
    assert [(r["name"], r["role"]) for r in body["ranches"]] == [("Mi rancho", Role.DUENO)]
    ranch = await db.scalar(select(Ranch))
    assert ranch is not None
    assert await db.get(RanchSettings, ranch.id) is not None


async def test_second_session_returns_the_same_account(api: AsyncClient, db: AsyncSession) -> None:
    first = await api.post("/api/auth/session", headers=bearer(make_token()))
    second = await api.post(
        "/api/auth/session", headers=bearer(make_token()), json={"first_name": "Otro"}
    )

    assert second.status_code == 200
    assert second.json()["created"] is False
    assert second.json()["user"] == first.json()["user"]
    assert await db.scalar(select(func.count()).select_from(Ranch)) == 1
    me = await api.get("/api/auth/me", headers=bearer(make_token()))
    assert me.json() == {k: v for k, v in second.json().items() if k != "created"}


async def test_social_sign_in_falls_back_to_the_token_name(api: AsyncClient) -> None:
    response = await api.post(
        "/api/auth/session",
        headers=bearer(make_token("google-uid", name="Luis G", picture="https://p.example/a")),
    )

    assert response.json()["user"]["first_name"] == "Luis G"
    assert response.json()["user"]["photo_url"] == "https://p.example/a"


async def _imported_user(db: AsyncSession, email: str, uid: str | None = None) -> User:
    user = User(first_name="Legado", email=email, firebase_uid=uid)
    db.add(user)
    await db.commit()
    return user


async def test_an_imported_row_is_linked_by_verified_email(
    api: AsyncClient, db: AsyncSession
) -> None:
    imported = await _imported_user(db, "legacy@example.com")

    response = await api.post(
        "/api/auth/session", headers=bearer(make_token("legacy-uid", email="legacy@example.com"))
    )

    assert response.status_code == 200
    assert response.json()["created"] is False
    assert response.json()["user"]["id"] == str(imported.id)
    assert response.json()["ranches"] == []


async def test_an_unverified_email_cannot_claim_an_imported_row(
    api: AsyncClient, db: AsyncSession
) -> None:
    await _imported_user(db, "legacy@example.com")

    response = await api.post(
        "/api/auth/session",
        headers=bearer(make_token("attacker", email="legacy@example.com", email_verified=False)),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "email_in_use"


async def test_an_email_owned_by_another_uid_is_409(api: AsyncClient, db: AsyncSession) -> None:
    await _imported_user(db, "taken@example.com", uid="someone")

    response = await api.post(
        "/api/auth/session", headers=bearer(make_token("other", email="taken@example.com"))
    )

    assert response.status_code == 409


async def test_two_sessions_at_once_make_one_account(
    schema: AsyncEngine, enforced_fks: None
) -> None:
    claims = TokenClaims("race-uid", "race@example.com", True, None, None)
    sessions = make_sessionmaker(schema)

    async def open_one() -> tuple[User, bool]:
        async with sessions() as session:
            return await accounts.open_session(session, claims, accounts.Profile())

    results = await asyncio.gather(open_one(), open_one())

    assert sorted(created for _, created in results) == [False, True]
    assert results[0][0].id == results[1][0].id
    async with sessions() as session:
        assert await session.scalar(select(func.count()).select_from(Ranch)) == 1
        assert await session.scalar(select(func.count()).select_from(Membership)) == 1


# --- Emulator safety ------------------------------------------------------------------------


@pytest.fixture
def clean_emulator_env() -> Iterator[None]:
    saved = os.environ.pop("FIREBASE_AUTH_EMULATOR_HOST", None)
    yield
    os.environ.pop("FIREBASE_AUTH_EMULATOR_HOST", None)
    if saved is not None:
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = saved


async def test_a_stray_emulator_variable_is_cleared(
    settings: Settings, clean_emulator_env: None
) -> None:
    os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "127.0.0.1:9099"

    create_app(settings)

    assert "FIREBASE_AUTH_EMULATOR_HOST" not in os.environ
