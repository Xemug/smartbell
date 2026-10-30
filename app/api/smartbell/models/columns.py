"""Column helpers shared by the models."""

import datetime as dt
import uuid
from enum import StrEnum
from typing import Annotated

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

# none_as_null: an explicit None is SQL NULL, not the JSON value null.
Json = JSON(none_as_null=True).with_variant(JSONB(none_as_null=True), "postgresql")

UuidPk = Annotated[uuid.UUID, mapped_column(Uuid, primary_key=True, default=uuid.uuid4)]
RanchId = Annotated[
    uuid.UUID, mapped_column(ForeignKey("ranches.id", ondelete="CASCADE"), index=True)
]


def str_enum(enum: type[StrEnum], name: str) -> Enum:
    """A check-constrained VARCHAR: `name` also names the CHECK, so it's unique per table."""
    return Enum(enum, name=name, native_enum=False, create_constraint=True, length=32)


def created_at() -> Mapped[dt.datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())
