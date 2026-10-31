"""Constraints, defaults and delete rules of the core schema."""

import datetime as dt
from collections.abc import Callable
from decimal import Decimal
from typing import Any

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import (
    AlertKind,
    AnimalKind,
    AnimalStatus,
    Breed,
    CrossbreedLevel,
    DevelopmentStage,
    EventType,
    GroupPreset,
    GroupType,
    HerdType,
    MilkDestination,
    RemovalReason,
    Role,
    Sex,
    TaskFrequency,
    TaskKind,
    TaskSource,
    TaskStatus,
)
from smartbell.models import (
    Alert,
    Animal,
    Event,
    Group,
    HistoryEntry,
    Membership,
    MilkCowLog,
    MilkHerdLog,
    Ranch,
    RanchSettings,
    Task,
    User,
    derive_kind,
)

BIRTH = dt.date(2022, 1, 15)
DAY = dt.date(2026, 10, 1)
Cow = Callable[..., Animal]


@pytest.fixture
async def owner(session: AsyncSession) -> User:
    user = User(first_name="Ana", email="ana@example.com")
    session.add(user)
    await session.flush()
    return user


@pytest.fixture
async def ranch(session: AsyncSession, owner: User) -> Ranch:
    ranch = Ranch(name="Mi rancho", owner_user_id=owner.id)
    session.add(ranch)
    await session.flush()
    return ranch


@pytest.fixture
def cow(ranch: Ranch) -> Cow:
    def build(control_id: str = "00001", **fields: Any) -> Animal:
        values: dict[str, Any] = {
            "ranch_id": ranch.id,
            "sex": Sex.HEMBRA,
            "kind": AnimalKind.VAQUILLA,
            "control_id": control_id,
            "birth_date": BIRTH,
        }
        return Animal(**(values | fields))

    return build


async def add(session: AsyncSession, *rows: object) -> None:
    session.add_all(rows)
    await session.flush()


async def assert_refused(session: AsyncSession, *rows: object) -> None:
    with pytest.raises(IntegrityError):
        await add(session, *rows)
    await session.rollback()


async def test_animal_defaults(session: AsyncSession, cow: Cow) -> None:
    animal = cow()
    await add(session, animal)

    assert animal.breed is Breed.HOLSTEIN
    assert animal.crossbreed_level is CrossbreedLevel.FB
    assert animal.development_stage is DevelopmentStage.AUTO
    assert animal.status is AnimalStatus.ACTIVE
    assert animal.is_sick is False
    assert animal.repro_state is None
    assert animal.expected_calving_date is None


async def test_control_id_unique_per_ranch(session: AsyncSession, cow: Cow, owner: User) -> None:
    other = Ranch(name="Otro", owner_user_id=owner.id)
    await add(session, other)
    await add(session, cow(), cow(ranch_id=other.id))

    await assert_refused(session, cow())


async def test_siniiga_unique_per_ranch_where_set(
    session: AsyncSession, cow: Cow, owner: User
) -> None:
    other = Ranch(name="Otro", owner_user_id=owner.id)
    await add(session, other)
    await add(
        session,
        cow("00001"),
        cow("00002"),  # Two animals without SINIIGA are fine.
        cow("00003", siniiga="MX-00-00-0000-1234"),
        cow("00004", siniiga="MX-00-00-0000-1234", ranch_id=other.id),
    )

    await assert_refused(session, cow("00005", siniiga="MX-00-00-0000-1234"))


async def test_bull_name_unique_per_ranch(session: AsyncSession, cow: Cow) -> None:
    def bull(control_id: str, name: str | None) -> Animal:
        return cow(control_id, sex=Sex.MACHO, kind=AnimalKind.TORO, name=name)

    await add(session, bull("T1", "Trueno"), bull("T2", None), bull("T3", None))
    await add(session, cow("00001", name="Trueno"))  # The name rule is about bulls.

    await assert_refused(session, bull("T4", "Trueno"))


async def test_herd_log_one_per_ranch_per_day(session: AsyncSession, ranch: Ranch) -> None:
    day = dt.date(2026, 10, 1)
    await add(session, MilkHerdLog(ranch_id=ranch.id, date=day, total_liters=Decimal(100)))

    await assert_refused(
        session, MilkHerdLog(ranch_id=ranch.id, date=day, total_liters=Decimal(90))
    )


async def test_contributing_breed_required_unless_fb(session: AsyncSession, cow: Cow) -> None:
    await add(
        session,
        cow("00001", crossbreed_level=CrossbreedLevel.F1, contributing_breed=Breed.JERSEY),
    )

    await assert_refused(session, cow("00002", crossbreed_level=CrossbreedLevel.F1))


@pytest.mark.parametrize(
    "fields",
    [
        {"sex": Sex.MACHO, "kind": AnimalKind.VACA},
        {"sex": Sex.HEMBRA, "kind": AnimalKind.TORO},
        {"sex": Sex.MACHO, "kind": AnimalKind.TORO, "development_stage": DevelopmentStage.TERNERA},
        {"development_stage": DevelopmentStage.TORO},
        {"status": AnimalStatus.REMOVED},
        {"removed_reason": RemovalReason.MUERTE},
    ],
)
async def test_animal_checks_refuse_contradictions(
    session: AsyncSession, cow: Cow, fields: dict[str, Any]
) -> None:
    await assert_refused(session, cow(**fields))


async def test_enum_columns_are_check_constrained(session: AsyncSession, cow: Cow) -> None:
    animal = cow()
    await add(session, animal)

    with pytest.raises(IntegrityError):
        await session.execute(text("UPDATE animals SET breed = 'MIXTA'"))


@pytest.mark.parametrize(
    ("sex", "stage", "has_calved", "kind"),
    [
        (Sex.HEMBRA, DevelopmentStage.TERNERA, False, AnimalKind.VAQUILLA),
        (Sex.HEMBRA, DevelopmentStage.AUTO, True, AnimalKind.VACA),
        (Sex.MACHO, DevelopmentStage.TORO, False, AnimalKind.TORO),
        (Sex.MACHO, DevelopmentStage.NOVILLO, False, AnimalKind.NOVILLO),
        (Sex.MACHO, DevelopmentStage.BECERRO, False, AnimalKind.BECERRO),
    ],
)
def test_derive_kind(sex: Sex, stage: DevelopmentStage, has_calved: bool, kind: AnimalKind) -> None:
    assert derive_kind(sex, stage, has_calved=has_calved) is kind


def test_derive_kind_refuses_an_unresolved_male_stage() -> None:
    with pytest.raises(ValueError, match="AUTO"):
        derive_kind(Sex.MACHO, DevelopmentStage.AUTO, has_calved=False)


async def test_ranch_settings_defaults(
    session: AsyncSession, ranch: Ranch, db_backend: str
) -> None:
    await session.execute(
        text("INSERT INTO ranch_settings (ranch_id) VALUES (:id)"),
        {"id": ranch.id.hex if db_backend == "sqlite" else ranch.id},
    )

    settings = (await session.scalars(select(RanchSettings))).one()

    assert settings.gestation_days == 283
    assert settings.heat_cycle_days == 21
    assert settings.heat_window_days == 7
    assert settings.vwp_days == 45
    assert (settings.preg_check_min_days, settings.preg_check_max_days) == (35, 45)
    assert settings.preg_recheck_days == [90, 180]
    assert settings.dry_off_days_before_calving == 60
    assert settings.close_up_days_before_calving == 21
    assert settings.fresh_cow_dim == 45
    assert settings.diet_change_dim == 120
    assert (settings.abortion_min_days, settings.abortion_max_days) == (42, 260)
    assert settings.heifer_heat_alert_from_months == 13
    assert settings.heifer_heat_alert_until_months == 18
    assert settings.heifer_breeding_unlock_months == 12
    assert settings.herd_type is HerdType.DAIRY
    assert settings.value_per_registered_cow_mxn == 2100


async def test_event_round_trip_normalises_payload(session: AsyncSession, cow: Cow) -> None:
    animal = cow()
    await add(session, animal)
    event = Event(
        ranch_id=animal.ranch_id,
        animal_id=animal.id,
        type=EventType.WEIGHT,
        occurred_on=DAY,
        payload={"kg": "410.5"},
    )
    await add(session, event)

    assert event.payload == {"type": "WEIGHT", "kg": 410.5}


async def test_event_with_a_mismatched_payload_is_never_written(
    session: AsyncSession, cow: Cow
) -> None:
    animal = cow()
    await add(session, animal)
    event = Event(
        ranch_id=animal.ranch_id,
        animal_id=animal.id,
        type=EventType.WEIGHT,
        occurred_on=DAY,
        payload={"kg": -1},
    )

    with pytest.raises(ValidationError):
        await add(session, event)


async def test_event_update_is_validated_too(session: AsyncSession, cow: Cow) -> None:
    animal = cow()
    await add(session, animal)
    event = Event(
        ranch_id=animal.ranch_id,
        animal_id=animal.id,
        type=EventType.WEIGHT,
        occurred_on=DAY,
        payload={"kg": 400},
    )
    await add(session, event)

    event.payload = {"reason": "MUERTE"}
    with pytest.raises(ValidationError):
        await session.flush()


async def test_editing_comments_doesnt_rejudge_an_old_payload(
    session: AsyncSession, cow: Cow
) -> None:
    animal = cow()
    await add(session, animal)
    event = Event(
        ranch_id=animal.ranch_id,
        animal_id=animal.id,
        type=EventType.WEIGHT,
        occurred_on=DAY,
        payload={"kg": 400},
    )
    await add(session, event)
    await session.execute(text("""UPDATE events SET payload = '{"kg": -1}'"""))
    await session.refresh(event)

    event.comments = "Pesada en báscula nueva"
    await session.flush()

    await session.refresh(event)
    assert event.comments == "Pesada en báscula nueva"
    assert event.payload == {"kg": -1}


@pytest.mark.parametrize(
    ("event_type", "deletable"),
    [
        (EventType.ALTA, False),
        (EventType.HEAT, False),
        (EventType.PREGNANCY_CHECK, False),
        (EventType.CALVING, False),
        (EventType.ABORTION, False),
        (EventType.ILLNESS, True),
        (EventType.REMOVAL, True),
    ],
)
def test_event_deletable_follows_type(event_type: EventType, deletable: bool) -> None:
    assert Event(type=event_type).deletable is deletable


async def test_comments_limit_on_postgres(session: AsyncSession, cow: Cow, db_backend: str) -> None:
    if db_backend != "postgresql":
        pytest.skip("SQLite doesn't enforce VARCHAR lengths")
    animal = cow()
    await add(session, animal)

    with pytest.raises(Exception, match="too long"):
        await add(
            session,
            Event(
                ranch_id=animal.ranch_id,
                animal_id=animal.id,
                type=EventType.WEIGHT,
                occurred_on=DAY,
                payload={"kg": 400},
                comments="x" * 161,
            ),
        )


async def test_task_has_the_v4_fields_and_defaults(session: AsyncSession, ranch: Ranch) -> None:
    task = Task(
        ranch_id=ranch.id,
        source=TaskSource.MANUAL,
        kind=TaskKind.MANUAL,
        title="Revisar cerca",
        due_date=dt.date(2026, 11, 1),
    )
    await add(session, task)

    assert task.status is TaskStatus.OPEN
    assert task.frequency is TaskFrequency.ONCE
    assert task.animal_id is None
    assert task.completed_at is None


async def test_an_alert_has_one_open_task(session: AsyncSession, cow: Cow, ranch: Ranch) -> None:
    animal = cow()
    await add(session, animal)
    day = dt.date(2026, 11, 1)
    alert = Alert(
        ranch_id=ranch.id,
        animal_id=animal.id,
        kind=AlertKind.HEAT,
        window_start=day,
        window_end=day,
    )
    await add(session, alert)

    def task(status: TaskStatus) -> Task:
        return Task(
            ranch_id=ranch.id,
            source=TaskSource.AUTOMATIC,
            kind=TaskKind.HEAT_OBSERVE,
            title="Observar celo",
            due_date=day,
            alert_id=alert.id,
            status=status,
        )

    await add(session, task(TaskStatus.DONE), task(TaskStatus.DONE), task(TaskStatus.OPEN))

    await assert_refused(session, task(TaskStatus.OPEN))


async def test_alert_window_is_idempotent_and_ordered(
    session: AsyncSession, cow: Cow, ranch: Ranch
) -> None:
    animal = cow()
    await add(session, animal)
    day = dt.date(2026, 11, 1)

    def alert(end: dt.date) -> Alert:
        return Alert(
            ranch_id=ranch.id,
            animal_id=animal.id,
            kind=AlertKind.HEAT,
            window_start=day,
            window_end=end,
        )

    await add(session, alert(day))
    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            await add(session, alert(day))

    with pytest.raises(IntegrityError):
        async with session.begin_nested():
            await add(session, alert(day - dt.timedelta(days=1)))


async def test_milk_cow_log_keeps_destination(session: AsyncSession, cow: Cow) -> None:
    animal = cow()
    await add(session, animal)
    log = MilkCowLog(
        ranch_id=animal.ranch_id,
        animal_id=animal.id,
        date=dt.date(2026, 10, 1),
        liters=Decimal("12.50"),
        destination=MilkDestination.ANTIBIOTICOS,
    )
    await add(session, log)

    assert (await session.scalars(select(MilkCowLog))).one().destination.value == "ANTIBIOTICOS"


async def test_preset_group_needs_its_preset(session: AsyncSession, ranch: Ranch) -> None:
    await add(
        session,
        Group(ranch_id=ranch.id, name="General", type=GroupType.PRESET, preset=GroupPreset.GENERAL),
        Group(ranch_id=ranch.id, name="Mis vacas", type=GroupType.CUSTOM),
    )

    await assert_refused(session, Group(ranch_id=ranch.id, name="X", type=GroupType.PRESET))


async def test_one_group_per_preset_per_ranch(session: AsyncSession, ranch: Ranch) -> None:
    def general() -> Group:
        return Group(
            ranch_id=ranch.id, name="General", type=GroupType.PRESET, preset=GroupPreset.GENERAL
        )

    await add(session, general())

    await assert_refused(session, general())


async def test_none_in_a_json_column_is_sql_null(session: AsyncSession, ranch: Ranch) -> None:
    await add(
        session, Group(ranch_id=ranch.id, name="Mis vacas", type=GroupType.CUSTOM, auto_filter=None)
    )

    nulls = await session.scalar(
        select(func.count()).select_from(Group).where(Group.auto_filter.is_(None))
    )
    assert nulls == 1


@pytest.mark.usefixtures("enforced_fks")
async def test_hard_delete_takes_the_animals_records_but_not_its_offspring(
    session: AsyncSession, cow: Cow
) -> None:
    dam = cow("00001")
    await add(session, dam)
    calf = cow("00002", dam_id=dam.id)
    event = Event(
        ranch_id=dam.ranch_id,
        animal_id=dam.id,
        type=EventType.WEIGHT,
        occurred_on=DAY,
        payload={"kg": 400},
    )
    await add(session, calf, event)

    await session.delete(dam)
    await session.flush()

    assert (await session.scalars(select(Event))).all() == []
    await session.refresh(calf)
    assert calf.dam_id is None


@pytest.mark.usefixtures("enforced_fks")
async def test_deleting_a_user_keeps_their_history(
    session: AsyncSession, cow: Cow, ranch: Ranch
) -> None:
    animal = cow()
    worker = User(first_name="Luis", email="luis@example.com")
    await add(session, animal, worker)
    event = Event(
        ranch_id=ranch.id,
        animal_id=animal.id,
        type=EventType.WEIGHT,
        occurred_on=DAY,
        payload={"kg": 400},
        recorded_by=worker.id,
    )
    entry = HistoryEntry(ranch_id=ranch.id, user_id=worker.id, category="GANADO", event_key="x")
    await add(
        session, event, entry, Membership(user_id=worker.id, ranch_id=ranch.id, role=Role.MEDICO)
    )

    await session.delete(worker)
    await session.flush()

    await session.refresh(event)
    await session.refresh(entry)
    assert event.recorded_by is None
    assert entry.user_id is None
    assert (await session.scalars(select(Membership))).all() == []


@pytest.mark.usefixtures("enforced_fks")
async def test_a_ranch_owner_cant_be_deleted(
    session: AsyncSession, owner: User, ranch: Ranch
) -> None:
    await session.delete(owner)
    with pytest.raises(IntegrityError):
        await session.flush()
