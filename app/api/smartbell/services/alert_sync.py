"""Keeps an animal's Alerts in step with its projection after an event write (§4).

A narrow hook: `events-api` calls `sync_animal` after every create, edit or delete. The alert
lifecycle (follow-up days, expiring a window that passed, the Tasks that surface alerts) belongs
to `alert-engine`; this module only opens what the projection asks for and closes what an event
made moot. It is idempotent: the same projection twice changes nothing, because an alert is keyed
by (animal, kind, window_start, window_end).
"""

import datetime as dt
import uuid
from collections.abc import Collection, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import AlertSpec, Projection, ReminderSpec
from smartbell.enums import AlertKind, AlertStatus, EventType, TaskStatus
from smartbell.models import Alert, Animal, Task

# The alerts an event of each type answers. A pending alert of one of these kinds that the new
# projection no longer asks for was resolved by the event, even if its window already passed.
RESOLVES: dict[EventType, frozenset[AlertKind]] = {
    EventType.HEAT: frozenset({AlertKind.HEAT}),
    EventType.PREGNANCY_CHECK: frozenset(
        {AlertKind.PREGNANCY_CHECK, AlertKind.PREG_RECHECK, AlertKind.HEAT}
    ),
    EventType.CALVING: frozenset(
        {
            AlertKind.CALVING,
            AlertKind.DRY_OFF,
            AlertKind.CLOSE_UP,
            AlertKind.PREGNANCY_CHECK,
            AlertKind.PREG_RECHECK,
        }
    ),
    EventType.ABORTION: frozenset(
        {
            AlertKind.CALVING,
            AlertKind.DRY_OFF,
            AlertKind.CLOSE_UP,
            AlertKind.PREGNANCY_CHECK,
            AlertKind.PREG_RECHECK,
        }
    ),
    EventType.TREATMENT_FOLLOWUP: frozenset({AlertKind.HEALTH}),
    EventType.DIET_CHANGE: frozenset({AlertKind.DIET_CHANGE}),
}
# Kinds the repro engine schedules. VACCINE_DUE and TREATMENT_DUE come from elsewhere, so a
# projection that doesn't list them says nothing about them.
PROJECTED_KINDS = frozenset(AlertKind) - {AlertKind.VACCINE_DUE, AlertKind.TREATMENT_DUE}

Key = tuple[AlertKind, dt.date, dt.date]


def _key(spec: AlertSpec) -> Key:
    return spec.kind, spec.window.start, spec.window.end


async def sync_animal(
    session: AsyncSession,
    animal: Animal,
    projection: Projection,
    today: dt.date,
    event_id: uuid.UUID | None = None,
    event_type: EventType | None = None,
    *,
    negative: bool = False,
    reopen: Collection[uuid.UUID] = (),
) -> list[Alert]:
    """Upsert the projection's alerts and close the ones it dropped. Returns the open alerts.

    `event_id` and `event_type` name the event just written, so an alert it answers is closed as
    CONFIRMED (NEGATED when `negative`: a heat not observed), and one it supersedes as EXPIRED;
    either way it is linked to the event. Without them (a
    deletion) a dropped alert is closed as EXPIRED. A removed animal has every alert closed.
    `reopen` lists closed alerts whose resolving event was just edited or deleted (`linked_to`):
    if the projection asks for one again, it is pending again. No other closed alert reopens,
    so one the alert engine expired stays expired. The caller commits.
    """
    rows = (await session.scalars(select(Alert).where(Alert.animal_id == animal.id))).all()
    by_key = {(row.kind, row.window_start, row.window_end): row for row in rows}
    wanted = {_key(spec) for spec in projection.alerts}

    for kind, start, end in sorted(wanted):
        row = by_key.get((kind, start, end))
        if row is None:
            row = Alert(
                ranch_id=animal.ranch_id,
                animal_id=animal.id,
                kind=kind,
                window_start=start,
                window_end=end,
                status=AlertStatus.PENDING,
            )
            session.add(row)
            by_key[(kind, start, end)] = row
        elif row.id in reopen and row.status is not AlertStatus.PENDING:
            row.status = AlertStatus.PENDING
            row.resolved_at = None
            row.resolved_by = None
            row.resulting_event_id = None

    resolves = RESOLVES.get(event_type, frozenset()) if event_type else frozenset()
    now = dt.datetime.now(dt.UTC)
    closed: list[Alert] = []
    for key, row in by_key.items():
        if key in wanted or row.status is not AlertStatus.PENDING:
            continue
        if row.kind not in PROJECTED_KINDS and not projection.removed:
            continue
        answered = row.kind in resolves
        if not answered and row.window_end < today and not projection.removed:
            continue  # Its window passed on its own: expiring it is the alert engine's job.
        if answered:
            row.status = AlertStatus.NEGATED if negative else AlertStatus.CONFIRMED
        else:
            row.status = AlertStatus.EXPIRED
        row.resolved_at = now
        # Linked even when only superseded (an extended HEALTH window, say), so editing or
        # deleting that event can bring this alert back through `linked_to`.
        row.resulting_event_id = event_id
        closed.append(row)
    await session.flush()
    await _close_tasks(session, closed)
    sync_reminders(animal, projection.reminders)
    return sorted(
        (row for row in by_key.values() if row.status is AlertStatus.PENDING),
        key=lambda row: (row.window_start, row.kind),
    )


async def linked_to(session: AsyncSession, event_id: uuid.UUID) -> set[uuid.UUID]:
    """The alerts `event_id` resolved: pass them as `reopen` when that event is edited or
    deleted."""
    rows = await session.scalars(select(Alert.id).where(Alert.resulting_event_id == event_id))
    return set(rows)


async def detach_event(session: AsyncSession, event_id: uuid.UUID) -> None:
    """Before an event is deleted: unlink the alerts it resolved. The foreign key does this too,
    but not on SQLite, and not before the sync runs."""
    rows = await session.scalars(select(Alert).where(Alert.resulting_event_id == event_id))
    for row in rows:
        row.resulting_event_id = None


async def _close_tasks(session: AsyncSession, alerts: Iterable[Alert]) -> None:
    """An alert's open task closes with it (§7.2)."""
    status_by_alert = {
        row.id: TaskStatus.DELETED if row.status is AlertStatus.EXPIRED else TaskStatus.DONE
        for row in alerts
    }
    if not status_by_alert:
        return
    tasks = await session.scalars(
        select(Task).where(Task.alert_id.in_(status_by_alert), Task.status == TaskStatus.OPEN)
    )
    now = dt.datetime.now(dt.UTC)
    for task in tasks:
        task.status = status_by_alert[task.alert_id]  # type: ignore[index]
        if task.status is TaskStatus.DONE:
            task.completed_at = now


def sync_reminders(animal: Animal, reminders: Iterable[ReminderSpec]) -> None:
    """A no-op seam. §7.2 replaced Reminder with Task, and there is no table for either kind of
    reminder yet. TODO(alert-engine): turn these specs into automatic Tasks (MILK_WITHDRAWAL,
    HEIFER_TO_REGISTER, "Esperar al siguiente ciclo"), idempotent by (animal, kind, due_on)."""
    del animal, reminders
