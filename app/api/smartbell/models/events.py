"""The bitácora: events are the source of truth (docs/domain-model.md §1)."""

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, String, event
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Mapped, Mapper, mapped_column

from smartbell.db import Base
from smartbell.enums import NON_DELETABLE_EVENT_TYPES, DeletionRequestStatus, EventType
from smartbell.models.columns import Json, RanchId, UuidPk, created_at, str_enum
from smartbell.schemas.events import validate_event_payload


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (Index("ix_events_animal_id_occurred_on", "animal_id", "occurred_on"),)

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    animal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("animals.id", ondelete="CASCADE"))
    type: Mapped[EventType] = mapped_column(str_enum(EventType, "type"))
    occurred_on: Mapped[dt.date] = mapped_column(default=dt.date.today)
    # SET NULL: deleting a user keeps their history.
    recorded_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[dt.datetime] = created_at()
    description: Mapped[str | None] = mapped_column(String(500))
    comments: Mapped[str | None] = mapped_column(String(160))
    payload: Mapped[dict[str, Any]] = mapped_column(Json)

    @property
    def deletable(self) -> bool:
        return self.type not in NON_DELETABLE_EVENT_TYPES


@event.listens_for(Event, "before_insert")
@event.listens_for(Event, "before_update")
def _validate_payload(_mapper: Mapper[Event], _connection: Connection, target: Event) -> None:
    parsed = validate_event_payload(target.type, target.payload)
    target.payload = parsed.model_dump(mode="json", exclude_none=True)


class DeletionRequest(Base):
    __tablename__ = "deletion_requests"

    id: Mapped[UuidPk]
    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), index=True
    )
    requested_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    status: Mapped[DeletionRequestStatus] = mapped_column(
        str_enum(DeletionRequestStatus, "status"),
        default=DeletionRequestStatus.PENDING,
        server_default=DeletionRequestStatus.PENDING,
    )
    created_at: Mapped[dt.datetime] = created_at()
