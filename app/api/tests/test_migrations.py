from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Connection, inspect, text
from sqlalchemy.ext.asyncio import AsyncConnection

from smartbell import models  # noqa: F401 - registers every table on Base.metadata
from smartbell.db import Base

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


def _config(connection: Connection) -> Config:
    config = Config(str(ALEMBIC_INI))
    config.attributes["connection"] = connection
    return config


def _upgrade_head(connection: Connection) -> None:
    command.upgrade(_config(connection), "head")


def _downgrade_base(connection: Connection) -> None:
    command.downgrade(_config(connection), "base")


def _tables(connection: Connection) -> set[str]:
    return set(inspect(connection).get_table_names())


def _schema_drift(connection: Connection) -> list[object]:
    return list(compare_metadata(MigrationContext.configure(connection), Base.metadata))


async def test_upgrade_head_on_empty_database(db_conn: AsyncConnection) -> None:
    await db_conn.run_sync(_upgrade_head)

    version = (await db_conn.execute(text("SELECT version_num FROM alembic_version"))).scalar_one()
    assert version == "0002"


async def test_upgrade_creates_every_model_table(db_conn: AsyncConnection) -> None:
    await db_conn.run_sync(_upgrade_head)

    assert set(Base.metadata.tables) <= await db_conn.run_sync(_tables)


async def test_downgrade_base_removes_every_table(db_conn: AsyncConnection) -> None:
    await db_conn.run_sync(_upgrade_head)
    await db_conn.run_sync(_downgrade_base)

    assert await db_conn.run_sync(_tables) == {"alembic_version"}


async def test_migration_matches_the_models(db_conn: AsyncConnection, db_backend: str) -> None:
    if db_backend != "postgresql":
        pytest.skip("types and partial indexes only compare cleanly on Postgres")

    await db_conn.run_sync(_upgrade_head)

    assert await db_conn.run_sync(_schema_drift) == []
