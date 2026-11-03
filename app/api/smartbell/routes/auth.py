import uuid
from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import Role
from smartbell.models import User
from smartbell.security import TokenClaims, get_current_user, get_token_claims
from smartbell.services import accounts

router = APIRouter(prefix="/auth", tags=["auth"])

_CONFLICT_STATUS = {
    "email_required": status.HTTP_403_FORBIDDEN,
    "email_in_use": status.HTTP_409_CONFLICT,
}


class SessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^\+[1-9]\d{7,14}$")  # E.164


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str | None
    email: str
    phone: str | None
    photo_url: str | None


class RanchOut(BaseModel):
    id: uuid.UUID
    name: str
    role: Role


class AccountOut(BaseModel):
    user: UserOut
    ranches: list[RanchOut]


class SessionOut(AccountOut):
    created: bool  # True only for the call that made the account, which sends it to the first cow.


async def _account(session: AsyncSession, user: User) -> AccountOut:
    ranches = await accounts.list_ranches(session, user)
    return AccountOut(
        user=UserOut.model_validate(user),
        ranches=[RanchOut(id=r.id, name=r.name, role=role) for r, role in ranches],
    )


@router.post("/session", operation_id="openSession")
async def open_session(
    claims: Annotated[TokenClaims, Depends(get_token_claims)],
    session: Annotated[AsyncSession, Depends(get_session)],
    body: Annotated[SessionRequest | None, Body()] = None,
) -> SessionOut:
    """Called after every Firebase sign-in. Identity comes from the token, never from the body."""
    body = body or SessionRequest()
    profile = accounts.Profile(first_name=body.first_name, phone=body.phone)
    try:
        user, created = await accounts.open_session(session, claims, profile)
    except accounts.AccountConflict as conflict:
        raise HTTPException(_CONFLICT_STATUS[conflict.code], detail=conflict.code) from conflict
    account = await _account(session, user)
    return SessionOut(**account.model_dump(), created=created)


@router.get("/me", operation_id="getMe")
async def me(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AccountOut:
    return await _account(session, user)
