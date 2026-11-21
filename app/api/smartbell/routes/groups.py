"""The groups (potreros) of the active ranch (`X-Ranch-Id`).

    GET /groups    every group, presets first, so the animal lists can name an animal's group

Read-only for now; the `groups` card adds create, edit, delete and moving cows.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.schemas.groups import GroupOut
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext, require
from smartbell.services import groups

router = APIRouter(tags=["groups"])


@router.get("/groups", operation_id="listGroups")
async def list_groups(
    ctx: Annotated[RanchContext, Depends(require(Permission.ANIMALS_VIEW))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[GroupOut]:
    return [
        GroupOut.model_validate(group) for group in await groups.list_groups(session, ctx.ranch_id)
    ]
