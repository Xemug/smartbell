"""Bull groups (`put-bulls-on-the-ranch-into-bull-groups`): bulls on the ranch (EN_RANCHO or
AMBOS) go into bull groups, picked by hand; a semen-only bull is in none; kinds never mix."""

import datetime as dt
import uuid
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import EventType
from smartbell.models import Animal, Event
from smartbell.routes.animals import get_today
from smartbell.services import history
from smartbell.services.history import render
from tests.conftest import Account, sign_up

TODAY = dt.date(2026, 11, 3)


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def register(api: AsyncClient, account: Account, **body: Any) -> Response:
    return await api.post("/api/animals", headers=account.headers(), json=body)


async def bull(api: AsyncClient, account: Account, control_id: str, **body: Any) -> str:
    response = await register(
        api, account, control_id=control_id, sex="MACHO", birth_date="2020-01-01", **body
    )
    assert response.status_code == 201, response.text
    assert response.json()["kind"] == "TORO"
    animal_id: str = response.json()["id"]
    return animal_id


async def cow(api: AsyncClient, account: Account, control_id: str) -> str:
    response = await register(
        api,
        account,
        control_id=control_id,
        birth_date="2022-01-15",
        last_calving_date="2026-06-01",
        lactation_number=2,
    )
    assert response.status_code == 201, response.text
    animal_id: str = response.json()["id"]
    return animal_id


async def bull_group(api: AsyncClient, account: Account, name: str = "Toros 1", **body: Any) -> str:
    response = await api.post(
        "/api/groups", headers=account.headers(), json={"name": name, "type": "TORO"} | body
    )
    assert response.status_code == 201, response.text
    assert response.json()["type"] == "TORO"
    group_id: str = response.json()["id"]
    return group_id


async def move(api: AsyncClient, account: Account, group_id: str, *ids: str) -> Response:
    return await api.post(
        f"/api/groups/{group_id}/animals", headers=account.headers(), json={"animal_ids": ids}
    )


async def counts(api: AsyncClient, account: Account) -> dict[str, int]:
    response = await api.get("/api/groups", headers=account.headers())
    assert response.status_code == 200, response.text
    return {g["name"]: g["animal_count"] for g in response.json()}


async def group_of(db: AsyncSession, animal_id: str) -> uuid.UUID | None:
    db.expire_all()
    return (await db.get_one(Animal, uuid.UUID(animal_id))).group_id


async def moves(db: AsyncSession, animal_id: str) -> list[dict[str, Any]]:
    rows = await db.scalars(
        select(Event)
        .where(Event.animal_id == uuid.UUID(animal_id), Event.type == EventType.GROUP_CHANGE)
        .order_by(Event.created_at)
    )
    return [row.payload for row in rows]


async def history_texts(db: AsyncSession, account: Account) -> list[str]:
    db.expire_all()
    return [render(entry) for entry in await history.entries(db, account.ranch_id)]


def code(response: Response) -> str:
    detail = response.json()["detail"]
    return str(detail if isinstance(detail, str) else detail[0]["type"])


async def test_bulls_on_the_ranch_are_registered_and_moved_into_a_bull_group(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    toros = await bull_group(tenant_api, owner)
    registered = await bull(tenant_api, owner, "T1", group_id=toros)
    both = await bull(tenant_api, owner, "T2", bull_availability="AMBOS")

    moved = await move(tenant_api, owner, toros, both)

    assert moved.status_code == 200, moved.text
    assert moved.json()["moved"] == [both]
    assert str(await group_of(tenant_db, registered)) == toros
    assert await moves(tenant_db, both) == [
        {"type": "GROUP_CHANGE", "to_group_id": toros}
    ]  # On his bitácora.
    assert (await counts(tenant_api, owner))["Toros 1"] == 2


async def test_a_bull_is_moved_into_a_bull_group_from_his_profile_or_an_edit(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    first, second = await bull_group(tenant_api, owner), await bull_group(tenant_api, owner, "B")
    toro = await bull(tenant_api, owner, "T1")

    recorded = await tenant_api.post(
        f"/api/animals/{toro}/events",
        headers=owner.headers(),
        json={
            "occurred_on": TODAY.isoformat(),
            "payload": {"type": "GROUP_CHANGE", "to_group_id": first},
        },
    )
    edited = await tenant_api.patch(
        f"/api/animals/{toro}", headers=owner.headers(), json={"group_id": second}
    )

    assert recorded.status_code == 201, recorded.text
    assert edited.status_code == 200, edited.text
    assert str(await group_of(tenant_db, toro)) == second
    assert [m["to_group_id"] for m in await moves(tenant_db, toro)] == [first, second]
    assert "Se cambió 1 toro a grupo Toros 1" in await history_texts(tenant_db, owner)


async def test_a_semen_only_bull_joins_no_bull_group(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    toros = await bull_group(tenant_api, owner)
    semen = await bull(tenant_api, owner, "T1", bull_availability="SEMEN")

    registered = await register(
        tenant_api,
        owner,
        control_id="T2",
        sex="MACHO",
        birth_date="2020-01-01",
        bull_availability="SEMEN",
        group_id=toros,
    )
    moved = await move(tenant_api, owner, toros, semen)
    edited = await tenant_api.patch(
        f"/api/animals/{semen}", headers=owner.headers(), json={"group_id": toros}
    )

    assert registered.status_code == 422 and code(registered) == "bull_semen_only"
    assert moved.status_code == 409 and code(moved) == "bull_semen_only"
    assert edited.status_code == 422 and code(edited) == "bull_semen_only"
    assert await group_of(tenant_db, semen) is None


async def test_switching_to_semen_only_takes_him_out_of_his_group(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    toros = await bull_group(tenant_api, owner)
    leaving = await bull(tenant_api, owner, "T1", group_id=toros)
    staying = await bull(tenant_api, owner, "T2", group_id=toros)

    switched = await tenant_api.patch(
        f"/api/animals/{leaving}", headers=owner.headers(), json={"bull_availability": "SEMEN"}
    )

    assert switched.status_code == 200, switched.text
    assert switched.json()["group_id"] is None
    assert await moves(tenant_db, leaving) == [
        {"type": "GROUP_CHANGE", "from_group_id": toros}  # No to_group_id: into no group.
    ]
    assert str(await group_of(tenant_db, staying)) == toros
    assert (await counts(tenant_api, owner))["Toros 1"] == 1
    # His profile reads the move back.
    events = await tenant_api.get(f"/api/animals/{leaving}/events", headers=owner.headers())
    assert events.status_code == 200, events.text
    assert "GROUP_CHANGE" in [e["type"] for e in events.json()]


async def test_kinds_never_mix(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    toros = await bull_group(tenant_api, owner)
    lote = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "Lote"})
    lote_id = lote.json()["id"]
    vaca = await cow(tenant_api, owner, "0001")
    toro = await bull(tenant_api, owner, "T1")

    cow_in = await move(tenant_api, owner, toros, vaca)
    bull_in = await move(tenant_api, owner, lote_id, toro)
    registered = await register(
        tenant_api, owner, control_id="T2", sex="MACHO", birth_date="2020-01-01", group_id=lote_id
    )
    cow_edit = await tenant_api.patch(
        f"/api/animals/{vaca}", headers=owner.headers(), json={"group_id": toros}
    )
    bull_event = await tenant_api.post(
        f"/api/animals/{toro}/events",
        headers=owner.headers(),
        json={
            "occurred_on": TODAY.isoformat(),
            "payload": {"type": "GROUP_CHANGE", "to_group_id": lote_id},
        },
    )

    assert cow_in.status_code == 409 and code(cow_in) == "not_a_bull"
    assert bull_in.status_code == 409 and code(bull_in) == "not_a_cow"
    assert registered.status_code == 422 and code(registered) == "not_a_cow"
    assert cow_edit.status_code == 422 and code(cow_edit) == "not_a_bull"
    assert bull_event.status_code == 422 and code(bull_event) == "not_a_cow"
    assert await group_of(tenant_db, vaca) is None and await group_of(tenant_db, toro) is None


async def test_bull_groups_are_manual_with_no_indicator_and_count_bulls_only(
    tenant_api: AsyncClient, owner: Account
) -> None:
    auto = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={
            "name": "Auto",
            "type": "TORO",
            "selection": "AUTO",
            "auto_filter": {"field": "BREED", "values": ["JERSEY"]},
        },
    )
    kpi = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={"name": "Kpi", "type": "TORO", "kpi_indicator": "EN_CELO"},
    )
    toros = await bull_group(tenant_api, owner)
    await bull(tenant_api, owner, "T1", group_id=toros)
    await cow(tenant_api, owner, "0001")
    later = await tenant_api.patch(
        f"/api/groups/{toros}", headers=owner.headers(), json={"kpi_indicator": "EN_CELO"}
    )

    assert auto.status_code == 422 and kpi.status_code == 422
    assert later.status_code == 422 and code(later) == "bull_group_no_kpi"
    assert await counts(tenant_api, owner) == {"General": 1, "Toros 1": 1}


async def test_deleting_a_bull_group_leaves_its_bulls_in_none_or_another_bull_group(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    first, second = await bull_group(tenant_api, owner), await bull_group(tenant_api, owner, "B")
    lote = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "Lote"})
    toro = await bull(tenant_api, owner, "T1", group_id=first)
    other = await bull(tenant_api, owner, "T2", group_id=second)

    to_cows = await tenant_api.delete(
        f"/api/groups/{first}?to_group_id={lote.json()['id']}", headers=owner.headers()
    )
    to_bulls = await tenant_api.delete(
        f"/api/groups/{first}?to_group_id={second}", headers=owner.headers()
    )
    out = await tenant_api.delete(f"/api/groups/{second}", headers=owner.headers())

    assert to_cows.status_code == 409 and code(to_cows) == "not_a_cow"
    assert to_bulls.status_code == 200, to_bulls.text
    assert to_bulls.json() == {"to_group_id": second, "to_group": "B", "moved": 1}
    assert out.status_code == 200, out.text
    assert out.json() == {"to_group_id": None, "to_group": None, "moved": 2}
    assert await group_of(tenant_db, toro) is None and await group_of(tenant_db, other) is None
    assert (await moves(tenant_db, other))[-1].get("to_group_id") is None
    texts = await history_texts(tenant_db, owner)
    assert "Se eliminó el grupo Toros 1 y los toros se enviaron a grupo B" in texts
    assert "Se eliminó el grupo B y sus toros quedaron sin grupo" in texts
