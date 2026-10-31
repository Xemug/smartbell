"""Builders for the engine's inputs. Every default below is a seeded RanchSettings default."""

import datetime as dt
import uuid
from typing import Any

from smartbell.domain.repro import (
    AnimalFacts,
    EventFact,
    Projection,
    ReproSettings,
    project,
)
from smartbell.enums import (
    AbortionCause,
    AbortionKind,
    CalvingTiming,
    DevelopmentStage,
    DrugPresentation,
    EventType,
    HeatOutcome,
    Illness,
    PregnancyCheckMethod,
    PregnancyCheckResult,
    RemovalReason,
    ServiceMethod,
    Sex,
    TreatmentFollowupOutcome,
    TreatmentType,
)

D0 = dt.date(2026, 1, 1)
BIRTH = dt.date(2022, 1, 1)
BULL = uuid.UUID(int=7)
SETTINGS = ReproSettings(
    gestation_days=283,
    heat_cycle_days=21,
    heat_window_days=7,
    vwp_days=45,
    preg_check_min_days=35,
    preg_check_max_days=45,
    preg_recheck_days=(90, 180),
    dry_off_days_before_calving=60,
    close_up_days_before_calving=21,
    diet_change_dim=120,
    abortion_min_days=42,
    abortion_max_days=260,
    heifer_heat_alert_from_months=13,
    heifer_heat_alert_until_months=18,
    heifer_breeding_unlock_months=12,
)
COW = AnimalFacts(Sex.HEMBRA, BIRTH, DevelopmentStage.VACA_ADULTA)
HEIFER = AnimalFacts(Sex.HEMBRA, dt.date(2024, 10, 1))


def day(offset: int) -> dt.date:
    return D0 + dt.timedelta(days=offset)


def fact(event_type: EventType, offset: int, **payload: Any) -> EventFact:
    return EventFact(event_type, day(offset), payload)


def alta(**payload: Any) -> EventFact:
    fields = {"control_id": "1", "sex": Sex.HEMBRA, "birth_date": BIRTH} | payload
    return EventFact(EventType.ALTA, BIRTH, fields)


def heat(offset: int, outcome: HeatOutcome, **payload: Any) -> EventFact:
    clean = {
        HeatOutcome.NOT_OBSERVED: None,
        HeatOutcome.DIRTY_MEDICATED: False,
        HeatOutcome.DIRTY_NOT_MEDICATED: False,
    }.get(outcome, True)
    if outcome is HeatOutcome.DIRTY_MEDICATED:
        payload.setdefault("treatment", treatment(offset, withdrawal_days=3))
    return fact(EventType.HEAT, offset, outcome=outcome, clean=clean, **payload)


def served(offset: int) -> EventFact:
    return heat(offset, HeatOutcome.INSEMINATED, bull_id=BULL, method=ServiceMethod.IA)


def check(offset: int, *, positive: bool) -> EventFact:
    result = PregnancyCheckResult.POSITIVE if positive else PregnancyCheckResult.NEGATIVE
    return fact(
        EventType.PREGNANCY_CHECK,
        offset,
        method=PregnancyCheckMethod.TACTO,
        result=result,
        description=None if positive else "Vacía",
    )


def calved(offset: int, *, registered: bool = True) -> EventFact:
    calf = {"calf_animal_id": uuid.UUID(int=9)} if registered else {}
    return fact(
        EventType.CALVING,
        offset,
        timing=CalvingTiming.ESPERADO,
        calf_registered=registered,
        **calf,
    )


def aborted(offset: int) -> EventFact:
    return fact(
        EventType.ABORTION, offset, kind=AbortionKind.NATURAL, cause=AbortionCause.DESCONOCIDO
    )


def treatment(offset: int, **fields: Any) -> dict[str, Any]:
    return {
        "type": TreatmentType.ANTIBIOTICO,
        "presentation": DrugPresentation.INYECCION,
        "start_date": day(offset),
    } | fields


def illness(offset: int, **fields: Any) -> EventFact:
    return fact(
        EventType.ILLNESS,
        offset,
        illness=Illness.MASTITIS,
        treatment=treatment(offset, **fields),
    )


def accident(offset: int, **fields: Any) -> EventFact:
    return fact(EventType.ACCIDENT, offset, treatment=treatment(offset, **fields))


def followup(offset: int, *, success: bool = True, **fields: Any) -> EventFact:
    if success:
        return fact(EventType.TREATMENT_FOLLOWUP, offset, outcome=TreatmentFollowupOutcome.SUCCESS)
    return fact(
        EventType.TREATMENT_FOLLOWUP,
        offset,
        outcome=TreatmentFollowupOutcome.CHANGE,
        new_treatment=treatment(offset, **fields),
    )


def removed(offset: int) -> EventFact:
    return fact(EventType.REMOVAL, offset, reason=RemovalReason.MUERTE)


def run(
    *events: EventFact,
    today: int,
    animal: AnimalFacts = COW,
    settings: ReproSettings = SETTINGS,
) -> Projection:
    return project(animal, [alta(lactation_number=1), *events], settings, day(today))
