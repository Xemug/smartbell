"""Every transition of docs/domain-model.md §2, as a table: events in, state out."""

import pytest

from smartbell.domain.repro import AnimalFacts, EventFact, Flag, ReproWarning, project
from smartbell.enums import (
    DevelopmentStage,
    EventType,
    HeatOutcome,
    LactationState,
    ReproState,
    Sex,
)
from tests.domain.factories import (
    BIRTH,
    COW,
    D0,
    HEIFER,
    SETTINGS,
    aborted,
    alta,
    calved,
    check,
    day,
    fact,
    heat,
    illness,
    removed,
    run,
    served,
)

H = HeatOutcome
NOT_SERVED = [H.NOT_OBSERVED, H.VWP, H.NOT_INSEMINATED, H.DIRTY_MEDICATED, H.DIRTY_NOT_MEDICATED]
OPEN_OUTCOMES = [H.NOT_OBSERVED, H.NOT_INSEMINATED, H.DIRTY_MEDICATED, H.DIRTY_NOT_MEDICATED]
RETURN_OUTCOMES = [H.VWP, H.NOT_INSEMINATED, H.DIRTY_MEDICATED, H.DIRTY_NOT_MEDICATED]
D = DevelopmentStage
GESTATING = [calved(0), served(60), check(100, positive=True)]
# Service on day 60, so dry-off is day 283 and the calving is due on day 343.
DRY_DAY = 60 + 283 - 60

TRANSITIONS = [
    # (events, today, expected state)
    *[("heifer", [heat(30, o)], 40, ReproState.VAQUILLA) for o in NOT_SERVED],
    ("heifer", [served(30)], 40, ReproState.SERVIDA),
    *[("cow", [calved(0), heat(30, o)], 40, ReproState.RECIEN_PARIDA) for o in NOT_SERVED],
    ("cow", [calved(0)], 44, ReproState.RECIEN_PARIDA),
    ("cow", [calved(0)], 45, ReproState.ABIERTA),
    ("cow", [calved(0), heat(30, H.VWP)], 45, ReproState.ABIERTA),
    ("cow", [calved(0), served(30)], 40, ReproState.SERVIDA),
    ("cow", [calved(0), served(30)], 50, ReproState.SERVIDA),
    ("cow", [calved(0), served(60)], 70, ReproState.SERVIDA),
    *[("cow", [calved(0), heat(60, o)], 70, ReproState.ABIERTA) for o in OPEN_OUTCOMES],
    *[
        ("cow", [calved(0), served(60), heat(80, o)], 90, ReproState.ABIERTA)
        for o in RETURN_OUTCOMES
    ],
    ("cow", [calved(0), served(60), heat(80, H.NOT_OBSERVED)], 90, ReproState.SERVIDA),
    ("cow", [calved(0), served(60), served(80)], 90, ReproState.SERVIDA),
    ("cow", [calved(0), served(60), check(100, positive=True)], 110, ReproState.GESTANTE),
    ("cow", [calved(0), served(60), check(100, positive=False)], 110, ReproState.ABIERTA),
    ("cow", GESTATING, DRY_DAY - 1, ReproState.GESTANTE),
    ("cow", GESTATING, DRY_DAY, ReproState.SECA),
    ("cow", [*GESTATING, calved(340)], 350, ReproState.RECIEN_PARIDA),
    ("cow", [*GESTATING, calved(200)], 210, ReproState.RECIEN_PARIDA),
    ("cow", [*GESTATING, calved(340)], 385, ReproState.ABIERTA),
    ("cow", [*GESTATING, aborted(150)], 160, ReproState.ABIERTA),
    ("cow", [*GESTATING, aborted(300)], 310, ReproState.ABIERTA),
    ("cow", [*GESTATING, check(190, positive=True)], 200, ReproState.GESTANTE),
    ("cow", [*GESTATING, check(190, positive=False)], 200, ReproState.ABIERTA),
    ("cow", [*GESTATING, illness(150)], 160, ReproState.GESTANTE),
    ("heifer", [served(30), check(70, positive=False)], 80, ReproState.ABIERTA),
    ("heifer", [served(30), check(70, positive=True), calved(313)], 320, ReproState.RECIEN_PARIDA),
]


@pytest.mark.parametrize(("who", "events", "today", "state"), TRANSITIONS)
def test_transition(who: str, events: list[EventFact], today: int, state: ReproState) -> None:
    animal = COW if who == "cow" else HEIFER
    alta_event = alta(lactation_number=1 if who == "cow" else 0)

    projection = project(animal, [alta_event, *events], SETTINGS, day(today))

    assert projection.repro_state is state


def test_there_are_at_least_forty_table_cases() -> None:
    assert len(TRANSITIONS) >= 40


def test_lactation_dries_off_with_her_and_starts_again_on_calving() -> None:
    assert run(*GESTATING, today=DRY_DAY - 1).lactation_state is LactationState.LACTANDO
    assert run(*GESTATING, today=DRY_DAY).lactation_state is LactationState.SECA
    assert run(*GESTATING, calved(340), today=350).lactation_state is LactationState.LACTANDO


def test_lactation_number_increments_on_each_calving() -> None:
    first = run(calved(0), today=10)
    second = run(calved(0), served(60), check(100, positive=True), calved(343), today=350)

    assert (first.lactation_number, second.lactation_number) == (2, 3)


def test_heifer_becomes_a_cow_on_her_first_calving() -> None:
    events = [alta(lactation_number=0), served(30), check(70, positive=True)]
    before = project(HEIFER, events, SETTINGS, day(100))
    after = project(HEIFER, [*events, calved(313)], SETTINGS, day(320))

    assert (before.has_calved, before.lactation_state) == (False, None)
    assert (after.has_calved, after.lactation_number) == (True, 1)
    assert after.lactation_state is LactationState.LACTANDO


def test_a_pregnant_heifer_goes_seca_with_no_lactation_to_dry_off() -> None:
    events = [alta(lactation_number=0), served(30), check(70, positive=True)]

    projection = project(HEIFER, events, SETTINGS, day(30 + 283 - 60))

    assert projection.repro_state is ReproState.SECA
    assert projection.lactation_state is None


def test_heat_during_vwp_is_allowed_with_a_warning() -> None:
    inside = run(calved(0), served(30), today=31)
    outside = run(calved(0), served(45), today=46)

    assert ReproWarning(Flag.HEAT_DURING_VWP, day(30)) in inside.warnings
    assert Flag.HEAT_DURING_VWP not in {warning.flag for warning in outside.warnings}


def test_return_to_heat_cancels_the_check_and_the_service_on_it_starts_over() -> None:
    failed = run(calved(0), served(60), heat(80, H.NOT_INSEMINATED), today=81)
    served_again = run(calved(0), served(60), served(80), today=81)

    assert failed.pregnancy_check is None
    assert failed.expected_calving_date is None
    assert failed.last_service_date == day(60)  # History stays; only the pending dates go.
    assert served_again.pregnancy_check is not None
    assert served_again.pregnancy_check.start == day(115)
    assert served_again.service_number_in_lactation == 2


def test_heat_not_observed_keeps_the_service_alive() -> None:
    projection = run(calved(0), served(60), heat(81, H.NOT_OBSERVED), today=82)

    assert projection.last_heat_date == day(60)
    assert projection.pregnancy_check is not None
    assert projection.pregnancy_check.start == day(95)


def test_negative_check_clears_the_pregnancy_dates() -> None:
    projection = run(calved(0), served(60), check(100, positive=False), today=101)

    assert projection.pregnancy_check is None
    assert projection.calving is None
    assert projection.next_heat is not None
    assert projection.next_heat.start == day(118)


def test_abortion_clears_the_pregnancy_and_does_not_change_the_lactation() -> None:
    projection = run(*GESTATING, aborted(150), today=151)

    assert projection.pregnancy_confirmed_date is None
    assert projection.expected_calving_date is None
    assert projection.lactation_state is LactationState.LACTANDO
    assert projection.next_heat is not None
    assert projection.next_heat.start == day(168)


def test_abortion_after_dry_off_leaves_her_dry_and_open() -> None:
    projection = run(*GESTATING, aborted(300), today=301)

    assert projection.repro_state is ReproState.ABIERTA
    assert projection.lactation_state is LactationState.SECA


@pytest.mark.parametrize(
    "events",
    [
        [calved(0), check(60, positive=True)],
        [calved(0), aborted(60)],
        [*GESTATING, served(120)],
        [calved(0), served(60), calved(100)],
    ],
)
def test_events_with_no_transition_are_flagged_not_fatal(events: list[EventFact]) -> None:
    projection = run(*events, today=130)

    assert Flag.UNEXPECTED_EVENT in {warning.flag for warning in projection.warnings}


def test_gestante_stays_put_on_an_unexpected_service() -> None:
    assert run(*GESTATING, served(120), today=130).repro_state is ReproState.GESTANTE


def test_medicated_heat_while_pregnant_still_counts_for_the_milk() -> None:
    projection = run(*GESTATING, heat(120, H.DIRTY_MEDICATED), today=121)

    assert projection.milk_withdrawal_until == day(128)


def test_removal_freezes_her_and_stops_everything() -> None:
    projection = run(calved(0), removed(10), served(60), today=100)

    assert projection.removed is True
    assert projection.repro_state is ReproState.RECIEN_PARIDA  # No date transition after it.
    assert (projection.alerts, projection.reminders, projection.next_heat) == ((), (), None)


def test_deleting_the_removal_re_projects_her() -> None:
    assert run(calved(0), today=100).repro_state is ReproState.ABIERTA


def test_a_bull_has_no_reproductive_state() -> None:
    bull = AnimalFacts(Sex.MACHO, BIRTH, DevelopmentStage.TORO)

    projection = project(bull, [illness(0)], SETTINGS, day(2))

    assert projection.repro_state is None
    assert projection.lactation_number is None
    assert projection.is_sick is True
    assert projection.milk_withdrawal_until is None


def test_alta_comes_first_even_if_it_was_dated_after_a_backfilled_event() -> None:
    late_alta = EventFact(EventType.ALTA, day(50), alta(lactation_number=2).payload)

    projection = project(COW, [calved(0), late_alta], SETTINGS, day(60))

    assert projection.lactation_number == 3


def test_a_future_event_is_not_folded() -> None:
    assert run(calved(0), served(60), today=59).last_service_date is None


@pytest.mark.parametrize(
    ("declared", "state", "last_service", "expected_calving"),
    [
        (ReproState.ABIERTA, ReproState.ABIERTA, None, None),
        (ReproState.SERVIDA, ReproState.SERVIDA, 0, None),
        (ReproState.GESTANTE, ReproState.GESTANTE, -35, 248),
        (ReproState.SECA, ReproState.SECA, -223, 60),
    ],
)
def test_declared_stage_and_date_seed_the_projection(
    declared: ReproState, state: ReproState, last_service: int | None, expected_calving: int | None
) -> None:
    cow = AnimalFacts(
        Sex.HEMBRA, BIRTH, DevelopmentStage.VACA_ADULTA, repro_stage=declared, repro_stage_date=D0
    )

    projection = project(cow, [alta(lactation_number=2)], SETTINGS, D0)

    assert projection.repro_state is state
    assert projection.last_service_date == (None if last_service is None else day(last_service))
    assert projection.expected_calving_date == (
        None if expected_calving is None else day(expected_calving)
    )


def test_declared_last_calving_sets_dim_and_the_fresh_stage() -> None:
    projection = project(
        AnimalFacts(Sex.HEMBRA, BIRTH),
        [alta(lactation_number=2, last_calving_date=D0)],
        SETTINGS,
        day(10),
    )

    assert projection.repro_state is ReproState.RECIEN_PARIDA
    assert (projection.dim, projection.lactation_number) == (10, 2)


def test_a_declared_stage_with_no_date_is_flagged() -> None:
    cow = AnimalFacts(Sex.HEMBRA, BIRTH, repro_stage=ReproState.GESTANTE)

    projection = project(cow, [alta(lactation_number=1)], SETTINGS, D0)

    assert projection.repro_state is ReproState.GESTANTE
    assert projection.expected_calving_date is None
    assert Flag.MISSING_STAGE_DATE in {warning.flag for warning in projection.warnings}


def test_a_female_with_no_alta_is_a_heifer() -> None:
    projection = project(HEIFER, [fact(EventType.WEIGHT, 0, kg=100)], SETTINGS, D0)

    assert projection.repro_state is ReproState.VAQUILLA


def test_an_adult_registered_on_auto_defaults_to_one_lactation() -> None:
    registered = EventFact(EventType.ALTA, D0, alta().payload)

    cow = project(AnimalFacts(Sex.HEMBRA, BIRTH), [registered], SETTINGS, D0)

    assert (cow.lactation_number, cow.has_calved) == (1, True)


def test_a_heifer_registered_young_stays_one_as_she_ages() -> None:
    registered = EventFact(EventType.ALTA, HEIFER.birth_date, alta().payload)

    projection = project(HEIFER, [registered], SETTINGS, day(1200))

    assert projection.has_calved is False


@pytest.mark.parametrize(
    ("positive", "state"), [(True, ReproState.GESTANTE), (False, ReproState.ABIERTA)]
)
def test_a_declared_service_with_no_date_still_takes_its_check(
    positive: bool, state: ReproState
) -> None:
    cow = AnimalFacts(Sex.HEMBRA, BIRTH, D.VACA_ADULTA, repro_stage=ReproState.SERVIDA)

    projection = project(cow, [alta(), check(10, positive=positive)], SETTINGS, day(11))

    assert projection.repro_state is state
    assert projection.expected_calving_date is None


def test_a_re_service_inside_the_vwp_is_warned_too() -> None:
    projection = run(calved(0), served(20), served(30), today=31)

    assert ReproWarning(Flag.HEAT_DURING_VWP, day(30)) in projection.warnings


def test_declared_fresh_with_no_calving_date_is_not_stuck() -> None:
    cow = AnimalFacts(Sex.HEMBRA, BIRTH, D.VACA_ADULTA, repro_stage=ReproState.RECIEN_PARIDA)

    projection = project(cow, [alta(), served(300)], SETTINGS, day(301))

    assert projection.repro_state is ReproState.SERVIDA
    assert Flag.MISSING_STAGE_DATE in {warning.flag for warning in projection.warnings}
    assert Flag.HEAT_DURING_VWP not in {warning.flag for warning in projection.warnings}


def test_vwp_heat_on_an_open_cow_is_kept_and_flagged() -> None:
    projection = run(calved(0), heat(60, H.VWP), today=61)

    assert ReproWarning(Flag.UNEXPECTED_EVENT, day(60)) in projection.warnings
    assert projection.last_heat_date == day(60)


def test_an_invalid_payload_is_skipped_and_flagged() -> None:
    bad = EventFact(EventType.HEAT, day(10), {"outcome": "NOPE"})

    projection = run(calved(0), bad, today=11)

    assert ReproWarning(Flag.INVALID_EVENT, day(10)) in projection.warnings
    assert projection.repro_state is ReproState.RECIEN_PARIDA


def test_a_payload_the_fold_ignores_is_not_parsed() -> None:
    bad = EventFact(EventType.WEIGHT, day(10), {"kg": "heavy"})

    assert Flag.INVALID_EVENT not in {w.flag for w in run(bad, today=11).warnings}
