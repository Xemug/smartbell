"""Bull availability (`mark-each-bull-as-on-the-ranch-semen-only-or-both`): on the ranch, semen
only, or both. A semen-only bull can't serve by MONTA and isn't part of the ranch's head."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import (
    AlertKind,
    VaccinationPlanStatus,
    VaccineFrequency,
    VaccineStartBy,
)
from smartbell.jobs.daily import run_ranch
from smartbell.models import Alert, PlanVaccine, VaccinationPlan
from smartbell.routes.animals import get_today
from tests.conftest import Account, sign_up

TODAY = dt.date(2026, 11, 3)
BULL_BIRTH = "2020-01-01"
VALUES = ["EN_RANCHO", "SEMEN", "AMBOS"]


@pytest.fixture(autouse=True)
def pinned_today(tenant_app: FastAPI) -> None:
    tenant_app.dependency_overrides[get_today] = lambda: TODAY


@pytest.fixture
async def owner(tenant_api: AsyncClient) -> Account:
    return await sign_up(tenant_api, "owner")


async def create(api: AsyncClient, account: Account, **body: Any) -> Response:
    return await api.post("/api/animals", headers=account.headers(), json=body)


async def bull(api: AsyncClient, account: Account, control_id: str, **body: Any) -> dict[str, Any]:
    response = await create(
        api, account, control_id=control_id, sex="MACHO", birth_date=BULL_BIRTH, **body
    )
    assert response.status_code == 201, response.text
    result: dict[str, Any] = response.json()
    return result


async def cow(api: AsyncClient, account: Account, control_id: str) -> str:
    response = await create(
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


async def edit(api: AsyncClient, account: Account, animal_id: str, **body: Any) -> Response:
    return await api.patch(f"/api/animals/{animal_id}", headers=account.headers(), json=body)


async def serve(
    api: AsyncClient, account: Account, cow_id: str, bull_id: str, method: str
) -> Response:
    return await api.post(
        f"/api/animals/{cow_id}/events",
        headers=account.headers(),
        json={
            "occurred_on": TODAY.isoformat(),
            "payload": {
                "type": "HEAT",
                "outcome": "INSEMINATED",
                "clean": True,
                "bull_id": bull_id,
                "method": method,
            },
        },
    )


# --- Create and edit ---------------------------------------------------------------------------


@pytest.mark.parametrize("value", VALUES)
async def test_a_bull_is_created_with_each_value(
    tenant_api: AsyncClient, owner: Account, value: str
) -> None:
    body = await bull(tenant_api, owner, "T1", bull_availability=value)

    assert body["kind"] == "TORO"
    assert body["bull_availability"] == value
    detail = await tenant_api.get(f"/api/animals/{body['id']}", headers=owner.headers())
    assert detail.json()["bull_availability"] == value


async def test_a_male_left_without_one_is_on_the_ranch_and_a_female_has_none(
    tenant_api: AsyncClient, owner: Account
) -> None:
    male = await bull(tenant_api, owner, "T1")
    calf = await create(
        tenant_api,
        owner,
        control_id="Cría",
        birth_date="2026-03-01",
        sire={"control_id": "T2", "birth_date": BULL_BIRTH},
    )
    assert calf.status_code == 201, calf.text
    sire = await tenant_api.get(f"/api/animals/{calf.json()['sire_id']}", headers=owner.headers())

    assert male["bull_availability"] == "EN_RANCHO"
    assert sire.json()["bull_availability"] == "EN_RANCHO"
    assert calf.json()["bull_availability"] is None


async def test_a_female_cannot_have_one(tenant_api: AsyncClient, owner: Account) -> None:
    response = await create(
        tenant_api, owner, control_id="V1", birth_date="2022-01-15", bull_availability="SEMEN"
    )
    animal_id = await cow(tenant_api, owner, "V2")
    edited = await edit(tenant_api, owner, animal_id, bull_availability="AMBOS")

    for refused in (response, edited):
        assert refused.status_code == 422
        (error,) = refused.json()["detail"]
        assert error["loc"] == ["body", "bull_availability"]
        assert error["type"] == "male_only"


@pytest.mark.parametrize("value", VALUES)
async def test_a_bull_is_edited_to_each_value(
    tenant_api: AsyncClient, owner: Account, value: str
) -> None:
    start = "AMBOS" if value != "AMBOS" else "SEMEN"
    created = await bull(tenant_api, owner, "T1", bull_availability=start)

    response = await edit(tenant_api, owner, created["id"], bull_availability=value)

    assert response.status_code == 200, response.text
    assert response.json()["bull_availability"] == value


async def test_a_bull_cannot_be_left_without_one(tenant_api: AsyncClient, owner: Account) -> None:
    created = await bull(tenant_api, owner, "T1")

    cleared = await edit(tenant_api, owner, created["id"], bull_availability=None)
    other_field = await edit(tenant_api, owner, created["id"], name="Relámpago")

    assert cleared.status_code == 422
    assert cleared.json()["detail"][0]["type"] == "required"
    assert other_field.status_code == 200
    assert other_field.json()["bull_availability"] == "EN_RANCHO"


async def test_an_unknown_value_is_refused(tenant_api: AsyncClient, owner: Account) -> None:
    response = await create(
        tenant_api,
        owner,
        control_id="T1",
        sex="MACHO",
        birth_date=BULL_BIRTH,
        bull_availability="PRESTADO",
    )

    assert response.status_code == 422


# --- List --------------------------------------------------------------------------------------


async def test_the_bulls_list_filters_by_availability(
    tenant_api: AsyncClient, owner: Account
) -> None:
    for index, value in enumerate(VALUES):
        await bull(tenant_api, owner, f"T{index}", bull_availability=value)

    listed = {}
    for value in VALUES:
        response = await tenant_api.get(
            "/api/animals",
            headers=owner.headers(),
            params={"kind": "TORO", "availability": value},
        )
        assert response.status_code == 200, response.text
        listed[value] = [item["bull_availability"] for item in response.json()["items"]]
    everyone = await tenant_api.get(
        "/api/animals", headers=owner.headers(), params={"kind": "TORO"}
    )

    assert listed == {value: [value] for value in VALUES}
    assert everyone.json()["total"] == 3


# --- Services ----------------------------------------------------------------------------------


async def test_a_semen_only_bull_cannot_serve_by_monta(
    tenant_api: AsyncClient, owner: Account
) -> None:
    semen = await bull(tenant_api, owner, "T1", bull_availability="SEMEN")
    cow_id = await cow(tenant_api, owner, "0100")

    response = await serve(tenant_api, owner, cow_id, semen["id"], "MONTA")

    assert response.status_code == 422
    (error,) = response.json()["detail"]
    assert error["loc"] == ["body", "payload", "bull_id"]
    assert error["type"] == "bull_semen_only"


@pytest.mark.parametrize(
    ("value", "method"),
    [("SEMEN", "IA"), ("EN_RANCHO", "IA"), ("EN_RANCHO", "MONTA"), ("AMBOS", "MONTA")],
)
async def test_other_services_accept_the_bull(
    tenant_api: AsyncClient, owner: Account, value: str, method: str
) -> None:
    chosen = await bull(tenant_api, owner, "T1", bull_availability=value)
    cow_id = await cow(tenant_api, owner, "0100")

    response = await serve(tenant_api, owner, cow_id, chosen["id"], method)

    assert response.status_code == 201, response.text
    assert response.json()["animal"]["repro_state"] == "SERVIDA"


async def test_editing_a_monta_service_to_a_semen_only_bull_is_refused(
    tenant_api: AsyncClient, owner: Account
) -> None:
    on_ranch = await bull(tenant_api, owner, "T1")
    semen = await bull(tenant_api, owner, "T2", bull_availability="SEMEN")
    cow_id = await cow(tenant_api, owner, "0100")
    served = await serve(tenant_api, owner, cow_id, on_ranch["id"], "MONTA")
    assert served.status_code == 201, served.text
    event = served.json()["event"]

    response = await tenant_api.patch(
        f"/api/animals/{cow_id}/events/{event['id']}",
        headers=owner.headers(),
        json={"payload": {**event["payload"], "bull_id": semen["id"]}},
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "bull_semen_only"


# --- Head count and alerts ---------------------------------------------------------------------


async def test_a_semen_only_bull_is_left_out_of_the_head_count(
    tenant_api: AsyncClient, owner: Account
) -> None:
    await cow(tenant_api, owner, "0100")
    await bull(tenant_api, owner, "T1", bull_availability="EN_RANCHO")
    await bull(tenant_api, owner, "T2", bull_availability="AMBOS")
    semen = await bull(tenant_api, owner, "T3", bull_availability="SEMEN")

    before = (await tenant_api.get("/api/ranch", headers=owner.headers())).json()
    await edit(tenant_api, owner, semen["id"], bull_availability="AMBOS")
    after = (await tenant_api.get("/api/ranch", headers=owner.headers())).json()

    assert before["animal_count"] == 3
    assert after["animal_count"] == 4


async def test_a_semen_only_bull_gets_no_vaccine_alerts(
    tenant_api: AsyncClient, tenant_db: AsyncSession, owner: Account
) -> None:
    plan = VaccinationPlan(ranch_id=owner.ranch_id, status=VaccinationPlanStatus.APROBADO)
    tenant_db.add(plan)
    await tenant_db.flush()
    tenant_db.add(
        PlanVaccine(
            plan_id=plan.id,
            name="IBR",
            dose_ml=Decimal(2),
            start_by=VaccineStartBy.AGE_MONTHS,
            start_value=Decimal(3),
            frequency=VaccineFrequency.ANUAL,
        )
    )
    await tenant_db.commit()
    on_ranch = await bull(tenant_api, owner, "T1")
    semen = await bull(tenant_api, owner, "T2", bull_availability="SEMEN")

    await run_ranch(tenant_db, owner.ranch_id, TODAY)
    await tenant_db.commit()

    async def due(animal_id: str) -> int:
        rows = await tenant_db.scalars(
            select(Alert).where(
                Alert.animal_id == uuid.UUID(animal_id), Alert.kind == AlertKind.VACCINE_DUE
            )
        )
        return len(rows.all())

    assert await due(on_ranch["id"]) == 1
    assert await due(semen["id"]) == 0
