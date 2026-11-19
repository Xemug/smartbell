"""The animal registry: create, edit, remove, list (docs/domain-model.md §1, §3.11, §7.1, §7.7).

Every write records a history entry and leaves the commit to the caller, so a request is one
transaction: a heifer and the dam created with her land together or not at all.
"""

import datetime as dt
import uuid
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import ColumnElement, Select, String, cast, delete, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import (
    EPOCH,
    EventFact,
    Projection,
    heifer_birth_date_editable,
    last_calving_date_valid,
    project,
)
from smartbell.enums import (
    AnimalKind,
    AnimalStatus,
    Breed,
    CrossbreedLevel,
    DamStatus,
    DevelopmentStage,
    EventType,
    GroupPreset,
    HistoryKey,
    RemovalReason,
    ReproState,
    Sex,
)
from smartbell.models import Animal, Event, Group, RanchSettings
from smartbell.models.animals import MALE_STAGES
from smartbell.schemas.animals import (
    REQUIRED_ON_UPDATE,
    AnimalCreate,
    AnimalRemoval,
    AnimalUpdate,
    GroupFilter,
    Health,
    ParentCreate,
    SortKey,
)
from smartbell.schemas.events import AltaPayload, RemovalPayload
from smartbell.schemas.history import HistoryRefs
from smartbell.security.ranch import RanchContext
from smartbell.services import history
from smartbell.services.projection import (
    animal_facts,
    compute_projection,
    repro_settings,
    reproject_animal,
    write_projection,
)

RANCH_TIMEZONE = ZoneInfo("America/Mexico_City")  # Ranches are in Mexico; none stores a zone yet.
PAGE_SIZE = 10

# §7.7: these numbers are retired with the animal and refused forever.
RETIRING_REASONS = frozenset({RemovalReason.MUERTE, RemovalReason.VENTA_RASTRO})
REMOVAL_HISTORY = {
    RemovalReason.ERROR_REGISTRO: HistoryKey.ANIMALS_REMOVED_ERROR,
    RemovalReason.VENTA_RASTRO: HistoryKey.ANIMALS_REMOVED_SLAUGHTER,
    RemovalReason.VENTA_OTRO_RANCHO: HistoryKey.ANIMALS_REMOVED_SOLD,
    RemovalReason.MUERTE: HistoryKey.ANIMALS_REMOVED_DEATH,
}
DAM_REMOVAL = {
    DamStatus.MUERTA_DESECHO: RemovalReason.MUERTE,
    DamStatus.VENDIDA_OTRO_RANCHO: RemovalReason.VENTA_OTRO_RANCHO,
    DamStatus.VENDIDA_RASTRO: RemovalReason.VENTA_RASTRO,
}
# Constraint names that a concurrent insert can trip after our own checks passed.
_UNIQUE_FIELDS = {
    "uq_animals_ranch_id_control_id": ("control_id", "control_id_taken"),
    "uq_animals_siniiga_active": ("siniiga", "siniiga_taken"),
    "uq_animals_ranch_id_bull_name": ("name", "name_taken"),
}
MESSAGES = {
    "control_id_taken": "El ID ingresado está repetido",
    # §7.7: says nothing about who holds it, or where.
    "siniiga_taken": "Este número SINIIGA ya está registrado",
    "name_taken": "Ya hay un toro con ese nombre",
}


def ranch_today() -> dt.date:
    return dt.datetime.now(RANCH_TIMEZONE).date()


class FieldError(Exception):
    """A refusal tied to one field of the body. `status` is 409 for a taken ID, else 422."""

    def __init__(self, status: int, loc: Sequence[str], code: str, msg: str | None = None):
        super().__init__(code)
        self.status = status
        self.loc = tuple(loc)
        self.code = code
        self.msg = msg or MESSAGES.get(code, code)


class AnimalNotFound(Exception):
    pass


class AnimalRemoved(Exception):
    """Removed animals are read-only, and can't be deleted either: a death or slaughter retires
    the SINIIGA for good (§7.7), which a deletion would undo."""


class AnimalInUse(Exception):
    """Another animal's events name this one (a service bull, a calf), so it can't be deleted."""


def _invalid(loc: Sequence[str], code: str, msg: str) -> FieldError:
    return FieldError(422, loc, code, msg)


def integrity_field_error(error: IntegrityError) -> FieldError:
    """Turns a unique-index race into the same 409 the checks give."""
    text = str(error.orig)
    for constraint, (name, code) in _UNIQUE_FIELDS.items():
        if constraint in text:
            return FieldError(409, (name,), code)
    raise error


# --- Checks ------------------------------------------------------------------------------------


async def _check_control_id(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    control_id: str,
    loc: tuple[str, ...],
    *,
    exclude: uuid.UUID | None = None,
) -> None:
    query = select(Animal.id).where(Animal.ranch_id == ranch_id, Animal.control_id == control_id)
    if exclude is not None:
        query = query.where(Animal.id != exclude)
    if await session.scalar(query.limit(1)) is not None:
        raise FieldError(409, (*loc, "control_id"), "control_id_taken")


async def _check_siniiga(
    session: AsyncSession, siniiga: str, loc: tuple[str, ...], *, exclude: uuid.UUID | None = None
) -> None:
    """§7.7, across every ranch: held by an ACTIVE animal, or retired by death or slaughter."""
    query = select(Animal.id).where(
        Animal.siniiga == siniiga,
        or_(
            Animal.status == AnimalStatus.ACTIVE,
            Animal.removed_reason.in_(RETIRING_REASONS),
        ),
    )
    if exclude is not None:
        query = query.where(Animal.id != exclude)
    if await session.scalar(query.limit(1)) is not None:
        raise FieldError(409, (*loc, "siniiga"), "siniiga_taken")


async def _check_bull_name(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    name: str,
    loc: tuple[str, ...],
    *,
    exclude: uuid.UUID | None = None,
) -> None:
    query = select(Animal.id).where(
        Animal.ranch_id == ranch_id, Animal.sex == Sex.MACHO, Animal.name == name
    )
    if exclude is not None:
        query = query.where(Animal.id != exclude)
    if await session.scalar(query.limit(1)) is not None:
        raise FieldError(409, (*loc, "name"), "name_taken")


async def _check_group(
    session: AsyncSession, ranch_id: uuid.UUID, group_id: uuid.UUID, loc: tuple[str, ...]
) -> None:
    found = await session.scalar(
        select(Group.id).where(Group.id == group_id, Group.ranch_id == ranch_id)
    )
    if found is None:
        raise _invalid((*loc, "group_id"), "group_not_found", "El potrero no existe")


def _check_crossbreed(
    level: CrossbreedLevel, contributing: Breed | None, loc: tuple[str, ...]
) -> None:
    if level is not CrossbreedLevel.FB and contributing is None:
        raise _invalid(
            (*loc, "contributing_breed"),
            "contributing_breed_required",
            "Selecciona la raza de aporte",
        )
    if level is CrossbreedLevel.FB and contributing is not None:
        raise _invalid(
            (*loc, "contributing_breed"),
            "contributing_breed_not_allowed",
            "Una raza pura (FB) no lleva raza de aporte",
        )


def _check_stage(sex: Sex, stage: DevelopmentStage, loc: tuple[str, ...]) -> None:
    if stage is DevelopmentStage.AUTO:
        return
    if (sex is Sex.MACHO) != (stage in MALE_STAGES):
        raise _invalid(
            (*loc, "development_stage"),
            "stage_does_not_match_sex",
            "La etapa de desarrollo no corresponde al sexo",
        )


def _check_past(day: dt.date, today: dt.date, loc: tuple[str, ...], name: str) -> None:
    if day > today:
        raise _invalid((*loc, name), "date_in_future", "La fecha no puede ser futura")


def _check_after_birth(day: dt.date, birth: dt.date, loc: tuple[str, ...], name: str) -> None:
    if day < birth:
        raise _invalid(
            (*loc, name), "date_before_birth", "La fecha no puede ser anterior al nacimiento"
        )


def _check_born_before(parent_birth: dt.date, child_birth: dt.date, loc: tuple[str, ...]) -> None:
    """A parent is born before its offspring, which also keeps the pedigree free of cycles."""
    if parent_birth >= child_birth:
        raise _invalid(
            loc, "parent_born_after", "Un padre o una madre debe nacer antes que su cría"
        )


async def _parent(
    session: AsyncSession, ranch_id: uuid.UUID, parent_id: uuid.UUID, sex: Sex, loc: str
) -> Animal:
    parent = await session.scalar(
        select(Animal).where(Animal.id == parent_id, Animal.ranch_id == ranch_id)
    )
    if parent is None:
        raise _invalid((loc,), "parent_not_found", "No encontramos ese animal")
    if parent.sex is not sex:
        message = "La madre debe ser hembra" if sex is Sex.HEMBRA else "El padre debe ser macho"
        raise _invalid((loc,), "parent_wrong_sex", message)
    return parent


# --- Create ------------------------------------------------------------------------------------


@dataclass
class _Registration:
    """What one new animal needs, whether it's the main one or a parent created inline."""

    fields: ParentCreate
    sex: Sex
    loc: tuple[str, ...]
    extra: dict[str, Any] = field(default_factory=dict)
    alta: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Created:
    animal: Animal
    projection: Projection
    created: list[Animal]


def _repro_inputs(body: AnimalCreate, today: dt.date) -> dict[str, Any]:
    """§3.11 and §7.1. Only females have them; a calving needs 660 days of age."""
    inputs = {
        "repro_stage": body.repro_stage,
        "repro_stage_date": body.repro_stage_date,
        "lactation_number": body.lactation_number,
        "last_calving_date": body.last_calving_date,
        "last_service_date": body.last_service_date,
    }
    given = {name: value for name, value in inputs.items() if value is not None}
    if given and body.sex is not Sex.HEMBRA:
        raise _invalid(
            (next(iter(given)),), "female_only", "Solo las hembras tienen datos reproductivos"
        )
    for name in ("repro_stage_date", "last_calving_date", "last_service_date"):
        day = inputs[name]
        if isinstance(day, dt.date):
            _check_past(day, today, (), name)
            _check_after_birth(day, body.birth_date, (), name)
    calving = body.last_calving_date
    if calving is not None and not last_calving_date_valid(body.birth_date, calving):
        raise _invalid(
            ("last_calving_date",),
            "calving_too_young",
            "El último parto debe ser al menos 660 días después del nacimiento",
        )
    if body.repro_stage is ReproState.VAQUILLA and (calving or body.lactation_number):
        raise _invalid(("repro_stage",), "heifer_has_calved", "Si ya parió, regístrala como vaca")
    return given


async def _register(
    session: AsyncSession,
    ctx: RanchContext,
    settings: RanchSettings,
    reg: _Registration,
    today: dt.date,
) -> tuple[Animal, Projection]:
    body, loc = reg.fields, reg.loc
    _check_past(body.birth_date, today, loc, "birth_date")
    _check_crossbreed(body.crossbreed_level, body.contributing_breed, loc)
    _check_stage(reg.sex, body.development_stage, loc)
    if body.group_id is not None:
        await _check_group(session, ctx.ranch_id, body.group_id, loc)
    await _check_control_id(session, ctx.ranch_id, body.control_id, loc)
    if body.siniiga is not None:
        await _check_siniiga(session, body.siniiga, loc)
    if body.name is not None and reg.sex is Sex.MACHO:
        await _check_bull_name(session, ctx.ranch_id, body.name, loc)

    animal = Animal(
        id=uuid.uuid4(),
        ranch_id=ctx.ranch_id,
        sex=reg.sex,
        control_id=body.control_id,
        name=body.name,
        siniiga=body.siniiga,
        birth_date=body.birth_date,
        breed=body.breed,
        crossbreed_level=body.crossbreed_level,
        contributing_breed=body.contributing_breed,
        development_stage=body.development_stage,
        group_id=body.group_id,
        status=AnimalStatus.ACTIVE,
        repro_stage=reg.alta.get("repro_stage"),
        repro_stage_date=reg.alta.get("repro_stage_date"),
        **reg.extra,
    )
    alta = AltaPayload(
        control_id=body.control_id,
        sex=reg.sex,
        birth_date=body.birth_date,
        breed=body.breed,
        development_stage=body.development_stage,
        group_id=body.group_id,
        **reg.alta,
    ).model_dump(mode="json", exclude_none=True)
    event = Event(
        id=uuid.uuid4(),
        ranch_id=ctx.ranch_id,
        animal_id=animal.id,
        type=EventType.ALTA,
        occurred_on=today,
        recorded_by=ctx.user.id,
        payload=alta,
    )
    # Folded before the flush: `kind` is derived from the projection and can't be NULL.
    fact = EventFact(EventType.ALTA, today, alta, event.id, EPOCH)
    projection = project(animal_facts(animal), [fact], repro_settings(settings), today)
    write_projection(animal, projection)
    session.add(animal)
    session.add(event)
    await session.flush()
    return animal, projection


async def create_animal(
    session: AsyncSession, ctx: RanchContext, body: AnimalCreate, today: dt.date
) -> Created:
    """Registers an animal, and first any parent given inline. The caller commits."""
    if body.dam is not None and body.dam_id is not None:
        raise _invalid(("dam",), "dam_twice", "Indica la madre por id o regístrala, no ambas")
    if body.sire is not None and body.sire_id is not None:
        raise _invalid(("sire",), "sire_twice", "Indica el padre por id o regístralo, no ambas")
    if body.dam_status is not None and body.dam is None and body.dam_id is None:
        raise _invalid(("dam_status",), "dam_required", "Indica primero la madre")
    alta = _repro_inputs(body, today)
    settings = await session.get_one(RanchSettings, ctx.ranch_id)
    created: list[Animal] = []

    dam: Animal | None = None
    if body.dam is not None:
        dam, _ = await _register(
            session, ctx, settings, _Registration(body.dam, Sex.HEMBRA, ("dam",)), today
        )
        created.append(dam)
    elif body.dam_id is not None:
        dam = await _parent(session, ctx.ranch_id, body.dam_id, Sex.HEMBRA, "dam_id")
    sire: Animal | None = None
    if body.sire is not None:
        sire, _ = await _register(
            session, ctx, settings, _Registration(body.sire, Sex.MACHO, ("sire",)), today
        )
        created.append(sire)
    elif body.sire_id is not None:
        sire = await _parent(session, ctx.ranch_id, body.sire_id, Sex.MACHO, "sire_id")

    if dam is not None:
        loc = ("dam", "birth_date") if body.dam is not None else ("dam_id",)
        _check_born_before(dam.birth_date, body.birth_date, loc)
    if sire is not None:
        loc = ("sire", "birth_date") if body.sire is not None else ("sire_id",)
        _check_born_before(sire.birth_date, body.birth_date, loc)

    extra = {
        "photo_url": body.photo_url,
        "birth_length_cm": body.birth_length_cm,
        "weight_birth_kg": body.weight_birth_kg,
        "weight_weaning_kg": body.weight_weaning_kg,
        "weight_one_year_kg": body.weight_one_year_kg,
        "dam_id": dam.id if dam else None,
        "sire_id": sire.id if sire else None,
    }
    animal, projection = await _register(
        session, ctx, settings, _Registration(body, body.sex, (), extra, alta), today
    )
    created.append(animal)
    refs = HistoryRefs(animal_ids=[a.id for a in created])
    await history.record(
        session, ctx.ranch_id, ctx.user.id, HistoryKey.ANIMALS_ADDED, refs, n=len(created)
    )

    reason = DAM_REMOVAL.get(body.dam_status) if body.dam_status else None
    if dam is not None and reason is not None and dam.status is AnimalStatus.ACTIVE:
        await _retire(session, ctx, settings, dam, reason, today, today)
    return Created(animal, projection, created)


# --- Edit --------------------------------------------------------------------------------------


async def get_animal(session: AsyncSession, ranch_id: uuid.UUID, animal_id: uuid.UUID) -> Animal:
    animal = await session.scalar(
        select(Animal).where(Animal.id == animal_id, Animal.ranch_id == ranch_id)
    )
    if animal is None:
        raise AnimalNotFound
    return animal


async def projection_of(session: AsyncSession, animal: Animal, today: dt.date) -> Projection:
    settings = await session.get_one(RanchSettings, animal.ranch_id)
    return await compute_projection(session, animal, settings, today)


async def update_animal(
    session: AsyncSession,
    ctx: RanchContext,
    animal_id: uuid.UUID,
    body: AnimalUpdate,
    today: dt.date,
) -> tuple[Animal, Projection]:
    animal = await get_animal(session, ctx.ranch_id, animal_id)
    if animal.status is AnimalStatus.REMOVED:
        raise AnimalRemoved
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    for name in REQUIRED_ON_UPDATE & changes.keys():
        if changes[name] is None:
            raise _invalid((name,), "required", "Este campo es obligatorio")

    if "control_id" in changes and changes["control_id"] != animal.control_id:
        await _check_control_id(session, ctx.ranch_id, changes["control_id"], (), exclude=animal.id)
    if changes.get("siniiga") not in (None, animal.siniiga):
        await _check_siniiga(session, changes["siniiga"], (), exclude=animal.id)
    if animal.sex is Sex.MACHO and changes.get("name") not in (None, animal.name):
        await _check_bull_name(session, ctx.ranch_id, changes["name"], (), exclude=animal.id)
    if changes.get("group_id") is not None:
        await _check_group(session, ctx.ranch_id, changes["group_id"], ())
    level = changes.get("crossbreed_level", animal.crossbreed_level)
    contributing = changes.get("contributing_breed", animal.contributing_breed)
    if level is CrossbreedLevel.FB and "contributing_breed" not in changes:
        contributing = changes["contributing_breed"] = None  # Going pure clears it.
    _check_crossbreed(level, contributing, ())
    if "development_stage" in changes:
        _check_stage(animal.sex, changes["development_stage"], ())
    final_birth: dt.date = changes.get("birth_date") or animal.birth_date
    for slot, sex in (("dam_id", Sex.HEMBRA), ("sire_id", Sex.MACHO)):
        parent_id = changes[slot] if slot in changes else getattr(animal, slot)
        if parent_id is None:
            continue
        if parent_id == animal.id:
            raise _invalid((slot,), "parent_is_self", "Un animal no puede ser su propio padre")
        parent = await _parent(session, ctx.ranch_id, parent_id, sex, slot)
        loc = (slot,) if slot in changes else ("birth_date",)
        _check_born_before(parent.birth_date, final_birth, loc)

    birth = changes.get("birth_date")
    if birth is not None and birth != animal.birth_date:
        await _check_birth_keeps_records(session, animal, birth)
        _check_past(birth, today, (), "birth_date")
        if animal.kind is AnimalKind.VAQUILLA and not heifer_birth_date_editable(birth, today):
            raise _invalid(
                ("birth_date",),
                "heifer_too_old",
                "Una vaquilla no puede tener más de 24 meses; si ya parió, regístrala como vaca",
            )
        calving = animal.last_calving_date
        if calving is not None and not last_calving_date_valid(birth, calving):
            raise _invalid(
                ("birth_date",),
                "calving_too_young",
                "El último parto debe ser al menos 660 días después del nacimiento",
            )

    for name, value in changes.items():
        setattr(animal, name, value)
    settings = await session.get_one(RanchSettings, ctx.ranch_id)
    projection = await reproject_animal(session, animal, settings, today)
    await history.record(
        session,
        ctx.ranch_id,
        ctx.user.id,
        HistoryKey.ANIMALS_EDITED,
        HistoryRefs(animal_ids=[animal.id]),
    )
    await session.flush()
    return animal, projection


async def _check_birth_keeps_records(session: AsyncSession, animal: Animal, birth: dt.date) -> None:
    """A new birth date can't come after anything already recorded about the animal: its
    declared or projected repro dates, its events, or its offspring."""
    first_event = await session.scalar(
        select(func.min(Event.occurred_on)).where(
            Event.animal_id == animal.id, Event.type != EventType.ALTA
        )
    )
    recorded = [
        animal.repro_stage_date,
        animal.last_calving_date,
        animal.last_heat_date,
        animal.last_service_date,
        first_event,
    ]
    if any(day is not None and day < birth for day in recorded):
        raise _invalid(
            ("birth_date",),
            "birth_after_records",
            "La fecha de nacimiento es posterior a eventos ya registrados",
        )
    eldest = await session.scalar(
        select(func.min(Animal.birth_date)).where(
            Animal.ranch_id == animal.ranch_id,
            or_(Animal.dam_id == animal.id, Animal.sire_id == animal.id),
        )
    )
    if eldest is not None:
        _check_born_before(birth, eldest, ("birth_date",))


# --- Remove ------------------------------------------------------------------------------------


async def _retire(
    session: AsyncSession,
    ctx: RanchContext,
    settings: RanchSettings,
    animal: Animal,
    reason: RemovalReason,
    on: dt.date,
    today: dt.date,
) -> None:
    """A REMOVAL event: the animal and its record stay, read-only."""
    session.add(
        Event(
            ranch_id=ctx.ranch_id,
            animal_id=animal.id,
            type=EventType.REMOVAL,
            occurred_on=on,
            recorded_by=ctx.user.id,
            payload=RemovalPayload(reason=reason).model_dump(mode="json"),
        )
    )
    animal.status = AnimalStatus.REMOVED
    animal.removed_reason = reason
    if on == today:
        animal.removed_at = dt.datetime.now(dt.UTC)
    else:  # Midday at the ranch, so the date reads the same in any zone near it.
        animal.removed_at = dt.datetime.combine(on, dt.time(12), RANCH_TIMEZONE)
    await session.flush()
    await reproject_animal(session, animal, settings, today)
    await history.record(
        session,
        ctx.ranch_id,
        ctx.user.id,
        REMOVAL_HISTORY[reason],
        HistoryRefs(animal_ids=[animal.id]),
    )


async def remove_animal(
    session: AsyncSession,
    ctx: RanchContext,
    animal_id: uuid.UUID,
    body: AnimalRemoval,
    today: dt.date,
) -> Animal | None:
    """Baja. Returns the removed animal, or None when ERROR_REGISTRO deleted it."""
    animal = await get_animal(session, ctx.ranch_id, animal_id)
    if animal.status is AnimalStatus.REMOVED:
        raise AnimalRemoved
    if body.reason is RemovalReason.ERROR_REGISTRO:
        # The record was a mistake: it goes, with its events, and its SINIIGA is free again.
        # Unless another animal's events name it: folding them would bring the id back.
        named = await session.scalar(
            select(Event.id)
            .where(
                Event.ranch_id == ctx.ranch_id,
                Event.animal_id != animal.id,
                Event.type.in_((EventType.HEAT, EventType.CALVING)),
                cast(Event.payload, String).contains(str(animal.id)),
            )
            .limit(1)
        )
        if named is not None:
            raise AnimalInUse
        for column in (Animal.dam_id, Animal.sire_id, Animal.service_bull_id):
            await session.execute(
                update(Animal)
                .where(Animal.ranch_id == ctx.ranch_id, column == animal.id)
                .values({column.key: None})
            )
        await session.execute(delete(Event).where(Event.animal_id == animal.id))
        await session.delete(animal)
        await history.record(
            session,
            ctx.ranch_id,
            ctx.user.id,
            HistoryKey.ANIMALS_REMOVED_ERROR,
            HistoryRefs(animal_ids=[animal.id]),
        )
        return None
    on = body.removed_on or today
    _check_past(on, today, (), "removed_on")
    _check_after_birth(on, animal.birth_date, (), "removed_on")
    settings = await session.get_one(RanchSettings, ctx.ranch_id)
    await _retire(session, ctx, settings, animal, body.reason, on, today)
    return animal


# --- List --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class AnimalFilters:
    kind: AnimalKind | None = None
    q: str | None = None
    group: GroupFilter | None = None
    breed: Breed | None = None
    repro: ReproState | None = None
    health: Health | None = None
    removed_reason: RemovalReason | None = None
    sort: SortKey = "control_id"
    page: int = 1
    page_size: int = PAGE_SIZE


def _like(text: str) -> str:
    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _filters(ranch_id: uuid.UUID, filters: AnimalFilters) -> list[ColumnElement[bool]]:
    conditions: list[ColumnElement[bool]] = [Animal.ranch_id == ranch_id]
    if filters.removed_reason is None:
        conditions.append(Animal.status == AnimalStatus.ACTIVE)
    else:  # "Bajas": the removed, by reason.
        conditions.append(Animal.status == AnimalStatus.REMOVED)
        conditions.append(Animal.removed_reason == filters.removed_reason)
    if filters.kind is not None:
        conditions.append(Animal.kind == filters.kind)
    if filters.q:
        pattern = _like(filters.q.strip())
        conditions.append(
            or_(
                Animal.control_id.ilike(pattern, escape="\\"),
                Animal.name.ilike(pattern, escape="\\"),
            )
        )
    if isinstance(filters.group, uuid.UUID):
        conditions.append(Animal.group_id == filters.group)
    elif filters.group is not None:
        preset_groups = select(Group.id).where(
            Group.ranch_id == ranch_id, Group.preset == filters.group
        )
        in_preset: ColumnElement[bool] = Animal.group_id.in_(preset_groups)
        # An animal with no group is in General, the default potrero.
        if filters.group is GroupPreset.GENERAL:
            in_preset = or_(in_preset, Animal.group_id.is_(None))
        conditions.append(in_preset)
    if filters.breed is not None:
        conditions.append(Animal.breed == filters.breed)
    if filters.repro is not None:
        conditions.append(Animal.repro_state == filters.repro)
    if filters.health is not None:
        conditions.append(Animal.is_sick.is_(filters.health == "ENFERMA"))
    return conditions


def _ordered(query: Select[Animal], sort: SortKey) -> Select[Animal]:
    column = getattr(Animal, sort.lstrip("-"))
    key = column.desc() if sort.startswith("-") else column.asc()
    return query.order_by(key.nulls_last(), Animal.id)


async def list_animals(
    session: AsyncSession, ranch_id: uuid.UUID, filters: AnimalFilters
) -> tuple[list[Animal], int]:
    conditions = _filters(ranch_id, filters)
    total = await session.scalar(select(func.count()).select_from(Animal).where(*conditions))
    query = _ordered(select(Animal).where(*conditions), filters.sort)
    offset = (filters.page - 1) * filters.page_size
    rows = await session.scalars(query.offset(offset).limit(filters.page_size))
    return list(rows.all()), total or 0
