"""When each vaccine of an approved plan is next due for an animal (docs/domain-model.md §4,
"VaccinationPlan approved → VACCINE_DUE per animal per vaccine schedule").

Pure, like `repro`: the caller passes the plan's vaccines, the animal's events and the projection
dates it needs, and gets the dates back. `smartbell.services.alerts` turns them into alerts.
"""

import datetime as dt
import uuid
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from decimal import Decimal

from smartbell.domain.repro import EventFact, add_months
from smartbell.enums import (
    EventType,
    HeatOutcome,
    PregnancyCheckResult,
    VaccineFrequency,
    VaccineStartBy,
    VaccineStartEvent,
)

REPEAT_MONTHS = {VaccineFrequency.CADA_6_MESES: 6, VaccineFrequency.ANUAL: 12}


@dataclass(frozen=True)
class VaccineRule:
    """One `PlanVaccine` row, as the rules read it."""

    id: uuid.UUID
    start_by: VaccineStartBy
    frequency: VaccineFrequency
    start_value: Decimal | None = None
    start_event: VaccineStartEvent | None = None
    booster_count: int | None = None
    booster_every_months: int | None = None


def _payload_value(event: EventFact, key: str) -> object:
    return event.payload.get(key) if isinstance(event.payload, Mapping) else None


def first_dose_date(
    rule: VaccineRule,
    birth_date: dt.date,
    events: Iterable[EventFact],
    dry_off_date: dt.date | None,
) -> dt.date | None:
    """When the first dose falls due, or None while the animal hasn't reached the start."""
    ordered = sorted(events, key=lambda event: event.occurred_on)
    match rule.start_by:
        case VaccineStartBy.AGE_MONTHS:
            return add_months(birth_date, int(rule.start_value or 0))
        case VaccineStartBy.WEIGHT_KG:
            target = float(rule.start_value or 0)
            for event in ordered:
                kg = _payload_value(event, "kg")
                if event.type is EventType.WEIGHT and isinstance(kg, int | float) and kg >= target:
                    return event.occurred_on
            return None
        case VaccineStartBy.EVENT:
            return _start_event_date(rule.start_event, ordered, dry_off_date)
    return None


def _start_event_date(
    start: VaccineStartEvent | None, ordered: list[EventFact], dry_off_date: dt.date | None
) -> dt.date | None:
    for event in ordered:
        outcome = _payload_value(event, "outcome")
        if event.type is EventType.HEAT:
            if start is VaccineStartEvent.PRIMER_CELO and outcome != HeatOutcome.NOT_OBSERVED:
                return event.occurred_on
            if start is VaccineStartEvent.PRIMERA_INSEMINACION and (
                outcome == HeatOutcome.INSEMINATED
            ):
                return event.occurred_on
        if (
            start is VaccineStartEvent.DIAGNOSTICO_GESTACION
            and event.type is EventType.PREGNANCY_CHECK
            and _payload_value(event, "result") == PregnancyCheckResult.POSITIVE
        ):
            return event.occurred_on
    if start is VaccineStartEvent.SECADO:
        return dry_off_date
    return None


def next_due(rule: VaccineRule, first: dt.date | None, doses: Iterable[dt.date]) -> dt.date | None:
    """The next dose's date given the doses already given, or None when the course is done."""
    given = sorted(doses)
    if not given:
        return first
    last = given[-1]
    match rule.frequency:
        case VaccineFrequency.UNICA:
            return None
        case VaccineFrequency.REFUERZOS:
            if len(given) > (rule.booster_count or 0) or not rule.booster_every_months:
                return None
            return add_months(last, rule.booster_every_months)
        case VaccineFrequency.CADA_6_MESES | VaccineFrequency.ANUAL:
            return add_months(last, REPEAT_MONTHS[rule.frequency])
    return None


def due_dates(
    rules: Iterable[VaccineRule],
    birth_date: dt.date,
    events: Iterable[EventFact],
    dry_off_date: dt.date | None,
    today: dt.date,
) -> set[dt.date]:
    """Every date on which a dose of the plan is due for this animal: one per vaccine at most."""
    known = [event for event in events if event.occurred_on <= today]
    doses: dict[str, list[dt.date]] = {}
    for event in known:
        if event.type is EventType.VACCINATION:
            vaccine = _payload_value(event, "vaccine_id")
            doses.setdefault(str(vaccine), []).append(event.occurred_on)
    dates: set[dt.date] = set()
    for rule in rules:
        due = next_due(
            rule,
            first_dose_date(rule, birth_date, known, dry_off_date),
            doses.get(str(rule.id), ()),
        )
        if due is not None:
            dates.add(due)
    return dates
