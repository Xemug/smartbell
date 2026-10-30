import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import AnimalKind, EventType, LactationState, ReproState, Role
from smartbell.models import (
    Alert,
    Animal,
    Event,
    Membership,
    MilkHerdLog,
    Ranch,
    RanchSettings,
    Task,
    User,
)
from smartbell.seed.fixture_herd import seed_fixture_herd

TODAY = dt.date(2026, 10, 30)


async def _by_control_id(session: AsyncSession) -> dict[str, Animal]:
    return {animal.control_id: animal for animal in await session.scalars(select(Animal))}


async def test_seed_creates_ranch_owner_and_herd(session: AsyncSession) -> None:
    assert await seed_fixture_herd(session, TODAY) is True

    ranch = (await session.scalars(select(Ranch))).one()
    membership = (await session.scalars(select(Membership))).one()
    owner = await session.get(User, ranch.owner_user_id)
    assert owner is not None
    assert (membership.user_id, membership.role) == (owner.id, Role.DUENO)
    assert await session.get(RanchSettings, ranch.id) is not None
    animals = await _by_control_id(session)
    assert len(animals) >= 37
    assert {f"{number:05d}" for number in range(1, 8)} <= set(animals)


async def test_every_animal_has_its_alta_and_every_type_is_seeded(session: AsyncSession) -> None:
    await seed_fixture_herd(session, TODAY)

    events = (await session.scalars(select(Event))).all()
    altas = {event.animal_id for event in events if event.type is EventType.ALTA}

    assert altas == set(await session.scalars(select(Animal.id)))
    assert {event.type for event in events} == set(EventType)


async def test_nothing_happens_in_the_future(session: AsyncSession) -> None:
    await seed_fixture_herd(session, TODAY)

    newest = await session.scalar(select(func.max(Event.occurred_on)))
    assert newest is not None
    assert newest <= TODAY


async def test_prototype_cows_start_their_scenarios(session: AsyncSession) -> None:
    await seed_fixture_herd(session, TODAY)
    herd = await _by_control_id(session)
    settings = (await session.scalars(select(RanchSettings))).one()

    assert herd["00001"].is_sick is True
    assert herd["00001"].sick_since == dt.date(2026, 10, 25)
    assert herd["00002"].repro_state is ReproState.SECA
    assert herd["00002"].lactation_state is LactationState.SECA
    assert herd["00002"].expected_calving_date == TODAY - dt.timedelta(days=7)
    assert herd["00004"].repro_state is ReproState.ABIERTA
    assert herd["00005"].expected_calving_date == TODAY
    assert herd["00006"].repro_state is ReproState.SERVIDA
    assert herd["00007"].expected_calving_date == TODAY + dt.timedelta(days=10)

    heat_alert = (
        await session.scalars(select(Alert).where(Alert.animal_id == herd["00004"].id))
    ).one()
    assert heat_alert.window_start <= TODAY <= heat_alert.window_end
    assert (heat_alert.window_end - heat_alert.window_start).days + 1 == settings.heat_window_days


async def test_every_served_cow_points_at_a_real_bull(session: AsyncSession) -> None:
    await seed_fixture_herd(session, TODAY)
    herd = (await _by_control_id(session)).values()
    bulls = {animal.id for animal in herd if animal.kind is AnimalKind.TORO}

    served = [animal for animal in herd if animal.service_bull_id]

    assert served
    assert {animal.service_bull_id for animal in served} <= bulls


async def test_alerts_have_tasks_and_the_herd_has_milk(session: AsyncSession) -> None:
    await seed_fixture_herd(session, TODAY)

    alerts = set(await session.scalars(select(Alert.id)))
    assert alerts == set(await session.scalars(select(Task.alert_id)))
    assert await session.scalar(select(func.count()).select_from(MilkHerdLog)) == 14


async def test_seeding_twice_changes_nothing(session: AsyncSession) -> None:
    await seed_fixture_herd(session, TODAY)
    await session.flush()
    before = await session.scalar(select(func.count()).select_from(Animal))

    assert await seed_fixture_herd(session, TODAY) is False
    assert await session.scalar(select(func.count()).select_from(Animal)) == before
