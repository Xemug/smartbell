import datetime as dt
import uuid
from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import Connection, inspect, text
from sqlalchemy.exc import IntegrityError
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
    assert version == "0009"


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


async def test_0007_numbers_existing_history_in_its_old_order(
    db_conn: AsyncConnection, db_backend: str
) -> None:
    if db_backend != "postgresql":
        pytest.skip("the backfill is Postgres SQL")
    await db_conn.run_sync(lambda c: command.upgrade(_config(c), "0006"))
    ranch_id, owner_id = uuid.uuid4(), uuid.uuid4()
    await db_conn.execute(
        text("INSERT INTO users (id, first_name, email) VALUES (:id, 'Ana', 'ana@example.com')"),
        {"id": owner_id},
    )
    await db_conn.execute(
        text("INSERT INTO ranches (id, name, owner_user_id) VALUES (:id, 'El Roble', :owner)"),
        {"id": ranch_id, "owner": owner_id},
    )
    # All tie on created_at, so the old order is by id.
    ids = sorted(uuid.uuid4() for _ in range(5))
    for entry_id in reversed(ids):
        await db_conn.execute(
            text(
                "INSERT INTO history_entries (id, ranch_id, category, event_key, created_at)"
                " VALUES (:id, :ranch_id, 'RANCHO', 'x', '2026-01-01T00:00:00Z')"
            ),
            {"id": entry_id, "ranch_id": ranch_id},
        )

    await db_conn.run_sync(_upgrade_head)

    rows = await db_conn.execute(text("SELECT id FROM history_entries ORDER BY seq"))
    assert [row.id for row in rows] == ids
    next_seq = await db_conn.scalar(
        text(
            "INSERT INTO history_entries (id, ranch_id, category, event_key)"
            " VALUES (:id, :ranch_id, 'RANCHO', 'x') RETURNING seq"
        ),
        {"id": uuid.uuid4(), "ranch_id": ranch_id},
    )
    assert next_seq == 6


async def test_0008_puts_existing_males_on_the_ranch(
    db_conn: AsyncConnection, db_backend: str
) -> None:
    if db_backend != "postgresql":
        pytest.skip("checked on Postgres, as CI runs it")
    await db_conn.run_sync(lambda c: command.upgrade(_config(c), "0007"))
    ranch_id, owner_id = uuid.uuid4(), uuid.uuid4()
    await db_conn.execute(
        text("INSERT INTO users (id, first_name, email) VALUES (:id, 'Ana', 'ana@example.com')"),
        {"id": owner_id},
    )
    await db_conn.execute(
        text("INSERT INTO ranches (id, name, owner_user_id) VALUES (:id, 'El Roble', :owner)"),
        {"id": ranch_id, "owner": owner_id},
    )
    for control_id, sex, kind in (("T1", "MACHO", "TORO"), ("V1", "HEMBRA", "VACA")):
        await db_conn.execute(
            text(
                "INSERT INTO animals (id, ranch_id, sex, kind, control_id, birth_date)"
                " VALUES (:id, :ranch_id, :sex, :kind, :control_id, '2020-01-01')"
            ),
            {
                "id": uuid.uuid4(),
                "ranch_id": ranch_id,
                "sex": sex,
                "kind": kind,
                "control_id": control_id,
            },
        )

    await db_conn.run_sync(_upgrade_head)

    rows = await db_conn.execute(
        text("SELECT control_id, bull_availability FROM animals ORDER BY control_id")
    )
    assert [tuple(row) for row in rows] == [("T1", "EN_RANCHO"), ("V1", None)]
    with pytest.raises(IntegrityError):
        async with db_conn.begin_nested():
            await db_conn.execute(
                text("UPDATE animals SET bull_availability = NULL WHERE control_id = 'T1'")
            )


async def test_0009_renames_duplicate_group_names_then_refuses_new_ones(
    db_conn: AsyncConnection, db_backend: str
) -> None:
    if db_backend != "postgresql":
        pytest.skip("checked on Postgres, as CI runs it")
    await db_conn.run_sync(lambda c: command.upgrade(_config(c), "0008"))
    owner_id = uuid.uuid4()
    await db_conn.execute(
        text("INSERT INTO users (id, first_name, email) VALUES (:id, 'Ana', 'ana@example.com')"),
        {"id": owner_id},
    )
    ranch_id, neighbour_id = uuid.uuid4(), uuid.uuid4()
    for ranch, name in ((ranch_id, "El Roble"), (neighbour_id, "La Ceiba")):
        await db_conn.execute(
            text("INSERT INTO ranches (id, name, owner_user_id) VALUES (:id, :name, :owner)"),
            {"id": ranch, "name": name, "owner": owner_id},
        )
    long_name = "x" * 60
    seeded = [  # (ranch, name, preset, created_at), oldest first within a name
        (ranch_id, "enfermas", None, "2026-01-01"),
        (ranch_id, "Enfermas", "ENFERMAS", "2026-01-02"),  # a preset keeps its name
        (ranch_id, "Lote", None, "2026-01-01"),
        (ranch_id, "LOTE", None, "2026-01-02"),
        (ranch_id, "lote", None, "2026-01-03"),
        (ranch_id, "Lote (2)", None, "2026-01-04"),  # already taken, so the copies skip it
        (ranch_id, long_name, None, "2026-01-01"),
        (ranch_id, long_name, None, "2026-01-02"),
        (neighbour_id, "Lote", None, "2026-01-01"),  # another ranch may share it
    ]
    ids = []
    for ranch, name, preset, created_at in seeded:
        group_id = uuid.uuid4()
        ids.append(group_id)
        await db_conn.execute(
            text(
                "INSERT INTO groups (id, ranch_id, name, type, preset, selection, created_at)"
                " VALUES (:id, :ranch, :name, :type, :preset, 'MANUAL', :created_at)"
            ),
            {
                "id": group_id,
                "ranch": ranch,
                "name": name,
                "type": "PRESET" if preset else "CUSTOM",
                "preset": preset,
                "created_at": dt.datetime.fromisoformat(f"{created_at}T00:00:00+00:00"),
            },
        )

    await db_conn.run_sync(_upgrade_head)

    names = {row.id: row.name for row in await db_conn.execute(text("SELECT id, name FROM groups"))}
    assert [names[group_id] for group_id in ids] == [
        "enfermas (2)",
        "Enfermas",
        "Lote",
        "LOTE (3)",
        "lote (4)",
        "Lote (2)",
        long_name,
        "x" * 56 + " (2)",
        "Lote",
    ]
    with pytest.raises(IntegrityError):
        async with db_conn.begin_nested():
            await db_conn.execute(
                text(
                    "INSERT INTO groups (id, ranch_id, name, type, selection)"
                    " VALUES (:id, :ranch, 'lOtE', 'CUSTOM', 'MANUAL')"
                ),
                {"id": uuid.uuid4(), "ranch": ranch_id},
            )


async def test_0009_downgrade_drops_the_name_index(db_conn: AsyncConnection) -> None:
    await db_conn.run_sync(_upgrade_head)
    await db_conn.run_sync(lambda c: command.downgrade(_config(c), "0008"))

    indexes = await db_conn.run_sync(lambda c: inspect(c).get_indexes("groups"))
    assert "uq_groups_ranch_id_lower_name" not in {index["name"] for index in indexes}
