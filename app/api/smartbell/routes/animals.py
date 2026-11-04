"""The animal registry of the active ranch (`X-Ranch-Id`): create, read, edit, remove, list.

Refusals tied to a field use FastAPI's validation shape, so the form can put the message under
the field: `{"detail": [{"loc": ["body", "siniiga"], "type": "siniiga_taken", "msg": "…"}]}`.
A taken ID is a 409; every other field refusal is a 422.
"""

import datetime as dt
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.domain.repro import Projection
from smartbell.enums import AnimalKind, Breed, DamStatus, RemovalReason, ReproState
from smartbell.models import Animal
from smartbell.schemas.animals import (
    AnimalCreate,
    AnimalCreated,
    AnimalDetail,
    AnimalOut,
    AnimalPage,
    AnimalRemoval,
    AnimalUpdate,
    GroupFilter,
    Health,
    ProjectionOut,
    SortKey,
    window_out,
)
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext, require
from smartbell.services import animals
from smartbell.services.animals import (
    PAGE_SIZE,
    AnimalFilters,
    AnimalNotFound,
    AnimalRemoved,
    FieldError,
    ranch_today,
)

router = APIRouter(tags=["animals"])

Session = Annotated[AsyncSession, Depends(get_session)]


def get_today() -> dt.date:
    """The ranch's date. A dependency, so tests can pin it."""
    return ranch_today()


Today = Annotated[dt.date, Depends(get_today)]


def _field_error(error: FieldError) -> HTTPException:
    return HTTPException(
        error.status,
        detail=[{"loc": ["body", *error.loc], "type": error.code, "msg": error.msg}],
    )


def _not_found() -> HTTPException:
    # The same answer for another ranch's animal, so ids can't be probed.
    return HTTPException(status.HTTP_404_NOT_FOUND, detail="animal_not_found")


def _removed() -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, detail="animal_removed")


@asynccontextmanager
async def _writing(session: AsyncSession) -> AsyncIterator[None]:
    """One transaction per request; domain refusals become HTTP errors and roll it back."""
    try:
        yield
        await session.commit()
    except FieldError as error:
        await session.rollback()
        raise _field_error(error) from error
    except IntegrityError as error:
        await session.rollback()
        raise _field_error(animals.integrity_field_error(error)) from error
    except AnimalNotFound as error:
        await session.rollback()
        raise _not_found() from error
    except AnimalRemoved as error:
        await session.rollback()
        raise _removed() from error


def _projection_out(projection: Projection) -> ProjectionOut:
    return ProjectionOut(
        development_stage=projection.development_stage,
        dim=projection.dim,
        days_open=projection.days_open,
        breeding_unlocked=projection.breeding_unlocked,
        next_heat=window_out(projection.next_heat),
        pregnancy_check=window_out(projection.pregnancy_check),
        calving=window_out(projection.calving),
        dry_off_date=projection.dry_off_date,
        close_up_date=projection.close_up_date,
        warnings=sorted({warning.flag.name for warning in projection.warnings}),
    )


def _detail(animal: Animal, projection: Projection) -> AnimalDetail:
    out = AnimalOut.model_validate(animal)
    return AnimalDetail(**out.model_dump(), projection=_projection_out(projection))


@router.post("/animals", operation_id="createAnimal", status_code=status.HTTP_201_CREATED)
async def create_animal(
    body: AnimalCreate,
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_CREATE))],
    session: Session,
    today: Today,
) -> AnimalCreated:
    """Alta. A nested `dam` or `sire` is created first, in the same transaction."""
    retires_dam = body.dam_status not in (None, DamStatus.VIVA)
    if retires_dam and Permission.ANIMALS_DELETE not in ctx.permissions:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="permission_denied")
    async with _writing(session):
        created = await animals.create_animal(session, ctx, body, today)
    detail = _detail(created.animal, created.projection)
    return AnimalCreated(**detail.model_dump(), created_ids=[a.id for a in created.created])


@router.get("/animals", operation_id="listAnimals")
async def list_animals(
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Session,
    kind: AnimalKind | None = None,
    q: Annotated[str | None, Query(max_length=60, description="Search by ID or name")] = None,
    group: Annotated[
        GroupFilter | None, Query(description="A group id, or a preset such as GENERAL")
    ] = None,
    breed: Breed | None = None,
    repro: ReproState | None = None,
    health: Health | None = None,
    removed_reason: Annotated[
        RemovalReason | None, Query(description="Lists the removed animals with this reason")
    ] = None,
    sort: SortKey = "control_id",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = PAGE_SIZE,
) -> AnimalPage:
    filters = AnimalFilters(
        kind=kind,
        q=q,
        group=group,
        breed=breed,
        repro=repro,
        health=health,
        removed_reason=removed_reason,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    rows, total = await animals.list_animals(session, ctx.ranch_id, filters)
    return AnimalPage(
        items=[AnimalOut.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/animals/{animal_id}", operation_id="getAnimal")
async def get_animal(
    animal_id: uuid.UUID,
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Session,
    today: Today,
) -> AnimalDetail:
    try:
        animal = await animals.get_animal(session, ctx.ranch_id, animal_id)
    except AnimalNotFound as error:
        raise _not_found() from error
    return _detail(animal, await animals.projection_of(session, animal, today))


@router.patch("/animals/{animal_id}", operation_id="updateAnimal")
async def update_animal(
    animal_id: uuid.UUID,
    body: AnimalUpdate,
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_EDIT))],
    session: Session,
    today: Today,
) -> AnimalDetail:
    async with _writing(session):
        animal, projection = await animals.update_animal(session, ctx, animal_id, body, today)
    return _detail(animal, projection)


@router.post(
    "/animals/{animal_id}/removal",
    operation_id="removeAnimal",
    response_model=AnimalOut,
    responses={204: {"description": "ERROR_REGISTRO: the animal was deleted"}},
)
async def remove_animal(
    animal_id: uuid.UUID,
    body: AnimalRemoval,
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_DELETE))],
    session: Session,
    today: Today,
) -> AnimalOut | Response:
    """Baja. ERROR_REGISTRO deletes the animal and its events (204); any other reason keeps
    them and marks the animal REMOVED (200)."""
    async with _writing(session):
        animal = await animals.remove_animal(session, ctx, animal_id, body, today)
    if animal is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return AnimalOut.model_validate(animal)
