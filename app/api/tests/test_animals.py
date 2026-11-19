"""The animal registry API (`animal-api`): create, read, edit, remove, list."""

import datetime as dt
import uuid
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import EventType, GroupPreset, GroupType, HistoryKey, Role
from smartbell.models import Animal, Event, Group, HistoryEntry
from smartbell.routes.animals import get_today
from tests.conftest import Account, add_member, sign_up

TODAY = dt.date(2026, 11, 3)
COW_BIRTH = "2022-01-15"


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def create(
    api: AsyncClient, account: Account, ranch_id: uuid.UUID | None = None, **body: Any
) -> Response:
    return await api.post("/api/animals", headers=account.headers(ranch_id), json=body)


async def created(api: AsyncClient, account: Account, **body: Any) -> dict[str, Any]:
    response = await create(api, account, **body)
    assert response.status_code == 201, response.text
    result: dict[str, Any] = response.json()
    return result


def cow(control_id: str, **fields: Any) -> dict[str, Any]:
    """A cow that calved in June and is open, unless `fields` say otherwise."""
    return {
        "control_id": control_id,
        "birth_date": COW_BIRTH,
        "last_calving_date": "2026-06-01",
        "lactation_number": 2,
    } | fields


def field_error(response: Response) -> tuple[list[str], str]:
    (error,) = response.json()["detail"]
    return error["loc"], error["type"]


# --- Create ------------------------------------------------------------------------------------


async def test_only_id_and_birth_date_are_required(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    body = await created(tenant_api, owner, control_id="Pinta 01", birth_date="2026-01-10")

    assert body["sex"] == "HEMBRA"
    assert body["kind"] == "VAQUILLA"
    assert body["breed"] == "HOLSTEIN"
    assert body["crossbreed_level"] == "FB"
    assert body["development_stage"] == "AUTO"
    assert body["projection"]["development_stage"] == "DESTETADA"
    animal_id = uuid.UUID(body["id"])
    alta = await tenant_db.scalar(select(Event).where(Event.animal_id == animal_id))
    assert alta is not None and alta.type is EventType.ALTA and alta.occurred_on == TODAY
    entry = await tenant_db.scalar(select(HistoryEntry))
    assert entry is not None and entry.event_key == HistoryKey.ANIMALS_ADDED
    assert entry.refs["animal_ids"] == [str(animal_id)]


async def test_gestante_cow_with_service_date_gets_a_calving_window(
    tenant_api: AsyncClient, owner: Account
) -> None:
    body = await created(
        tenant_api,
        owner,
        **cow(
            "0100",
            repro_stage="GESTANTE",
            repro_stage_date="2026-09-20",
            last_service_date="2026-08-10",
        ),
    )

    assert body["kind"] == "VACA"
    assert body["repro_state"] == "GESTANTE"
    expected = dt.date(2026, 8, 10) + dt.timedelta(days=283)  # Gestation, ±3 days (§7.6).
    assert body["expected_calving_date"] == expected.isoformat()
    window = body["projection"]["calving"]
    assert window == {
        "start": (expected - dt.timedelta(days=3)).isoformat(),
        "end": (expected + dt.timedelta(days=3)).isoformat(),
    }


async def test_duplicate_control_id_is_a_409_on_the_field(
    tenant_api: AsyncClient, owner: Account
) -> None:
    await created(tenant_api, owner, control_id="0100", birth_date=COW_BIRTH)

    response = await create(tenant_api, owner, control_id="0100", birth_date=COW_BIRTH)

    assert response.status_code == 409
    assert field_error(response) == (["body", "control_id"], "control_id_taken")


@pytest.mark.parametrize("control_id", ["Vaca_1", "Vaca#1", "a/b", "   "])
async def test_control_id_charset(tenant_api: AsyncClient, owner: Account, control_id: str) -> None:
    response = await create(tenant_api, owner, control_id=control_id, birth_date=COW_BIRTH)

    assert response.status_code == 422


async def test_control_id_takes_letters_digits_n_tilde_spaces_and_hyphens(
    tenant_api: AsyncClient, owner: Account
) -> None:
    body = await created(tenant_api, owner, control_id=" Peña 0001-A ", birth_date=COW_BIRTH)

    assert body["control_id"] == "Peña 0001-A"


async def test_birth_date_cannot_be_in_the_future(tenant_api: AsyncClient, owner: Account) -> None:
    response = await create(tenant_api, owner, control_id="1", birth_date="2026-11-04")

    assert response.status_code == 422
    assert field_error(response) == (["body", "birth_date"], "date_in_future")


async def test_last_calving_needs_660_days_of_age(tenant_api: AsyncClient, owner: Account) -> None:
    birth = dt.date(2024, 1, 1)
    too_soon = birth + dt.timedelta(days=659)
    response = await create(
        tenant_api, owner, **cow("1", birth_date=birth.isoformat(), last_calving_date=str(too_soon))
    )
    assert response.status_code == 422
    assert field_error(response) == (["body", "last_calving_date"], "calving_too_young")

    on_time = birth + dt.timedelta(days=660)
    await created(
        tenant_api, owner, **cow("2", birth_date=birth.isoformat(), last_calving_date=str(on_time))
    )


async def test_crossbreed_below_fb_needs_a_contributing_breed(
    tenant_api: AsyncClient, owner: Account
) -> None:
    response = await create(
        tenant_api, owner, control_id="1", birth_date=COW_BIRTH, crossbreed_level="F2"
    )
    assert response.status_code == 422
    assert field_error(response) == (["body", "contributing_breed"], "contributing_breed_required")

    body = await created(
        tenant_api,
        owner,
        control_id="2",
        birth_date=COW_BIRTH,
        crossbreed_level="F2",
        contributing_breed="JERSEY",
    )
    assert body["contributing_breed"] == "JERSEY"


async def test_stage_must_match_sex_and_repro_inputs_are_female_only(
    tenant_api: AsyncClient, owner: Account
) -> None:
    stage = await create(
        tenant_api, owner, control_id="1", birth_date=COW_BIRTH, sex="MACHO",
        development_stage="NOVILLA",
    )  # fmt: skip
    repro = await create(
        tenant_api, owner, control_id="2", birth_date=COW_BIRTH, sex="MACHO",
        repro_stage="ABIERTA",
    )  # fmt: skip

    assert field_error(stage) == (["body", "development_stage"], "stage_does_not_match_sex")
    assert field_error(repro) == (["body", "repro_stage"], "female_only")


async def test_a_heifer_over_30_months_is_flagged_not_fertile(
    tenant_api: AsyncClient, owner: Account
) -> None:
    # Declared a novilla: an AUTO female this old is taken for a cow with one lactation (§7.1).
    body = await created(
        tenant_api, owner, control_id="1", birth_date="2024-01-01", development_stage="NOVILLA"
    )

    assert body["kind"] == "VAQUILLA"
    assert body["projection"]["warnings"] == ["NOT_FERTILE"]


async def test_a_bull_gets_his_kind_from_age(tenant_api: AsyncClient, owner: Account) -> None:
    body = await created(
        tenant_api, owner, control_id="T1", name="Trueno", birth_date=COW_BIRTH, sex="MACHO"
    )
    assert body["kind"] == "TORO"
    assert body["repro_state"] is None

    taken = await create(
        tenant_api, owner, control_id="T2", name="Trueno", birth_date=COW_BIRTH, sex="MACHO"
    )
    assert field_error(taken) == (["body", "name"], "name_taken")


# --- SINIIGA (§7.7) ----------------------------------------------------------------------------

NUMBER = "1412345678"
STORED = "MX-00-14-1234-5678"


@pytest.fixture
async def neighbor(tenant_api: AsyncClient) -> Account:
    """Another owner with a ranch of their own."""
    return await sign_up(tenant_api, "neighbor")


async def test_siniiga_is_stored_in_its_long_form(tenant_api: AsyncClient, owner: Account) -> None:
    body = await created(tenant_api, owner, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)
    again = await created(tenant_api, owner, control_id="2", birth_date=COW_BIRTH, siniiga="")

    assert body["siniiga"] == STORED
    assert again["siniiga"] is None


@pytest.mark.parametrize(
    "siniiga", ["141234567", "14123456789", "0012345678", "3312345678", "14-1234-567X"]
)
async def test_siniiga_with_a_bad_length_or_state_is_a_422(
    tenant_api: AsyncClient, owner: Account, siniiga: str
) -> None:
    response = await create(
        tenant_api, owner, control_id="1", birth_date=COW_BIRTH, siniiga=siniiga
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "siniiga"]


async def test_siniiga_held_in_another_ranch_is_refused_without_naming_it(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    holder = await created(
        tenant_api, owner, control_id="Lucera", birth_date=COW_BIRTH, siniiga=NUMBER
    )

    response = await create(
        tenant_api, neighbor, control_id="Nueva", birth_date=COW_BIRTH, siniiga=STORED
    )

    assert response.status_code == 409
    assert field_error(response) == (["body", "siniiga"], "siniiga_taken")
    text = response.text
    for secret in ("Lucera", holder["id"], str(owner.ranch_id), "Mi rancho", owner.uid):
        assert secret not in text


async def remove(
    api: AsyncClient, account: Account, animal_id: str, reason: str, **body: Any
) -> Response:
    return await api.post(
        f"/api/animals/{animal_id}/removal",
        headers=account.headers(),
        json={"reason": reason} | body,
    )


@pytest.mark.parametrize("reason", ["MUERTE", "VENTA_RASTRO"])
async def test_a_retired_siniiga_is_refused_in_every_ranch(
    tenant_api: AsyncClient, owner: Account, neighbor: Account, reason: str
) -> None:
    holder = await created(tenant_api, owner, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)
    assert (await remove(tenant_api, owner, holder["id"], reason)).status_code == 200

    here = await create(tenant_api, owner, control_id="2", birth_date=COW_BIRTH, siniiga=NUMBER)
    there = await create(tenant_api, neighbor, control_id="2", birth_date=COW_BIRTH, siniiga=NUMBER)

    assert here.status_code == there.status_code == 409


async def test_a_siniiga_sold_to_another_ranch_can_be_registered_by_the_buyer(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    holder = await created(tenant_api, owner, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)
    early = await create(tenant_api, neighbor, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)
    assert early.status_code == 409  # The seller hasn't recorded the sale yet.

    assert (await remove(tenant_api, owner, holder["id"], "VENTA_OTRO_RANCHO")).status_code == 200
    bought = await created(
        tenant_api, neighbor, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER
    )

    assert bought["siniiga"] == STORED


async def test_a_siniiga_deleted_as_an_error_is_free_again(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    holder = await created(tenant_api, owner, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)
    assert (await remove(tenant_api, owner, holder["id"], "ERROR_REGISTRO")).status_code == 204

    await created(tenant_api, neighbor, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)


# --- Parents -----------------------------------------------------------------------------------


async def count_animals(db: AsyncSession) -> int:
    return await db.scalar(select(func.count()).select_from(Animal)) or 0


async def test_a_heifer_with_a_new_dam_creates_both_linked(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    body = await created(
        tenant_api,
        owner,
        control_id="Hija",
        birth_date="2026-03-01",
        dam={"control_id": "Madre", "birth_date": "2020-05-01"},
        sire={"control_id": "Toro 7", "birth_date": "2019-05-01", "name": "Relámpago"},
    )

    dam = await tenant_db.scalar(select(Animal).where(Animal.control_id == "Madre"))
    sire = await tenant_db.scalar(select(Animal).where(Animal.control_id == "Toro 7"))
    assert dam is not None and sire is not None
    assert body["dam_id"] == str(dam.id) and body["sire_id"] == str(sire.id)
    assert dam.sex.value == "HEMBRA" and sire.sex.value == "MACHO"
    assert body["created_ids"] == [str(dam.id), str(sire.id), body["id"]]
    entry = await tenant_db.scalar(select(HistoryEntry))
    assert entry is not None and entry.n == 3


async def test_a_refused_heifer_leaves_no_dam_behind(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    await created(tenant_api, owner, control_id="Hija", birth_date="2026-03-01")

    response = await create(
        tenant_api,
        owner,
        control_id="Hija",
        birth_date="2026-03-01",
        dam={"control_id": "Madre", "birth_date": "2020-05-01"},
    )

    assert response.status_code == 409
    assert await count_animals(tenant_db) == 1


async def test_an_inline_dam_is_validated_under_its_own_key(
    tenant_api: AsyncClient, owner: Account
) -> None:
    response = await create(
        tenant_api,
        owner,
        control_id="Hija",
        birth_date="2026-03-01",
        dam={"control_id": "Madre", "birth_date": "2020-05-01", "crossbreed_level": "F1"},
    )

    assert field_error(response) == (
        ["body", "dam", "contributing_breed"],
        "contributing_breed_required",
    )


async def test_an_existing_dam_must_be_a_female_of_this_ranch(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    bull = await created(tenant_api, owner, control_id="T", birth_date=COW_BIRTH, sex="MACHO")
    theirs = await created(tenant_api, neighbor, control_id="M", birth_date=COW_BIRTH)

    wrong_sex = await create(
        tenant_api, owner, control_id="1", birth_date="2026-03-01", dam_id=bull["id"]
    )
    elsewhere = await create(
        tenant_api, owner, control_id="1", birth_date="2026-03-01", dam_id=theirs["id"]
    )

    assert field_error(wrong_sex) == (["body", "dam_id"], "parent_wrong_sex")
    assert field_error(elsewhere) == (["body", "dam_id"], "parent_not_found")


async def test_a_dead_dam_is_removed_when_her_heifer_is_registered(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    dam = await created(tenant_api, owner, **cow("Madre"))

    await created(
        tenant_api,
        owner,
        control_id="Hija",
        birth_date="2026-03-01",
        dam_id=dam["id"],
        dam_status="MUERTA_DESECHO",
    )

    row = await tenant_db.get(Animal, uuid.UUID(dam["id"]))
    assert row is not None
    assert row.status.value == "REMOVED" and row.removed_reason is not None
    assert row.removed_reason.value == "MUERTE"
    removal = await tenant_db.scalar(
        select(Event).where(Event.animal_id == row.id, Event.type == EventType.REMOVAL)
    )
    assert removal is not None


async def test_a_live_dam_stays_active(tenant_api: AsyncClient, owner: Account) -> None:
    dam = await created(tenant_api, owner, **cow("Madre"))

    await created(
        tenant_api, owner, control_id="Hija", birth_date="2026-03-01", dam_id=dam["id"],
        dam_status="VIVA",
    )  # fmt: skip

    response = await tenant_api.get(f"/api/animals/{dam['id']}", headers=owner.headers())
    assert response.json()["status"] == "ACTIVE"


# --- Remove ------------------------------------------------------------------------------------


async def test_error_registro_deletes_the_row_and_its_events(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    body = await created(tenant_api, owner, **cow("1"))

    response = await remove(tenant_api, owner, body["id"], "ERROR_REGISTRO")

    assert response.status_code == 204
    animal_id = uuid.UUID(body["id"])
    assert await tenant_db.get(Animal, animal_id) is None
    events = await tenant_db.scalar(
        select(func.count()).select_from(Event).where(Event.animal_id == animal_id)
    )
    assert events == 0
    keys = (await tenant_db.scalars(select(HistoryEntry.event_key))).all()
    assert HistoryKey.ANIMALS_REMOVED_ERROR in keys


async def test_other_reasons_keep_the_row_and_events_as_removed(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    body = await created(tenant_api, owner, **cow("1"))

    response = await remove(tenant_api, owner, body["id"], "VENTA_RASTRO", removed_on="2026-11-01")

    assert response.status_code == 200
    assert response.json()["status"] == "REMOVED"
    assert response.json()["removed_reason"] == "VENTA_RASTRO"
    assert response.json()["removed_at"].startswith("2026-11-01")
    types = (
        await tenant_db.scalars(select(Event.type).where(Event.animal_id == uuid.UUID(body["id"])))
    ).all()
    assert sorted(types) == [EventType.ALTA, EventType.REMOVAL]
    again = await remove(tenant_api, owner, body["id"], "MUERTE")
    assert again.status_code == 409


async def test_a_removal_date_cannot_be_in_the_future(
    tenant_api: AsyncClient, owner: Account
) -> None:
    body = await created(tenant_api, owner, **cow("1"))

    response = await remove(tenant_api, owner, body["id"], "MUERTE", removed_on="2026-11-04")

    assert field_error(response) == (["body", "removed_on"], "date_in_future")


async def test_a_retired_animal_cannot_be_deleted_to_free_its_siniiga(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    holder = await created(tenant_api, owner, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)
    await remove(tenant_api, owner, holder["id"], "MUERTE")

    deleted = await remove(tenant_api, owner, holder["id"], "ERROR_REGISTRO")
    reused = await create(
        tenant_api, neighbor, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER
    )

    assert deleted.status_code == 409
    assert reused.status_code == 409


async def test_a_bull_named_in_another_cows_events_cannot_be_deleted(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    bull = await created(tenant_api, owner, control_id="T", birth_date=COW_BIRTH, sex="MACHO")
    served = await created(tenant_api, owner, **cow("1"))
    tenant_db.add(
        Event(
            ranch_id=owner.ranch_id,
            animal_id=uuid.UUID(served["id"]),
            type=EventType.HEAT,
            occurred_on=dt.date(2026, 10, 1),
            payload={"type": "HEAT", "outcome": "INSEMINATED", "clean": True,
                     "bull_id": bull["id"], "method": "IA"},
        )
    )  # fmt: skip
    await tenant_db.commit()

    response = await remove(tenant_api, owner, bull["id"], "ERROR_REGISTRO")

    assert response.status_code == 409
    assert response.json()["detail"] == "animal_in_use"


# --- Edit --------------------------------------------------------------------------------------


async def patch(api: AsyncClient, account: Account, animal_id: str, **body: Any) -> Response:
    return await api.patch(f"/api/animals/{animal_id}", headers=account.headers(), json=body)


async def test_edit_changes_only_what_is_sent(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    body = await created(tenant_api, owner, **cow("1", siniiga=NUMBER))

    response = await patch(
        tenant_api, owner, body["id"], control_id="Uno", crossbreed_level="F1",
        contributing_breed="JERSEY",
    )  # fmt: skip

    assert response.status_code == 200, response.text
    edited = response.json()
    assert edited["control_id"] == "Uno"
    assert edited["siniiga"] == STORED
    assert edited["contributing_breed"] == "JERSEY"
    keys = (await tenant_db.scalars(select(HistoryEntry.event_key))).all()
    assert HistoryKey.ANIMALS_EDITED in keys

    pure = await patch(tenant_api, owner, body["id"], crossbreed_level="FB")
    assert pure.json()["contributing_breed"] is None
    cleared = await patch(tenant_api, owner, body["id"], siniiga=None)
    assert cleared.json()["siniiga"] is None
    required = await patch(tenant_api, owner, body["id"], control_id=None)
    assert field_error(required) == (["body", "control_id"], "required")


async def test_edit_keeps_ids_unique(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    first = await created(tenant_api, owner, control_id="1", birth_date=COW_BIRTH)
    await created(tenant_api, owner, control_id="2", birth_date=COW_BIRTH)
    await created(tenant_api, neighbor, control_id="1", birth_date=COW_BIRTH, siniiga=NUMBER)

    same = await patch(tenant_api, owner, first["id"], control_id="1")
    taken = await patch(tenant_api, owner, first["id"], control_id="2")
    siniiga = await patch(tenant_api, owner, first["id"], siniiga=NUMBER)

    assert same.status_code == 200
    assert field_error(taken) == (["body", "control_id"], "control_id_taken")
    assert field_error(siniiga) == (["body", "siniiga"], "siniiga_taken")


async def test_a_heifer_birth_date_must_keep_her_24_months_or_younger(
    tenant_api: AsyncClient, owner: Account
) -> None:
    body = await created(tenant_api, owner, control_id="1", birth_date="2025-06-01")

    ok = await patch(tenant_api, owner, body["id"], birth_date="2024-11-03")
    too_old = await patch(tenant_api, owner, body["id"], birth_date="2024-11-02")

    assert ok.status_code == 200
    assert field_error(too_old) == (["body", "birth_date"], "heifer_too_old")


async def test_a_cow_birth_date_must_leave_660_days_before_her_calving(
    tenant_api: AsyncClient, owner: Account
) -> None:
    body = await created(tenant_api, owner, **cow("1"))

    response = await patch(tenant_api, owner, body["id"], birth_date="2025-06-01")

    assert field_error(response) == (["body", "birth_date"], "calving_too_young")


async def test_a_birth_date_cannot_move_after_recorded_history(
    tenant_api: AsyncClient, owner: Account
) -> None:
    body = await created(
        tenant_api, owner, control_id="1", birth_date="2024-01-01", repro_stage="SERVIDA",
        repro_stage_date="2025-06-01",
    )  # fmt: skip

    response = await patch(tenant_api, owner, body["id"], birth_date="2025-07-01")

    assert field_error(response) == (["body", "birth_date"], "birth_after_records")


async def test_parents_are_born_before_their_offspring(
    tenant_api: AsyncClient, owner: Account
) -> None:
    late_dam = await create(
        tenant_api, owner, control_id="Hija", birth_date="2026-03-01",
        dam={"control_id": "Madre", "birth_date": "2026-04-01"},
    )  # fmt: skip
    assert field_error(late_dam) == (["body", "dam", "birth_date"], "parent_born_after")

    dam = await created(tenant_api, owner, **cow("Madre"))
    calf = await created(
        tenant_api, owner, control_id="Hija", birth_date="2026-03-01", dam_id=dam["id"]
    )
    cycle = await patch(tenant_api, owner, dam["id"], dam_id=calf["id"])
    younger = await patch(tenant_api, owner, dam["id"], birth_date="2026-03-02")

    assert field_error(cycle) == (["body", "dam_id"], "parent_born_after")
    assert field_error(younger)[0] == ["body", "birth_date"]


async def test_a_removed_animal_cannot_be_edited(tenant_api: AsyncClient, owner: Account) -> None:
    body = await created(tenant_api, owner, **cow("1"))
    await remove(tenant_api, owner, body["id"], "MUERTE")

    response = await patch(tenant_api, owner, body["id"], control_id="2")

    assert response.status_code == 409


# --- Read and list -----------------------------------------------------------------------------


async def listing(api: AsyncClient, account: Account, **params: Any) -> dict[str, Any]:
    response = await api.get("/api/animals", headers=account.headers(), params=params)
    assert response.status_code == 200, response.text
    result: dict[str, Any] = response.json()
    return result


def ids(page: dict[str, Any]) -> list[str]:
    return [item["control_id"] for item in page["items"]]


async def test_filter_by_repro_state_and_general_group(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    general = Group(
        ranch_id=owner.ranch_id, name="General", type=GroupType.PRESET, preset=GroupPreset.GENERAL
    )
    custom = Group(ranch_id=owner.ranch_id, name="Lote 2", type=GroupType.CUSTOM)
    tenant_db.add_all([general, custom])
    await tenant_db.commit()
    served = {"repro_stage": "SERVIDA", "repro_stage_date": "2026-10-20"}
    await created(tenant_api, owner, **cow("A", **served))  # No group: General.
    await created(tenant_api, owner, **cow("B", group_id=str(general.id), **served))
    await created(tenant_api, owner, **cow("C", group_id=str(custom.id), **served))
    await created(tenant_api, owner, **cow("D"))  # Open, in General.
    await created(tenant_api, owner, control_id="E", birth_date="2025-06-01")  # Heifer.

    page = await listing(tenant_api, owner, repro="SERVIDA", group="GENERAL")
    by_group_id = await listing(tenant_api, owner, repro="SERVIDA", group=str(custom.id))

    assert ids(page) == ["A", "B"] and page["total"] == 2
    assert ids(by_group_id) == ["C"]


async def test_list_search_kind_sort_and_pages_of_ten(
    tenant_api: AsyncClient, owner: Account
) -> None:
    for number in range(12):
        await created(tenant_api, owner, **cow(f"V-{number:02}"))
    await created(tenant_api, owner, control_id="Becerra", birth_date="2026-05-01")

    first = await listing(tenant_api, owner, kind="VACA")
    second = await listing(tenant_api, owner, kind="VACA", page=2)
    newest = await listing(tenant_api, owner, sort="-control_id", page_size=1)
    search = await listing(tenant_api, owner, q="becer")
    literal = await listing(tenant_api, owner, q="%")

    assert first["total"] == 12 and len(first["items"]) == 10 and first["page_size"] == 10
    assert ids(second) == ["V-10", "V-11"]
    assert ids(newest) == ["V-11"]
    assert ids(search) == ["Becerra"]
    assert literal["total"] == 0


async def test_removed_animals_are_listed_only_by_reason(
    tenant_api: AsyncClient, owner: Account
) -> None:
    sold = await created(tenant_api, owner, **cow("Vendida"))
    await created(tenant_api, owner, **cow("Activa"))
    await remove(tenant_api, owner, sold["id"], "VENTA_OTRO_RANCHO")

    active = await listing(tenant_api, owner)
    removed = await listing(tenant_api, owner, removed_reason="VENTA_OTRO_RANCHO")
    dead = await listing(tenant_api, owner, removed_reason="MUERTE")

    assert ids(active) == ["Activa"]
    assert ids(removed) == ["Vendida"]
    assert dead["total"] == 0


async def test_health_and_breed_filters(tenant_api: AsyncClient, owner: Account) -> None:
    await created(tenant_api, owner, **cow("H"))
    await created(tenant_api, owner, **cow("J", breed="JERSEY"))

    jersey = await listing(tenant_api, owner, breed="JERSEY")
    healthy = await listing(tenant_api, owner, health="SALUDABLE")
    sick = await listing(tenant_api, owner, health="ENFERMA")

    assert ids(jersey) == ["J"]
    assert ids(healthy) == ["H", "J"]
    assert sick["total"] == 0


async def test_detail_has_the_projection(tenant_api: AsyncClient, owner: Account) -> None:
    body = await created(tenant_api, owner, **cow("1"))

    response = await tenant_api.get(f"/api/animals/{body['id']}", headers=owner.headers())

    assert response.status_code == 200
    projection = response.json()["projection"]
    assert projection["dim"] == (TODAY - dt.date(2026, 6, 1)).days
    assert projection["next_heat"] is not None


# --- Tenancy -----------------------------------------------------------------------------------


async def test_another_ranchs_animal_is_not_found(
    tenant_api: AsyncClient, owner: Account, neighbor: Account
) -> None:
    body = await created(tenant_api, owner, **cow("1"))
    path = f"/api/animals/{body['id']}"

    read = await tenant_api.get(path, headers=neighbor.headers())
    edit = await patch(tenant_api, neighbor, body["id"], control_id="mío")
    gone = await remove(tenant_api, neighbor, body["id"], "ERROR_REGISTRO")
    listed = await listing(tenant_api, neighbor)

    assert read.status_code == edit.status_code == gone.status_code == 404
    assert listed["total"] == 0


async def test_permissions_follow_the_matrix(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    tecnico = await sign_up(tenant_api, "tecnico")
    await add_member(tenant_db, tecnico, owner.ranch_id, Role.TECNICO_CAMPO)
    nutriologo = await sign_up(tenant_api, "nutriologo")
    await add_member(tenant_db, nutriologo, owner.ranch_id, Role.NUTRIOLOGO)
    body = await created(tenant_api, owner, **cow("1"))

    denied = await create(tenant_api, tecnico, owner.ranch_id, control_id="2", birth_date=COW_BIRTH)
    edit = await tenant_api.patch(
        f"/api/animals/{body['id']}", headers=tecnico.headers(owner.ranch_id), json={"name": "x"}
    )
    removal = await tenant_api.post(
        f"/api/animals/{body['id']}/removal",
        headers=nutriologo.headers(owner.ranch_id),
        json={"reason": "MUERTE"},
    )

    assert denied.status_code == 403
    assert edit.status_code == 200
    assert removal.status_code == 403


async def test_retiring_a_dam_needs_the_delete_permission(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    """A member who can register animals but not remove them can't remove a dam by the back
    door of "Estatus vaca madre"."""
    from smartbell.models import Membership

    clerk = await sign_up(tenant_api, "clerk")
    await add_member(tenant_db, clerk, owner.ranch_id, Role.TECNICO_CAMPO)
    membership = await tenant_db.get(Membership, (clerk.user_id, owner.ranch_id))
    assert membership is not None
    membership.permissions = ["ANIMALS_CREATE", "ANIMALS_VIEW"]
    await tenant_db.commit()
    dam = await created(tenant_api, owner, **cow("Madre"))

    response = await create(
        tenant_api, clerk, owner.ranch_id, control_id="Hija", birth_date="2026-03-01",
        dam_id=dam["id"], dam_status="VENDIDA_RASTRO",
    )  # fmt: skip

    assert response.status_code == 403
