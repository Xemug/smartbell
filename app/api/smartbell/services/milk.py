"""Milk records (docs/domain-model.md §7.3): the herd's daily total, each cow's litres by
destination, and the aggregates the milk screens, the dashboard tile and the profile read.

Writes are upserts. The herd log is unique per (ranch, day) and a cow log per (cow, day,
destination), so re-entering a value overwrites it, and two requests at once can't duplicate it.
"""

import datetime as dt
import uuid
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.dialects import postgresql, sqlite
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import (
    AnimalStatus,
    LactationState,
    MilkDestination,
    MilkGranularity,
    MilkWarning,
    Sex,
)
from smartbell.models import Animal, MilkCowLog, MilkHerdLog
from smartbell.services.animals import AnimalNotFound, AnimalRemoved, FieldError, get_animal

CENTS = Decimal("0.01")

# The longest history one request may ask for: ten years of buckets, or one year of days.
MAX_RANGE_DAYS = 3660
MAX_DAY_BUCKETS = 366


class HerdLogNotFound(Exception):
    pass


def _invalid(loc: Sequence[str | int], code: str, msg: str) -> FieldError:
    """A 422 whose `loc` is complete, starting with "body" or "query"."""
    return FieldError(422, [str(part) for part in loc], code, msg)


def _log_date(day: dt.date | None, today: dt.date) -> dt.date:
    """A log is for a day that has started: today by default, back-dating allowed (S2 edits)."""
    day = day or today
    if day > today:
        raise _invalid(("body", "date"), "date_in_future", "La fecha no puede ser futura")
    return day


def _insert(session: AsyncSession, model: type[Any]) -> Any:
    """The dialect's INSERT, which has `on_conflict_do_update` on both PostgreSQL and SQLite."""
    dialect = session.get_bind().dialect.name
    return (postgresql.insert if dialect == "postgresql" else sqlite.insert)(model)


def _round(value: Decimal) -> Decimal:
    return value.quantize(CENTS)


# --- Herd log ----------------------------------------------------------------------------------


async def put_herd_log(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID,
    day: dt.date | None,
    total_liters: Decimal,
    today: dt.date,
) -> MilkHerdLog:
    """Logs the herd's total for a day, overwriting that day's log if there is one."""
    day = _log_date(day, today)
    statement = _insert(session, MilkHerdLog).values(
        id=uuid.uuid4(), ranch_id=ranch_id, date=day, total_liters=total_liters, entered_by=user_id
    )
    statement = statement.on_conflict_do_update(
        index_elements=["ranch_id", "date"],
        set_={"total_liters": total_liters, "entered_by": user_id},
    )
    await session.execute(statement)
    return (
        await session.scalars(
            select(MilkHerdLog)
            .where(MilkHerdLog.ranch_id == ranch_id, MilkHerdLog.date == day)
            .execution_options(populate_existing=True)
        )
    ).one()


async def list_herd_logs(
    session: AsyncSession, ranch_id: uuid.UUID, start: dt.date, end: dt.date
) -> Sequence[MilkHerdLog]:
    """The ranch's herd logs between two days (inclusive), newest first."""
    return (
        await session.scalars(
            select(MilkHerdLog)
            .where(MilkHerdLog.ranch_id == ranch_id, MilkHerdLog.date.between(start, end))
            .order_by(MilkHerdLog.date.desc())
        )
    ).all()


async def delete_herd_log(session: AsyncSession, ranch_id: uuid.UUID, day: dt.date) -> None:
    result = await session.execute(
        delete(MilkHerdLog).where(MilkHerdLog.ranch_id == ranch_id, MilkHerdLog.date == day)
    )
    if not result.rowcount:  # type: ignore[attr-defined]
        raise HerdLogNotFound


# --- Cow logs ----------------------------------------------------------------------------------


def in_withdrawal(animal: Animal, day: dt.date) -> bool:
    """Whether the cow's milk is withheld on `day`.

    The projection keeps only the end of the current withdrawal (`milk_withdrawal_until`), so a
    back-dated log before the treatment that started it also counts as in withdrawal.
    """
    until = animal.milk_withdrawal_until
    return until is not None and day <= until


def withdrawal_warning(
    animal: Animal, day: dt.date, destination: MilkDestination
) -> MilkWarning | None:
    withheld = in_withdrawal(animal, day)
    if withheld and destination is MilkDestination.TANQUE:
        return MilkWarning.WITHDRAWAL_TO_TANK
    if not withheld and destination is MilkDestination.ANTIBIOTICOS:
        return MilkWarning.ANTIBIOTICS_OUTSIDE_WITHDRAWAL
    return None


@dataclass(frozen=True)
class CowEntry:
    animal_id: uuid.UUID
    destination: MilkDestination
    liters: Decimal


@dataclass(frozen=True)
class CowLogsResult:
    logs: list[MilkCowLog]
    warnings: list[tuple[uuid.UUID, MilkWarning]]


async def put_cow_logs(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    day: dt.date | None,
    entries: Sequence[CowEntry],
    today: dt.date,
) -> CowLogsResult:
    """Logs litres per cow and destination for one day, overwriting what was there.

    Every cow must be an active female of the ranch; one bad entry refuses the whole body. Logs
    that break the withdrawal rule are saved and come back as warnings.
    """
    day = _log_date(day, today)
    seen: set[tuple[uuid.UUID, MilkDestination]] = set()
    for index, entry in enumerate(entries):
        key = (entry.animal_id, entry.destination)
        if key in seen:
            raise _invalid(
                ("body", "entries", index),
                "duplicate_entry",
                "La vaca ya tiene litros para ese destino",
            )
        seen.add(key)

    ids = list(dict.fromkeys(entry.animal_id for entry in entries))
    found = await session.scalars(
        select(Animal).where(Animal.ranch_id == ranch_id, Animal.id.in_(ids))
    )
    animals = {animal.id: animal for animal in found}
    for index, entry in enumerate(entries):
        animal = animals.get(entry.animal_id)
        if animal is None:
            raise AnimalNotFound  # also another ranch's cow, so ids can't be probed
        if animal.status is AnimalStatus.REMOVED:
            raise AnimalRemoved
        if animal.sex is not Sex.HEMBRA:
            raise _invalid(
                ("body", "entries", index, "animal_id"), "not_a_cow", "Solo las hembras dan leche"
            )

    statement = _insert(session, MilkCowLog).values(
        [
            {
                "id": uuid.uuid4(),
                "ranch_id": ranch_id,
                "animal_id": entry.animal_id,
                "date": day,
                "liters": entry.liters,
                "destination": entry.destination,
            }
            for entry in entries
        ]
    )
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=["animal_id", "date", "destination"],
            set_={"liters": statement.excluded.liters},
        )
    )
    warnings = [
        (entry.animal_id, warning)
        for entry in entries
        if (warning := withdrawal_warning(animals[entry.animal_id], day, entry.destination))
        is not None
    ]

    logs = await list_cow_logs(session, ranch_id, day, ids)
    return CowLogsResult(logs=list(logs), warnings=warnings)


async def list_cow_logs(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    day: dt.date,
    animal_ids: Sequence[uuid.UUID] | None = None,
) -> Sequence[MilkCowLog]:
    """A day's cow logs, so the per-cow screen can drop the cows already logged."""
    query = select(MilkCowLog).where(MilkCowLog.ranch_id == ranch_id, MilkCowLog.date == day)
    if animal_ids is not None:
        query = query.where(MilkCowLog.animal_id.in_(animal_ids))
    query = query.order_by(MilkCowLog.animal_id, MilkCowLog.destination)
    return (await session.scalars(query.execution_options(populate_existing=True))).all()


@dataclass(frozen=True)
class CowStats:
    days_logged: int
    total_liters: Decimal
    avg_daily_liters: Decimal | None
    peak_date: dt.date | None
    peak_liters: Decimal | None
    peak_dim: int | None


async def cow_stats(session: AsyncSession, ranch_id: uuid.UUID, animal_id: uuid.UUID) -> CowStats:
    """The cow's average litres per logged day and her peak day (all destinations summed)."""
    animal = await get_animal(session, ranch_id, animal_id)
    daily = func.sum(MilkCowLog.liters)
    rows = (
        await session.execute(
            select(MilkCowLog.date, daily)
            .where(MilkCowLog.ranch_id == ranch_id, MilkCowLog.animal_id == animal_id)
            .group_by(MilkCowLog.date)
        )
    ).all()
    if not rows:
        return CowStats(0, Decimal(0), None, None, None, None)
    totals = [(day, Decimal(liters)) for day, liters in rows]
    total = sum((liters for _, liters in totals), Decimal(0))
    # Highest litres; the earliest day wins a tie.
    peak_date, peak_liters = max(totals, key=lambda row: (row[1], -row[0].toordinal()))
    calving = animal.last_calving_date
    dim = (peak_date - calving).days if calving is not None and peak_date >= calving else None
    return CowStats(
        days_logged=len(totals),
        total_liters=_round(total),
        avg_daily_liters=_round(total / len(totals)),
        peak_date=peak_date,
        peak_liters=_round(peak_liters),
        peak_dim=dim,
    )


# --- Aggregates --------------------------------------------------------------------------------


def bucket_start(day: dt.date, granularity: MilkGranularity) -> dt.date:
    match granularity:
        case MilkGranularity.DAY:
            return day
        case MilkGranularity.WEEK:
            return day - dt.timedelta(days=day.weekday())  # Monday
        case MilkGranularity.MONTH:
            return day.replace(day=1)
        case MilkGranularity.QUARTER:
            return dt.date(day.year, (day.month - 1) // 3 * 3 + 1, 1)
        case MilkGranularity.SEMESTER:
            return dt.date(day.year, 1 if day.month <= 6 else 7, 1)
        case MilkGranularity.YEAR:
            return dt.date(day.year, 1, 1)


def next_bucket(start: dt.date, granularity: MilkGranularity) -> dt.date:
    def add_months(months: int) -> dt.date:
        index = start.year * 12 + start.month - 1 + months
        return dt.date(index // 12, index % 12 + 1, 1)

    match granularity:
        case MilkGranularity.DAY:
            return start + dt.timedelta(days=1)
        case MilkGranularity.WEEK:
            return start + dt.timedelta(days=7)
        case MilkGranularity.MONTH:
            return add_months(1)
        case MilkGranularity.QUARTER:
            return add_months(3)
        case MilkGranularity.SEMESTER:
            return add_months(6)
        case MilkGranularity.YEAR:
            return add_months(12)


def check_range(start: dt.date, end: dt.date, granularity: MilkGranularity) -> None:
    if start > end:
        raise _invalid(("query", "start"), "start_after_end", "El inicio es posterior al fin")
    span = (end - start).days + 1
    limit = MAX_DAY_BUCKETS if granularity is MilkGranularity.DAY else MAX_RANGE_DAYS
    if span > limit:
        raise _invalid(("query", "start"), "range_too_long", f"El rango supera {limit} días")


async def lactating_cows(session: AsyncSession, ranch_id: uuid.UUID) -> int:
    count = await session.scalar(
        select(func.count())
        .select_from(Animal)
        .where(
            Animal.ranch_id == ranch_id,
            Animal.status == AnimalStatus.ACTIVE,
            Animal.sex == Sex.HEMBRA,
            Animal.lactation_state == LactationState.LACTANDO,
        )
    )
    return count or 0


def per_cow(liters: Decimal, cows: int) -> Decimal | None:
    return _round(liters / cows) if cows else None


@dataclass(frozen=True)
class BucketTotals:
    start: dt.date
    end: dt.date
    total_liters: Decimal
    days_logged: int
    avg_daily_liters: Decimal | None
    avg_liters_per_cow: Decimal | None
    by_destination: dict[MilkDestination, Decimal]


@dataclass(frozen=True)
class Summary:
    lactating_cows: int
    latest: MilkHerdLog | None
    latest_per_cow: Decimal | None
    buckets: list[BucketTotals]


async def summary(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    granularity: MilkGranularity,
    start: dt.date,
    end: dt.date,
) -> Summary:
    """Production history in buckets covering `start`..`end`, plus the latest day's KPI.

    Buckets are whole calendar periods (a Monday-start week, a month…), so the first and last may
    reach outside the range; every bucket in between is present, empty ones with zeros. Litres
    per cow divide by the cows lactating today: the projection keeps no history of that count.
    """
    check_range(start, end, granularity)
    cows = await lactating_cows(session, ranch_id)
    first = bucket_start(start, granularity)
    last_end = next_bucket(bucket_start(end, granularity), granularity) - dt.timedelta(days=1)

    herd = (
        await session.execute(
            select(MilkHerdLog.date, MilkHerdLog.total_liters).where(
                MilkHerdLog.ranch_id == ranch_id, MilkHerdLog.date.between(first, last_end)
            )
        )
    ).all()
    cow_rows = (
        await session.execute(
            select(MilkCowLog.date, MilkCowLog.destination, func.sum(MilkCowLog.liters))
            .where(MilkCowLog.ranch_id == ranch_id, MilkCowLog.date.between(first, last_end))
            .group_by(MilkCowLog.date, MilkCowLog.destination)
        )
    ).all()

    herd_by_bucket: dict[dt.date, list[Decimal]] = defaultdict(list)
    for day, liters in herd:
        herd_by_bucket[bucket_start(day, granularity)].append(Decimal(liters))
    destinations: dict[dt.date, dict[MilkDestination, Decimal]] = defaultdict(
        lambda: {destination: Decimal(0) for destination in MilkDestination}
    )
    for day, destination, liters in cow_rows:
        destinations[bucket_start(day, granularity)][MilkDestination(destination)] += Decimal(
            liters
        )

    buckets: list[BucketTotals] = []
    cursor = first
    while cursor <= end:
        following = next_bucket(cursor, granularity)
        days = herd_by_bucket.get(cursor, [])
        total = sum(days, Decimal(0))
        average = total / len(days) if days else None
        buckets.append(
            BucketTotals(
                start=cursor,
                end=following - dt.timedelta(days=1),
                total_liters=_round(total),
                days_logged=len(days),
                avg_daily_liters=_round(average) if average is not None else None,
                avg_liters_per_cow=per_cow(average, cows) if average is not None else None,
                by_destination={
                    destination: _round(liters)
                    for destination, liters in destinations[cursor].items()
                },
            )
        )
        cursor = following

    latest = await session.scalar(
        select(MilkHerdLog)
        .where(MilkHerdLog.ranch_id == ranch_id, MilkHerdLog.date <= end)
        .order_by(MilkHerdLog.date.desc())
        .limit(1)
    )
    return Summary(
        lactating_cows=cows,
        latest=latest,
        latest_per_cow=per_cow(latest.total_liters, cows) if latest is not None else None,
        buckets=buckets,
    )
