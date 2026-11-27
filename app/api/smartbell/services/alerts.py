"""The alert lifecycle and the alert reads (docs/domain-model.md §4; alerts-dashboard-reports.md
§3.1-3.2).

Alerts are internal (reconciliation-v4 §4.3): people see them as automatic tasks and off-app
notifications. `alert_sync` opens and closes them as events come in; this module does what only
the passing of days can do, for the daily job:

- `follow_up_day` counts the days since the window opened, 0 to 5 ("Hoy, Hace 1 día … Hace 5+
  días");
- a pending alert expires ("Sistema ya no envía alertas") once its window has ended and it has
  reached follow-up day 5, or once its window has ended and a later alert of the same kind for
  the same animal has opened (a passed dry-off reminder gives way to the next one);
- VACCINE_DUE alerts follow the ranch's approved vaccination plan.
"""

import datetime as dt
import uuid
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import EventFact, Projection
from smartbell.domain.vaccines import VaccineRule, due_dates
from smartbell.enums import (
    AlertKind,
    AlertStatus,
    AnimalStatus,
    BullAvailability,
    EventType,
    VaccinationPlanStatus,
)
from smartbell.models import Alert, Animal, Event, PlanVaccine, VaccinationPlan
from smartbell.services.alert_sync import close_tasks

FOLLOW_UP_DAYS = 5
# A dose given up to this many days before a VACCINE_DUE date still answers that alert.
EARLY_DOSE_DAYS = 30


def follow_up_day(alert: Alert, today: dt.date) -> int:
    return max(0, min((today - alert.window_start).days, FOLLOW_UP_DAYS))


def is_spent(alert: Alert, today: dt.date) -> bool:
    """Its window has ended and it has been followed up for 5+ days."""
    last_day = max(alert.window_end, alert.window_start + dt.timedelta(days=FOLLOW_UP_DAYS))
    return today > last_day


async def advance(session: AsyncSession, ranch_id: uuid.UUID, today: dt.date) -> list[Alert]:
    """Move every pending alert of the ranch one day on. Returns the alerts it expired."""
    pending = (
        await session.scalars(
            select(Alert).where(Alert.ranch_id == ranch_id, Alert.status == AlertStatus.PENDING)
        )
    ).all()
    latest: dict[tuple[uuid.UUID, AlertKind], dt.date] = {}
    for row in pending:
        key = (row.animal_id, row.kind)
        # Only an alert that has opened takes over. VACCINE_DUE alerts of different vaccines
        # share the kind, so one never stands in for another.
        if row.window_start <= today and row.kind is not AlertKind.VACCINE_DUE:
            latest[key] = max(latest.get(key, row.window_start), row.window_start)
    now = dt.datetime.now(dt.UTC)
    expired: list[Alert] = []
    for row in pending:
        day = follow_up_day(row, today)
        if row.follow_up_day != day:
            row.follow_up_day = day
        newest = latest.get((row.animal_id, row.kind), row.window_start)
        superseded = row.window_end < today and newest > row.window_start
        if is_spent(row, today) or superseded:
            row.status = AlertStatus.EXPIRED
            row.resolved_at = now
            expired.append(row)
    await session.flush()
    await close_tasks(session, expired)
    return expired


# --- VACCINE_DUE ---------------------------------------------------------------------------------


async def approved_vaccines(session: AsyncSession, ranch_id: uuid.UUID) -> list[VaccineRule]:
    """The vaccines of the ranch's latest approved plan; none while no plan is approved."""
    plan = await session.scalar(
        select(VaccinationPlan)
        .where(
            VaccinationPlan.ranch_id == ranch_id,
            VaccinationPlan.status == VaccinationPlanStatus.APROBADO,
        )
        .order_by(VaccinationPlan.version.desc())
        .limit(1)
    )
    if plan is None:
        return []
    # A dose names the PlanVaccine of the version it was given under; the same vaccine in another
    # version of the ranch's plan (same name) is the same vaccine.
    every = await session.execute(
        select(PlanVaccine.id, PlanVaccine.name)
        .join(VaccinationPlan, VaccinationPlan.id == PlanVaccine.plan_id)
        .where(VaccinationPlan.ranch_id == ranch_id)
    )
    ids_by_name: dict[str, set[uuid.UUID]] = {}
    for vaccine_id, name in every:
        ids_by_name.setdefault(name.strip().casefold(), set()).add(vaccine_id)
    rows = await session.scalars(select(PlanVaccine).where(PlanVaccine.plan_id == plan.id))
    return [
        VaccineRule(
            id=row.id,
            aliases=frozenset(ids_by_name.get(row.name.strip().casefold(), set())),
            start_by=row.start_by,
            frequency=row.frequency,
            start_value=row.start_value,
            start_event=row.start_event,
            booster_count=row.booster_count,
            booster_every_months=row.booster_every_months,
        )
        for row in rows
    ]


async def sync_vaccines(
    session: AsyncSession,
    animal: Animal,
    projection: Projection,
    rules: Sequence[VaccineRule],
    events: Iterable[EventFact],
    today: dt.date,
) -> None:
    """Open one VACCINE_DUE alert per animal per due date, and close the ones no longer due.

    A dose already overdue (the plan was approved after it fell due) is surfaced today, once:
    a pending or expired alert that opened on or after its due date already covers it, so the job
    doesn't open a new one every morning. A confirmed one doesn't: that dose was for another
    vaccine, or its VACCINATION was since deleted. A pending alert that is no longer due was
    answered by a VACCINATION from `EARLY_DOSE_DAYS` before its date on (CONFIRMED), or made moot
    (EXPIRED: the plan changed, the animal was removed). Alerts carry no vaccine, so a dose of
    any vaccine counts: one alert per animal per date stands for every vaccine due that day.
    """
    facts = list(events)
    # A semen-only bull isn't a live animal of the ranch: nothing to vaccinate.
    active = (
        animal.status is AnimalStatus.ACTIVE
        and not projection.removed
        and animal.bull_availability is not BullAvailability.SEMEN
    )
    dates = (
        due_dates(rules, animal.birth_date, facts, projection.dry_off_date, today)
        if active
        else set()
    )
    rows = (
        await session.scalars(
            select(Alert).where(Alert.animal_id == animal.id, Alert.kind == AlertKind.VACCINE_DUE)
        )
    ).all()
    plan_ids = {str(key) for rule in rules for key in (rule.id, *rule.aliases)}
    doses = sorted(
        (
            fact
            for fact in facts
            if fact.type is EventType.VACCINATION
            and fact.occurred_on <= today
            and str(fact.payload.get("vaccine_id")) in plan_ids
        ),
        key=lambda fact: fact.occurred_on,
    )
    dose_ids = {fact.id for fact in doses}
    for row in rows:
        # Confirmed by the job with a dose that has since been deleted or moved to a vaccine
        # outside the plan: pending again, and closed below if it is no longer due.
        if (
            row.status is AlertStatus.CONFIRMED
            and row.resolved_by is None
            and row.resulting_event_id not in dose_ids
        ):
            row.status = AlertStatus.PENDING
            row.resolved_at = None
            row.resulting_event_id = None
    by_start = {row.window_start: row for row in rows}
    wanted: set[dt.date] = set()
    for due in dates:
        if due >= today:
            wanted.add(due)
            continue
        covering = [
            start
            for start, row in by_start.items()
            if due <= start <= today and row.status is not AlertStatus.CONFIRMED
        ]
        wanted.add(min(covering) if covering else today)
    for start in sorted(wanted):
        if start not in by_start:
            row = Alert(
                ranch_id=animal.ranch_id,
                animal_id=animal.id,
                kind=AlertKind.VACCINE_DUE,
                window_start=start,
                window_end=start,
                status=AlertStatus.PENDING,
            )
            session.add(row)
            by_start[start] = row
    now = dt.datetime.now(dt.UTC)
    closed: list[Alert] = []
    for start, row in by_start.items():
        if start in wanted or row.status is not AlertStatus.PENDING:
            continue
        earliest = start - dt.timedelta(days=EARLY_DOSE_DAYS)
        dose = next((fact for fact in reversed(doses) if fact.occurred_on >= earliest), None)
        row.status = AlertStatus.CONFIRMED if dose is not None else AlertStatus.EXPIRED
        row.resulting_event_id = dose.id if dose is not None else None
        row.resolved_at = now
        closed.append(row)
    await session.flush()
    await close_tasks(session, closed)


# --- Reads and the resolve action ----------------------------------------------------------------


@dataclass(frozen=True)
class AlertCounts:
    total: int
    by_kind: dict[AlertKind, int]


async def list_alerts(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    kind: AlertKind | None = None,
    status: AlertStatus | None = None,
) -> list[Alert]:
    query = select(Alert).where(Alert.ranch_id == ranch_id)
    if kind is not None:
        query = query.where(Alert.kind == kind)
    if status is not None:
        query = query.where(Alert.status == status)
    rows = await session.scalars(query.order_by(Alert.window_start, Alert.kind, Alert.id))
    return list(rows)


async def count_active(session: AsyncSession, ranch_id: uuid.UUID, today: dt.date) -> AlertCounts:
    """The bell badge: pending alerts whose window has opened."""
    kinds = await session.scalars(
        select(Alert.kind).where(
            Alert.ranch_id == ranch_id,
            Alert.status == AlertStatus.PENDING,
            Alert.window_start <= today,
        )
    )
    by_kind = Counter(kinds)
    return AlertCounts(total=sum(by_kind.values()), by_kind=dict(by_kind))


class AlertNotFound(Exception):
    pass


class AlertClosed(Exception):
    pass


class EventMismatch(Exception):
    pass


async def resolve(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    alert_id: uuid.UUID,
    user_id: uuid.UUID,
    status: AlertStatus,
    event_id: uuid.UUID | None = None,
) -> Alert:
    """Close a pending alert by hand: CONFIRMED, optionally naming the event that answered it,
    or NEGATED ("No entró"). Its open task closes with it. The caller commits."""
    if status not in (AlertStatus.CONFIRMED, AlertStatus.NEGATED):
        raise ValueError(status)
    animal_id = await session.scalar(
        select(Alert.animal_id).where(Alert.id == alert_id, Alert.ranch_id == ranch_id)
    )
    if animal_id is None:
        raise AlertNotFound
    # The animal row lock the events API and the daily job take: whichever of them touched
    # this alert has committed by the time its status is read below.
    await session.execute(select(Animal.id).where(Animal.id == animal_id).with_for_update())
    row = await session.scalar(
        select(Alert).where(Alert.id == alert_id).execution_options(populate_existing=True)
    )
    if row is None:
        raise AlertNotFound
    if row.status is not AlertStatus.PENDING:
        raise AlertClosed
    if event_id is not None:
        found = await session.scalar(
            select(Event.id).where(
                Event.id == event_id, Event.ranch_id == ranch_id, Event.animal_id == row.animal_id
            )
        )
        if found is None:
            raise EventMismatch
    row.status = status
    row.resolved_by = user_id
    row.resolved_at = dt.datetime.now(dt.UTC)
    row.resulting_event_id = event_id
    await session.flush()
    await close_tasks(session, [row])
    return row
