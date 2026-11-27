"""The groups (potreros) of the active ranch (`X-Ranch-Id`).

    GET    /groups                      every group with its count and indicator, presets first
    GET    /groups/heifers              the computed heifer groups and their heifers
    POST   /groups/preview              the cows an AUTO rule would match now
    POST   /groups                      the wizard: create, pick cows, pick the indicator
    GET    /groups/{id}                 one group
    PATCH  /groups/{id}                 rename, describe, indicator, AUTO rule
    DELETE /groups/{id}?to_group_id=    send its animals to General (or the group given), delete
    POST   /groups/{id}/animals         move animals in (GROUP_CHANGE events, one history entry)
    POST   /groups/{id}/reevaluate      apply an AUTO group's rule now

Field refusals use the animals API's shape: `{"detail": [{"loc": [...], "type": ..., "msg": ...}]}`;
other refusals are `{"detail": "<code>"}`.
"""

import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.routes.animals import Today
from smartbell.schemas.groups import (
    AutoFilter,
    GroupCreate,
    GroupDeleted,
    GroupOut,
    GroupUpdate,
    HeiferGroupOut,
    MoveAnimals,
    MoveResult,
    Reevaluated,
)
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext, require
from smartbell.services import groups
from smartbell.services.animals import FieldError
from smartbell.services.groups import GroupError

router = APIRouter(tags=["groups"])

Session = Annotated[AsyncSession, Depends(get_session)]
Viewer = Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))]
Creator = Annotated[RanchContext, Depends(require(Permission.GROUPS_CREATE))]
Editor = Annotated[RanchContext, Depends(require(Permission.GROUPS_VIEW_EDIT))]
Deleter = Annotated[RanchContext, Depends(require(Permission.GROUPS_DELETE))]


@asynccontextmanager
async def _writing(session: AsyncSession) -> AsyncIterator[None]:
    """One transaction per request; refusals become HTTP errors and roll it back."""
    try:
        yield
        await session.commit()
    except FieldError as error:
        await session.rollback()
        detail = [{"loc": ["body", *error.loc], "type": error.code, "msg": error.msg}]
        raise HTTPException(error.status, detail=detail) from error
    except GroupError as error:
        await session.rollback()
        raise HTTPException(error.status, detail=error.code) from error


async def _one(
    session: AsyncSession, ctx: RanchContext, group_id: uuid.UUID, today: Today
) -> GroupOut:
    group = await groups.get_group(session, ctx.ranch_id, group_id)
    return (await groups.describe(session, ctx.ranch_id, [group], today))[0]


@router.get("/groups", operation_id="listGroups")
async def list_groups(ctx: Viewer, session: Session, today: Today) -> list[GroupOut]:
    """General is created here the first time a ranch's groups are read."""
    async with _writing(session):
        await groups.ensure_general(session, ctx.ranch_id)
    rows = await groups.list_groups(session, ctx.ranch_id)
    return await groups.describe(session, ctx.ranch_id, rows, today)


@router.get("/groups/heifers", operation_id="listHeiferGroups")
async def list_heifer_groups(ctx: Viewer, session: Session, today: Today) -> list[HeiferGroupOut]:
    return await groups.heifer_groups(session, ctx.ranch_id, today)


@router.post("/groups/preview", operation_id="previewAutoGroup")
async def preview_auto_group(
    body: AutoFilter, ctx: Viewer, session: Session, today: Today
) -> list[uuid.UUID]:
    return await groups.preview(session, ctx.ranch_id, body, today)


@router.post("/groups", operation_id="createGroup", status_code=status.HTTP_201_CREATED)
async def create_group(body: GroupCreate, ctx: Creator, session: Session, today: Today) -> GroupOut:
    async with _writing(session):
        group = await groups.create_group(session, ctx.ranch_id, ctx.user.id, body, today)
        group_id = group.id
    return await _one(session, ctx, group_id, today)


@router.get("/groups/{group_id}", operation_id="getGroup")
async def get_group(group_id: uuid.UUID, ctx: Viewer, session: Session, today: Today) -> GroupOut:
    try:
        return await _one(session, ctx, group_id, today)
    except GroupError as error:
        raise HTTPException(error.status, detail=error.code) from error


@router.patch("/groups/{group_id}", operation_id="updateGroup")
async def update_group(
    group_id: uuid.UUID, body: GroupUpdate, ctx: Editor, session: Session, today: Today
) -> GroupOut:
    async with _writing(session):
        await groups.update_group(session, ctx.ranch_id, ctx.user.id, group_id, body, today)
    return await _one(session, ctx, group_id, today)


@router.delete("/groups/{group_id}", operation_id="deleteGroup")
async def delete_group(
    group_id: uuid.UUID,
    ctx: Deleter,
    session: Session,
    today: Today,
    to_group_id: uuid.UUID | None = None,
) -> GroupDeleted:
    async with _writing(session):
        target, moved = await groups.delete_group(
            session, ctx.ranch_id, ctx.user.id, group_id, to_group_id, today
        )
        result = GroupDeleted(to_group_id=target.id, to_group=target.name, moved=moved)
    return result


@router.post("/groups/{group_id}/animals", operation_id="moveAnimalsToGroup")
async def move_animals(
    group_id: uuid.UUID, body: MoveAnimals, ctx: Editor, session: Session, today: Today
) -> MoveResult:
    async with _writing(session):
        group = await groups.get_group(session, ctx.ranch_id, group_id)
        result = await groups.move_animals(
            session, ctx.ranch_id, ctx.user.id, group, body.animal_ids, today
        )
    return MoveResult(moved=result.moved, unchanged=result.unchanged)


@router.post("/groups/{group_id}/reevaluate", operation_id="reevaluateGroup")
async def reevaluate_group(
    group_id: uuid.UUID, ctx: Editor, session: Session, today: Today
) -> Reevaluated:
    async with _writing(session):
        group = await groups.get_group(session, ctx.ranch_id, group_id)
        result = await groups.reevaluate(session, ctx.ranch_id, ctx.user.id, group, today)
    return Reevaluated(came_in=result.came_in, went_out=result.went_out)
