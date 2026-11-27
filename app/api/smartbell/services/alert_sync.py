"""Keeps an animal's Alerts in step with its projection after an event write (§4).

A narrow hook: `events-api` calls `sync_animal` after every create, edit or delete, and the
daily job (`jobs/daily`) after re-projecting each animal. The alert lifecycle (follow-up days,
expiring a window that passed) belongs to `services.alerts`, and the Tasks that surface alerts to
`tasks-engine`; this module opens what the projection asks for, closes what an event made moot,
and keeps the reminder Tasks in step. It is idempotent: the same projection twice changes
nothing, because an alert is keyed by (animal, kind, window_start, window_end).
"""

import datetime as dt
import uuid
from collections.abc import Collection, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import AlertSpec, Projection, ReminderKind, ReminderSpec
from smartbell.enums import (
    AlertKind,
    AlertStatus,
    BullAvailability,
    EventType,
    TaskCategory,
    TaskKind,
    TaskSource,
    TaskStatus,
)
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
    deletion) a dropped alert is closed as EXPIRED. A removed animal has every alert closed, and
    so has a semen-only bull: it isn't a live animal of the ranch, so nothing opens for it either.
    `reopen` lists closed alerts whose resolving event was just edited or deleted (`linked_to`):
    if the projection asks for one again, it is pending again. No other closed alert reopens,
    so one the alert engine expired stays expired. The caller commits.
    """
    rows = (await session.scalars(select(Alert).where(Alert.animal_id == animal.id))).all()
    by_key = {(row.kind, row.window_start, row.window_end): row for row in rows}
    gone = projection.removed or animal.bull_availability is BullAvailability.SEMEN
    wanted = set() if gone else {_key(spec) for spec in projection.alerts}

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
        if row.kind not in PROJECTED_KINDS and not gone:
            continue
        answered = row.kind in resolves
        if not answered and row.window_end < today and not gone:
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
    await close_tasks(session, closed)
    await sync_reminders(session, animal, () if gone else projection.reminders)
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


async def close_tasks(session: AsyncSession, alerts: Iterable[Alert]) -> None:
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


# The reminders that become automatic Tasks (§7.2), with their title and category. WAIT_NEXT_CYCLE
# ("Esperar al siguiente ciclo") is copy for the heat form, not a task: the next HEAT alert's
# task already asks to watch her on that day.
REMINDER_TASKS: dict[ReminderKind, tuple[TaskKind, TaskCategory, str]] = {
    ReminderKind.MILK_WITHDRAWAL: (
        TaskKind.MILK_WITHDRAWAL,
        TaskCategory.SALUD,
        "Separar la leche de vaca {id} hasta el {date}",
    ),
    ReminderKind.HEIFER_TO_REGISTER: (
        TaskKind.HEIFER_TO_REGISTER,
        TaskCategory.REPRODUCCION,
        "Registrar la cría de vaca {id}",
    ),
}
REMINDER_TASK_KINDS = frozenset(kind for kind, _, _ in REMINDER_TASKS.values())


async def sync_reminders(
    session: AsyncSession, animal: Animal, reminders: Iterable[ReminderSpec]
) -> None:
    """Turn the projection's reminders into automatic Tasks, idempotent by (animal, kind, due).

    A task is never made twice for the same key, so one the user completed stays done. An open
    one the projection no longer asks for (the withdrawal was edited, the calf was registered) is
    deleted, and reopened if the projection asks for it again (that edit was undone). There is
    no way for a person to delete these tasks yet; `tasks-engine` decides what that means.
    """
    wanted: dict[tuple[TaskKind, dt.date], ReminderSpec] = {}
    for spec in reminders:
        if spec.kind in REMINDER_TASKS:
            wanted[(REMINDER_TASKS[spec.kind][0], spec.due_on)] = spec
    tasks = (
        await session.scalars(
            select(Task).where(
                Task.animal_id == animal.id,
                Task.kind.in_(REMINDER_TASK_KINDS),
                Task.source == TaskSource.AUTOMATIC,
            )
        )
    ).all()
    existing = {(task.kind, task.due_date) for task in tasks}
    for task in tasks:
        key = (task.kind, task.due_date)
        if task.status is TaskStatus.OPEN and key not in wanted:
            task.status = TaskStatus.DELETED
        elif task.status is TaskStatus.DELETED and key in wanted:
            task.status = TaskStatus.OPEN
    for (kind, due), spec in sorted(wanted.items()):
        if (kind, due) in existing:
            continue
        _, category, title = REMINDER_TASKS[spec.kind]
        session.add(
            Task(
                ranch_id=animal.ranch_id,
                source=TaskSource.AUTOMATIC,
                kind=kind,
                category=category,
                title=title.format(id=animal.control_id, date=due.strftime("%d/%m/%Y")),
                due_date=due,
                animal_id=animal.id,
                status=TaskStatus.OPEN,
            )
        )
