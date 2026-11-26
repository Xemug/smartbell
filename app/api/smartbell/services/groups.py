"""The active ranch's groups (potreros): list, create, edit, delete, move animals, AUTO rules.

Rules (docs/roadmap/groups.md):
- General always exists (created on first use) and holds every animal with no group.
- Every move writes a GROUP_CHANGE event on the animal's bitácora; one request writes one
  history entry per kind of change, however many animals it moves.
- An AUTO group pulls in matching cows only from General, and sends cows that stop matching back
  to General. It never takes an animal from another group, so no two rules fight over a cow.
  Animals can't be added to an AUTO group by hand: its rule decides.
- Deleting a group sends its animals to General, or to the group the caller picks.
- Heifer groups are computed from age and state, never stored.

The caller commits, so a request is one transaction.
"""

import datetime as dt
import uuid
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import PREGNANT_STATES
from smartbell.enums import (
    AlertKind,
    AlertStatus,
    AnimalKind,
    AnimalStatus,
    GroupFilterField,
    GroupKpiIndicator,
    GroupPreset,
    GroupSelection,
    GroupType,
    HeiferGroup,
    HistoryKey,
    LactationState,
    ReproState,
)
from smartbell.models import Alert, Animal, Group
from smartbell.schemas.groups import (
    COUNT_CHIP_MAS,
    AutoFilter,
    GroupCreate,
    GroupOut,
    GroupUpdate,
    HeiferGroupOut,
    HeiferOut,
)
from smartbell.schemas.history import HistoryRefs
from smartbell.services import events, history
from smartbell.services.animals import FieldError

PRESET_NAMES = {
    GroupPreset.GENERAL: "General",
    GroupPreset.ALTA_PRODUCCION: "Alta producción",
    GroupPreset.SECAS_RETO: "Secas o en reto",
    GroupPreset.RECIEN_PARIDAS: "Recién paridas",
    GroupPreset.ENFERMAS: "Enfermas",
}
GENERAL_DESCRIPTION = "Este es el grupo general... ¡Aquí están todas las vacas en tu rancho!"
NEWBORN_MONTHS = 6


class GroupError(Exception):
    """A refusal that isn't about one field: 404 or 409, with a code."""

    def __init__(self, status: int, code: str):
        super().__init__(code)
        self.status = status
        self.code = code


@dataclass(frozen=True)
class Moved:
    moved: list[uuid.UUID]
    unchanged: list[uuid.UUID]


@dataclass(frozen=True)
class Reevaluated:
    came_in: list[uuid.UUID]
    went_out: list[uuid.UUID]  # back to General


# --- Read --------------------------------------------------------------------------------------


async def list_groups(session: AsyncSession, ranch_id: uuid.UUID) -> list[Group]:
    """Presets first, then the ranch's own groups, each by name."""
    query = (
        select(Group)
        .where(Group.ranch_id == ranch_id)
        .order_by(Group.preset.is_(None), Group.name, Group.id)
    )
    return list((await session.scalars(query)).all())


async def ensure_general(session: AsyncSession, ranch_id: uuid.UUID) -> Group:
    """The ranch's General group, created the first time it's needed."""
    general = await _general(session, ranch_id)
    if general is not None:
        return general
    try:
        async with session.begin_nested():
            general = Group(
                ranch_id=ranch_id,
                name=PRESET_NAMES[GroupPreset.GENERAL],
                description=GENERAL_DESCRIPTION,
                type=GroupType.PRESET,
                preset=GroupPreset.GENERAL,
            )
            session.add(general)
        return general
    except IntegrityError:  # Another request made it first.
        found = await _general(session, ranch_id)
        if found is None:
            raise
        return found


async def _general(session: AsyncSession, ranch_id: uuid.UUID) -> Group | None:
    return await session.scalar(
        select(Group).where(Group.ranch_id == ranch_id, Group.preset == GroupPreset.GENERAL)
    )


async def get_group(session: AsyncSession, ranch_id: uuid.UUID, group_id: uuid.UUID) -> Group:
    group = await session.scalar(
        select(Group).where(Group.id == group_id, Group.ranch_id == ranch_id)
    )
    if group is None:
        raise GroupError(404, "group_not_found")
    return group


async def describe(
    session: AsyncSession, ranch_id: uuid.UUID, groups: Sequence[Group], today: dt.date
) -> list[GroupOut]:
    """Each group with its animal count and indicator figure, from one read of the herd."""
    general_id = next((g.id for g in groups if g.preset is GroupPreset.GENERAL), None)
    rows = (
        await session.execute(
            select(
                Animal.id,
                Animal.group_id,
                Animal.repro_state,
                Animal.is_sick,
                Animal.lactation_state,
                Animal.last_calving_date,
            ).where(Animal.ranch_id == ranch_id, Animal.status == AnimalStatus.ACTIVE)
        )
    ).all()
    in_heat = set(
        await session.scalars(
            select(Alert.animal_id).where(
                Alert.ranch_id == ranch_id,
                Alert.kind == AlertKind.HEAT,
                Alert.status == AlertStatus.PENDING,
            )
        )
    )
    members: dict[uuid.UUID | None, list[Any]] = {}
    for row in rows:
        members.setdefault(row.group_id or general_id, []).append(row)

    out = []
    for group in groups:
        mine = members.get(group.id, [])
        value: int | None = None
        match group.kpi_indicator:
            case GroupKpiIndicator.EN_CELO:
                value = sum(1 for row in mine if row.id in in_heat)
            case GroupKpiIndicator.PRENADAS:
                value = sum(1 for row in mine if row.repro_state in PREGNANT_STATES)
            case GroupKpiIndicator.ENFERMAS:
                value = sum(1 for row in mine if row.is_sick)
            case GroupKpiIndicator.DIM:
                days = [
                    (today - row.last_calving_date).days
                    for row in mine
                    if row.lactation_state is LactationState.LACTANDO and row.last_calving_date
                ]
                value = round(sum(days) / len(days)) if days else None
        result = GroupOut.model_validate(group)
        result.animal_count = len(mine)
        result.kpi_value = value
        out.append(result)
    return out


def age_in_months(birth: dt.date, today: dt.date) -> int:
    months = (today.year - birth.year) * 12 + today.month - birth.month
    return months - 1 if today.day < birth.day else months


async def heifer_groups(
    session: AsyncSession, ranch_id: uuid.UUID, today: dt.date
) -> list[HeiferGroupOut]:
    """Active heifers by stage: under 6 months, 6 months on and not served, served, pregnant;
    a sick heifer is also in Enfermas."""
    heifers = (
        await session.scalars(
            select(Animal)
            .where(
                Animal.ranch_id == ranch_id,
                Animal.status == AnimalStatus.ACTIVE,
                Animal.kind == AnimalKind.VAQUILLA,
            )
            .order_by(Animal.control_id)
        )
    ).all()
    buckets: dict[HeiferGroup, list[HeiferOut]] = {key: [] for key in HeiferGroup}
    for heifer in heifers:
        out = HeiferOut.model_validate(heifer)
        if heifer.repro_state in PREGNANT_STATES:
            buckets[HeiferGroup.PRENADAS].append(out)
        elif heifer.repro_state is ReproState.SERVIDA:
            buckets[HeiferGroup.SERVIDAS].append(out)
        elif age_in_months(heifer.birth_date, today) < NEWBORN_MONTHS:
            buckets[HeiferGroup.RECIEN_NACIDAS].append(out)
        else:
            buckets[HeiferGroup.EN_DESARROLLO].append(out)
        if heifer.is_sick:
            buckets[HeiferGroup.ENFERMAS].append(out)
    return [HeiferGroupOut(key=key, animals=animals) for key, animals in buckets.items()]


# --- AUTO rules --------------------------------------------------------------------------------


def _chip_matches(values: Iterable[str], number: int | None) -> bool:
    if number is None:
        return False
    return any(
        number >= COUNT_CHIP_MAS if value == "MAS" else number == int(value) for value in values
    )


def matches(rule: AutoFilter, animal: Animal, today: dt.date) -> bool:
    match rule.field:
        case GroupFilterField.BREED:
            return animal.breed.value in rule.values
        case GroupFilterField.AGE:
            return _chip_matches(rule.values, age_in_months(animal.birth_date, today) // 12)
        case GroupFilterField.LACTATIONS:
            return _chip_matches(rule.values, animal.lactation_number)


async def _cows(session: AsyncSession, ranch_id: uuid.UUID, *, lock: bool) -> list[Animal]:
    query = select(Animal).where(
        Animal.ranch_id == ranch_id,
        Animal.status == AnimalStatus.ACTIVE,
        Animal.kind == AnimalKind.VACA,
    )
    if lock:
        query = query.order_by(Animal.id).with_for_update()
    return list((await session.scalars(query)).all())


async def preview(
    session: AsyncSession, ranch_id: uuid.UUID, rule: AutoFilter, today: dt.date
) -> list[uuid.UUID]:
    """The cows a rule matches now, wherever they are."""
    return [
        cow.id for cow in await _cows(session, ranch_id, lock=False) if matches(rule, cow, today)
    ]


async def reevaluate(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID | None,
    group: Group,
    today: dt.date,
) -> Reevaluated:
    """Apply an AUTO group's rule: matching cows in General come in, members that stopped
    matching go back to General."""
    if group.selection is not GroupSelection.AUTO or group.auto_filter is None:
        raise GroupError(409, "group_not_auto")
    rule = AutoFilter.model_validate(group.auto_filter)
    general = await ensure_general(session, ranch_id)
    came_in: list[Animal] = []
    went_out: list[Animal] = []
    for cow in await _cows(session, ranch_id, lock=True):
        fits = matches(rule, cow, today)
        if fits and cow.group_id in (None, general.id):
            came_in.append(cow)
        elif not fits and cow.group_id == group.id:
            went_out.append(cow)
    for cow in came_in:
        await events.move_to_group(session, ranch_id, user_id, cow, group.id, today)
    for cow in went_out:
        await events.move_to_group(session, ranch_id, user_id, cow, general.id, today)
    if came_in:
        await _record_added(session, ranch_id, user_id, group, [c.id for c in came_in])
    if went_out:
        await history.record(
            session,
            ranch_id,
            user_id,
            HistoryKey.GROUP_ANIMALS_MOVED,
            HistoryRefs(
                animal_ids=[c.id for c in went_out],
                group_id=general.id,
                group=group.name,
                to_group=general.name,
            ),
            n=len(went_out),
        )
    return Reevaluated(came_in=[c.id for c in came_in], went_out=[c.id for c in went_out])


async def reevaluate_ranch(session: AsyncSession, ranch_id: uuid.UUID, today: dt.date) -> int:
    """The daily job's step: every AUTO group, by nobody. Returns how many cows moved."""
    groups = await session.scalars(
        select(Group)
        .where(Group.ranch_id == ranch_id, Group.selection == GroupSelection.AUTO)
        .order_by(Group.created_at, Group.id)
    )
    total = 0
    for group in list(groups):
        if group.auto_filter is None:
            continue
        result = await reevaluate(session, ranch_id, None, group, today)
        total += len(result.came_in) + len(result.went_out)
    return total


# --- Writes ------------------------------------------------------------------------------------


async def _check_name(
    session: AsyncSession, ranch_id: uuid.UUID, name: str, exclude: uuid.UUID | None = None
) -> None:
    query = select(Group.id).where(
        Group.ranch_id == ranch_id, func.lower(Group.name) == name.lower()
    )
    if exclude is not None:
        query = query.where(Group.id != exclude)
    if await session.scalar(query) is not None:
        raise FieldError(409, ("name",), "group_name_taken", "Ya hay un potrero con ese nombre")


async def create_group(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID,
    body: GroupCreate,
    today: dt.date,
) -> Group:
    await ensure_general(session, ranch_id)
    if body.preset is not None:
        taken = await session.scalar(
            select(Group.id).where(Group.ranch_id == ranch_id, Group.preset == body.preset)
        )
        if taken is not None:
            raise FieldError(409, ("preset",), "preset_exists", "Ese potrero ya existe")
    name = body.name or PRESET_NAMES[body.preset]  # type: ignore[index]
    await _check_name(session, ranch_id, name)
    group = Group(
        id=uuid.uuid4(),
        ranch_id=ranch_id,
        name=name,
        description=body.description or None,
        type=GroupType.PRESET if body.preset else GroupType.CUSTOM,
        preset=body.preset,
        selection=body.selection,
        auto_filter=body.auto_filter.model_dump(mode="json") if body.auto_filter else None,
        kpi_indicator=body.kpi_indicator,
    )
    session.add(group)
    await session.flush()
    await history.record(
        session,
        ranch_id,
        user_id,
        HistoryKey.GROUP_CREATED,
        HistoryRefs(group_id=group.id, group=group.name),
    )
    if body.selection is GroupSelection.AUTO:
        moved = (await reevaluate(session, ranch_id, user_id, group, today)).came_in
    else:
        moved = (
            await move_animals(session, ranch_id, user_id, group, body.animal_ids, today)
        ).moved
    # C3: "No se puede pasar a seleccionar un Indicador, si no se han agregado vacas al grupo".
    if body.kpi_indicator is not None and not moved:
        raise FieldError(
            422, ("kpi_indicator",), "kpi_needs_animals", "Agrega vacas antes de elegir indicador"
        )
    return group


async def update_group(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID,
    group_id: uuid.UUID,
    body: GroupUpdate,
    today: dt.date,
) -> Group:
    group = await get_group(session, ranch_id, group_id)
    changes = body.model_fields_set
    if "name" in changes:
        if body.name is None:
            raise FieldError(422, ("name",), "required", "Es necesario el nombre")
        if group.preset is not None and body.name != group.name:
            raise FieldError(
                422, ("name",), "preset_name_fixed", "Un potrero preconfigurado no se renombra"
            )
        await _check_name(session, ranch_id, body.name, exclude=group.id)
        group.name = body.name
    if "description" in changes:
        group.description = body.description or None
    if "kpi_indicator" in changes:
        group.kpi_indicator = body.kpi_indicator
    rule_changed = False
    if "auto_filter" in changes:
        if group.selection is not GroupSelection.AUTO or body.auto_filter is None:
            raise FieldError(
                422, ("auto_filter",), "not_auto", "Este potrero es de selección manual"
            )
        new_rule = body.auto_filter.model_dump(mode="json")
        rule_changed = new_rule != group.auto_filter
        group.auto_filter = new_rule
    await session.flush()
    await history.record(
        session,
        ranch_id,
        user_id,
        HistoryKey.GROUP_EDITED,
        HistoryRefs(group_id=group.id, group=group.name),
    )
    if rule_changed:
        await reevaluate(session, ranch_id, user_id, group, today)
    return group


async def delete_group(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID,
    group_id: uuid.UUID,
    to_group_id: uuid.UUID | None,
    today: dt.date,
) -> tuple[Group, int]:
    """Sends the group's animals to `to_group_id` (General by default), then deletes it.
    Returns where they went and how many active animals moved."""
    group = await get_group(session, ranch_id, group_id)
    if group.preset is GroupPreset.GENERAL:
        raise GroupError(409, "general_not_deletable")
    if to_group_id is None:
        target = await ensure_general(session, ranch_id)
    else:
        target = await get_group(session, ranch_id, to_group_id)
        if target.id == group.id:
            raise FieldError(422, ("to_group_id",), "same_group", "Elige otro potrero")
    animals = (
        await session.scalars(
            select(Animal)
            .where(Animal.ranch_id == ranch_id, Animal.group_id == group.id)
            .order_by(Animal.id)
            .with_for_update()
        )
    ).all()
    moved = 0
    for animal in animals:
        if animal.status is AnimalStatus.ACTIVE:
            await events.move_to_group(session, ranch_id, user_id, animal, target.id, today)
            moved += 1
        else:  # A baja has no new events; it just stops pointing at a group that's gone.
            animal.group_id = None
    await history.record(
        session,
        ranch_id,
        user_id,
        HistoryKey.GROUP_DELETED,
        HistoryRefs(group_id=target.id, group=group.name, to_group=target.name),
    )
    await session.flush()
    await session.delete(group)
    await session.flush()
    return target, moved


async def move_animals(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID | None,
    group: Group,
    animal_ids: Sequence[uuid.UUID],
    today: dt.date,
) -> Moved:
    """Moves the animals into `group`, one GROUP_CHANGE each, and writes one history entry."""
    if not animal_ids:
        return Moved([], [])
    if group.selection is GroupSelection.AUTO:
        raise GroupError(409, "group_is_auto")
    wanted = list(dict.fromkeys(animal_ids))
    animals = (
        await session.scalars(
            select(Animal)
            .where(Animal.ranch_id == ranch_id, Animal.id.in_(wanted))
            .order_by(Animal.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    ).all()
    if len(animals) != len(wanted):
        raise GroupError(404, "animal_not_found")
    if any(a.status is AnimalStatus.REMOVED for a in animals):
        raise GroupError(409, "animal_removed")
    moved: list[Animal] = []
    unchanged: list[uuid.UUID] = []
    sources: set[uuid.UUID | None] = set()
    for animal in animals:
        before = animal.group_id
        if await events.move_to_group(session, ranch_id, user_id, animal, group.id, today):
            moved.append(animal)
            sources.add(before)
        else:
            unchanged.append(animal.id)
    if moved:
        ids = [a.id for a in moved]
        source = await _single_source(session, sources)
        if source is not None:
            await history.record(
                session,
                ranch_id,
                user_id,
                HistoryKey.GROUP_ANIMALS_MOVED,
                HistoryRefs(animal_ids=ids, group_id=group.id, group=source, to_group=group.name),
                n=len(ids),
            )
        else:
            await _record_added(session, ranch_id, user_id, group, ids)
    return Moved(moved=[a.id for a in moved], unchanged=unchanged)


async def _single_source(session: AsyncSession, sources: set[uuid.UUID | None]) -> str | None:
    """The name of the one group every moved animal came from, if there was one."""
    if len(sources) != 1:
        return None
    (only,) = sources
    if only is None:
        return None
    source = await session.get(Group, only)
    return source.name if source else None


async def _record_added(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    user_id: uuid.UUID | None,
    group: Group,
    ids: list[uuid.UUID],
) -> None:
    await history.record(
        session,
        ranch_id,
        user_id,
        HistoryKey.GROUP_ANIMALS_ADDED,
        HistoryRefs(animal_ids=ids, group_id=group.id, group=group.name),
        n=len(ids),
    )
