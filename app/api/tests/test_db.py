from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection


async def test_connection_round_trip(db_conn: AsyncConnection) -> None:
    await db_conn.execute(text("CREATE TABLE probe (id INTEGER PRIMARY KEY, name TEXT)"))
    await db_conn.execute(text("INSERT INTO probe (id, name) VALUES (1, 'ok')"))

    result = await db_conn.execute(text("SELECT name FROM probe"))

    assert result.scalar_one() == "ok"


async def test_each_test_gets_its_own_schema(db_conn: AsyncConnection, db_backend: str) -> None:
    # The table created by the test above must not leak into this one.
    if db_backend == "postgresql":
        schema = (await db_conn.execute(text("SELECT current_schema()"))).scalar_one()
        assert schema.startswith("test_")
        query = "SELECT count(*) FROM information_schema.tables WHERE table_name = 'probe'"
    else:
        query = "SELECT count(*) FROM sqlite_master WHERE name = 'probe'"

    assert (await db_conn.execute(text(query))).scalar_one() == 0
