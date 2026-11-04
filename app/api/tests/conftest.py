"""Shared fixtures.

Database tests run against PostgreSQL when TEST_DATABASE_URL is set (CI always sets it): each
test gets its own throwaway schema. Without it they fall back to in-memory SQLite, which is
allowed in tests only; `db_backend` says which one a test got.
"""

import os
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    create_async_engine,
)

from smartbell import models  # noqa: F401 - registers every table on Base.metadata
from smartbell.db import Base, get_session, make_sessionmaker
from smartbell.enums import Role
from smartbell.main import create_app
from smartbell.models import Membership
from smartbell.security import TokenClaims, get_token_claims
from smartbell.security.permissions import preset
from smartbell.settings import Settings

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")
FIREBASE_PROJECT_ID = "demo-smartbell-test"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        env="test",
        database_url=TEST_DATABASE_URL or "sqlite+aiosqlite:///:memory:",
        secret_key="test-secret",
        firebase_project_id=FIREBASE_PROJECT_ID,
        firebase_auth_emulator_host="",
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    # ASGITransport does not run the lifespan, which is what sets up the engine and sessions.
    async with (
        app.router.lifespan_context(app),
        AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client,
    ):
        yield client


@pytest.fixture
def db_backend() -> str:
    return "postgresql" if TEST_DATABASE_URL else "sqlite"


@pytest.fixture
def enforced_fks(db_backend: str) -> None:
    if db_backend == "sqlite":
        pytest.skip("SQLite doesn't enforce foreign keys here")


@pytest.fixture
async def db_engine() -> AsyncIterator[AsyncEngine]:
    if not TEST_DATABASE_URL:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        yield engine
        await engine.dispose()
        return

    schema = f"test_{uuid.uuid4().hex}"
    admin = create_async_engine(TEST_DATABASE_URL)
    async with admin.begin() as conn:
        await conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_async_engine(
        TEST_DATABASE_URL, connect_args={"server_settings": {"search_path": schema}}
    )
    try:
        yield engine
    finally:
        await engine.dispose()
        async with admin.begin() as conn:
            await conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        await admin.dispose()


@pytest.fixture
async def db_conn(db_engine: AsyncEngine) -> AsyncIterator[AsyncConnection]:
    async with db_engine.connect() as conn:
        yield conn


@pytest.fixture
async def session(db_engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    """A session on a fresh copy of the full schema."""
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with make_sessionmaker(db_engine)() as session:
        yield session


# --- Tenancy: signed-in users, their ranches and the active-ranch header ----------------------
# Token verification has its own tests (test_auth.py). Here `Authorization: Bearer <uid>` stands
# for a verified token of that uid, so ranch tests stay about ranches.


@pytest.fixture
async def schema(db_engine: AsyncEngine) -> AsyncEngine:
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return db_engine


@pytest.fixture
def tenant_app(settings: Settings, schema: AsyncEngine) -> FastAPI:
    app = create_app(settings)
    sessions = make_sessionmaker(schema)

    async def session_override() -> AsyncIterator[AsyncSession]:
        async with sessions() as session:
            yield session

    async def claims_override(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTPBearer())],
    ) -> TokenClaims:
        assert credentials is not None
        uid = credentials.credentials
        return TokenClaims(
            uid=uid, email=f"{uid}@example.com", email_verified=True, name=uid, picture=None
        )

    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_token_claims] = claims_override
    return app


@pytest.fixture
async def tenant_api(tenant_app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=tenant_app), base_url="http://test") as api:
        yield api


@pytest.fixture
async def tenant_db(schema: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with make_sessionmaker(schema)() as session:
        yield session


@dataclass(frozen=True)
class Account:
    uid: str
    user_id: uuid.UUID
    ranch_id: uuid.UUID  # The "Mi rancho" made at sign-up.

    def headers(self, ranch_id: uuid.UUID | None = None) -> dict[str, str]:
        """Bearer token plus `X-Ranch-Id`: this account's own ranch unless another is named."""
        return {"Authorization": f"Bearer {self.uid}", "X-Ranch-Id": str(ranch_id or self.ranch_id)}


async def sign_up(api: AsyncClient, uid: str) -> Account:
    response = await api.post("/api/auth/session", headers={"Authorization": f"Bearer {uid}"})
    assert response.status_code == 200, response.text
    body = response.json()
    return Account(uid, uuid.UUID(body["user"]["id"]), uuid.UUID(body["ranches"][0]["id"]))


async def add_member(db: AsyncSession, account: Account, ranch_id: uuid.UUID, role: Role) -> None:
    """Joins `account` to a ranch with its role's preset (invitations arrive with user-admin)."""
    db.add(
        Membership(user_id=account.user_id, ranch_id=ranch_id, role=role, permissions=preset(role))
    )
    await db.commit()


@dataclass(frozen=True)
class RanchPair:
    """One owner with two ranches, A and B, each with a second member.

    The shared fixture for isolation tests: seed data in A, read with `X-Ranch-Id: B`, and
    nothing of A's may come back. See test_ranch_isolation.py.
    """

    owner: Account
    ranch_a: uuid.UUID
    ranch_b: uuid.UUID
    member_a: Account
    member_b: Account


@pytest.fixture
async def ranch_pair(tenant_api: AsyncClient, tenant_db: AsyncSession) -> RanchPair:
    owner = await sign_up(tenant_api, "owner")
    created = await tenant_api.post(
        "/api/ranches", headers=owner.headers(), json={"name": "Rancho B"}
    )
    assert created.status_code == 201, created.text
    ranch_b = uuid.UUID(created.json()["id"])
    member_a = await sign_up(tenant_api, "member-a")
    member_b = await sign_up(tenant_api, "member-b")
    await add_member(tenant_db, member_a, owner.ranch_id, Role.MEDICO)
    await add_member(tenant_db, member_b, ranch_b, Role.MEDICO)
    return RanchPair(owner, owner.ranch_id, ranch_b, member_a, member_b)
