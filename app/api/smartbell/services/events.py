"""The bitácora API: record, edit and delete an animal's events (docs/domain-model.md §1, §4).

Every write re-runs the repro fold, writes the projection onto the animal, syncs its alerts
(`alert_sync`) and records a history entry. The caller commits, so a request is one transaction.
"""

import datetime as dt
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import PREGNANT_STATES, Projection, classify_loss, project
from smartbell.domain.withdrawal import separates_milk, withdrawal_until
from smartbell.enums import (
    NON_DELETABLE_EVENT_TYPES,
    AnimalStatus,
    CalvingTiming,
    DeletionRequestStatus,
    EventType,
    GroupPreset,
    HeatOutcome,
    HistoryKey,
    PregnancyCheckResult,
    ReproState,
    Role,
    Sex,
    TreatmentFollowupOutcome,
)
from smartbell.models import (
    Alert,
    Animal,
    DeletionRequest,
    Event,
    Group,
    PlanVaccine,
    RanchSettings,
    VaccinationPlan,
)
from smartbell.schemas.event_api import EventCreate, EventDerived, EventInput, EventUpdate
from smartbell.schemas.events import (
    AbortionPayload,
    AccidentPayload,
    CalvingPayload,
    EventPayload,
    GroupChangeDetails,
    GroupChangePayload,
    HeatPayload,
    IllnessPayload,
    MedicalTreatmentPayload,
    PregnancyCheckPayload,
    Treatment,
    TreatmentFollowupPayload,
    VaccinationPayload,
    validate_event_payload,
)
from smartbell.schemas.history import HistoryRefs
from smartbell.security.permissions import Permission
from smartbell.security.ranch import RanchContext
from smartbell.services import alert_sync, history
from smartbell.services.animals import AnimalRemoved, FieldError, get_animal
from smartbell.services.projection import (
    animal_facts,
    event_fact,
    repro_settings,
    reproject_animal,
)

# Recorded elsewhere, and with side effects of their own: never edited or deleted here.
OWN_FLOW_TYPES = frozenset({EventType.ALTA, EventType.REMOVAL})
# §6 Q4: repro events are never deleted, but an admin may correct one.
ADMIN_ROLES = frozenset({Role.DUENO, Role.ADMINISTRADOR})


class EventNotFound(Exception):
    pass


class EventLocked(Exception):
    """A 409: the event can't be edited or deleted. `code` says which."""

    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


class AdminOnly(Exception):
    """A 403: only the Dueño or an Administrador may edit a repro event."""


@dataclass(frozen=True)
class Written:
    event: Event
    derived: EventDerived
    animal: Animal
    projection: Projection
    open_alerts: list[Alert]


@dataclass(frozen=True)
class Deleted:
    animal: Animal
    projection: Projection
    open_alerts: list[Alert]


def _invalid(loc: tuple[str, ...], code: str, msg: str) -> FieldError:
    return FieldError(422, loc, code, msg)


# --- Read --------------------------------------------------------------------------------------


async def list_events(
    session: AsyncSession, ranch_id: uuid.UUID, animal_id: uuid.UUID
) -> list[Event]:
    """The bitácora, newest first."""
    await get_animal(session, ranch_id, animal_id)
    rows = await session.scalars(
        select(Event)
        .where(Event.animal_id == animal_id, Event.ranch_id == ranch_id)
        .order_by(Event.occurred_on.desc(), Event.created_at.desc(), Event.id.desc())
    )
    return list(rows)


async def _get_event(
    session: AsyncSession, ranch_id: uuid.UUID, animal_id: uuid.UUID, event_id: uuid.UUID
) -> Event:
    event = await session.scalar(
        select(Event).where(
            Event.id == event_id, Event.animal_id == animal_id, Event.ranch_id == ranch_id
        )
    )
    if event is None:
        raise EventNotFound
    return event


# --- Checks ------------------------------------------------------------------------------------


def _check_date(on: dt.date, animal: Animal, today: dt.date) -> None:
    if on > today:
        raise _invalid(("occurred_on",), "date_in_future", "La fecha no puede ser futura")
    if on < animal.birth_date:
        raise _invalid(
            ("occurred_on",), "before_birth", "La fecha no puede ser anterior al nacimiento"
        )


async def _check_animal_ref(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    animal_id: uuid.UUID,
    loc: tuple[str, ...],
    sex: Sex | None = None,
) -> None:
    found = await session.scalar(
        select(Animal.sex).where(Animal.id == animal_id, Animal.ranch_id == ranch_id)
    )
    if found is None:
        raise _invalid(loc, "animal_not_found", "No encontramos ese animal")
    if sex is not None and found is not sex:
        raise _invalid(loc, "bull_not_male", "El toro debe ser macho")


async def _check_group(session: AsyncSession, ranch_id: uuid.UUID, group_id: uuid.UUID) -> Group:
    group = await session.scalar(
        select(Group).where(Group.id == group_id, Group.ranch_id == ranch_id)
    )
    if group is None:
        raise _invalid(("payload", "to_group_id"), "group_not_found", "El potrero no existe")
    return group


async def _check_refs(
    session: AsyncSession, ranch_id: uuid.UUID, animal: Animal, payload: EventInput
) -> None:
    """Every id in the payload must name something of the active ranch."""
    match payload:
        case HeatPayload(bull_id=uuid.UUID() as bull):
            await _check_animal_ref(session, ranch_id, bull, ("payload", "bull_id"), Sex.MACHO)
        case CalvingPayload(calf_animal_id=uuid.UUID() as calf):
            if calf == animal.id:
                raise _invalid(("payload", "calf_animal_id"), "calf_is_dam", "Elige la cría")
            await _check_animal_ref(session, ranch_id, calf, ("payload", "calf_animal_id"))
        case VaccinationPayload(vaccine_id=vaccine):
            found = await session.scalar(
                select(PlanVaccine.id)
                .join(VaccinationPlan, VaccinationPlan.id == PlanVaccine.plan_id)
                .where(PlanVaccine.id == vaccine, VaccinationPlan.ranch_id == ranch_id)
            )
            if found is None:
                raise _invalid(
                    ("payload", "vaccine_id"), "vaccine_not_found", "La vacuna no existe"
                )
        case _:
            pass


# --- Derived fields ----------------------------------------------------------------------------


async def _prior_projection(
    session: AsyncSession,
    animal: Animal,
    settings: RanchSettings,
    on: dt.date,
    exclude: uuid.UUID | None,
) -> Projection:
    """The animal as of `on`, without the event being written."""
    query = select(Event).where(Event.animal_id == animal.id)
    if exclude is not None:
        query = query.where(Event.id != exclude)
    events = await session.scalars(query)
    return project(animal_facts(animal), map(event_fact, events), repro_settings(settings), on)


def _calving_timing(prior: Projection, on: dt.date) -> CalvingTiming | None:
    window = prior.calving
    if window is None:
        return None
    if on < window.start:
        return CalvingTiming.ANTICIPADO
    return CalvingTiming.RETRASADO if on > window.end else CalvingTiming.ESPERADO


def _treatment(payload: EventPayload) -> Treatment | None:
    match payload:
        case IllnessPayload() | AccidentPayload() | MedicalTreatmentPayload():
            return payload.treatment
        case HeatPayload():
            return payload.treatment
        case TreatmentFollowupPayload():
            return payload.new_treatment
        case _:
            return None


def _withdrawal(event_type: EventType, payload: EventPayload) -> dt.date | None:
    treatment = _treatment(payload)
    if treatment is None:
        return None
    kind = payload.kind if isinstance(payload, MedicalTreatmentPayload) else None
    if not separates_milk(event_type, treatment, kind):
        return None
    return withdrawal_until(treatment, kind)


async def _derive(
    session: AsyncSession,
    animal: Animal,
    settings: RanchSettings,
    payload: EventInput | EventPayload,
    on: dt.date,
    exclude: uuid.UUID | None,
) -> EventDerived:
    """Fills CALVING timing on `payload` and works out the rest for the response."""
    derived = EventDerived(withdrawal_until=_withdrawal(payload.type, payload))
    if isinstance(payload, CalvingPayload | AbortionPayload):
        prior = await _prior_projection(session, animal, settings, on, exclude)
        if isinstance(payload, CalvingPayload):
            payload.timing = _calving_timing(prior, on) or payload.timing or CalvingTiming.ESPERADO
            derived.calving_timing = payload.timing
        else:
            served = prior.repro_state in PREGNANT_STATES or prior.repro_state is ReproState.SERVIDA
            if served and prior.last_service_date is not None:
                loss = classify_loss(prior.last_service_date, on, repro_settings(settings))
                derived.loss = loss.name
    return derived


# --- Groups ------------------------------------------------------------------------------------


def _group_change(payload: EventPayload | EventInput) -> GroupChangeDetails | None:
    if isinstance(payload, GroupChangePayload):
        return payload
    if isinstance(payload, IllnessPayload | AccidentPayload):
        return payload.group_change
    return None


async def _apply_group_change(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    animal: Animal,
    payload: EventInput | EventPayload,
    *,
    auto: bool = True,
) -> None:
    """Moves the animal. An ILLNESS with no move sends her to ENFERMAS, if the ranch has it."""
    change = _group_change(payload)
    if change is None and auto and isinstance(payload, IllnessPayload):
        sick = await session.scalar(
            select(Group.id).where(Group.ranch_id == ranch_id, Group.preset == GroupPreset.ENFERMAS)
        )
        if sick is not None and sick != animal.group_id:
            payload.group_change = GroupChangeDetails(
                from_group_id=animal.group_id, to_group_id=sick
            )
            animal.group_id = sick
        return
    if change is None:
        return
    await _check_group(session, ranch_id, change.to_group_id)
    if change.to_group_id == animal.group_id:
        raise _invalid(("payload", "to_group_id"), "same_group", "La vaca ya está en ese potrero")
    change.from_group_id = animal.group_id
    animal.group_id = change.to_group_id


async def _move_again(
    session: AsyncSession,
    ranch_id: uuid.UUID,
    animal: Animal,
    old: EventPayload | None,
    new: EventInput | EventPayload,
) -> None:
    """An edit: a move to the same group stays as recorded, even if she has moved on since.
    Otherwise the old move is undone and the new one made. No automatic move to ENFERMAS."""
    before, after = (_group_change(old) if old else None), _group_change(new)
    if before is not None and after is not None and before.to_group_id == after.to_group_id:
        after.from_group_id = before.from_group_id
        return
    if old is not None:
        _revert_group_change(animal, old)
    if after is not None:
        await _apply_group_change(session, ranch_id, animal, new, auto=False)


def _revert_group_change(animal: Animal, payload: EventPayload) -> None:
    """Undoes a move, unless the animal has been moved again since."""
    change = _group_change(payload)
    if change is not None and animal.group_id == change.to_group_id:
        animal.group_id = change.from_group_id


# --- History -----------------------------------------------------------------------------------


def _history_key(payload: EventPayload) -> HistoryKey:
    match payload:
        case HeatPayload(outcome=HeatOutcome.NOT_OBSERVED):
            return HistoryKey.HEAT_NOT_OBSERVED
        case HeatPayload():
            return HistoryKey.HEAT_IDENTIFIED
        case PregnancyCheckPayload(result=PregnancyCheckResult.NEGATIVE):
            return HistoryKey.PREGNANCY_NEGATIVE
        case PregnancyCheckPayload():
            return HistoryKey.PREGNANCY_DIAGNOSED
        case TreatmentFollowupPayload(outcome=TreatmentFollowupOutcome.SUCCESS):
            return HistoryKey.ANIMALS_CURED
        case TreatmentFollowupPayload():
            return HistoryKey.TREATMENT_CHANGED
        case _:
            return {
                EventType.CALVING: HistoryKey.CALVED,
                EventType.ABORTION: HistoryKey.ABORTED,
                EventType.ILLNESS: HistoryKey.ANIMALS_ILL,
                EventType.ACCIDENT: HistoryKey.ANIMALS_INJURED,
                EventType.MEDICAL_TREATMENT: HistoryKey.TREATMENT_APPLIED,
                EventType.DIET_CHANGE: HistoryKey.DIET_CHANGED,
                EventType.VACCINATION: HistoryKey.VACCINATED,
                EventType.WEIGHT: HistoryKey.WEIGHED,
            }[payload.type]


async def _record_history(
    session: AsyncSession, ctx: RanchContext, animal: Animal, payload: EventPayload
) -> None:
    refs = HistoryRefs(animal_ids=[animal.id])
    if isinstance(payload, GroupChangePayload):
        to = await session.get_one(Group, payload.to_group_id)
        refs = HistoryRefs(animal_ids=[animal.id], group_id=to.id, to_group=to.name)
        key = HistoryKey.GROUP_ANIMALS_SENT
    else:
        key = _history_key(payload)
    await history.record(session, ctx.ranch_id, ctx.user.id, key, refs)


# --- Writes ------------------------------------------------------------------------------------


async def _writable_animal(
    session: AsyncSession, ranch_id: uuid.UUID, animal_id: uuid.UUID
) -> Animal:
    animal = await get_animal(session, ranch_id, animal_id)
    if animal.status is AnimalStatus.REMOVED:
        raise AnimalRemoved
    return animal


async def _after_write(
    session: AsyncSession,
    animal: Animal,
    settings: RanchSettings,
    today: dt.date,
    event: Event | None,
) -> tuple[Projection, list[Alert]]:
    projection = await reproject_animal(session, animal, settings, today)
    alerts = await alert_sync.sync_animal(
        session,
        animal,
        projection,
        today,
        event_id=event.id if event else None,
        event_type=event.type if event else None,
    )
    return projection, alerts


async def record_event(
    session: AsyncSession,
    ctx: RanchContext,
    animal_id: uuid.UUID,
    body: EventCreate,
    today: dt.date,
) -> Written:
    animal = await _writable_animal(session, ctx.ranch_id, animal_id)
    settings = await session.get_one(RanchSettings, ctx.ranch_id)
    payload = body.payload
    _check_date(body.occurred_on, animal, today)
    await _check_refs(session, ctx.ranch_id, animal, payload)
    derived = await _derive(session, animal, settings, payload, body.occurred_on, None)
    await _apply_group_change(session, ctx.ranch_id, animal, payload)
    stored = validate_event_payload(payload.type, payload.model_dump(mode="json"))
    event = Event(
        id=uuid.uuid4(),
        ranch_id=ctx.ranch_id,
        animal_id=animal.id,
        type=payload.type,
        occurred_on=body.occurred_on,
        recorded_by=ctx.user.id,
        description=body.description,
        comments=body.comments,
        payload=stored.model_dump(mode="json", exclude_none=True),
    )
    session.add(event)
    await session.flush()
    await session.refresh(event)
    projection, alerts = await _after_write(session, animal, settings, today, event)
    await _record_history(session, ctx, animal, stored)
    return Written(event, derived, animal, projection, alerts)


async def edit_event(
    session: AsyncSession,
    ctx: RanchContext,
    animal_id: uuid.UUID,
    event_id: uuid.UUID,
    body: EventUpdate,
    today: dt.date,
) -> Written:
    animal = await _writable_animal(session, ctx.ranch_id, animal_id)
    event = await _get_event(session, ctx.ranch_id, animal_id, event_id)
    if event.type in OWN_FLOW_TYPES:
        raise EventLocked("event_not_editable")
    if event.type in NON_DELETABLE_EVENT_TYPES and ctx.role not in ADMIN_ROLES:
        raise AdminOnly
    settings = await session.get_one(RanchSettings, ctx.ranch_id)
    changes = body.model_dump(exclude_unset=True)
    on = body.occurred_on if body.occurred_on is not None else event.occurred_on
    if "occurred_on" in changes:
        if body.occurred_on is None:
            raise _invalid(("occurred_on",), "required", "La fecha es obligatoria")
        _check_date(on, animal, today)
    try:
        old: EventPayload | None = validate_event_payload(event.type, event.payload)
    except ValueError:
        old = None  # A payload that no longer parses: a new one must be sent to replace it.
    if body.payload is not None:
        payload: EventInput | EventPayload = body.payload
        if payload.type is not event.type:
            raise _invalid(("payload", "type"), "type_changed", "No se puede cambiar el tipo")
        await _check_refs(session, ctx.ranch_id, animal, body.payload)
    elif old is not None:
        payload = old
    else:
        raise _invalid(("payload",), "required", "Envía el registro completo")
    derived = await _derive(session, animal, settings, payload, on, event.id)
    await _move_again(session, ctx.ranch_id, animal, old, payload)
    stored = validate_event_payload(payload.type, payload.model_dump(mode="json"))
    event.payload = stored.model_dump(mode="json", exclude_none=True)
    if "occurred_on" in changes:
        event.occurred_on = on
    if "description" in changes:
        event.description = body.description
    if "comments" in changes:
        event.comments = body.comments
    await session.flush()
    projection, alerts = await _after_write(session, animal, settings, today, event)
    await history.record(
        session,
        ctx.ranch_id,
        ctx.user.id,
        HistoryKey.ANIMALS_EDITED,
        HistoryRefs(animal_ids=[animal.id]),
    )
    return Written(event, derived, animal, projection, alerts)


async def delete_event(
    session: AsyncSession,
    ctx: RanchContext,
    animal_id: uuid.UUID,
    event_id: uuid.UUID,
    today: dt.date,
) -> Deleted | DeletionRequest:
    """Deletes the event, or, for a member without ANIMALS_DELETE, asks an admin to (§1)."""
    animal = await _writable_animal(session, ctx.ranch_id, animal_id)
    event = await _get_event(session, ctx.ranch_id, animal_id, event_id)
    if event.type in NON_DELETABLE_EVENT_TYPES or event.type in OWN_FLOW_TYPES:
        raise EventLocked("event_not_deletable")
    if Permission.ANIMALS_DELETE not in ctx.permissions:
        pending = await session.scalar(
            select(DeletionRequest).where(
                DeletionRequest.event_id == event.id,
                DeletionRequest.status == DeletionRequestStatus.PENDING,
            )
        )
        if pending is not None:
            return pending
        request = DeletionRequest(event_id=event.id, requested_by=ctx.user.id)
        session.add(request)
        await session.flush()
        await session.refresh(request)
        return request
    settings = await session.get_one(RanchSettings, ctx.ranch_id)
    try:
        _revert_group_change(animal, validate_event_payload(event.type, event.payload))
    except ValueError:
        pass  # A payload that no longer parses moved nobody we can tell.
    await alert_sync.detach_event(session, event.id)
    await session.delete(event)
    await session.flush()
    projection, alerts = await _after_write(session, animal, settings, today, None)
    await history.record(
        session,
        ctx.ranch_id,
        ctx.user.id,
        HistoryKey.ANIMALS_EDITED,
        HistoryRefs(animal_ids=[animal.id]),
    )
    return Deleted(animal, projection, alerts)
