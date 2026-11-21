"""`GET /api/geocode/*`: address lookup for Datos Rancho, through the API so the key stays here.

Signed-in users only, and each user is held to a small rate, so the paid lookup can't be run up
by a script.
"""

import time
import uuid
from collections import defaultdict, deque
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel

from smartbell.models import User
from smartbell.security import get_current_user
from smartbell.services import geocoding

router = APIRouter(prefix="/geocode", tags=["geocode"])

# A ranch address takes a handful of lookups (the fallbacks in the web app's `searchesFor`).
PER_MINUTE = 30


class Limiter:
    """Per-user sliding window, kept in this process. Enough to stop a runaway loop."""

    def __init__(self, per_minute: int) -> None:
        self.per_minute = per_minute
        self._calls: defaultdict[uuid.UUID, deque[float]] = defaultdict(deque)

    def allow(self, user_id: uuid.UUID) -> bool:
        now = time.monotonic()
        calls = self._calls[user_id]
        while calls and now - calls[0] >= 60:
            calls.popleft()
        if len(calls) >= self.per_minute:
            return False
        calls.append(now)
        return True


_limiter = Limiter(PER_MINUTE)


def get_geocoder(request: Request) -> geocoding.Geocoder:
    return geocoding.geocoder_for(request.app.state.settings.google_maps_api_key)


def get_limiter() -> Limiter:
    return _limiter


class PointOut(BaseModel):
    latitude: float
    longitude: float


class Found(BaseModel):
    """`pin` is null when nothing matches."""

    pin: PointOut | None


class AddressOut(BaseModel):
    """`address` is null where there is no street nearby: the coordinates are the address."""

    address: str | None


async def _limited(
    user: Annotated[User, Depends(get_current_user)],
    limiter: Annotated[Limiter, Depends(get_limiter)],
) -> None:
    if not limiter.allow(user.id):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, detail="too_many_lookups")


@router.get("/search", operation_id="geocodeSearch", dependencies=[Depends(_limited)])
async def search(
    q: Annotated[str, Query(min_length=1, max_length=300)],
    geocoder: Annotated[geocoding.Geocoder, Depends(get_geocoder)],
) -> Found:
    try:
        point = await geocoder.search(q.strip())
    except geocoding.GeocoderUnavailable as err:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="geocoder_unavailable") from err
    return Found(
        pin=PointOut(latitude=point.latitude, longitude=point.longitude) if point else None
    )


@router.get("/reverse", operation_id="geocodeReverse", dependencies=[Depends(_limited)])
async def reverse(
    latitude: Annotated[float, Query(ge=-90, le=90)],
    longitude: Annotated[float, Query(ge=-180, le=180)],
    geocoder: Annotated[geocoding.Geocoder, Depends(get_geocoder)],
) -> AddressOut:
    try:
        address = await geocoder.reverse(geocoding.Point(latitude, longitude))
    except geocoding.GeocoderUnavailable as err:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="geocoder_unavailable") from err
    return AddressOut(address=address)
