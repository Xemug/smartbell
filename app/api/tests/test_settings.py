import pytest
from pydantic import ValidationError

from smartbell.settings import (
    DEV_DATABASE_URL,
    DEV_FIREBASE_AUTH_EMULATOR_HOST,
    DEV_FIREBASE_PROJECT_ID,
    DEV_SECRET_KEY,
    Settings,
)


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


def test_dev_defaults_to_the_demo_project_on_the_emulator() -> None:
    settings = Settings(_env_file=None)

    assert settings.firebase_project_id == DEV_FIREBASE_PROJECT_ID
    assert settings.firebase_auth_emulator_host == DEV_FIREBASE_AUTH_EMULATOR_HOST


def test_dev_with_a_real_project_does_not_assume_the_emulator() -> None:
    settings = Settings(_env_file=None, firebase_project_id="real-project")

    assert settings.firebase_auth_emulator_host == ""


@pytest.mark.parametrize("env", ["dev", "test", "prod"])
def test_the_emulator_is_refused_with_a_real_project(env: str) -> None:
    # The emulator turns off signature checks, so with a real project it would accept forgeries.
    with pytest.raises(ValidationError, match="needs a demo- FIREBASE_PROJECT_ID"):
        Settings(
            _env_file=None,
            env=env,
            database_url="postgresql+asyncpg://u:p@db/smartbell",
            secret_key="s",
            firebase_project_id="smartbell-app-2025",
            firebase_auth_emulator_host="127.0.0.1:9099",
        )


def test_prod_refuses_a_demo_project() -> None:
    with pytest.raises(ValidationError, match="can't be a demo- project"):
        Settings(
            _env_file=None,
            env="prod",
            database_url="postgresql+asyncpg://u:p@db/smartbell",
            secret_key="s",
            firebase_project_id="demo-smartbell",
        )
