"""Mi cuenta: the caller's own profile and photo. Email and password live in Firebase."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.models import User
from smartbell.routes.auth import UserOut
from smartbell.security import get_current_user
from smartbell.services import media

router = APIRouter(tags=["users"])


class ProfileUpdate(BaseModel):
    """Only the fields sent change. Email is the sign-in identity, so it isn't editable here."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^\+[1-9]\d{7,14}$")  # E.164

    @model_validator(mode="after")
    def _required_stay_set(self) -> "ProfileUpdate":
        # Web 1.4: name and phone are required, so they can change but not be cleared.
        for name in ("first_name", "phone"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} can't be cleared")
        return self


def storage(request: Request) -> media.Storage:
    return media.LocalStorage(request.app.state.settings.media_dir)


@router.patch("/users/me", operation_id="updateMe")
async def update_me(
    body: ProfileUpdate,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserOut:
    changes = body.model_dump(include=body.model_fields_set)
    if not changes:
        raise HTTPException(422, detail="nothing_to_change")
    if "last_name" in changes and not changes["last_name"]:
        changes["last_name"] = None
    for name, value in changes.items():
        setattr(user, name, value)
    await session.commit()
    return UserOut.model_validate(user)


async def _read_capped(request: Request) -> bytes:
    """The body, refused as soon as it passes the cap rather than after reading it all."""
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > media.MAX_PHOTO_BYTES:
        raise media.PhotoRefused("photo_too_large", 413)
    chunks: list[bytes] = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > media.MAX_PHOTO_BYTES:
            raise media.PhotoRefused("photo_too_large", 413)
        chunks.append(chunk)
    return b"".join(chunks)


@router.put(
    "/users/me/photo",
    operation_id="uploadMyPhoto",
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                kind: {"schema": {"type": "string", "format": "binary"}}
                for kind in media.CONTENT_TYPES.values()
            },
        }
    },
)
async def upload_photo(
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    files: Annotated[media.Storage, Depends(storage)],
) -> UserOut:
    """The raw JPG or PNG as the body, at most 2MB."""
    try:
        data = await _read_capped(request)
        if not data:
            raise media.PhotoRefused("photo_type", 415)
        kind = media.photo_kind(data, request.headers.get("content-type"))
    except media.PhotoRefused as error:
        raise HTTPException(error.status, detail=error.code) from error
    name = media.new_name(kind)
    await run_in_threadpool(files.save, media.AVATAR_PREFIX, name, data)
    previous = media.own_avatar_name(user.photo_url)
    user.photo_url = media.avatar_url(name)
    try:
        await session.commit()
    except Exception:
        await run_in_threadpool(files.delete, media.AVATAR_PREFIX, name)  # No row points at it.
        raise
    if previous:
        await run_in_threadpool(files.delete, media.AVATAR_PREFIX, previous)
    return UserOut.model_validate(user)


@router.get("/media/avatars/{name}", operation_id="getAvatar", include_in_schema=False)
async def get_avatar(name: str, files: Annotated[media.Storage, Depends(storage)]) -> FileResponse:
    path = await run_in_threadpool(files.path, media.AVATAR_PREFIX, name)
    if path is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="not_found")
    kind = name.rsplit(".", 1)[1]
    return FileResponse(
        path,
        media_type=media.CONTENT_TYPES[kind],
        # The name changes with every upload, so a copy never goes stale.
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            # Served as the image it was checked to be, never sniffed or run as a page.
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; sandbox",
        },
    )
