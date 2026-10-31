"""The prototype cows of event-flows.md, through the writer, on the seeded herd.

Their dates are relative to seeding, so each starts its scenario whenever the herd is seeded. The
mock's absolute dates aren't reproduced: see the card for why.
"""

import dataclasses
import datetime as dt

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import ReproSettings, Window
from smartbell.enums import LactationState, ReproState
from smartbell.models import Animal, RanchSettings
from smartbell.seed.fixture_herd import seed_fixture_herd
from smartbell.services.projection import repro_settings, reproject_animal, reproject_ranch
from tests.domain.factories import SETTINGS

TODAY = dt.date(2026, 10, 30)
L = LactationState


async def herd(session: AsyncSession) -> dict[str, Animal]:
    await seed_fixture_herd(session, TODAY)
    await session.flush()
    return {animal.control_id: animal for animal in await session.scalars(select(Animal))}


@pytest.mark.parametrize(
    ("control_id", "state", "lactation", "number", "dim"),
    [
        ("00001", ReproState.ABIERTA, L.LACTANDO, 2, 60),
        ("00002", ReproState.SECA, L.SECA, 3, 392),
        ("00003", ReproState.ABIERTA, L.LACTANDO, 2, 150),
        ("00004", ReproState.ABIERTA, L.LACTANDO, 2, 110),
        ("00005", ReproState.SECA, L.SECA, 3, 385),
        ("00006", ReproState.SERVIDA, L.LACTANDO, 2, 140),
        ("00007", ReproState.SECA, L.SECA, 3, 402),
    ],
)
async def test_prototype_cow_projects_to_her_state(
    session: AsyncSession,
    control_id: str,
    state: ReproState,
    lactation: LactationState,
    number: int,
    dim: int,
) -> None:
    cow = (await herd(session))[control_id]

    assert cow.repro_state is state
    assert cow.lactation_state is lactation
    assert cow.lactation_number == number
    assert cow.last_calving_date == TODAY - dt.timedelta(days=dim)


async def test_prototype_scenarios_land_in_their_windows(session: AsyncSession) -> None:
    animals = await herd(session)
    settings = await session.get_one(RanchSettings, animals["00001"].ranch_id)

    async def projected(control_id: str) -> Window | None:
        return (await reproject_animal(session, animals[control_id], settings, TODAY)).calving

    heat = await reproject_animal(session, animals["00004"], settings, TODAY)
    check = await reproject_animal(session, animals["00006"], settings, TODAY)
    late, on_time, early = [await projected(c) for c in ("00002", "00005", "00007")]

    assert heat.next_heat is not None and heat.next_heat.start <= TODAY <= heat.next_heat.end
    assert check.pregnancy_check is not None
    assert check.pregnancy_check.start <= TODAY <= check.pregnancy_check.end
    assert late is not None and late.end < TODAY
    assert on_time is not None and on_time.start <= TODAY <= on_time.end
    assert early is not None and early.start > TODAY


async def test_00001_is_sick_with_her_withdrawal(session: AsyncSession) -> None:
    cow = (await herd(session))["00001"]

    assert (cow.is_sick, cow.sick_since) == (True, TODAY - dt.timedelta(days=5))
    assert cow.milk_withdrawal_until == TODAY + dt.timedelta(days=5)


async def test_every_animal_agrees_with_what_the_seed_built_in_memory(
    session: AsyncSession,
) -> None:
    animals = await herd(session)

    assert animals["00002"].expected_calving_date == TODAY - dt.timedelta(days=7)
    assert animals["00005"].expected_calving_date == TODAY
    assert animals["00007"].expected_calving_date == TODAY + dt.timedelta(days=10)
    assert all(a.repro_state is None for a in animals.values() if a.sex == "MACHO")
    assert all(a.repro_state is not None for a in animals.values() if a.sex == "HEMBRA")


async def test_reprojecting_changes_nothing(session: AsyncSession) -> None:
    animals = await herd(session)
    columns = [column.key for column in Animal.__table__.columns]
    before = {a.id: {key: getattr(a, key) for key in columns} for a in animals.values()}
    ranch_id = animals["00001"].ranch_id

    assert await reproject_ranch(session, ranch_id, TODAY) == len(animals)
    await session.flush()

    assert before == {a.id: {key: getattr(a, key) for key in columns} for a in animals.values()}


async def test_a_later_today_moves_the_date_driven_states(session: AsyncSession) -> None:
    animals = await herd(session)
    cow = animals["00006"]
    settings = await session.get_one(RanchSettings, cow.ranch_id)

    projection = await reproject_animal(session, cow, settings, TODAY + dt.timedelta(days=1000))

    assert projection.dim == 1140
    assert cow.repro_state is ReproState.SERVIDA


async def test_settings_row_converts_and_matches_the_seeded_defaults(session: AsyncSession) -> None:
    animals = await herd(session)
    row = await session.get_one(RanchSettings, animals["00001"].ranch_id)

    converted = repro_settings(row)

    assert converted == SETTINGS
    assert {f.name for f in dataclasses.fields(ReproSettings)} <= set(
        RanchSettings.__table__.c.keys()
    )
