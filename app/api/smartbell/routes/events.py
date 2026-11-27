"""The bitácora of an animal in the active ranch (`X-Ranch-Id`): list, record, edit, delete.

Field refusals use the animals API's shape: `{"detail": [{"loc": [...], "type": ..., "msg": ...}]}`.
"""

import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.models import DeletionRequest
from smartbell.routes.animals import Today, animal_detail
from smartbell.schemas.event_api import (
    AlertOut,
    BullServiceOut,
    DeletionRequestOut,
    EventCreate,
    EventDeleted,
    EventOut,
    EventUpdate,
    EventWritten,
)
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext, require
from smartbell.services import events
from smartbell.services.animals import AnimalNotFound, AnimalRemoved, FieldError
from smartbell.services.events import AdminOnly, EventLocked, EventNotFound, Written

router = APIRouter(tags=["events"])

Session = Annotated[AsyncSession, Depends(get_session)]
Recorder = Annotated[RanchContext, Depends(require(Permission.EVENTS_RECORD))]


@asynccontextmanager
async def _writing(session: AsyncSession) -> AsyncIterator[None]:
    """One transaction per request; domain refusals become HTTP errors and roll it back."""
    try:
        yield
        await session.commit()
    except FieldError as error:
        await session.rollback()
        detail = [{"loc": ["body", *error.loc], "type": error.code, "msg": error.msg}]
        raise HTTPException(error.status, detail=detail) from error
    except AnimalNotFound as error:
        await session.rollback()
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="animal_not_found") from error
    except EventNotFound as error:
        await session.rollback()
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="event_not_found") from error
    except AnimalRemoved as error:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="animal_removed") from error
    except EventLocked as error:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail=error.code) from error
    except AdminOnly as error:
        await session.rollback()
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="admin_only") from error


def _written(result: Written) -> EventWritten:
    return EventWritten(
        event=EventOut.model_validate(result.event),
        derived=result.derived,
        animal=animal_detail(result.animal, result.projection),
        open_alerts=[AlertOut.model_validate(row) for row in result.open_alerts],
    )


@router.get("/animals/{animal_id}/events", operation_id="listEvents")
async def list_events(
    animal_id: uuid.UUID,
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Session,
) -> list[EventOut]:
    """The bitácora, newest first."""
    try:
        rows = await events.list_events(session, ctx.ranch_id, animal_id)
    except AnimalNotFound as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="animal_not_found") from error
    names = await events.recorder_names(
        session, {row.recorded_by for row in rows if row.recorded_by is not None}
    )
    out = [EventOut.model_validate(row) for row in rows]
    for event in out:
        if event.recorded_by is not None:
            event.recorded_by_name = names.get(event.recorded_by)
    return out


@router.get("/animals/{animal_id}/services", operation_id="listBullServices")
async def list_bull_services(
    animal_id: uuid.UUID,
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Session,
) -> list[BullServiceOut]:
    """The cows a bull served (IA or monta), newest first: his reproduction history."""
    try:
        rows = await events.list_bull_services(session, ctx.ranch_id, animal_id)
    except AnimalNotFound as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="animal_not_found") from error
    return [BullServiceOut.model_validate(row, from_attributes=True) for row in rows]


@router.post(
    "/animals/{animal_id}/events", operation_id="recordEvent", status_code=status.HTTP_201_CREATED
)
async def record_event(
    animal_id: uuid.UUID, body: EventCreate, ctx: Recorder, session: Session, today: Today
) -> EventWritten:
    """Records an event, re-projects the animal and opens or closes its alerts."""
    async with _writing(session):
        result = await events.record_event(session, ctx, animal_id, body, today)
    return _written(result)


@router.patch("/animals/{animal_id}/events/{event_id}", operation_id="editEvent")
async def edit_event(
    animal_id: uuid.UUID,
    event_id: uuid.UUID,
    body: EventUpdate,
    ctx: Recorder,
    session: Session,
    today: Today,
) -> EventWritten:
    """Health, diet, group, vaccination and weight events; repro events by admins only. ALTA and
    REMOVAL have their own flows (409)."""
    async with _writing(session):
        result = await events.edit_event(session, ctx, animal_id, event_id, body, today)
    return _written(result)


@router.delete(
    "/animals/{animal_id}/events/{event_id}",
    operation_id="deleteEvent",
    response_model=EventDeleted | DeletionRequestOut,
    responses={
        200: {"model": EventDeleted, "description": "Deleted; the animal re-projected"},
        202: {"model": DeletionRequestOut, "description": "Sent to an admin for approval"},
        409: {"description": "event_not_deletable: ALTA, REMOVAL and repro events"},
    },
)
async def delete_event(
    animal_id: uuid.UUID,
    event_id: uuid.UUID,
    ctx: Recorder,
    session: Session,
    today: Today,
    response: Response,
) -> EventDeleted | DeletionRequestOut:
    """Deletes and re-projects (200). Without ANIMALS_DELETE, files a DeletionRequest (202)."""
    async with _writing(session):
        result = await events.delete_event(session, ctx, animal_id, event_id, today)
    if isinstance(result, DeletionRequest):
        response.status_code = status.HTTP_202_ACCEPTED
        return DeletionRequestOut.model_validate(result)
    return EventDeleted(
        animal=animal_detail(result.animal, result.projection),
        open_alerts=[AlertOut.model_validate(row) for row in result.open_alerts],
    )
