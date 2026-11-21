"""The events API (`events-api`): record, edit and delete bitácora events, with re-projection
and alert sync (docs/domain-model.md §1, §4)."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import (
    AlertKind,
    AlertStatus,
    DeletionRequestStatus,
    GroupPreset,
    GroupType,
    HistoryKey,
    Role,
    VaccinationPlanStatus,
    VaccineFrequency,
    VaccineStartBy,
)
from smartbell.models import (
    Alert,
    DeletionRequest,
    Event,
    Group,
    HistoryEntry,
    PlanVaccine,
    VaccinationPlan,
)
from smartbell.routes.animals import get_today
from tests.conftest import Account, add_member, sign_up

TODAY = dt.date(2026, 11, 3)
COW_BIRTH = "2022-01-15"


def days(n: int) -> str:
    return (TODAY + dt.timedelta(days=n)).isoformat()


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def new_cow(api: AsyncClient, account: Account, control_id: str, **fields: Any) -> str:
    body = {
        "control_id": control_id,
        "birth_date": COW_BIRTH,
        "last_calving_date": "2026-06-01",
        "lactation_number": 2,
    } | fields
    response = await api.post("/api/animals", headers=account.headers(), json=body)
    assert response.status_code == 201, response.text
    animal_id: str = response.json()["id"]
    return animal_id


async def served_cow(api: AsyncClient, account: Account, served_on: str) -> str:
    return await new_cow(
        api,
        account,
        "0200",
        repro_stage="SERVIDA",
        repro_stage_date=served_on,
        last_service_date=served_on,
    )


async def pregnant_cow(api: AsyncClient, account: Account, served_on: str) -> str:
    return await new_cow(
        api,
        account,
        "0300",
        repro_stage="GESTANTE",
        repro_stage_date=served_on,
        last_service_date=served_on,
    )


async def post(
    api: AsyncClient,
    account: Account,
    animal_id: str,
    payload: dict[str, Any],
    on: str | None = None,
    **extra: Any,
) -> Response:
    body = {"occurred_on": on or TODAY.isoformat(), "payload": payload} | extra
    return await api.post(f"/api/animals/{animal_id}/events", headers=account.headers(), json=body)


async def recorded(
    api: AsyncClient, account: Account, animal_id: str, payload: dict[str, Any], **kw: Any
) -> dict[str, Any]:
    response = await post(api, account, animal_id, payload, **kw)
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def open_kinds(body: dict[str, Any]) -> dict[str, tuple[str, str]]:
    """The open alerts by kind: the first window of each."""
    out: dict[str, tuple[str, str]] = {}
    for alert in body["open_alerts"]:
        out.setdefault(alert["kind"], (alert["window_start"], alert["window_end"]))
    return out


async def alerts_of(db: AsyncSession, animal_id: str) -> list[Alert]:
    rows = await db.scalars(select(Alert).where(Alert.animal_id == uuid.UUID(animal_id)))
    return list(rows)


def treatment(**fields: Any) -> dict[str, Any]:
    return {
        "type": "ANTIBIOTICO",
        "presentation": "INYECCION",
        "start_date": TODAY.isoformat(),
    } | fields


ILLNESS = {"type": "ILLNESS", "illness": "MASTITIS", "treatment": treatment()}
# Antibiotic: 5 days of treatment, then 10 of withdrawal (§3.6).
ILLNESS_UNTIL = days(15)


async def preset_group(db: AsyncSession, account: Account, preset: GroupPreset) -> uuid.UUID:
    group = Group(
        ranch_id=account.ranch_id, name=preset.name.title(), type=GroupType.PRESET, preset=preset
    )
    db.add(group)
    await db.commit()
    return group.id


# --- Create: one per event type ----------------------------------------------------------------


async def test_alta_opens_the_next_heat_alert(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    rows = await alerts_of(tenant_db, animal_id)

    heat = [row for row in rows if row.kind is AlertKind.HEAT]
    assert [row.status for row in heat] == [AlertStatus.PENDING]
    assert heat[0].window_end >= TODAY


async def test_heat_inseminated_serves_her_and_schedules_the_check(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    bull = await tenant_api.post(
        "/api/animals",
        headers=owner.headers(),
        json={"control_id": "T1", "name": "Toro", "sex": "MACHO", "birth_date": "2020-01-01"},
    )
    assert bull.status_code == 201, bull.text

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {
            "type": "HEAT",
            "outcome": "INSEMINATED",
            "clean": True,
            "bull_id": bull.json()["id"],
            "method": "IA",
        },
    )

    assert body["event"]["type"] == "HEAT"
    assert body["event"]["deletable"] is False
    assert body["animal"]["repro_state"] == "SERVIDA"
    assert body["animal"]["last_service_date"] == TODAY.isoformat()
    kinds = open_kinds(body)
    assert kinds["PREGNANCY_CHECK"] == (days(35), days(45))
    assert kinds["HEAT"] == (days(18), days(24))  # Watching for a return to heat at +21.
    entry = await tenant_db.scalar(
        select(HistoryEntry).where(HistoryEntry.event_key == HistoryKey.HEAT_IDENTIFIED)
    )
    assert entry is not None and entry.refs["animal_ids"] == [animal_id]


async def test_pregnancy_check_positive_schedules_calving_and_closes_the_check(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    served_on = (TODAY - dt.timedelta(days=40)).isoformat()
    animal_id = await served_cow(tenant_api, owner, served_on)
    check = next(
        row
        for row in await alerts_of(tenant_db, animal_id)
        if row.kind is AlertKind.PREGNANCY_CHECK
    )

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "PREGNANCY_CHECK", "method": "TACTO", "result": "POSITIVE"},
    )

    assert body["animal"]["repro_state"] == "GESTANTE"
    expected = dt.date.fromisoformat(served_on) + dt.timedelta(days=283)
    assert body["animal"]["expected_calving_date"] == expected.isoformat()
    kinds = open_kinds(body)
    assert "PREGNANCY_CHECK" not in kinds
    assert {"CALVING", "CLOSE_UP", "DRY_OFF", "PREG_RECHECK"} <= kinds.keys()
    await tenant_db.refresh(check)
    assert check.status is AlertStatus.CONFIRMED
    assert str(check.resulting_event_id) == body["event"]["id"]


async def test_calving_inside_the_window_is_esperado_and_starts_a_lactation(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    served = TODAY - dt.timedelta(days=283)  # Expected today, window ±3.
    animal_id = await pregnant_cow(tenant_api, owner, served.isoformat())

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "CALVING", "calf_registered": False, "timing": "RETRASADO"},
    )

    assert body["derived"]["calving_timing"] == "ESPERADO"
    assert body["event"]["payload"]["timing"] == "ESPERADO"  # The server's, not the client's.
    assert body["animal"]["repro_state"] == "RECIEN_PARIDA"
    assert body["animal"]["lactation_number"] == 3
    assert body["animal"]["last_calving_date"] == TODAY.isoformat()
    kinds = open_kinds(body)
    assert "CALVING" not in kinds and "HEAT" in kinds
    closed = [row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.CALVING]
    assert [row.status for row in closed] == [AlertStatus.CONFIRMED]


async def test_calving_after_the_window_is_retrasado(
    tenant_api: AsyncClient, owner: Account
) -> None:
    served = TODAY - dt.timedelta(days=290)
    animal_id = await pregnant_cow(tenant_api, owner, served.isoformat())

    body = await recorded(
        tenant_api, owner, animal_id, {"type": "CALVING", "calf_registered": False}
    )

    assert body["derived"]["calving_timing"] == "RETRASADO"


async def test_abortion_reopens_her_and_classifies_the_loss(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await pregnant_cow(tenant_api, owner, days(-85))

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "ABORTION", "kind": "NATURAL", "cause": "HORMONAL"},
    )

    assert body["derived"]["loss"] == "ABORTION"
    assert body["animal"]["repro_state"] == "ABIERTA"
    assert body["animal"]["expected_calving_date"] is None
    kinds = open_kinds(body)
    assert "CALVING" not in kinds and "HEAT" in kinds
    statuses = {row.kind: row.status for row in await alerts_of(tenant_db, animal_id)}
    assert statuses[AlertKind.CALVING] is AlertStatus.CONFIRMED


async def test_illness_makes_her_sick_with_a_health_alert_and_moves_her_to_enfermas(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    sick_group = await preset_group(tenant_db, owner, GroupPreset.ENFERMAS)
    animal_id = await new_cow(tenant_api, owner, "0100")

    body = await recorded(tenant_api, owner, animal_id, ILLNESS)

    animal = body["animal"]
    assert animal["is_sick"] is True
    assert animal["sick_since"] == TODAY.isoformat()
    assert animal["milk_withdrawal_until"] == ILLNESS_UNTIL
    assert animal["group_id"] == str(sick_group)
    assert body["event"]["payload"]["group_change"] == {"to_group_id": str(sick_group)}
    assert body["derived"]["withdrawal_until"] == ILLNESS_UNTIL
    assert open_kinds(body)["HEALTH"] == (TODAY.isoformat(), ILLNESS_UNTIL)


async def test_accident_with_a_milk_affecting_treatment(
    tenant_api: AsyncClient, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "ACCIDENT", "description": "Cojea", "treatment": treatment(type="ANTISEPTICO")},
    )

    assert body["animal"]["is_sick"] is True
    assert body["animal"]["milk_withdrawal_until"] == days(8)  # 5 + 3 days.
    assert open_kinds(body)["HEALTH"] == (TODAY.isoformat(), days(8))


async def test_accident_with_a_topical_treatment_keeps_the_milk(
    tenant_api: AsyncClient, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "ACCIDENT", "treatment": treatment(presentation="TOPICO")},
    )

    assert body["animal"]["is_sick"] is True
    assert body["animal"]["milk_withdrawal_until"] is None
    assert body["derived"]["withdrawal_until"] is None
    assert "HEALTH" not in open_kinds(body)


async def test_medical_treatment_for_heat_sync(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {
            "type": "MEDICAL_TREATMENT",
            "kind": "SINCRONIZACION_CELO",
            "treatment": treatment(type="ANTIINFLAMATORIO"),
        },
    )

    assert body["animal"]["is_sick"] is False
    assert body["animal"]["milk_withdrawal_until"] == days(7)  # 5 + 2 days.
    assert open_kinds(body)["HEALTH"] == (TODAY.isoformat(), days(7))


async def test_treatment_followup_success_cures_her_and_closes_the_health_alert(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    started = ILLNESS | {"treatment": treatment(start_date=days(-3))}
    await recorded(tenant_api, owner, animal_id, started, on=days(-3))

    body = await recorded(
        tenant_api, owner, animal_id, {"type": "TREATMENT_FOLLOWUP", "outcome": "SUCCESS"}
    )

    assert body["animal"]["is_sick"] is False
    assert body["animal"]["milk_withdrawal_until"] == days(12)  # The milk still waits.
    assert "HEALTH" not in open_kinds(body)
    health = [row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.HEALTH]
    assert [row.status for row in health] == [AlertStatus.CONFIRMED]
    cured = await tenant_db.scalar(
        select(HistoryEntry).where(HistoryEntry.event_key == HistoryKey.ANIMALS_CURED)
    )
    assert cured is not None


async def test_treatment_followup_change_extends_the_withdrawal(
    tenant_api: AsyncClient, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    await recorded(tenant_api, owner, animal_id, ILLNESS, on=days(-3))

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {
            "type": "TREATMENT_FOLLOWUP",
            "outcome": "CHANGE",
            "new_treatment": treatment(type="CORTICOIDE"),
        },
    )

    assert body["animal"]["is_sick"] is True
    assert body["animal"]["milk_withdrawal_until"] == days(26)  # 5 + 21 days.
    assert open_kinds(body)["HEALTH"] == (days(-3), days(26))


async def test_diet_change_closes_the_diet_alert(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    before = {row.kind for row in await alerts_of(tenant_db, animal_id)}

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "DIET_CHANGE", "reason": "ETAPA_REPRODUCTIVA", "diet": "Alta producción"},
    )

    assert "DIET_CHANGE" not in open_kinds(body)
    assert body["animal"]["repro_state"] == "ABIERTA"
    if AlertKind.DIET_CHANGE in before:
        rows = await alerts_of(tenant_db, animal_id)
        diet = [row for row in rows if row.kind is AlertKind.DIET_CHANGE]
        assert [row.status for row in diet] == [AlertStatus.CONFIRMED]


async def test_group_change_moves_her(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    general = await preset_group(tenant_db, owner, GroupPreset.GENERAL)
    animal_id = await new_cow(tenant_api, owner, "0100")

    body = await recorded(
        tenant_api, owner, animal_id, {"type": "GROUP_CHANGE", "to_group_id": str(general)}
    )

    assert body["animal"]["group_id"] == str(general)
    assert body["animal"]["repro_state"] == "ABIERTA"
    assert set(open_kinds(body)) == {
        row.kind.value for row in await alerts_of(tenant_db, animal_id)
    }
    entry = await tenant_db.scalar(
        select(HistoryEntry).where(HistoryEntry.event_key == HistoryKey.GROUP_ANIMALS_SENT)
    )
    assert entry is not None and entry.refs["group_id"] == str(general)

    again = await post(
        tenant_api, owner, animal_id, {"type": "GROUP_CHANGE", "to_group_id": str(general)}
    )
    assert again.status_code == 422
    assert again.json()["detail"][0]["type"] == "same_group"


async def test_vaccination_needs_a_vaccine_of_the_ranch(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    plan = VaccinationPlan(ranch_id=owner.ranch_id, status=VaccinationPlanStatus.APROBADO)
    tenant_db.add(plan)
    await tenant_db.flush()
    vaccine = PlanVaccine(
        plan_id=plan.id,
        name="IBR",
        dose_ml=Decimal(2),
        start_by=VaccineStartBy.AGE_MONTHS,
        frequency=VaccineFrequency.ANUAL,
    )
    tenant_db.add(vaccine)
    await tenant_db.commit()
    animal_id = await new_cow(tenant_api, owner, "0100")

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {"type": "VACCINATION", "vaccine_id": str(vaccine.id), "dose_ml": 2},
    )
    assert body["animal"]["repro_state"] == "ABIERTA"
    assert "HEAT" in open_kinds(body)

    unknown = await post(
        tenant_api,
        owner,
        animal_id,
        {"type": "VACCINATION", "vaccine_id": str(uuid.uuid4()), "dose_ml": 2},
    )
    assert unknown.status_code == 422
    assert unknown.json()["detail"][0]["loc"] == ["body", "payload", "vaccine_id"]


async def test_weight_changes_nothing_in_the_projection(
    tenant_api: AsyncClient, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    before = await tenant_api.get(f"/api/animals/{animal_id}", headers=owner.headers())

    body = await recorded(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 540})

    assert body["event"]["payload"] == {"type": "WEIGHT", "kg": 540.0}
    assert body["animal"]["repro_state"] == before.json()["repro_state"]
    assert "HEAT" in open_kinds(body)


# --- Idempotency -------------------------------------------------------------------------------


async def test_posting_the_same_event_twice_does_not_duplicate_alerts(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    first = await recorded(tenant_api, owner, animal_id, ILLNESS)
    second = await recorded(tenant_api, owner, animal_id, ILLNESS)

    assert first["open_alerts"] == second["open_alerts"]
    rows = await alerts_of(tenant_db, animal_id)
    keys = [(row.kind, row.window_start, row.window_end) for row in rows]
    assert len(keys) == len(set(keys))
    assert sum(row.kind is AlertKind.HEALTH for row in rows) == 1


# --- Delete ------------------------------------------------------------------------------------


async def test_deleting_a_heat_is_refused(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(
        tenant_api, owner, animal_id, {"type": "HEAT", "outcome": "NOT_INSEMINATED", "clean": True}
    )

    response = await tenant_api.delete(
        f"/api/animals/{animal_id}/events/{body['event']['id']}", headers=owner.headers()
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "event_not_deletable"


async def test_deleting_the_alta_is_refused(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    alta = await tenant_db.scalar(select(Event.id).where(Event.animal_id == uuid.UUID(animal_id)))

    response = await tenant_api.delete(
        f"/api/animals/{animal_id}/events/{alta}", headers=owner.headers()
    )

    assert response.status_code == 409


async def test_deleting_an_illness_without_permission_files_a_request(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    tech = await sign_up(tenant_api, "tecnico")
    await add_member(tenant_db, tech, owner.ranch_id, Role.TECNICO_CAMPO)
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(tenant_api, owner, animal_id, ILLNESS)
    url = f"/api/animals/{animal_id}/events/{body['event']['id']}"

    response = await tenant_api.delete(url, headers=tech.headers(owner.ranch_id))
    repeat = await tenant_api.delete(url, headers=tech.headers(owner.ranch_id))

    assert response.status_code == 202, response.text
    request = response.json()
    assert request["status"] == "PENDING"
    assert request["event_id"] == body["event"]["id"]
    assert request["requested_by"] == str(tech.user_id)
    assert repeat.status_code == 202 and repeat.json()["id"] == request["id"]
    count = await tenant_db.scalar(select(func.count()).select_from(DeletionRequest))
    assert count == 1
    still = await tenant_db.get(Event, uuid.UUID(body["event"]["id"]))
    assert still is not None
    pending = await tenant_db.scalar(select(DeletionRequest.status))
    assert pending is DeletionRequestStatus.PENDING


async def test_deleting_an_illness_reprojects_and_closes_its_health_alert(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    sick_group = await preset_group(tenant_db, owner, GroupPreset.ENFERMAS)
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(tenant_api, owner, animal_id, ILLNESS)
    assert body["animal"]["group_id"] == str(sick_group)

    response = await tenant_api.delete(
        f"/api/animals/{animal_id}/events/{body['event']['id']}", headers=owner.headers()
    )

    assert response.status_code == 200, response.text
    animal = response.json()["animal"]
    assert animal["is_sick"] is False
    assert animal["milk_withdrawal_until"] is None
    assert animal["group_id"] is None  # Back where she was.
    assert "HEALTH" not in open_kinds(response.json())
    health = [row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.HEALTH]
    assert [row.status for row in health] == [AlertStatus.EXPIRED]
    assert await tenant_db.get(Event, uuid.UUID(body["event"]["id"])) is None


async def test_deleting_a_followup_reopens_the_health_alert_it_closed(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    await recorded(tenant_api, owner, animal_id, ILLNESS)
    followup = await recorded(
        tenant_api, owner, animal_id, {"type": "TREATMENT_FOLLOWUP", "outcome": "SUCCESS"}
    )

    response = await tenant_api.delete(
        f"/api/animals/{animal_id}/events/{followup['event']['id']}", headers=owner.headers()
    )

    assert response.status_code == 200, response.text
    assert response.json()["animal"]["is_sick"] is True
    assert open_kinds(response.json())["HEALTH"] == (TODAY.isoformat(), ILLNESS_UNTIL)
    health = [row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.HEALTH]
    assert [row.status for row in health] == [AlertStatus.PENDING]


# --- Edit --------------------------------------------------------------------------------------


async def test_editing_an_illness_moves_the_withdrawal(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(tenant_api, owner, animal_id, ILLNESS)

    response = await tenant_api.patch(
        f"/api/animals/{animal_id}/events/{body['event']['id']}",
        headers=owner.headers(),
        json={
            "comments": "Corregido",
            "payload": ILLNESS | {"treatment": treatment(type="CORTICOIDE")},
        },
    )

    assert response.status_code == 200, response.text
    edited = response.json()
    assert edited["event"]["comments"] == "Corregido"
    assert edited["animal"]["milk_withdrawal_until"] == days(26)
    assert open_kinds(edited)["HEALTH"] == (TODAY.isoformat(), days(26))
    statuses = sorted(
        (row.window_end, row.status)
        for row in await alerts_of(tenant_db, animal_id)
        if row.kind is AlertKind.HEALTH
    )
    assert statuses == [
        (dt.date.fromisoformat(ILLNESS_UNTIL), AlertStatus.EXPIRED),
        (TODAY + dt.timedelta(days=26), AlertStatus.PENDING),
    ]


async def test_only_admins_edit_a_repro_event(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    vet = await sign_up(tenant_api, "medico")
    await add_member(tenant_db, vet, owner.ranch_id, Role.MEDICO)
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(
        tenant_api, owner, animal_id, {"type": "HEAT", "outcome": "VWP", "clean": True}
    )
    url = f"/api/animals/{animal_id}/events/{body['event']['id']}"

    refused = await tenant_api.patch(
        url, headers=vet.headers(owner.ranch_id), json={"comments": "x"}
    )
    allowed = await tenant_api.patch(url, headers=owner.headers(), json={"occurred_on": days(-1)})

    assert refused.status_code == 403
    assert refused.json()["detail"] == "admin_only"
    assert allowed.status_code == 200, allowed.text
    assert allowed.json()["event"]["occurred_on"] == days(-1)
    assert allowed.json()["animal"]["last_heat_date"] == days(-1)


async def test_editing_cannot_change_the_type(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 500})

    response = await tenant_api.patch(
        f"/api/animals/{animal_id}/events/{body['event']['id']}",
        headers=owner.headers(),
        json={"payload": {"type": "WEIGHT", "kg": 510}},
    )
    changed = await tenant_api.patch(
        f"/api/animals/{animal_id}/events/{body['event']['id']}",
        headers=owner.headers(),
        json={"payload": {"type": "DIET_CHANGE", "reason": "OTRA", "diet": "Pasto"}},
    )

    assert response.status_code == 200
    assert response.json()["event"]["payload"]["kg"] == 510
    assert changed.status_code == 422
    assert changed.json()["detail"][0]["type"] == "type_changed"


# --- Refusals ----------------------------------------------------------------------------------


async def test_a_future_date_is_refused(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    response = await post(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 500}, on=days(1))

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "date_in_future"


async def test_alta_and_removal_cannot_be_posted(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    response = await post(tenant_api, owner, animal_id, {"type": "REMOVAL", "reason": "MUERTE"})

    assert response.status_code == 422


async def test_a_removed_animal_is_read_only(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    removed = await tenant_api.post(
        f"/api/animals/{animal_id}/removal", headers=owner.headers(), json={"reason": "MUERTE"}
    )
    assert removed.status_code == 200, removed.text

    response = await post(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 500})

    assert response.status_code == 409
    assert response.json()["detail"] == "animal_removed"


async def test_removal_closes_the_open_alerts(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    await tenant_api.post(
        f"/api/animals/{animal_id}/removal", headers=owner.headers(), json={"reason": "MUERTE"}
    )

    rows = await alerts_of(tenant_db, animal_id)
    assert rows and all(row.status is not AlertStatus.PENDING for row in rows)


async def test_another_ranchs_animal_and_bull_are_not_found(
    tenant_api: AsyncClient, owner: Account
) -> None:
    other = await sign_up(tenant_api, "other")
    theirs = await new_cow(tenant_api, other, "0100")
    their_bull = await tenant_api.post(
        "/api/animals",
        headers=other.headers(),
        json={"control_id": "T1", "name": "Toro", "sex": "MACHO", "birth_date": "2020-01-01"},
    )
    mine = await new_cow(tenant_api, owner, "0100")

    on_theirs = await post(tenant_api, owner, theirs, {"type": "WEIGHT", "kg": 500})
    listed = await tenant_api.get(f"/api/animals/{theirs}/events", headers=owner.headers())
    with_their_bull = await post(
        tenant_api,
        owner,
        mine,
        {
            "type": "HEAT",
            "outcome": "INSEMINATED",
            "clean": True,
            "bull_id": their_bull.json()["id"],
            "method": "MONTA",
        },
    )

    assert on_theirs.status_code == 404
    assert listed.status_code == 404
    assert with_their_bull.status_code == 422
    assert with_their_bull.json()["detail"][0]["loc"] == ["body", "payload", "bull_id"]


async def test_recording_needs_the_events_permission(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    stranger = await sign_up(tenant_api, "stranger")

    response = await tenant_api.post(
        f"/api/animals/{animal_id}/events",
        headers=stranger.headers(owner.ranch_id),
        json={"occurred_on": TODAY.isoformat(), "payload": {"type": "WEIGHT", "kg": 500}},
    )

    assert response.status_code == 403


async def test_the_bitacora_lists_newest_first(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    await recorded(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 500}, on=days(-2))
    await recorded(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 510}, on=days(-1))

    response = await tenant_api.get(f"/api/animals/{animal_id}/events", headers=owner.headers())

    assert response.status_code == 200
    rows = response.json()
    # By date: the ALTA is today's. (Same-day order is by created_at, which SQLite keeps to the
    # second, so this test doesn't lean on it.)
    assert [(row["type"], row["occurred_on"]) for row in rows] == [
        ("ALTA", TODAY.isoformat()),
        ("WEIGHT", days(-1)),
        ("WEIGHT", days(-2)),
    ]
    assert rows[0]["deletable"] is False and rows[1]["deletable"] is True


async def test_payload_text_is_capped(tenant_api: AsyncClient, owner: Account) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")

    response = await post(
        tenant_api,
        owner,
        animal_id,
        {"type": "ACCIDENT", "description": "x" * 501, "treatment": treatment()},
    )

    assert response.status_code == 422


# --- Review regressions ------------------------------------------------------------------------


DIET = {"type": "DIET_CHANGE", "reason": "ETAPA_REPRODUCTIVA", "diet": "Alta producción"}


async def test_a_heat_not_observed_negates_the_heat_alert(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    (heat,) = [row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.HEAT]
    on = min(TODAY, heat.window_end).isoformat()

    await recorded(tenant_api, owner, animal_id, {"type": "HEAT", "outcome": "NOT_OBSERVED"}, on=on)

    await tenant_db.refresh(heat)
    assert heat.status is AlertStatus.NEGATED


async def test_editing_an_event_reopens_the_alert_it_no_longer_answers(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(tenant_api, owner, animal_id, DIET)
    (diet,) = [
        row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.DIET_CHANGE
    ]
    assert diet.status is AlertStatus.CONFIRMED

    response = await tenant_api.patch(
        f"/api/animals/{animal_id}/events/{body['event']['id']}",
        headers=owner.headers(),
        json={"occurred_on": "2026-07-01"},  # Before the diet was due: it is due again.
    )

    assert response.status_code == 200, response.text
    assert "DIET_CHANGE" in open_kinds(response.json())
    reopened = await tenant_db.get(Alert, diet.id, populate_existing=True)
    assert reopened is not None
    assert reopened.status is AlertStatus.PENDING and reopened.resulting_event_id is None


async def test_an_expired_alert_stays_expired_after_another_write(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    (diet,) = [
        row for row in await alerts_of(tenant_db, animal_id) if row.kind is AlertKind.DIET_CHANGE
    ]
    diet.status = AlertStatus.EXPIRED  # As the alert engine would, once its window passed.
    await tenant_db.commit()

    body = await recorded(tenant_api, owner, animal_id, {"type": "WEIGHT", "kg": 500})

    assert "DIET_CHANGE" not in open_kinds(body)
    await tenant_db.refresh(diet)
    assert diet.status is AlertStatus.EXPIRED


async def test_removal_closes_alerts_of_every_kind(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    vaccine = Alert(
        ranch_id=owner.ranch_id,
        animal_id=uuid.UUID(animal_id),
        kind=AlertKind.VACCINE_DUE,
        window_start=TODAY,
        window_end=TODAY,
    )
    tenant_db.add(vaccine)
    await tenant_db.commit()

    await tenant_api.post(
        f"/api/animals/{animal_id}/removal",
        headers=owner.headers(),
        json={"reason": "VENTA_RASTRO"},
    )

    await tenant_db.refresh(vaccine)
    assert vaccine.status is AlertStatus.EXPIRED


async def test_editing_an_illness_keeps_her_in_enfermas(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    sick_group = await preset_group(tenant_db, owner, GroupPreset.ENFERMAS)
    animal_id = await new_cow(tenant_api, owner, "0100")
    body = await recorded(tenant_api, owner, animal_id, ILLNESS)

    response = await tenant_api.patch(
        f"/api/animals/{animal_id}/events/{body['event']['id']}",
        headers=owner.headers(),
        json={"payload": ILLNESS | {"illness": "COJERA"}},
    )

    assert response.status_code == 200, response.text
    edited = response.json()
    assert edited["animal"]["group_id"] == str(sick_group)
    assert edited["event"]["payload"]["group_change"] == {"to_group_id": str(sick_group)}


async def test_correcting_an_old_move_leaves_her_where_she_is_now(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    y = await preset_group(tenant_db, owner, GroupPreset.GENERAL)
    z = await preset_group(tenant_db, owner, GroupPreset.ALTA_PRODUCCION)
    w = await preset_group(tenant_db, owner, GroupPreset.SECAS_RETO)
    animal_id = await new_cow(tenant_api, owner, "0100")
    first = await recorded(
        tenant_api, owner, animal_id, {"type": "GROUP_CHANGE", "to_group_id": str(y)}, on=days(-5)
    )
    await recorded(tenant_api, owner, animal_id, {"type": "GROUP_CHANGE", "to_group_id": str(z)})

    response = await tenant_api.patch(
        f"/api/animals/{animal_id}/events/{first['event']['id']}",
        headers=owner.headers(),
        json={"payload": {"type": "GROUP_CHANGE", "to_group_id": str(w)}},
    )

    assert response.status_code == 200, response.text
    assert response.json()["animal"]["group_id"] == str(z)
    assert response.json()["event"]["payload"] == {"type": "GROUP_CHANGE", "to_group_id": str(w)}


async def test_repro_events_are_refused_on_a_male(tenant_api: AsyncClient, owner: Account) -> None:
    bull = await tenant_api.post(
        "/api/animals",
        headers=owner.headers(),
        json={"control_id": "T1", "name": "Toro", "sex": "MACHO", "birth_date": "2020-01-01"},
    )

    response = await post(
        tenant_api, owner, bull.json()["id"], {"type": "CALVING", "calf_registered": False}
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "not_female"


async def test_deleting_an_extension_brings_back_the_health_alert_it_replaced(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    await recorded(tenant_api, owner, animal_id, ILLNESS)
    longer = ILLNESS | {"treatment": treatment(type="CORTICOIDE")}
    second = await recorded(tenant_api, owner, animal_id, longer)
    assert open_kinds(second)["HEALTH"] == (TODAY.isoformat(), days(26))

    response = await tenant_api.delete(
        f"/api/animals/{animal_id}/events/{second['event']['id']}", headers=owner.headers()
    )

    assert response.status_code == 200, response.text
    assert open_kinds(response.json())["HEALTH"] == (TODAY.isoformat(), ILLNESS_UNTIL)
    pending = [
        row
        for row in await alerts_of(tenant_db, animal_id)
        if row.kind is AlertKind.HEALTH and row.status is AlertStatus.PENDING
    ]
    assert len(pending) == 1


async def test_a_followup_withdrawal_follows_the_treatment_it_changes(
    tenant_api: AsyncClient, owner: Account
) -> None:
    animal_id = await new_cow(tenant_api, owner, "0100")
    await recorded(
        tenant_api,
        owner,
        animal_id,
        {
            "type": "MEDICAL_TREATMENT",
            "kind": "SINCRONIZACION_CELO",
            "treatment": treatment(type="ANTIINFLAMATORIO", start_date=days(-2)),
        },
        on=days(-2),
    )

    body = await recorded(
        tenant_api,
        owner,
        animal_id,
        {
            "type": "TREATMENT_FOLLOWUP",
            "outcome": "CHANGE",
            "new_treatment": treatment(type="CORTICOIDE"),
        },
    )

    # Heat sync keeps its 2 days (§3.14), not the corticoid's 21: 5 + 2 from today.
    assert body["derived"]["withdrawal_until"] == days(7)
    assert body["animal"]["milk_withdrawal_until"] == days(7)
