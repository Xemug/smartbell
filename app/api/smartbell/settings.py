"""Settings read from the environment (and an optional `.env` file)."""

from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_DATABASE_URL = "postgresql+asyncpg://smartbell:smartbell@localhost:5432/smartbell"
DEV_SECRET_KEY = "dev-only-insecure-secret-key"  # noqa: S105 - dev default, refused outside dev
# A `demo-` project cannot reach any real Firebase resource, so dev can't touch the live one.
DEV_FIREBASE_PROJECT_ID = "demo-smartbell"
DEV_FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    database_url: str = ""
    secret_key: str = ""
    cors_origins: list[str] = ["http://localhost:5173"]
    firebase_project_id: str = ""
    # firebase-admin skips signature checks when this is set, so anyone could forge a token.
    firebase_auth_emulator_host: str = ""

    @model_validator(mode="after")
    def _require_secrets_outside_dev(self) -> "Settings":
        if self.env == "dev":
            self.database_url = self.database_url or DEV_DATABASE_URL
            self.secret_key = self.secret_key or DEV_SECRET_KEY
            if not self.firebase_project_id:
                self.firebase_project_id = DEV_FIREBASE_PROJECT_ID
                self.firebase_auth_emulator_host = (
                    self.firebase_auth_emulator_host or DEV_FIREBASE_AUTH_EMULATOR_HOST
                )
        required = ("database_url", "secret_key", "firebase_project_id")
        missing = [name for name in required if not getattr(self, name)]
        if missing:
            names = ", ".join(name.upper() for name in missing)
            raise ValueError(f"{names} must be set when ENV={self.env}")
        if self.firebase_auth_emulator_host and not self.firebase_project_id.startswith("demo-"):
            raise ValueError("FIREBASE_AUTH_EMULATOR_HOST needs a demo- FIREBASE_PROJECT_ID")
        if self.env == "prod" and self.firebase_project_id.startswith("demo-"):
            raise ValueError("FIREBASE_PROJECT_ID can't be a demo- project when ENV=prod")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
