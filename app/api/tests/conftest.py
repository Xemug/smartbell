"""Shared fixtures.

Database tests run against PostgreSQL when TEST_DATABASE_URL is set (CI always sets it): each
test gets its own throwaway schema. Without it they fall back to in-memory SQLite, which is
allowed in tests only; `db_backend` says which one a test got.
"""

import os
import uuid
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    create_async_engine,
)

from smartbell import models  # noqa: F401 - registers every table on Base.metadata
from smartbell.db import Base, make_sessionmaker
from smartbell.main import create_app
from smartbell.settings import Settings

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,
        env="test",
        database_url=TEST_DATABASE_URL or "sqlite+aiosqlite:///:memory:",
        secret_key="test-secret",
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
