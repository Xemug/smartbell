"""Writes the repro engine's projection onto animals. Alerts and tasks belong to `events-api`."""

import dataclasses
import datetime as dt
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from smartbell.domain.repro import AnimalFacts, EventFact, Projection, ReproSettings, project
from smartbell.models import Animal, Event, RanchSettings, derive_kind


def repro_settings(row: RanchSettings) -> ReproSettings:
    values = {field.name: getattr(row, field.name) for field in dataclasses.fields(ReproSettings)}
    return ReproSettings(**{**values, "preg_recheck_days": tuple(row.preg_recheck_days)})


def animal_facts(animal: Animal) -> AnimalFacts:
    return AnimalFacts(
        sex=animal.sex,
        birth_date=animal.birth_date,
        development_stage=animal.development_stage,
        repro_stage=animal.repro_stage,
        repro_stage_date=animal.repro_stage_date,
    )


def event_fact(event: Event) -> EventFact:
    return EventFact(
        id=event.id,
        type=event.type,
        occurred_on=event.occurred_on,
        payload=event.payload,
        created_at=event.created_at,
    )


def write_projection(animal: Animal, projection: Projection) -> None:
    """The one place the projection columns are written. `development_stage` stays as chosen, so
    AUTO stays AUTO; `status` belongs to whoever records the removal."""
    animal.repro_state = projection.repro_state
    animal.lactation_state = projection.lactation_state
    animal.lactation_number = projection.lactation_number
    animal.last_calving_date = projection.last_calving_date
    animal.last_heat_date = projection.last_heat_date
    animal.last_service_date = projection.last_service_date
    animal.service_bull_id = projection.service_bull_id
    animal.service_number_in_lactation = projection.service_number_in_lactation
    animal.pregnancy_confirmed_date = projection.pregnancy_confirmed_date
    animal.expected_calving_date = projection.expected_calving_date
    animal.is_sick = projection.is_sick
    animal.sick_since = projection.sick_since
    animal.milk_withdrawal_until = projection.milk_withdrawal_until
    animal.kind = derive_kind(
        animal.sex, projection.development_stage, has_calved=projection.has_calved
    )


async def reproject_animal(
    session: AsyncSession, animal: Animal, settings: RanchSettings, today: dt.date
) -> Projection:
    """Re-run the fold after an event is added, edited or deleted. The caller commits."""
    events = await session.scalars(select(Event).where(Event.animal_id == animal.id))
    projection = project(
        animal_facts(animal), map(event_fact, events), repro_settings(settings), today
    )
    write_projection(animal, projection)
    return projection


async def reproject_ranch(session: AsyncSession, ranch_id: uuid.UUID, today: dt.date) -> int:
    """Re-run the fold for a whole ranch, as the daily job does. Returns the animals written."""
    settings = await session.get_one(RanchSettings, ranch_id)
    engine_settings = repro_settings(settings)
    animals = (await session.scalars(select(Animal).where(Animal.ranch_id == ranch_id))).all()
    events: dict[uuid.UUID, list[EventFact]] = {animal.id: [] for animal in animals}
    for event in await session.scalars(select(Event).where(Event.ranch_id == ranch_id)):
        events[event.animal_id].append(event_fact(event))
    for animal in animals:
        projection = project(animal_facts(animal), events[animal.id], engine_settings, today)
        write_projection(animal, projection)
    return len(animals)
