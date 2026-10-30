import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def test_connection_round_trip(db_conn: AsyncConnection) -> None:
    await db_conn.execute(text("CREATE TABLE probe (id INTEGER PRIMARY KEY, name TEXT)"))
    await db_conn.execute(text("INSERT INTO probe (id, name) VALUES (1, 'ok')"))
    await db_conn.commit()

    result = await db_conn.execute(text("SELECT name FROM probe"))

    assert result.scalar_one() == "ok"


async def test_postgres_tests_run_in_their_own_schema(
    db_conn: AsyncConnection, db_backend: str
) -> None:
    if db_backend != "postgresql":
        pytest.skip("per-test schemas only apply to Postgres")

    schema = (await db_conn.execute(text("SELECT current_schema()"))).scalar_one()
    await db_conn.execute(text("CREATE TABLE probe (id INTEGER PRIMARY KEY)"))
    await db_conn.commit()

    where = "table_name = 'probe' AND table_schema = :schema"
    tables = text(f"SELECT count(*) FROM information_schema.tables WHERE {where}")
    assert schema.startswith("test_")
    assert (await db_conn.execute(tables, {"schema": schema})).scalar_one() == 1
    assert (await db_conn.execute(tables, {"schema": "public"})).scalar_one() == 0
