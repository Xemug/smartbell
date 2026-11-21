"""Alerts as the tasks layer and the bell badge read them (docs/roadmap/alert-engine.md)."""

import datetime as dt
import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict

from smartbell.enums import AlertKind, AlertStatus


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    animal_id: uuid.UUID
    kind: AlertKind
    window_start: dt.date
    window_end: dt.date
    status: AlertStatus
    follow_up_day: int
    resolved_by: uuid.UUID | None
    resolved_at: dt.datetime | None
    resulting_event_id: uuid.UUID | None


class AlertCountsOut(BaseModel):
    total: int
    by_kind: dict[AlertKind, int]


class AlertResolve(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal[AlertStatus.CONFIRMED, AlertStatus.NEGATED]
    event_id: uuid.UUID | None = None
