"""Milk withdrawal (docs/domain-model.md §3.6, §3.14)."""

import datetime as dt

import pytest

from smartbell.domain.withdrawal import (
    MAX_WITHDRAWAL_DAYS,
    separates_milk,
    withdrawal_days,
    withdrawal_until,
)
from smartbell.enums import (
    DrugPresentation,
    EventType,
    HeatOutcome,
    MedicalTreatmentKind,
    TreatmentType,
)
from smartbell.schemas.events import Treatment
from tests.domain.factories import D0, calved, day, fact, followup, heat, illness, run, treatment

T = TreatmentType


def make(**fields: object) -> Treatment:
    return Treatment.model_validate(treatment(0, **fields))


@pytest.mark.parametrize(
    ("kind", "days"),
    [
        (T.CORTICOIDE, 21),
        (T.ANTIBIOTICO, 10),
        (T.ANTISEPTICO, 3),
        (T.ANTIBACTERIANO, 3),
        (T.ANTIMICROBIANO, 42),
        (T.ANTIPARASITARIO, 42),
        (T.ANTIMICOTICO, 3),
    ],
)
def test_default_by_type(kind: TreatmentType, days: int) -> None:
    assert withdrawal_days(make(type=kind)) == days


@pytest.mark.parametrize("kind", [T.QUIRURGICO, T.ANTIINFLAMATORIO])
def test_with_no_stated_value_and_no_default_the_maximum_applies(kind: TreatmentType) -> None:
    assert withdrawal_days(make(type=kind)) == MAX_WITHDRAWAL_DAYS == 42


def test_what_the_user_entered_wins() -> None:
    assert withdrawal_days(make(type=T.QUIRURGICO, withdrawal_days=7)) == 7
    assert withdrawal_days(make(type=T.CORTICOIDE, withdrawal_days=0)) == 0


def test_topical_has_no_restriction() -> None:
    assert withdrawal_days(make(presentation=DrugPresentation.TOPICO)) == 0


def test_heat_synchronisation_is_two_days() -> None:
    days = withdrawal_days(make(), MedicalTreatmentKind.SINCRONIZACION_CELO)

    assert days == 2


def test_until_is_start_plus_duration_plus_withdrawal() -> None:
    assert withdrawal_until(make(duration_days=3, withdrawal_days=4)) == D0 + dt.timedelta(days=7)


def test_illness_always_separates_milk() -> None:
    assert separates_milk(EventType.ILLNESS, make(withdrawal_days=0)) is True


@pytest.mark.parametrize("event_type", [EventType.ACCIDENT, EventType.MEDICAL_TREATMENT])
def test_accident_and_treatment_separate_milk_only_if_affected(event_type: EventType) -> None:
    assert separates_milk(event_type, make(withdrawal_days=0)) is False
    assert separates_milk(event_type, make(withdrawal_days=1)) is True


def test_the_fold_applies_the_maximum_when_nothing_was_stated() -> None:
    projection = run(illness(10, type=T.QUIRURGICO), today=11)

    assert projection.milk_withdrawal_until == day(10 + 5 + 42)


def test_a_milder_later_drug_never_shortens_the_withdrawal() -> None:
    projection = run(illness(10, withdrawal_days=30), illness(12, withdrawal_days=1), today=13)

    assert projection.milk_withdrawal_until == day(45)


def test_a_changed_treatment_extends_the_withdrawal() -> None:
    projection = run(
        illness(10, withdrawal_days=2), followup(12, success=False, withdrawal_days=9), today=13
    )

    assert projection.milk_withdrawal_until == day(26)


def test_medical_treatment_uses_its_kind() -> None:
    event = fact(
        EventType.MEDICAL_TREATMENT,
        10,
        kind=MedicalTreatmentKind.SINCRONIZACION_CELO,
        treatment=treatment(10),
    )

    assert run(event, today=11).milk_withdrawal_until == day(10 + 5 + 2)


def test_heat_treatment_counts_for_the_milk() -> None:
    projection = run(calved(0), heat(50, HeatOutcome.DIRTY_MEDICATED), today=51)

    assert projection.milk_withdrawal_until == day(58)
