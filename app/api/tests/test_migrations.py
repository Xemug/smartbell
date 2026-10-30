from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import Connection, text
from sqlalchemy.ext.asyncio import AsyncConnection

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


def _upgrade_head(connection: Connection) -> None:
    config = Config(str(ALEMBIC_INI))
    config.attributes["connection"] = connection
    command.upgrade(config, "head")


async def test_upgrade_head_on_empty_database(db_conn: AsyncConnection) -> None:
    await db_conn.run_sync(_upgrade_head)

    version = (await db_conn.execute(text("SELECT version_num FROM alembic_version"))).scalar_one()
    assert version == "0001"
