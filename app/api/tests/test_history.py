import uuid

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.enums import HistoryCard, HistoryCategory, HistoryKey
from smartbell.i18n.history_es import TEMPLATES
from smartbell.models import HistoryEntry, Ranch, User
from smartbell.schemas.history import HistoryRefs
from smartbell.services.history import record, render

DUPLICATE = uuid.uuid4()
NAMES = {"group": "General", "to_group": "Secas", "ranch": "El Roble"}

# key: (singular, plural); plural is None when the event is always about one thing.
COPY: dict[HistoryKey, tuple[str, str | None]] = {
    HistoryKey.ANIMALS_ADDED: ("Se dio de alta 1 animal", "Se dieron de alta 5 animales"),
    HistoryKey.ANIMALS_REMOVED_SLAUGHTER: (
        "Se dio de baja 1 animal por venta a rastro",
        "Se dieron de baja 5 animales por venta a rastro",
    ),
    HistoryKey.ANIMALS_REMOVED_SOLD: (
        "Se dio de baja 1 animal por venta a otro rancho",
        "Se dieron de baja 5 animales por venta a otro rancho",
    ),
    HistoryKey.ANIMALS_REMOVED_DEATH: (
        "Se dio de baja 1 animal por muerte",
        "Se dieron de baja 5 animales por muerte",
    ),
    HistoryKey.ANIMALS_REMOVED_ERROR: (
        "Se dio de baja 1 animal por error en registro",
        "Se dieron de baja 5 animales por error en registro",
    ),
    HistoryKey.ANIMALS_EDITED: ("Se editó 1 animal", "Se editaron 5 animales"),
    HistoryKey.GROUP_ANIMALS_ADDED: (
        "Se agregó 1 animal al potrero General",
        "Se agregaron 5 animales al potrero General",
    ),
    HistoryKey.GROUP_EDITED: ("Se editó el potrero General", None),
    HistoryKey.GROUP_DELETED: (
        "Se eliminó General potrero y las vacas se enviaron a potrero Secas",
        None,
    ),
    HistoryKey.GROUP_ANIMALS_MOVED: (
        "Se cambió 1 vaca de potrero General a potrero Secas",
        "Se cambiaron 5 vacas de potrero General a potrero Secas",
    ),
    HistoryKey.GROUP_ANIMALS_SENT: (
        "Se cambió 1 vaca a potrero Secas",
        "Se cambiaron 5 vacas a potrero Secas",
    ),
    HistoryKey.GROUP_CREATED: ("Se creó el potrero General", None),
    HistoryKey.USERS_ADDED: ("Se dio de alta 1 usuario", "Se dieron de alta 5 usuarios"),
    HistoryKey.USERS_REMOVED: ("Se dio de baja 1 usuario", "Se dieron de baja 5 usuarios"),
    HistoryKey.USERS_EDITED: ("Se editó 1 usuario", "Se editaron 5 usuarios"),
    HistoryKey.DIET_CHANGED: ("Se cambió la dieta a 1 animal", "Se cambió la dieta a 5 animales"),
    HistoryKey.ANIMALS_ILL: ("Se enfermó 1 animal", "Se enfermaron 5 animales"),
    HistoryKey.ANIMALS_INJURED: ("Se accidentó 1 animal", "Se accidentaron 5 animales"),
    HistoryKey.TREATMENT_APPLIED: (
        "Se aplicó tratamiento a 1 animal",
        "Se aplicó tratamiento a 5 animales",
    ),
    HistoryKey.HEAT_IDENTIFIED: (
        "1 animal se identificó en celo",
        "5 animales se identificaron en celo",
    ),
    HistoryKey.PREGNANCY_DIAGNOSED: (
        "1 animal se diagnosticó preñada",
        "5 animales se diagnosticaron preñadas",
    ),
    HistoryKey.CALVED: ("1 vaca tuvo parto", "5 vacas tuvieron parto"),
    HistoryKey.TREATMENT_CHANGED: (
        "1 animal que estaba enferma, se le cambió el tratamiento",
        "5 animales que estaban enfermas, se les cambió el tratamiento",
    ),
    HistoryKey.ANIMALS_CURED: (
        "1 animal que estaba enferma, se curó exitosamente",
        "5 animales que estaban enfermas, se curaron exitosamente",
    ),
    HistoryKey.HEAT_NOT_OBSERVED: ("1 animal no entró en celo", "5 animales no entraron en celo"),
    HistoryKey.PREGNANCY_NEGATIVE: (
        "1 animal se diagnosticó vacía",
        "5 animales se diagnosticaron vacías",
    ),
    HistoryKey.ABORTED: ("1 vaca tuvo aborto", "5 vacas tuvieron aborto"),
    HistoryKey.VACCINATED: ("Se vacunó 1 animal", "Se vacunaron 5 animales"),
    HistoryKey.WEIGHED: ("Se registró el peso de 1 animal", "Se registró el peso de 5 animales"),
    HistoryKey.RANCH_ADDED: ("Se dio de alta el rancho El Roble", None),
    HistoryKey.RANCH_REMOVED: ("Se dio de baja el rancho El Roble", None),
    HistoryKey.RANCH_EDITED: ("Se editó el rancho El Roble", None),
}


def ids(n: int) -> list[uuid.UUID]:
    return [uuid.uuid4() for _ in range(n)]


def refs_for(key: HistoryKey, n: int) -> HistoryRefs:
    template = TEMPLATES[key]
    return HistoryRefs(
        animal_ids=ids(n) if template.plural and template.card is not HistoryCard.C else [],
        user_ids=ids(n) if template.card is HistoryCard.C else [],
        group_id=uuid.uuid4() if template.names & {"group", "to_group"} else None,
        **{name: NAMES[name] for name in template.names},
    )


@pytest.fixture
async def user(session: AsyncSession) -> User:
    user = User(first_name="Ana", email="ana@example.com")
    session.add(user)
    await session.flush()
    return user


@pytest.fixture
async def ranch(session: AsyncSession, user: User) -> Ranch:
    ranch = Ranch(name="El Roble", owner_user_id=user.id)
    session.add(ranch)
    await session.flush()
    return ranch


def test_every_key_has_a_template_and_copy() -> None:
    assert set(TEMPLATES) == set(HistoryKey) == set(COPY)


@pytest.mark.parametrize("key", COPY)
async def test_renders_singular_and_plural(
    session: AsyncSession, ranch: Ranch, user: User, key: HistoryKey
) -> None:
    singular, plural = COPY[key]

    entry = await record(session, ranch.id, user.id, key, refs_for(key, 1), 1)
    assert render(entry) == singular

    if plural is None:
        assert TEMPLATES[key].plural is None
    else:
        entry = await record(session, ranch.id, user.id, key, refs_for(key, 5), 5)
        assert render(entry) == plural


@pytest.mark.parametrize(
    ("key", "category", "card"),
    [
        (HistoryKey.ANIMALS_ADDED, HistoryCategory.GANADO, HistoryCard.A),
        (HistoryKey.ANIMALS_REMOVED_ERROR, HistoryCategory.GANADO, HistoryCard.B),
        (HistoryKey.USERS_ADDED, HistoryCategory.USUARIOS, HistoryCard.C),
        (HistoryKey.CALVED, HistoryCategory.SALUD, HistoryCard.A),
        (HistoryKey.RANCH_EDITED, HistoryCategory.RANCHO, HistoryCard.B),
    ],
)
def test_categories_and_cards(
    key: HistoryKey, category: HistoryCategory, card: HistoryCard
) -> None:
    assert TEMPLATES[key].category is category
    assert TEMPLATES[key].card is card


async def test_a_batch_is_one_entry_with_its_count(
    session: AsyncSession, ranch: Ranch, user: User
) -> None:
    animal_ids, group_id = ids(5), uuid.uuid4()

    await record(
        session,
        ranch.id,
        user.id,
        HistoryKey.GROUP_ANIMALS_MOVED,
        HistoryRefs(animal_ids=animal_ids, group_id=group_id, group="General", to_group="Secas"),
        n=5,
    )

    entry = (await session.scalars(select(HistoryEntry))).one()
    await session.refresh(entry)
    assert entry.ranch_id == ranch.id
    assert entry.user_id == user.id
    assert entry.category is HistoryCategory.GANADO
    assert entry.event_key == HistoryKey.GROUP_ANIMALS_MOVED
    assert entry.n == 5
    assert entry.refs == {
        "animal_ids": [str(animal_id) for animal_id in animal_ids],
        "group_id": str(group_id),
        "group": "General",
        "to_group": "Secas",
    }


async def test_rollback_leaves_no_entry(session: AsyncSession, ranch: Ranch, user: User) -> None:
    ranch_id, user_id = ranch.id, user.id
    await session.commit()

    await record(session, ranch_id, user_id, HistoryKey.RANCH_EDITED, HistoryRefs(ranch="El Roble"))
    assert await session.scalar(select(func.count()).select_from(HistoryEntry)) == 1
    await session.rollback()

    assert await session.scalar(select(func.count()).select_from(HistoryEntry)) == 0


async def test_commit_is_the_callers(session: AsyncSession, ranch: Ranch, user: User) -> None:
    await session.commit()

    await record(session, ranch.id, user.id, HistoryKey.RANCH_EDITED, HistoryRefs(ranch="El Roble"))
    await session.commit()

    assert await session.scalar(select(func.count()).select_from(HistoryEntry)) == 1


@pytest.mark.usefixtures("enforced_fks")
async def test_a_deleted_users_entries_stay_readable(
    session: AsyncSession, ranch: Ranch, user: User
) -> None:
    worker = User(first_name="Luis", email="luis@example.com")
    session.add(worker)
    await session.flush()
    entry = await record(
        session, ranch.id, worker.id, HistoryKey.USERS_ADDED, HistoryRefs(user_ids=[worker.id])
    )

    await session.delete(worker)
    await session.flush()
    await session.refresh(entry)

    assert entry.user_id is None
    assert entry.refs["user_ids"] == [str(worker.id)]
    assert render(entry) == "Se dio de alta 1 usuario"


async def test_an_entry_keeps_names_that_later_change(
    session: AsyncSession, ranch: Ranch, user: User
) -> None:
    entry = await record(
        session, ranch.id, user.id, HistoryKey.RANCH_EDITED, HistoryRefs(ranch="El Roble")
    )

    ranch.name = "La Encina"
    await session.flush()

    assert render(entry) == "Se editó el rancho El Roble"


async def test_a_system_entry_has_no_user(session: AsyncSession, ranch: Ranch) -> None:
    entry = await record(
        session, ranch.id, None, HistoryKey.RANCH_EDITED, HistoryRefs(ranch="El Roble")
    )

    assert entry.user_id is None


async def test_names_are_not_format_strings(
    session: AsyncSession, ranch: Ranch, user: User
) -> None:
    entry = await record(
        session, ranch.id, user.id, HistoryKey.RANCH_EDITED, HistoryRefs(ranch="{n} {0.x}")
    )

    assert render(entry) == "Se editó el rancho {n} {0.x}"


@pytest.mark.parametrize(
    ("key", "refs", "n"),
    [
        pytest.param(
            HistoryKey.ANIMALS_ADDED, HistoryRefs(animal_ids=ids(2)), 3, id="count-vs-animals"
        ),
        pytest.param(HistoryKey.ANIMALS_ADDED, HistoryRefs(), 1, id="no-animals"),
        pytest.param(HistoryKey.ANIMALS_REMOVED_ERROR, HistoryRefs(), 5, id="hard-delete-count"),
        pytest.param(
            HistoryKey.ANIMALS_ADDED, HistoryRefs(animal_ids=[DUPLICATE] * 2), 2, id="repeat-exact"
        ),
        pytest.param(
            HistoryKey.ANIMALS_ADDED,
            HistoryRefs(animal_ids=[DUPLICATE, DUPLICATE, uuid.uuid4()]),
            2,
            id="repeat-distinct",
        ),
        pytest.param(HistoryKey.USERS_EDITED, HistoryRefs(user_ids=ids(1)), 2, id="count-vs-users"),
        pytest.param(HistoryKey.ANIMALS_ADDED, HistoryRefs(), 0, id="zero"),
        pytest.param(HistoryKey.ANIMALS_REMOVED_ERROR, HistoryRefs(), -1, id="negative"),
        pytest.param(HistoryKey.RANCH_EDITED, HistoryRefs(ranch="X"), 2, id="plural-of-one"),
        pytest.param(HistoryKey.RANCH_EDITED, HistoryRefs(), 1, id="no-name"),
        pytest.param(
            HistoryKey.GROUP_DELETED,
            HistoryRefs(group_id=uuid.uuid4(), group="A"),
            1,
            id="no-destination",
        ),
        pytest.param(HistoryKey.GROUP_EDITED, HistoryRefs(group="A"), 1, id="no-link"),
    ],
)
async def test_refuses_an_entry_it_could_not_show(
    session: AsyncSession, ranch: Ranch, user: User, key: HistoryKey, refs: HistoryRefs, n: int
) -> None:
    with pytest.raises(ValueError, match=key):
        await record(session, ranch.id, user.id, key, refs, n)

    assert await session.scalar(select(func.count()).select_from(HistoryEntry)) == 0


@pytest.mark.parametrize("name", ["", "  "])
def test_refs_refuse_blank_names(name: str) -> None:
    with pytest.raises(ValidationError):
        HistoryRefs(group=name)


def test_refs_refuse_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        HistoryRefs(cow_ids=[])  # type: ignore[call-arg]
