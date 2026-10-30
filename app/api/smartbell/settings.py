"""Settings read from the environment (and an optional `.env` file)."""

from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_DATABASE_URL = "postgresql+asyncpg://smartbell:smartbell@localhost:5432/smartbell"
DEV_SECRET_KEY = "dev-only-insecure-secret-key"  # noqa: S105 - dev default, refused outside dev


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    database_url: str = ""
    secret_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173"]

    @model_validator(mode="after")
    def _require_secrets_outside_dev(self) -> "Settings":
        if self.env == "dev":
            self.database_url = self.database_url or DEV_DATABASE_URL
            self.secret_key = self.secret_key or DEV_SECRET_KEY
            return self
        missing = [name for name in ("database_url", "secret_key") if not getattr(self, name)]
        if missing:
            names = ", ".join(name.upper() for name in missing)
            raise ValueError(f"{names} must be set when ENV={self.env}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
