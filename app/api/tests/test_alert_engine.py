"""The alert engine (`alert-engine`): the daily job, date-driven transitions, the alert lifecycle,
VACCINE_DUE, reminder tasks and the `/alerts` routes. Time is frozen: every run names its day."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from smartbell.db import make_sessionmaker
from smartbell.domain.repro import EventFact
from smartbell.domain.vaccines import VaccineRule, due_dates, first_dose_date, next_due
from smartbell.enums import (
    AlertKind,
    AlertStatus,
    EventType,
    ReproState,
    Role,
    TaskKind,
    TaskSource,
    TaskStatus,
    VaccinationPlanStatus,
    VaccineFrequency,
    VaccineStartBy,
    VaccineStartEvent,
)
from smartbell.jobs.daily import RUN_AT_HOUR, ranch_today, run_all, run_ranch, start_scheduler
from smartbell.models import (
    Alert,
    Animal,
    Event,
    Membership,
    PlanVaccine,
    Task,
    VaccinationPlan,
)
from smartbell.routes.animals import get_today
from smartbell.services.animals import RANCH_TIMEZONE
from tests.conftest import Account, add_member, sign_up

TODAY = dt.date(2026, 11, 3)
COW_BIRTH = "2022-01-15"


def day(n: int) -> dt.date:
    return TODAY + dt.timedelta(days=n)


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def new_cow(api: AsyncClient, account: Account, control_id: str, **fields: Any) -> uuid.UUID:
    body = {
        "control_id": control_id,
        "birth_date": COW_BIRTH,
        "last_calving_date": "2026-06-01",
        "lactation_number": 2,
    } | fields
    response = await api.post("/api/animals", headers=account.headers(), json=body)
    assert response.status_code == 201, response.text
    return uuid.UUID(response.json()["id"])


async def served_cow(api: AsyncClient, account: Account, served_on: dt.date) -> uuid.UUID:
    return await new_cow(
        api,
        account,
        "0200",
        repro_stage="SERVIDA",
        repro_stage_date=served_on.isoformat(),
        last_service_date=served_on.isoformat(),
    )


async def pregnant_cow(api: AsyncClient, account: Account, served_on: dt.date) -> uuid.UUID:
    return await new_cow(
        api,
        account,
        "0300",
        repro_stage="GESTANTE",
        repro_stage_date=served_on.isoformat(),
        last_service_date=served_on.isoformat(),
    )


async def run(db: AsyncSession, account: Account, on: dt.date) -> None:
    await run_ranch(db, account.ranch_id, on)
    await db.commit()


async def alerts_of(db: AsyncSession, animal_id: uuid.UUID, kind: AlertKind) -> list[Alert]:
    rows = await db.scalars(
        select(Alert)
        .where(Alert.animal_id == animal_id, Alert.kind == kind)
        .order_by(Alert.window_start)
        .execution_options(populate_existing=True)
    )
    return list(rows)


async def snapshot(db: AsyncSession, ranch_id: uuid.UUID) -> list[tuple[Any, ...]]:
    fresh = {"populate_existing": True}
    alerts = await db.scalars(
        select(Alert).where(Alert.ranch_id == ranch_id).execution_options(**fresh)
    )
    tasks = await db.scalars(
        select(Task).where(Task.ranch_id == ranch_id).execution_options(**fresh)
    )
    return sorted(
        [
            (
                str(a.id),
                str(a.animal_id),
                a.kind,
                a.window_start,
                a.window_end,
                a.status,
                a.follow_up_day,
            )
            for a in alerts
        ]
        + [
            (str(t.id), str(t.animal_id), t.kind, t.due_date, t.due_date, t.status, 0)
            for t in tasks
        ]
    )


# --- Acceptance ----------------------------------------------------------------------------------


async def test_a_cow_served_35_days_ago_has_an_active_pregnancy_check_on_the_window_start(
    tenant_app: FastAPI, tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await served_cow(tenant_api, owner, TODAY)
    badge = "/api/alerts/counts"

    await run(tenant_db, owner, day(34))
    [check] = await alerts_of(tenant_db, cow, AlertKind.PREGNANCY_CHECK)
    assert (check.window_start, check.status) == (day(35), AlertStatus.PENDING)
    tenant_app.dependency_overrides[get_today] = lambda: day(34)
    before = (await tenant_api.get(badge, headers=owner.headers())).json()
    assert "PREGNANCY_CHECK" not in before["by_kind"]

    await run(tenant_db, owner, day(35))
    [check] = await alerts_of(tenant_db, cow, AlertKind.PREGNANCY_CHECK)
    assert (check.status, check.follow_up_day) == (AlertStatus.PENDING, 0)
    tenant_app.dependency_overrides[get_today] = lambda: day(35)
    after = (await tenant_api.get(badge, headers=owner.headers())).json()
    assert after["by_kind"]["PREGNANCY_CHECK"] == 1


async def test_a_pregnant_cow_goes_seca_at_expected_calving_minus_60_without_an_event(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    served = day(-200)
    cow = await pregnant_cow(tenant_api, owner, served)
    animal = await tenant_db.get_one(Animal, cow, populate_existing=True)
    assert animal.expected_calving_date == served + dt.timedelta(days=283)
    dry_off = animal.expected_calving_date - dt.timedelta(days=60)
    events_before = await tenant_db.scalar(select(func.count()).select_from(Event))

    await run(tenant_db, owner, dry_off - dt.timedelta(days=1))
    animal = await tenant_db.get_one(Animal, cow, populate_existing=True)
    assert animal.repro_state is ReproState.GESTANTE

    await run(tenant_db, owner, dry_off)
    animal = await tenant_db.get_one(Animal, cow, populate_existing=True)
    assert animal.repro_state is ReproState.SECA
    assert animal.lactation_state == "SECA"
    assert await tenant_db.scalar(select(func.count()).select_from(Event)) == events_before
    assert [a.status for a in await alerts_of(tenant_db, cow, AlertKind.CALVING)] == [
        AlertStatus.PENDING
    ]


async def test_running_the_job_twice_in_a_day_changes_nothing(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    await served_cow(tenant_api, owner, day(-40))
    await pregnant_cow(tenant_api, owner, day(-200))
    await new_cow(tenant_api, owner, "0100")

    await run(tenant_db, owner, day(10))
    first = await snapshot(tenant_db, owner.ranch_id)
    await run(tenant_db, owner, day(10))
    second = await snapshot(tenant_db, owner.ranch_id)

    assert first == second
    keys = [row[1:5] for row in first if isinstance(row[2], AlertKind)]
    assert len(keys) == len(set(keys))


async def test_an_unconfirmed_heat_alert_expires_after_follow_up_day_5(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0100")
    [heat] = await alerts_of(tenant_db, cow, AlertKind.HEAT)
    start, end = heat.window_start, heat.window_end
    task = Task(
        ranch_id=owner.ranch_id,
        source=TaskSource.AUTOMATIC,
        kind=TaskKind.HEAT_OBSERVE,
        title="Observar el celo de vaca 0100",
        due_date=start,
        animal_id=cow,
        alert_id=heat.id,
    )
    tenant_db.add(task)
    await tenant_db.commit()

    for offset, follow_up in ((0, 0), (1, 1), (5, 5)):
        await run(tenant_db, owner, start + dt.timedelta(days=offset))
        heat = await tenant_db.get_one(Alert, heat.id, populate_existing=True)
        assert (heat.status, heat.follow_up_day) == (AlertStatus.PENDING, follow_up)

    await run(tenant_db, owner, end + dt.timedelta(days=1))
    heat = await tenant_db.get_one(Alert, heat.id, populate_existing=True)
    assert heat.status is AlertStatus.EXPIRED
    assert heat.resolved_at is not None
    assert (
        await tenant_db.get_one(Task, task.id, populate_existing=True)
    ).status is TaskStatus.DELETED
    # The next cycle's window is open for her, and stays expired the day after.
    pending = [a for a in await alerts_of(tenant_db, cow, AlertKind.HEAT) if a.id != heat.id]
    assert [a.status for a in pending] == [AlertStatus.PENDING]
    await run(tenant_db, owner, end + dt.timedelta(days=2))
    assert (
        await tenant_db.get_one(Alert, heat.id, populate_existing=True)
    ).status is AlertStatus.EXPIRED


# --- Lifecycle details ---------------------------------------------------------------------------


async def test_a_passed_dry_off_reminder_gives_way_once_the_next_one_opens(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await pregnant_cow(tenant_api, owner, day(-200))
    animal = await tenant_db.get_one(Animal, cow, populate_existing=True)
    assert animal.expected_calving_date is not None
    dry_off = animal.expected_calving_date - dt.timedelta(days=60)
    ten_before = dry_off - dt.timedelta(days=10)
    five_before = dry_off - dt.timedelta(days=5)

    await run(tenant_db, owner, ten_before + dt.timedelta(days=1))
    by_day = {a.window_start: a.status for a in await alerts_of(tenant_db, cow, AlertKind.DRY_OFF)}
    assert by_day[ten_before] is AlertStatus.PENDING

    await run(tenant_db, owner, five_before)
    by_day = {a.window_start: a.status for a in await alerts_of(tenant_db, cow, AlertKind.DRY_OFF)}
    assert by_day == {
        ten_before: AlertStatus.EXPIRED,
        five_before: AlertStatus.PENDING,
        dry_off: AlertStatus.PENDING,
    }


async def test_run_all_covers_every_ranch_in_ranch_time(
    tenant_api: AsyncClient, tenant_db: AsyncSession, schema: AsyncEngine, owner: Account
) -> None:
    other = await sign_up(tenant_api, "other")
    await served_cow(tenant_api, owner, TODAY)
    await served_cow(tenant_api, other, TODAY)
    # 03:00 UTC on the 9th is still the 8th in Mexico City.
    now = dt.datetime.combine(day(6), dt.time(3), tzinfo=dt.UTC)
    assert ranch_today(now) == day(5)

    runs = await run_all(make_sessionmaker(schema), now)

    assert {r.ranch_id for r in runs} == {owner.ranch_id, other.ranch_id}
    assert {r.today for r in runs} == {day(5)}
    assert all(r.animals == 1 for r in runs)


async def test_the_scheduler_runs_the_job_at_5_am_ranch_time(schema: AsyncEngine) -> None:
    scheduler = start_scheduler(make_sessionmaker(schema))
    try:
        job = scheduler.get_job("daily-alerts")
        when = job.next_run_time.astimezone(RANCH_TIMEZONE)
        assert (when.hour, when.minute) == (RUN_AT_HOUR, 0)
    finally:
        scheduler.shutdown(wait=False)


# --- VACCINE_DUE ---------------------------------------------------------------------------------


async def approved_plan(db: AsyncSession, account: Account, **vaccine: Any) -> PlanVaccine:
    plan = VaccinationPlan(ranch_id=account.ranch_id, status=VaccinationPlanStatus.APROBADO)
    db.add(plan)
    await db.flush()
    row = PlanVaccine(
        plan_id=plan.id,
        name="IBR",
        dose_ml=Decimal(2),
        **(
            {
                "start_by": VaccineStartBy.AGE_MONTHS,
                "start_value": Decimal(3),
                "frequency": VaccineFrequency.ANUAL,
            }
            | vaccine
        ),
    )
    db.add(row)
    await db.commit()
    return row


async def test_an_approved_plan_opens_vaccine_due_once_and_a_dose_confirms_it(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    vaccine = await approved_plan(tenant_db, owner)
    cow = await new_cow(tenant_api, owner, "0100")

    # Her first dose fell due in 2022: surfaced today, once.
    await run(tenant_db, owner, TODAY)
    await run(tenant_db, owner, day(1))
    [due] = await alerts_of(tenant_db, cow, AlertKind.VACCINE_DUE)
    assert (due.window_start, due.status, due.follow_up_day) == (TODAY, AlertStatus.PENDING, 1)

    response = await tenant_api.post(
        f"/api/animals/{cow}/events",
        headers=owner.headers(),
        json={
            "occurred_on": TODAY.isoformat(),
            "payload": {"type": "VACCINATION", "vaccine_id": str(vaccine.id), "dose_ml": 2},
        },
    )
    assert response.status_code == 201, response.text
    await run(tenant_db, owner, day(2))

    rows = await alerts_of(tenant_db, cow, AlertKind.VACCINE_DUE)
    assert [(a.window_start, a.status) for a in rows] == [
        (TODAY, AlertStatus.CONFIRMED),
        (dt.date(2027, 11, 3), AlertStatus.PENDING),
    ]
    assert rows[0].resulting_event_id == uuid.UUID(response.json()["event"]["id"])


async def test_no_vaccine_due_without_an_approved_plan(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    plan = VaccinationPlan(ranch_id=owner.ranch_id, status=VaccinationPlanStatus.PENDIENTE)
    tenant_db.add(plan)
    await tenant_db.flush()
    tenant_db.add(
        PlanVaccine(
            plan_id=plan.id,
            name="IBR",
            start_by=VaccineStartBy.AGE_MONTHS,
            start_value=Decimal(3),
            frequency=VaccineFrequency.ANUAL,
        )
    )
    await tenant_db.commit()
    cow = await new_cow(tenant_api, owner, "0100")

    await run(tenant_db, owner, TODAY)

    assert await alerts_of(tenant_db, cow, AlertKind.VACCINE_DUE) == []


def fact(kind: EventType, on: dt.date, **payload: Any) -> EventFact:
    return EventFact(type=kind, occurred_on=on, payload=payload)


def test_vaccine_rules() -> None:
    birth = dt.date(2026, 1, 10)
    vid = uuid.uuid4()
    once = VaccineRule(vid, VaccineStartBy.AGE_MONTHS, VaccineFrequency.UNICA, Decimal(3))
    assert next_due(once, dt.date(2026, 4, 10), []) == dt.date(2026, 4, 10)
    assert next_due(once, dt.date(2026, 4, 10), [dt.date(2026, 4, 12)]) is None

    boosters = VaccineRule(
        vid,
        VaccineStartBy.AGE_MONTHS,
        VaccineFrequency.REFUERZOS,
        Decimal(3),
        booster_count=2,
        booster_every_months=1,
    )
    first = dt.date(2026, 4, 10)
    assert next_due(boosters, first, [first]) == dt.date(2026, 5, 10)
    assert next_due(boosters, first, [first, dt.date(2026, 5, 10)]) == dt.date(2026, 6, 10)
    assert next_due(boosters, first, [first, dt.date(2026, 5, 10), dt.date(2026, 6, 10)]) is None

    six = VaccineRule(vid, VaccineStartBy.AGE_MONTHS, VaccineFrequency.CADA_6_MESES, Decimal(3))
    assert next_due(six, first, [dt.date(2026, 5, 1)]) == dt.date(2026, 11, 1)

    by_weight = VaccineRule(vid, VaccineStartBy.WEIGHT_KG, VaccineFrequency.UNICA, Decimal(200))
    weights = [
        fact(EventType.WEIGHT, dt.date(2026, 3, 1), kg=150),
        fact(EventType.WEIGHT, dt.date(2026, 6, 1), kg=210),
    ]
    assert first_dose_date(by_weight, birth, weights, None) == dt.date(2026, 6, 1)
    assert first_dose_date(by_weight, birth, weights[:1], None) is None

    by_heat = VaccineRule(
        vid, VaccineStartBy.EVENT, VaccineFrequency.UNICA, start_event=VaccineStartEvent.PRIMER_CELO
    )
    heats = [
        fact(EventType.HEAT, dt.date(2027, 1, 1), outcome="NOT_OBSERVED"),
        fact(EventType.HEAT, dt.date(2027, 2, 1), outcome="NOT_INSEMINATED"),
    ]
    assert first_dose_date(by_heat, birth, heats, None) == dt.date(2027, 2, 1)
    at_dry_off = VaccineRule(
        vid, VaccineStartBy.EVENT, VaccineFrequency.UNICA, start_event=VaccineStartEvent.SECADO
    )
    assert first_dose_date(at_dry_off, birth, [], dt.date(2028, 1, 1)) == dt.date(2028, 1, 1)

    # Doses recorded after `today` don't count yet.
    dose = EventFact(EventType.VACCINATION, dt.date(2026, 5, 1), {"vaccine_id": str(vid)})
    assert due_dates([once], birth, [dose], None, dt.date(2026, 4, 20)) == {dt.date(2026, 4, 10)}
    assert due_dates([once], birth, [dose], None, dt.date(2026, 5, 2)) == set()


# --- Reminder tasks ------------------------------------------------------------------------------


async def test_a_milk_withdrawal_becomes_one_automatic_task(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0100")
    illness = {
        "occurred_on": TODAY.isoformat(),
        "payload": {
            "type": "ILLNESS",
            "illness": "MASTITIS",
            "treatment": {
                "type": "ANTIBIOTICO",
                "presentation": "INYECCION",
                "start_date": TODAY.isoformat(),
            },
        },
    }
    response = await tenant_api.post(
        f"/api/animals/{cow}/events", headers=owner.headers(), json=illness
    )
    assert response.status_code == 201, response.text
    await run(tenant_db, owner, day(1))
    await run(tenant_db, owner, day(1))

    tasks = (
        await tenant_db.scalars(
            select(Task).where(Task.animal_id == cow).execution_options(populate_existing=True)
        )
    ).all()
    assert [(t.kind, t.due_date, t.status, t.source) for t in tasks] == [
        (TaskKind.MILK_WITHDRAWAL, day(15), TaskStatus.OPEN, TaskSource.AUTOMATIC)
    ]
    assert tasks[0].title == f"Separar la leche de vaca 0100 hasta el {day(15):%d/%m/%Y}"

    # Once the withdrawal is over, the reminder is gone and its open task with it.
    await run(tenant_db, owner, day(16))
    task = await tenant_db.get_one(Task, tasks[0].id)
    assert task.status is TaskStatus.DELETED


# --- Routes --------------------------------------------------------------------------------------


async def test_list_filters_by_kind_and_status(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    served = await served_cow(tenant_api, owner, TODAY)
    await new_cow(tenant_api, owner, "0100")

    response = await tenant_api.get(
        "/api/alerts",
        params={"kind": "PREGNANCY_CHECK", "status": "PENDING"},
        headers=owner.headers(),
    )

    assert response.status_code == 200
    [row] = response.json()
    assert row["animal_id"] == str(served)
    assert (row["window_start"], row["window_end"]) == (day(35).isoformat(), day(45).isoformat())
    every = (await tenant_api.get("/api/alerts", headers=owner.headers())).json()
    assert {r["kind"] for r in every} >= {"HEAT", "PREGNANCY_CHECK"}
    bad = await tenant_api.get("/api/alerts", params={"kind": "NOPE"}, headers=owner.headers())
    assert bad.status_code == 422


async def test_resolve_negates_a_pending_alert_and_its_task(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0100")
    [heat] = await alerts_of(tenant_db, cow, AlertKind.HEAT)
    task = Task(
        ranch_id=owner.ranch_id,
        source=TaskSource.AUTOMATIC,
        kind=TaskKind.HEAT_OBSERVE,
        title="Observar el celo de vaca 0100",
        due_date=heat.window_start,
        animal_id=cow,
        alert_id=heat.id,
    )
    tenant_db.add(task)
    await tenant_db.commit()
    url = f"/api/alerts/{heat.id}/resolve"

    response = await tenant_api.post(url, headers=owner.headers(), json={"status": "NEGATED"})

    assert response.status_code == 200, response.text
    body = response.json()
    assert (body["status"], body["resolved_by"]) == ("NEGATED", str(owner.user_id))
    assert (
        await tenant_db.get_one(Task, task.id, populate_existing=True)
    ).status is TaskStatus.DONE
    again = await tenant_api.post(url, headers=owner.headers(), json={"status": "CONFIRMED"})
    assert again.status_code == 409


async def test_resolve_refuses_bad_input_other_ranches_and_missing_permission(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0100")
    other_cow = await new_cow(tenant_api, owner, "0101")
    [heat] = await alerts_of(tenant_db, cow, AlertKind.HEAT)
    other_event = await tenant_db.scalar(select(Event.id).where(Event.animal_id == other_cow))
    url = f"/api/alerts/{heat.id}/resolve"

    expired = await tenant_api.post(url, headers=owner.headers(), json={"status": "EXPIRED"})
    extra = await tenant_api.post(
        url, headers=owner.headers(), json={"status": "NEGATED", "resolved_by": str(uuid.uuid4())}
    )
    wrong_event = await tenant_api.post(
        url, headers=owner.headers(), json={"status": "CONFIRMED", "event_id": str(other_event)}
    )
    assert [expired.status_code, extra.status_code, wrong_event.status_code] == [422, 422, 422]

    stranger = await sign_up(tenant_api, "stranger")
    outsider = await tenant_api.post(url, headers=stranger.headers(), json={"status": "NEGATED"})
    assert outsider.status_code == 404
    listed = await tenant_api.get("/api/alerts", headers=stranger.headers())
    assert listed.json() == []

    viewer = await sign_up(tenant_api, "viewer")
    await add_member(tenant_db, viewer, owner.ranch_id, Role.TECNICO_CAMPO)
    membership = await tenant_db.get_one(Membership, (viewer.user_id, owner.ranch_id))
    membership.permissions = ["ANIMALS_VIEW"]
    await tenant_db.commit()
    forbidden = await tenant_api.post(
        url, headers=viewer.headers(owner.ranch_id), json={"status": "NEGATED"}
    )
    assert forbidden.status_code == 403
    assert (
        await tenant_db.get_one(Alert, heat.id, populate_existing=True)
    ).status is AlertStatus.PENDING
