"""Milk records of the active ranch (`X-Ranch-Id`), docs/domain-model.md §7.3.

    POST   /milk/herd-logs            log the herd's total for a day (re-posting overwrites it)
    GET    /milk/herd-logs            the herd logs in a date range, newest first
    DELETE /milk/herd-logs/{date}     delete one day's herd log
    POST   /milk/cow-logs             log litres per cow and destination; withdrawal warnings
    GET    /milk/cow-logs             one day's cow logs
    GET    /milk/summary              production history in buckets plus the KPI tile
    GET    /milk/cows/{animal_id}     one cow's average and peak day

Writing takes EVENTS_RECORD (logging is field work, like events); reading takes REPORTS_VIEW.
Field refusals use FastAPI's validation shape, like the animal routes.
"""

import datetime as dt
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.db import get_session
from smartbell.enums import MilkGranularity
from smartbell.routes.animals import Today
from smartbell.schemas.milk import (
    Bucket,
    CowLogOut,
    CowLogsIn,
    CowLogsOut,
    CowLogWarning,
    CowMilkStats,
    HerdLogIn,
    HerdLogOut,
    LatestDay,
    MilkSummary,
    PeakDay,
)
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext, require
from smartbell.services import milk
from smartbell.services.animals import AnimalNotFound, AnimalRemoved, FieldError

router = APIRouter(prefix="/milk", tags=["milk"])

Session = Annotated[AsyncSession, Depends(get_session)]
Writer = Annotated[RanchContext, Depends(require(Permission.EVENTS_RECORD))]
Reader = Annotated[RanchContext, Depends(require(Permission.REPORTS_VIEW))]


def _field_error(error: FieldError) -> HTTPException:
    return HTTPException(
        error.status, detail=[{"loc": list(error.loc), "type": error.code, "msg": error.msg}]
    )


def _animal_not_found() -> HTTPException:
    # The same answer for another ranch's animal, so ids can't be probed.
    return HTTPException(status.HTTP_404_NOT_FOUND, detail="animal_not_found")


@asynccontextmanager
async def _writing(session: AsyncSession) -> AsyncIterator[None]:
    """One transaction per request; refusals become HTTP errors and roll it back."""
    try:
        yield
        await session.commit()
    except FieldError as error:
        await session.rollback()
        raise _field_error(error) from error
    except AnimalNotFound as error:
        await session.rollback()
        raise _animal_not_found() from error
    except AnimalRemoved as error:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, detail="animal_removed") from error
    except milk.HerdLogNotFound as error:
        await session.rollback()
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="herd_log_not_found") from error


# --- Herd log ----------------------------------------------------------------------------------


@router.post("/herd-logs", response_model=HerdLogOut)
async def put_herd_log(body: HerdLogIn, ctx: Writer, session: Session, today: Today) -> HerdLogOut:
    async with _writing(session):
        log = await milk.put_herd_log(
            session, ctx.ranch_id, ctx.user.id, body.date, body.total_liters, today
        )
        out = HerdLogOut.model_validate(log)
    return out


@router.get("/herd-logs", response_model=list[HerdLogOut])
async def list_herd_logs(
    ctx: Reader,
    session: Session,
    today: Today,
    start: dt.date | None = None,
    end: dt.date | None = None,
) -> list[HerdLogOut]:
    """Defaults to the last 7 days, the shipped app's "Últimos 7 días"."""
    end = end or today
    start = start or end - dt.timedelta(days=6)
    try:
        milk.check_range(start, end, MilkGranularity.WEEK)
    except FieldError as error:
        raise _field_error(error) from error
    logs = await milk.list_herd_logs(session, ctx.ranch_id, start, end)
    return [HerdLogOut.model_validate(log) for log in logs]


@router.delete("/herd-logs/{day}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_herd_log(day: dt.date, ctx: Writer, session: Session) -> Response:
    async with _writing(session):
        await milk.delete_herd_log(session, ctx.ranch_id, day)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Cow logs ----------------------------------------------------------------------------------


@router.post("/cow-logs", response_model=CowLogsOut)
async def put_cow_logs(body: CowLogsIn, ctx: Writer, session: Session, today: Today) -> CowLogsOut:
    entries = [
        milk.CowEntry(entry.animal_id, entry.destination, entry.liters) for entry in body.entries
    ]
    async with _writing(session):
        result = await milk.put_cow_logs(session, ctx.ranch_id, body.date, entries, today)
        out = CowLogsOut(
            logs=[CowLogOut.model_validate(log) for log in result.logs],
            warnings=[
                CowLogWarning(animal_id=animal_id, code=code) for animal_id, code in result.warnings
            ],
        )
    return out


@router.get("/cow-logs", response_model=list[CowLogOut])
async def list_cow_logs(
    ctx: Reader,
    session: Session,
    today: Today,
    day: Annotated[dt.date | None, Query(alias="date")] = None,
) -> list[CowLogOut]:
    logs = await milk.list_cow_logs(session, ctx.ranch_id, day or today)
    return [CowLogOut.model_validate(log) for log in logs]


@router.get("/cows/{animal_id}", response_model=CowMilkStats)
async def cow_stats(animal_id: uuid.UUID, ctx: Reader, session: Session) -> CowMilkStats:
    try:
        stats = await milk.cow_stats(session, ctx.ranch_id, animal_id)
    except AnimalNotFound as error:
        raise _animal_not_found() from error
    peak = (
        PeakDay(date=stats.peak_date, liters=stats.peak_liters, dim=stats.peak_dim)
        if stats.peak_date is not None and stats.peak_liters is not None
        else None
    )
    return CowMilkStats(
        animal_id=animal_id,
        days_logged=stats.days_logged,
        total_liters=stats.total_liters,
        avg_daily_liters=stats.avg_daily_liters,
        peak=peak,
    )


# --- Aggregates --------------------------------------------------------------------------------


@router.get("/summary", response_model=MilkSummary)
async def summary(
    ctx: Reader,
    session: Session,
    today: Today,
    granularity: MilkGranularity = MilkGranularity.DAY,
    start: dt.date | None = None,
    end: dt.date | None = None,
) -> MilkSummary:
    """Production history ending `end` (today by default), from `start` (a week before)."""
    end = end or today
    start = start or end - dt.timedelta(days=6)
    try:
        result = await milk.summary(session, ctx.ranch_id, granularity, start, end)
    except FieldError as error:
        raise _field_error(error) from error
    latest = (
        LatestDay(
            date=result.latest.date,
            total_liters=result.latest.total_liters,
            liters_per_cow=result.latest_per_cow,
        )
        if result.latest is not None
        else None
    )
    return MilkSummary(
        granularity=granularity,
        start=start,
        end=end,
        lactating_cows=result.lactating_cows,
        latest=latest,
        buckets=[
            Bucket(
                start=bucket.start,
                end=bucket.end,
                total_liters=bucket.total_liters,
                days_logged=bucket.days_logged,
                avg_daily_liters=bucket.avg_daily_liters,
                avg_liters_per_cow=bucket.avg_liters_per_cow,
                by_destination=bucket.by_destination,
            )
            for bucket in result.buckets
        ],
    )
