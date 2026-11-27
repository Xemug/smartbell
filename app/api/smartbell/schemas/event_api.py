"""Request and response bodies of the events API (`/animals/{animal_id}/events`).

The stored payload models live in `smartbell.schemas.events`. A request takes the same models,
except that fields the server computes are optional there: CALVING `timing`, and a group move's
`from_group_id`, which the server always overwrites with the animal's current group.
"""

import datetime as dt
import uuid
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field

from smartbell.enums import (
    AlertKind,
    AlertStatus,
    CalvingTiming,
    DeletionRequestStatus,
    EventType,
    ServiceMethod,
)
from smartbell.schemas.animals import AnimalDetail
from smartbell.schemas.events import (
    AbortionPayload,
    AccidentPayload,
    CalvingPayload,
    DietChangePayload,
    GroupChangePayload,
    HeatPayload,
    IllnessPayload,
    MedicalTreatmentPayload,
    PregnancyCheckPayload,
    TreatmentFollowupPayload,
    VaccinationPayload,
    WeightPayload,
)


class CalvingInput(CalvingPayload):
    timing: CalvingTiming | None = None  # type: ignore[assignment]  # Computed by the server.


# ALTA comes from `POST /animals` and REMOVAL from `POST /animals/{id}/removal`.
EventInput = Annotated[
    HeatPayload
    | PregnancyCheckPayload
    | CalvingInput
    | AbortionPayload
    | IllnessPayload
    | AccidentPayload
    | MedicalTreatmentPayload
    | TreatmentFollowupPayload
    | DietChangePayload
    | GroupChangePayload
    | VaccinationPayload
    | WeightPayload,
    Field(discriminator="type"),
]


class _Body(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EventCreate(_Body):
    occurred_on: dt.date
    description: Annotated[str | None, Field(max_length=500)] = None
    comments: Annotated[str | None, Field(max_length=160)] = None
    payload: EventInput


class EventUpdate(_Body):
    """Only the fields sent change. `payload`, when sent, replaces the whole payload and must
    keep the event's type."""

    occurred_on: dt.date | None = None
    description: Annotated[str | None, Field(max_length=500)] = None
    comments: Annotated[str | None, Field(max_length=160)] = None
    payload: EventInput | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    animal_id: uuid.UUID
    type: EventType
    occurred_on: dt.date
    recorded_by: uuid.UUID | None
    # "Realizó registro": filled by the bitácora list; other responses leave it empty.
    recorded_by_name: str | None = None
    created_at: dt.datetime
    description: str | None
    comments: str | None
    payload: dict[str, Any]
    deletable: bool


class BullServiceOut(BaseModel):
    """A service the bull gave: the cow, the day and how (IA or MONTA)."""

    event_id: uuid.UUID
    occurred_on: dt.date
    method: ServiceMethod
    cow_id: uuid.UUID
    cow_control_id: str


class EventDerived(BaseModel):
    """What the server worked out from the event, as of when it was written."""

    calving_timing: CalvingTiming | None = None
    # §3.9: EARLY_EMBRYONIC_DEATH, ABORTION or CALVING, from the days since the service.
    loss: str | None = None
    withdrawal_until: dt.date | None = None


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: AlertKind
    window_start: dt.date
    window_end: dt.date
    status: AlertStatus


class EventWritten(BaseModel):
    event: EventOut
    derived: EventDerived
    animal: AnimalDetail
    open_alerts: list[AlertOut]


class EventDeleted(BaseModel):
    animal: AnimalDetail
    open_alerts: list[AlertOut]


class DeletionRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    requested_by: uuid.UUID | None
    status: DeletionRequestStatus
    created_at: dt.datetime
