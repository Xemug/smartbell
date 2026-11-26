"""Groups (potreros): the list, the wizard, edit, delete, moving cows, AUTO rules, heifer groups."""

import datetime as dt
import uuid
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import EventType, GroupPreset, GroupType, HistoryKey, Role
from smartbell.jobs.daily import run_ranch
from smartbell.models import Animal, Event, Group, HistoryEntry
from smartbell.routes.animals import get_today
from tests.conftest import Account, add_member, sign_up

TODAY = dt.date(2026, 11, 3)


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def new_cow(api: AsyncClient, account: Account, control_id: str, **fields: Any) -> str:
    body = {
        "control_id": control_id,
        "birth_date": "2022-01-15",
        "last_calving_date": "2026-06-01",
        "lactation_number": 2,
    } | fields
    response = await api.post("/api/animals", headers=account.headers(), json=body)
    assert response.status_code == 201, response.text
    animal_id: str = response.json()["id"]
    return animal_id


async def new_heifer(api: AsyncClient, account: Account, control_id: str, **fields: Any) -> str:
    # Declared a novilla: an AUTO female past a cow's age is taken for a cow (§7.1).
    body = {"control_id": control_id, "birth_date": "2026-01-10", "development_stage": "NOVILLA"}
    body |= fields
    response = await api.post("/api/animals", headers=account.headers(), json=body)
    assert response.status_code == 201, response.text
    assert response.json()["kind"] == "VAQUILLA"
    animal_id: str = response.json()["id"]
    return animal_id


async def groups_by_name(api: AsyncClient, account: Account) -> dict[str, dict[str, Any]]:
    response = await api.get("/api/groups", headers=account.headers())
    assert response.status_code == 200, response.text
    return {g["name"]: g for g in response.json()}


async def history(db: AsyncSession, account: Account) -> list[HistoryEntry]:
    db.expire_all()
    rows = await db.scalars(
        select(HistoryEntry)
        .where(HistoryEntry.ranch_id == account.ranch_id)
        .order_by(HistoryEntry.created_at, HistoryEntry.seq)
    )
    return list(rows)


async def group_of(db: AsyncSession, animal_id: str) -> uuid.UUID | None:
    db.expire_all()
    animal = await db.get_one(Animal, uuid.UUID(animal_id))
    return animal.group_id


async def group_changes(db: AsyncSession, animal_id: str) -> list[Event]:
    rows = await db.scalars(
        select(Event).where(
            Event.animal_id == uuid.UUID(animal_id), Event.type == EventType.GROUP_CHANGE
        )
    )
    return list(rows)


# --- List --------------------------------------------------------------------------------------


async def test_lists_general_then_presets_then_custom_by_name(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    tenant_db.add_all(
        [
            Group(ranch_id=owner.ranch_id, name="Zeta", type=GroupType.CUSTOM),
            Group(
                ranch_id=owner.ranch_id,
                name="General",
                type=GroupType.PRESET,
                preset=GroupPreset.GENERAL,
            ),
            Group(ranch_id=owner.ranch_id, name="Lote 2", type=GroupType.CUSTOM),
            Group(
                ranch_id=owner.ranch_id,
                name="Alta producción",
                type=GroupType.PRESET,
                preset=GroupPreset.ALTA_PRODUCCION,
            ),
        ]
    )
    await tenant_db.commit()

    response = await tenant_api.get("/api/groups", headers=owner.headers())

    assert response.status_code == 200
    body = response.json()
    assert [g["name"] for g in body] == ["General", "Alta producción", "Lote 2", "Zeta"]
    assert body[0]["preset"] == "GENERAL" and body[0]["type"] == "PRESET"
    assert body[2]["preset"] is None


async def test_general_is_created_once_and_counts_cows_with_no_group(
    tenant_api: AsyncClient, owner: Account
) -> None:
    await new_cow(tenant_api, owner, "0001")
    await new_cow(tenant_api, owner, "0002")

    first = await groups_by_name(tenant_api, owner)
    second = await groups_by_name(tenant_api, owner)

    assert list(first) == ["General"] and list(second) == ["General"]
    assert first["General"]["id"] == second["General"]["id"]
    assert first["General"]["animal_count"] == 2


async def test_needs_a_member_of_the_ranch(
    tenant_api: AsyncClient, tenant_db: AsyncSession
) -> None:
    owner = await sign_up(tenant_api, "owner")
    stranger = await sign_up(tenant_api, "stranger")
    vet = await sign_up(tenant_api, "vet")
    await add_member(tenant_db, vet, owner.ranch_id, Role.TECNICO_CAMPO)

    anonymous = await tenant_api.get("/api/groups", headers={"X-Ranch-Id": str(owner.ranch_id)})
    outsider = await tenant_api.get("/api/groups", headers=stranger.headers(owner.ranch_id))
    member = await tenant_api.get("/api/groups", headers=vet.headers(owner.ranch_id))

    assert anonymous.status_code == 401
    assert outsider.status_code in (403, 404)
    assert member.status_code == 200


# --- Create ------------------------------------------------------------------------------------


async def test_manual_group_with_three_cows_lists_them_with_its_kpi(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cows = [await new_cow(tenant_api, owner, f"000{i}") for i in range(1, 5)]
    picked = cows[:3]

    response = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={
            "name": "Lote norte",
            "description": "Las del corral norte",
            "selection": "MANUAL",
            "animal_ids": picked,
            "kpi_indicator": "EN_CELO",
        },
    )

    assert response.status_code == 201, response.text
    group = response.json()
    assert group["type"] == "CUSTOM" and group["animal_count"] == 3
    assert group["kpi_indicator"] == "EN_CELO"
    # Each cow got her open heat alert at registration, so all three count.
    assert group["kpi_value"] == 3
    listed = await tenant_api.get(
        "/api/animals", headers=owner.headers(), params={"group": group["id"]}
    )
    assert sorted(a["id"] for a in listed.json()["items"]) == sorted(picked)
    assert len(await group_changes(tenant_db, picked[0])) == 1
    keys = [e.event_key for e in await history(tenant_db, owner)]
    assert keys[-2:] == [HistoryKey.GROUP_CREATED, HistoryKey.GROUP_ANIMALS_ADDED]
    assert (await history(tenant_db, owner))[-1].n == 3


async def test_preset_takes_its_name_and_cannot_be_created_twice(
    tenant_api: AsyncClient, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0001")
    body = {"preset": "ALTA_PRODUCCION", "animal_ids": [cow]}

    first = await tenant_api.post("/api/groups", headers=owner.headers(), json=body)
    again = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json=body | {"animal_ids": []}
    )

    assert first.status_code == 201 and first.json()["name"] == "Alta producción"
    assert first.json()["type"] == "PRESET"
    assert again.status_code == 409 and again.json()["detail"][0]["type"] == "preset_exists"


async def test_create_refusals(tenant_api: AsyncClient, owner: Account) -> None:
    async def create(body: dict[str, Any]) -> tuple[int, Any]:
        response = await tenant_api.post("/api/groups", headers=owner.headers(), json=body)
        return response.status_code, response.json()

    long_name = await create({"name": "x" * 61})
    no_name = await create({"description": "sin nombre"})
    kpi_alone = await create({"name": "Vacío", "kpi_indicator": "ENFERMAS"})
    auto_without_rule = await create({"name": "Auto", "selection": "AUTO"})
    bad_chip = await create(
        {"name": "Auto", "selection": "AUTO", "auto_filter": {"field": "AGE", "values": ["9"]}}
    )
    await create({"name": "Lote"})
    taken = await create({"name": "lote"})

    assert long_name[0] == 422 and no_name[0] == 422
    assert kpi_alone[0] == 422 and kpi_alone[1]["detail"][0]["type"] == "kpi_needs_animals"
    assert auto_without_rule[0] == 422 and bad_chip[0] == 422
    assert taken[0] == 409 and taken[1]["detail"][0]["type"] == "group_name_taken"


async def test_needs_groups_create(tenant_api: AsyncClient, tenant_db: AsyncSession) -> None:
    owner = await sign_up(tenant_api, "owner")
    nutri = await sign_up(tenant_api, "nutri")
    await add_member(tenant_db, nutri, owner.ranch_id, Role.NUTRIOLOGO)

    response = await tenant_api.post(
        "/api/groups", headers=nutri.headers(owner.ranch_id), json={"name": "Lote"}
    )

    assert response.status_code == 403


# --- AUTO --------------------------------------------------------------------------------------


async def test_auto_group_takes_matching_cows_from_general_only(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    jersey = await new_cow(tenant_api, owner, "0001", breed="JERSEY")
    holstein = await new_cow(tenant_api, owner, "0002")
    kept = await new_cow(tenant_api, owner, "0003", breed="JERSEY")
    manual = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "Mías", "animal_ids": [kept]}
    )
    rule = {"field": "BREED", "values": ["JERSEY"]}

    preview = await tenant_api.post("/api/groups/preview", headers=owner.headers(), json=rule)
    response = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={"name": "Jerseys", "selection": "AUTO", "auto_filter": rule},
    )

    assert preview.json() == [jersey]  # `kept` is in a manual group, so it stays there.
    assert response.status_code == 201, response.text
    auto_id = uuid.UUID(response.json()["id"])
    assert response.json()["animal_count"] == 1
    assert await group_of(tenant_db, jersey) == auto_id
    assert await group_of(tenant_db, holstein) != auto_id
    assert str(await group_of(tenant_db, kept)) == manual.json()["id"]
    by_hand = await tenant_api.post(
        f"/api/groups/{auto_id}/animals", headers=owner.headers(), json={"animal_ids": [holstein]}
    )
    assert by_hand.status_code == 409 and by_hand.json()["detail"] == "group_is_auto"


async def test_auto_rule_change_sends_non_matching_cows_back_to_general(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    second = await new_cow(tenant_api, owner, "0001", lactation_number=2)
    third = await new_cow(tenant_api, owner, "0002", lactation_number=3)
    created = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={
            "name": "Segundo parto",
            "selection": "AUTO",
            "auto_filter": {"field": "LACTATIONS", "values": ["2"]},
        },
    )
    group_id = created.json()["id"]

    edited = await tenant_api.patch(
        f"/api/groups/{group_id}",
        headers=owner.headers(),
        json={"auto_filter": {"field": "LACTATIONS", "values": ["3", "MAS"]}},
    )

    assert edited.status_code == 200, edited.text
    general = (await groups_by_name(tenant_api, owner))["General"]["id"]
    assert str(await group_of(tenant_db, second)) == general
    assert str(await group_of(tenant_db, third)) == group_id


async def test_daily_job_reevaluates_auto_groups(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    created = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={
            "name": "Jerseys",
            "selection": "AUTO",
            "auto_filter": {"field": "BREED", "values": ["JERSEY"]},
        },
    )
    cow = await new_cow(tenant_api, owner, "0001", breed="JERSEY")  # Arrives after the rule.

    run = await run_ranch(tenant_db, owner.ranch_id, TODAY)
    await tenant_db.commit()

    assert run.regrouped == 1
    assert str(await group_of(tenant_db, cow)) == created.json()["id"]
    entry = (await history(tenant_db, owner))[-1]
    assert entry.event_key == HistoryKey.GROUP_ANIMALS_ADDED and entry.user_id is None


# --- Edit --------------------------------------------------------------------------------------


async def test_edit_renames_and_clears_the_indicator(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0001")
    created = await tenant_api.post(
        "/api/groups",
        headers=owner.headers(),
        json={"name": "Lote", "animal_ids": [cow], "kpi_indicator": "DIM"},
    )
    assert created.json()["kpi_value"] == (TODAY - dt.date(2026, 6, 1)).days
    group_id = created.json()["id"]

    edited = await tenant_api.patch(
        f"/api/groups/{group_id}",
        headers=owner.headers(),
        json={"name": "Lote sur", "description": "", "kpi_indicator": None},
    )

    assert edited.status_code == 200
    assert edited.json()["name"] == "Lote sur" and edited.json()["kpi_indicator"] is None
    assert edited.json()["description"] is None
    assert (await history(tenant_db, owner))[-1].event_key == HistoryKey.GROUP_EDITED


async def test_a_preset_keeps_its_name(tenant_api: AsyncClient, owner: Account) -> None:
    general = (await groups_by_name(tenant_api, owner))["General"]["id"]

    response = await tenant_api.patch(
        f"/api/groups/{general}", headers=owner.headers(), json={"name": "Otro"}
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "preset_name_fixed"


# --- Delete ------------------------------------------------------------------------------------


async def test_delete_sends_cows_to_general_with_one_history_entry(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cows = [await new_cow(tenant_api, owner, f"000{i}") for i in range(1, 3)]
    created = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "Lote", "animal_ids": cows}
    )
    group_id = created.json()["id"]
    before = len(await history(tenant_db, owner))

    response = await tenant_api.delete(f"/api/groups/{group_id}", headers=owner.headers())

    assert response.status_code == 200, response.text
    general = (await groups_by_name(tenant_api, owner))["General"]
    assert response.json() == {"to_group_id": general["id"], "to_group": "General", "moved": 2}
    assert "Lote" not in await groups_by_name(tenant_api, owner)
    assert all([str(await group_of(tenant_db, c)) == general["id"] for c in cows])
    assert len(await group_changes(tenant_db, cows[0])) == 2
    entries = await history(tenant_db, owner)
    assert len(entries) == before + 1
    assert entries[-1].event_key == HistoryKey.GROUP_DELETED
    assert entries[-1].refs == {"group_id": general["id"], "group": "Lote", "to_group": "General"}


async def test_delete_to_a_chosen_group_and_general_stays(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0001")
    a = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "A", "animal_ids": [cow]}
    )
    b = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "B"})
    general = (await groups_by_name(tenant_api, owner))["General"]["id"]

    moved = await tenant_api.delete(
        f"/api/groups/{a.json()['id']}",
        headers=owner.headers(),
        params={"to_group_id": b.json()["id"]},
    )
    refused = await tenant_api.delete(f"/api/groups/{general}", headers=owner.headers())

    assert moved.status_code == 200 and moved.json()["to_group"] == "B"
    assert str(await group_of(tenant_db, cow)) == b.json()["id"]
    assert refused.status_code == 409 and refused.json()["detail"] == "general_not_deletable"


async def test_delete_needs_groups_delete(tenant_api: AsyncClient, tenant_db: AsyncSession) -> None:
    owner = await sign_up(tenant_api, "owner")
    tech = await sign_up(tenant_api, "tech")
    await add_member(tenant_db, tech, owner.ranch_id, Role.TECNICO_CAMPO)
    created = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "L"})

    response = await tenant_api.delete(
        f"/api/groups/{created.json()['id']}", headers=tech.headers(owner.ranch_id)
    )

    assert response.status_code == 403


# --- Move --------------------------------------------------------------------------------------


async def test_move_writes_group_change_events_and_one_moved_entry(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cows = [await new_cow(tenant_api, owner, f"000{i}") for i in range(1, 3)]
    a = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "A", "animal_ids": cows}
    )
    b = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "B"})

    response = await tenant_api.post(
        f"/api/groups/{b.json()['id']}/animals",
        headers=owner.headers(),
        json={"animal_ids": [*cows, cows[0]]},
    )
    again = await tenant_api.post(
        f"/api/groups/{b.json()['id']}/animals",
        headers=owner.headers(),
        json={"animal_ids": cows},
    )

    assert response.status_code == 200, response.text
    assert sorted(response.json()["moved"]) == sorted(cows)
    assert sorted(again.json()["unchanged"]) == sorted(cows) and again.json()["moved"] == []
    changes = await group_changes(tenant_db, cows[0])
    assert len(changes) == 2
    assert {
        "from_group_id": a.json()["id"],
        "to_group_id": b.json()["id"],
        "type": "GROUP_CHANGE",
    } in [e.payload for e in changes]
    entry = (await history(tenant_db, owner))[-1]
    assert entry.event_key == HistoryKey.GROUP_ANIMALS_MOVED and entry.n == 2
    assert entry.refs["group"] == "A" and entry.refs["to_group"] == "B"


async def test_move_refuses_another_ranchs_animal(tenant_api: AsyncClient, owner: Account) -> None:
    other = await sign_up(tenant_api, "other")
    theirs = await new_cow(tenant_api, other, "0001")
    group = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "L"})

    response = await tenant_api.post(
        f"/api/groups/{group.json()['id']}/animals",
        headers=owner.headers(),
        json={"animal_ids": [theirs]},
    )
    foreign_group = await tenant_api.post(
        f"/api/groups/{group.json()['id']}/animals",
        headers=other.headers(),
        json={"animal_ids": [theirs]},
    )

    assert response.status_code == 404 and response.json()["detail"] == "animal_not_found"
    assert foreign_group.status_code == 404 and foreign_group.json()["detail"] == "group_not_found"


# --- Heifers -----------------------------------------------------------------------------------


async def test_heifer_groups_by_age_and_state(tenant_api: AsyncClient, owner: Account) -> None:
    newborn = await new_heifer(tenant_api, owner, "V001", birth_date="2026-08-01")
    growing = await new_heifer(tenant_api, owner, "V002", birth_date="2025-09-01")
    older = await new_heifer(tenant_api, owner, "V003", birth_date="2024-06-01")
    served = await new_heifer(
        tenant_api,
        owner,
        "V004",
        birth_date="2025-01-01",
        repro_stage="SERVIDA",
        repro_stage_date="2026-10-20",
        last_service_date="2026-10-20",
    )
    await new_cow(tenant_api, owner, "0001")

    response = await tenant_api.get("/api/groups/heifers", headers=owner.headers())

    assert response.status_code == 200, response.text
    buckets = {g["key"]: [a["id"] for a in g["animals"]] for g in response.json()}
    assert buckets == {
        "RECIEN_NACIDAS": [newborn],
        "EN_DESARROLLO": [growing, older],
        "SERVIDAS": [served],
        "PRENADAS": [],
        "ENFERMAS": [],
    }


# --- Review fixes ------------------------------------------------------------------------------


async def auto_group(api: AsyncClient, account: Account) -> str:
    response = await api.post(
        "/api/groups",
        headers=account.headers(),
        json={
            "name": "Jerseys",
            "selection": "AUTO",
            "auto_filter": {"field": "BREED", "values": ["JERSEY"]},
        },
    )
    assert response.status_code == 201, response.text
    group_id: str = response.json()["id"]
    return group_id


async def test_an_auto_group_takes_no_cows_from_a_delete_or_an_event(
    tenant_api: AsyncClient, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0001")
    auto = await auto_group(tenant_api, owner)
    lote = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "Lote", "animal_ids": [cow]}
    )

    deleted = await tenant_api.delete(
        f"/api/groups/{lote.json()['id']}",
        headers=owner.headers(),
        params={"to_group_id": auto},
    )
    event = await tenant_api.post(
        f"/api/animals/{cow}/events",
        headers=owner.headers(),
        json={
            "occurred_on": TODAY.isoformat(),
            "payload": {"type": "GROUP_CHANGE", "to_group_id": auto},
        },
    )

    assert deleted.status_code == 409 and deleted.json()["detail"] == "group_is_auto"
    assert event.status_code == 422 and event.json()["detail"][0]["type"] == "group_is_auto"


async def test_undoing_a_delete_move_sends_her_to_general_not_the_deleted_group(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    cow = await new_cow(tenant_api, owner, "0001")
    lote = await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "Lote", "animal_ids": [cow]}
    )
    await tenant_api.delete(f"/api/groups/{lote.json()['id']}", headers=owner.headers())
    general = (await groups_by_name(tenant_api, owner))["General"]["id"]
    move = next(
        e for e in await group_changes(tenant_db, cow) if e.payload["to_group_id"] == general
    )

    response = await tenant_api.delete(
        f"/api/animals/{cow}/events/{move.id}", headers=owner.headers()
    )

    assert response.status_code in (200, 204), response.text
    assert await group_of(tenant_db, cow) is None  # No group: General.


async def test_a_move_from_several_groups_is_sent_not_moved(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    one = await new_cow(tenant_api, owner, "0001")
    two = await new_cow(tenant_api, owner, "0002")
    await tenant_api.post(
        "/api/groups", headers=owner.headers(), json={"name": "A", "animal_ids": [one]}
    )
    b = await tenant_api.post("/api/groups", headers=owner.headers(), json={"name": "B"})

    await tenant_api.post(
        f"/api/groups/{b.json()['id']}/animals",
        headers=owner.headers(),
        json={"animal_ids": [one, two]},
    )

    entry = (await history(tenant_db, owner))[-1]
    assert entry.event_key == HistoryKey.GROUP_ANIMALS_SENT and entry.n == 2
    assert entry.refs["to_group"] == "B"
