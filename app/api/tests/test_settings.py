import pytest
from pydantic import ValidationError

from smartbell.settings import DEV_DATABASE_URL, DEV_SECRET_KEY, Settings


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in (
        "ENV",
        "DATABASE_URL",
        "SECRET_KEY",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_AUTH_EMULATOR_HOST",
    ):
        monkeypatch.delenv(name, raising=False)


def test_dev_fills_in_defaults() -> None:
    settings = Settings(_env_file=None)

    assert settings.env == "dev"
    assert settings.database_url == DEV_DATABASE_URL
    assert settings.secret_key == DEV_SECRET_KEY


@pytest.mark.parametrize("env", ["test", "prod"])
def test_outside_dev_requires_database_url_and_secret_key(env: str) -> None:
    with pytest.raises(
        ValidationError, match="DATABASE_URL, SECRET_KEY, FIREBASE_PROJECT_ID must be set"
    ):
        Settings(_env_file=None, env=env)


def test_prod_reads_values_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV", "prod")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@db/smartbell")
    monkeypatch.setenv("SECRET_KEY", "s3cret")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "real-project")

    settings = Settings(_env_file=None)

    assert settings.database_url == "postgresql+asyncpg://u:p@db/smartbell"
    assert settings.secret_key == "s3cret"
