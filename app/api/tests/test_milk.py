"""The milk records API (`milk-api`): herd daily log, per-cow litres by destination, aggregates."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import LactationState, MilkGranularity, Role
from smartbell.models import Animal, Membership, MilkCowLog, MilkHerdLog
from smartbell.routes.animals import get_today
from smartbell.services.milk import bucket_start, next_bucket
from tests.conftest import Account, add_member, sign_up

TODAY = dt.date(2026, 11, 20)  # A Friday.


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def add_cow(
    api: AsyncClient,
    db: AsyncSession,
    account: Account,
    control_id: str,
    *,
    lactating: bool = True,
    withdrawal_until: dt.date | None = None,
    **fields: Any,
) -> uuid.UUID:
    body = {
        "control_id": control_id,
        "birth_date": "2022-01-15",
        "last_calving_date": "2026-06-01",
        "lactation_number": 2,
    } | fields
    response = await api.post("/api/animals", headers=account.headers(), json=body)
    assert response.status_code == 201, response.text
    animal_id = uuid.UUID(response.json()["id"])
    # Projection fields, set directly: the repro engine has its own tests.
    await db.execute(
        update(Animal)
        .where(Animal.id == animal_id)
        .values(
            lactation_state=LactationState.LACTANDO if lactating else LactationState.SECA,
            milk_withdrawal_until=withdrawal_until,
        )
    )
    await db.commit()
    return animal_id


async def post_herd(
    api: AsyncClient, account: Account, liters: str, day: dt.date | None = None
) -> Response:
    body: dict[str, Any] = {"total_liters": liters}
    if day is not None:
        body["date"] = day.isoformat()
    return await api.post("/api/milk/herd-logs", headers=account.headers(), json=body)


async def post_cows(
    api: AsyncClient,
    account: Account,
    entries: list[tuple[uuid.UUID, str, str]],
    day: dt.date | None = None,
) -> Response:
    body: dict[str, Any] = {
        "entries": [
            {"animal_id": str(animal_id), "destination": destination, "liters": liters}
            for animal_id, destination, liters in entries
        ]
    }
    if day is not None:
        body["date"] = day.isoformat()
    return await api.post("/api/milk/cow-logs", headers=account.headers(), json=body)


def field_error(response: Response) -> tuple[list[Any], str]:
    (error,) = response.json()["detail"]
    return error["loc"], error["type"]


# --- Herd log ----------------------------------------------------------------------------------


async def test_posting_the_same_day_twice_overwrites_the_herd_log(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    day = dt.date(2026, 11, 18)
    first = await post_herd(tenant_api, owner, "480.50", day)
    second = await post_herd(tenant_api, owner, "512", day)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert second.json() == {
        "date": "2026-11-18",
        "total_liters": "512.00",
        "entered_by": str(owner.user_id),
    }
    logs = (await tenant_db.scalars(select(MilkHerdLog))).all()
    assert [(log.date, log.total_liters) for log in logs] == [(day, Decimal("512.00"))]


async def test_herd_log_defaults_to_today_and_refuses_the_future(
    tenant_api: AsyncClient, owner: Account
) -> None:
    today = await post_herd(tenant_api, owner, "300")
    future = await post_herd(tenant_api, owner, "300", TODAY + dt.timedelta(days=1))
    negative = await post_herd(tenant_api, owner, "-1")

    assert today.json()["date"] == TODAY.isoformat()
    assert future.status_code == 422
    assert field_error(future) == (["body", "date"], "date_in_future")
    assert negative.status_code == 422


async def test_list_and_delete_herd_logs(tenant_api: AsyncClient, owner: Account) -> None:
    for days_ago, liters in [(0, "300"), (3, "310"), (6, "320"), (7, "330")]:
        await post_herd(tenant_api, owner, liters, TODAY - dt.timedelta(days=days_ago))

    listed = await tenant_api.get("/api/milk/herd-logs", headers=owner.headers())
    assert [log["total_liters"] for log in listed.json()] == ["300.00", "310.00", "320.00"]

    gone = await tenant_api.delete(f"/api/milk/herd-logs/{TODAY}", headers=owner.headers())
    again = await tenant_api.delete(f"/api/milk/herd-logs/{TODAY}", headers=owner.headers())
    ranged = await tenant_api.get(
        "/api/milk/herd-logs",
        headers=owner.headers(),
        params={"start": "2026-11-01", "end": TODAY.isoformat()},
    )

    assert gone.status_code == 204
    assert again.status_code == 404
    assert [log["date"] for log in ranged.json()] == ["2026-11-17", "2026-11-14", "2026-11-13"]


# --- Cow logs ----------------------------------------------------------------------------------


async def test_cow_in_withdrawal_logged_to_tank_returns_a_warning(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    treated = await add_cow(
        tenant_api, tenant_db, owner, "Tratada", withdrawal_until=TODAY + dt.timedelta(days=2)
    )
    healthy = await add_cow(tenant_api, tenant_db, owner, "Sana")

    response = await post_cows(
        tenant_api,
        owner,
        [
            (treated, "TANQUE", "12"),
            (treated, "ANTIBIOTICOS", "3"),
            (healthy, "TANQUE", "25"),
            (healthy, "BECERRAS", "4"),
            (healthy, "ANTIBIOTICOS", "1"),
        ],
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert sorted((w["animal_id"], w["code"]) for w in body["warnings"]) == sorted(
        [
            (str(treated), "WITHDRAWAL_TO_TANK"),
            (str(healthy), "ANTIBIOTICS_OUTSIDE_WITHDRAWAL"),
        ]
    )
    assert len(body["logs"]) == 5
    # Saved anyway: the warning is for the screen, not a refusal.
    assert await tenant_db.scalar(select(func.count()).select_from(MilkCowLog)) == 5


async def test_withdrawal_ends_on_its_last_day(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await add_cow(tenant_api, tenant_db, owner, "Tratada", withdrawal_until=TODAY)

    last_day = await post_cows(tenant_api, owner, [(cow, "ANTIBIOTICOS", "5")])
    response = await post_cows(
        tenant_api, owner, [(cow, "ANTIBIOTICOS", "5")], TODAY - dt.timedelta(days=1)
    )

    assert last_day.json()["warnings"] == []
    assert response.json()["warnings"] == []


async def test_reposting_a_cow_replaces_her_day(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await add_cow(tenant_api, tenant_db, owner, "Pinta")
    await post_cows(tenant_api, owner, [(cow, "TANQUE", "20")])
    # Corrected: the litres went to antibiotics, not the tank. Counted once.
    response = await post_cows(tenant_api, owner, [(cow, "ANTIBIOTICOS", "20")])
    stats = await tenant_api.get(f"/api/milk/cows/{cow}", headers=owner.headers())

    assert [(log["destination"], log["liters"]) for log in response.json()["logs"]] == [
        ("ANTIBIOTICOS", "20.00")
    ]
    assert stats.json()["total_liters"] == "20.00"


async def test_reposting_a_cow_overwrites_her_split(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await add_cow(tenant_api, tenant_db, owner, "Pinta")
    await post_cows(tenant_api, owner, [(cow, "TANQUE", "20"), (cow, "BECERRAS", "4")])
    response = await post_cows(tenant_api, owner, [(cow, "TANQUE", "22.5"), (cow, "BECERRAS", "4")])

    assert response.json()["logs"] == [
        {"animal_id": str(cow), "date": TODAY.isoformat(), "destination": d, "liters": liters}
        for d, liters in [("BECERRAS", "4.00"), ("TANQUE", "22.50")]
    ]
    listed = await tenant_api.get("/api/milk/cow-logs", headers=owner.headers())
    assert len(listed.json()) == 2


async def test_cow_log_refusals(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await add_cow(tenant_api, tenant_db, owner, "Pinta")
    bull = (
        await tenant_api.post(
            "/api/animals",
            headers=owner.headers(),
            json={"control_id": "Toro 1", "birth_date": "2022-01-15", "sex": "MACHO"},
        )
    ).json()["id"]
    other = await sign_up(tenant_api, "neighbour")
    foreign = await add_cow(tenant_api, tenant_db, other, "Ajena")

    duplicate = await post_cows(tenant_api, owner, [(cow, "TANQUE", "1"), (cow, "TANQUE", "2")])
    male = await post_cows(
        tenant_api, owner, [(cow, "TANQUE", "1"), (uuid.UUID(bull), "TANQUE", "1")]
    )
    not_mine = await post_cows(tenant_api, owner, [(foreign, "TANQUE", "1")])
    too_much = await post_cows(tenant_api, owner, [(cow, "TANQUE", "1000")])

    assert field_error(duplicate) == (["body", "entries", "1"], "duplicate_entry")
    assert field_error(male) == (["body", "entries", "1", "animal_id"], "not_a_cow")
    assert not_mine.status_code == 404
    assert too_much.status_code == 422
    # Nothing of a refused body is kept.
    assert await tenant_db.scalar(select(func.count()).select_from(MilkCowLog)) == 0


async def test_removed_cow_is_refused(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await add_cow(tenant_api, tenant_db, owner, "Vendida")
    removed = await tenant_api.post(
        f"/api/animals/{cow}/removal",
        headers=owner.headers(),
        json={"reason": "VENTA_OTRO_RANCHO"},
    )
    assert removed.status_code in (200, 204), removed.text

    response = await post_cows(tenant_api, owner, [(cow, "TANQUE", "10")])

    assert response.status_code == 409


# --- Aggregates --------------------------------------------------------------------------------

# Herd totals: Q3 has one day; Q4 has two weeks of October and two days of November.
HERD = {
    dt.date(2026, 9, 30): "100",  # Wednesday
    dt.date(2026, 10, 5): "200",  # Monday
    dt.date(2026, 10, 11): "300",  # Sunday: same week as Oct 5
    dt.date(2026, 10, 12): "400",  # Monday: next week
    dt.date(2026, 11, 2): "500",
    dt.date(2026, 11, 20): "600",
}


@pytest.fixture
async def history(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> dict[str, uuid.UUID]:
    a = await add_cow(tenant_api, tenant_db, owner, "A")
    b = await add_cow(tenant_api, tenant_db, owner, "B", withdrawal_until=TODAY)
    await add_cow(tenant_api, tenant_db, owner, "Seca", lactating=False)
    for day, liters in HERD.items():
        assert (await post_herd(tenant_api, owner, liters, day)).status_code == 200
    await post_cows(
        tenant_api, owner, [(a, "TANQUE", "20"), (a, "BECERRAS", "5")], dt.date(2026, 10, 5)
    )
    await post_cows(tenant_api, owner, [(a, "TANQUE", "30")], dt.date(2026, 10, 6))
    await post_cows(tenant_api, owner, [(b, "ANTIBIOTICOS", "10")], dt.date(2026, 10, 12))
    return {"a": a, "b": b}


async def get_summary(
    api: AsyncClient, account: Account, granularity: str, start: str, end: str
) -> dict[str, Any]:
    response = await api.get(
        "/api/milk/summary",
        headers=account.headers(),
        params={"granularity": granularity, "start": start, "end": end},
    )
    assert response.status_code == 200, response.text
    result: dict[str, Any] = response.json()
    return result


def rows(summary: dict[str, Any]) -> list[tuple[str, str, str, int, str | None, str | None]]:
    return [
        (
            b["start"],
            b["end"],
            b["total_liters"],
            b["days_logged"],
            b["avg_daily_liters"],
            b["avg_liters_per_cow"],
        )
        for b in summary["buckets"]
    ]


@pytest.mark.usefixtures("history")
async def test_weekly_aggregates_start_on_monday(tenant_api: AsyncClient, owner: Account) -> None:
    # Starts on a Thursday: its bucket still begins on Monday Oct 5.
    summary = await get_summary(tenant_api, owner, "WEEK", "2026-10-08", "2026-10-25")

    assert summary["lactating_cows"] == 2
    assert rows(summary) == [
        ("2026-10-05", "2026-10-11", "500.00", 2, "250.00", "125.00"),
        ("2026-10-12", "2026-10-18", "400.00", 1, "400.00", "200.00"),
        ("2026-10-19", "2026-10-25", "0.00", 0, None, None),
    ]
    assert summary["buckets"][0]["by_destination"] == {
        "TANQUE": "50.00",
        "BECERRAS": "5.00",
        "ANTIBIOTICOS": "0.00",
    }


@pytest.mark.usefixtures("history")
async def test_monthly_aggregates_match_the_fixture(
    tenant_api: AsyncClient, owner: Account
) -> None:
    summary = await get_summary(tenant_api, owner, "MONTH", "2026-09-01", "2026-11-30")

    assert rows(summary) == [
        ("2026-09-01", "2026-09-30", "100.00", 1, "100.00", "50.00"),
        ("2026-10-01", "2026-10-31", "900.00", 3, "300.00", "150.00"),
        ("2026-11-01", "2026-11-30", "1100.00", 2, "550.00", "275.00"),
    ]
    assert summary["buckets"][1]["by_destination"] == {
        "TANQUE": "50.00",
        "BECERRAS": "5.00",
        "ANTIBIOTICOS": "10.00",
    }


@pytest.mark.usefixtures("history")
async def test_quarterly_aggregates_match_the_fixture(
    tenant_api: AsyncClient, owner: Account
) -> None:
    summary = await get_summary(tenant_api, owner, "QUARTER", "2026-08-15", "2026-11-20")

    assert rows(summary) == [
        ("2026-07-01", "2026-09-30", "100.00", 1, "100.00", "50.00"),
        ("2026-10-01", "2026-12-31", "2000.00", 5, "400.00", "200.00"),
    ]


@pytest.mark.usefixtures("history")
async def test_semester_and_year_aggregates(tenant_api: AsyncClient, owner: Account) -> None:
    semester = await get_summary(tenant_api, owner, "SEMESTER", "2026-01-01", "2026-12-31")
    year = await get_summary(tenant_api, owner, "YEAR", "2025-06-01", "2026-11-20")

    assert [(b["start"], b["total_liters"]) for b in semester["buckets"]] == [
        ("2026-01-01", "0.00"),
        ("2026-07-01", "2100.00"),
    ]
    assert [(b["start"], b["end"], b["total_liters"]) for b in year["buckets"]] == [
        ("2025-01-01", "2025-12-31", "0.00"),
        ("2026-01-01", "2026-12-31", "2100.00"),
    ]


@pytest.mark.usefixtures("history")
async def test_summary_defaults_to_last_week_by_day_with_the_kpi(
    tenant_api: AsyncClient, owner: Account
) -> None:
    response = await tenant_api.get("/api/milk/summary", headers=owner.headers())
    summary = response.json()

    assert summary["granularity"] == "DAY"
    assert (summary["start"], summary["end"]) == ("2026-11-14", "2026-11-20")
    assert len(summary["buckets"]) == 7
    # Litres per cow per day = herd total ÷ lactating cows (the dry cow doesn't count).
    assert summary["latest"] == {
        "date": "2026-11-20",
        "total_liters": "600.00",
        "liters_per_cow": "300.00",
    }


async def test_summary_refuses_bad_ranges(tenant_api: AsyncClient, owner: Account) -> None:
    backwards = await tenant_api.get(
        "/api/milk/summary",
        headers=owner.headers(),
        params={"start": "2026-11-20", "end": "2026-11-01"},
    )
    too_long = await tenant_api.get(
        "/api/milk/summary",
        headers=owner.headers(),
        params={"granularity": "DAY", "start": "2025-01-01", "end": "2026-11-20"},
    )

    far = await tenant_api.get(
        "/api/milk/summary",
        headers=owner.headers(),
        params={"granularity": "YEAR", "start": "9999-01-01", "end": "9999-12-31"},
    )
    ancient = await tenant_api.get(
        "/api/milk/herd-logs", headers=owner.headers(), params={"end": "0001-01-01"}
    )

    assert field_error(backwards) == (["query", "start"], "start_after_end")
    assert field_error(far) == (["query", "start"], "date_out_of_range")
    assert field_error(ancient) == (["query", "end"], "date_out_of_range")
    assert field_error(too_long) == (["query", "start"], "range_too_long")


async def test_empty_ranch_summary(tenant_api: AsyncClient, owner: Account) -> None:
    response = await tenant_api.get("/api/milk/summary", headers=owner.headers())

    assert response.json()["latest"] is None
    assert response.json()["lactating_cows"] == 0


async def test_cow_stats_average_and_peak_with_dim(
    tenant_api: AsyncClient, history: dict[str, uuid.UUID], owner: Account
) -> None:
    response = await tenant_api.get(f"/api/milk/cows/{history['a']}", headers=owner.headers())

    # Oct 5: 20 + 5 = 25 (destinations summed); Oct 6: 30, the peak, 127 days after June 1.
    assert response.json() == {
        "animal_id": str(history["a"]),
        "days_logged": 2,
        "total_liters": "55.00",
        "avg_daily_liters": "27.50",
        "peak": {"date": "2026-10-06", "liters": "30.00", "dim": 127},
    }


@pytest.mark.parametrize(
    ("granularity", "day", "start", "following"),
    [
        (MilkGranularity.WEEK, dt.date(2026, 11, 1), dt.date(2026, 10, 26), dt.date(2026, 11, 2)),
        (MilkGranularity.MONTH, dt.date(2026, 12, 31), dt.date(2026, 12, 1), dt.date(2027, 1, 1)),
        (MilkGranularity.QUARTER, dt.date(2026, 6, 30), dt.date(2026, 4, 1), dt.date(2026, 7, 1)),
        (MilkGranularity.SEMESTER, dt.date(2026, 7, 1), dt.date(2026, 7, 1), dt.date(2027, 1, 1)),
        (MilkGranularity.YEAR, dt.date(2026, 2, 28), dt.date(2026, 1, 1), dt.date(2027, 1, 1)),
    ],
)
def test_bucket_edges(
    granularity: MilkGranularity, day: dt.date, start: dt.date, following: dt.date
) -> None:
    assert bucket_start(day, granularity) == start
    assert next_bucket(start, granularity) == following


# --- Access ------------------------------------------------------------------------------------


async def test_member_without_events_record_cannot_log(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    reader = await sign_up(tenant_api, "reader")
    await add_member(tenant_db, reader, owner.ranch_id, Role.TECNICO_CAMPO)
    await tenant_db.execute(
        update(Membership)
        .where(Membership.user_id == reader.user_id)
        .values(permissions=["REPORTS_VIEW"])
    )
    await tenant_db.commit()
    headers = reader.headers(owner.ranch_id)

    write = await tenant_api.post(
        "/api/milk/herd-logs", headers=headers, json={"total_liters": "10"}
    )
    read = await tenant_api.get("/api/milk/summary", headers=headers)

    assert write.status_code == 403
    assert read.status_code == 200


async def test_another_ranch_sees_none_of_the_logs(
    tenant_api: AsyncClient, history: dict[str, uuid.UUID], owner: Account
) -> None:
    other = await sign_up(tenant_api, "neighbour")

    logs = await tenant_api.get("/api/milk/herd-logs", headers=other.headers())
    cows = await tenant_api.get(
        "/api/milk/cow-logs", headers=other.headers(), params={"date": "2026-10-05"}
    )
    stats = await tenant_api.get(f"/api/milk/cows/{history['a']}", headers=other.headers())
    deleted = await tenant_api.delete(f"/api/milk/herd-logs/{TODAY}", headers=other.headers())

    assert logs.json() == []
    assert cows.json() == []
    assert stats.status_code == 404
    assert deleted.status_code == 404
