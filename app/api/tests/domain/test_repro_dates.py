"""The computed dates of docs/domain-model.md §3 and §7.5."""

import dataclasses
import datetime as dt
import random

import pytest

from smartbell.domain.repro import (
    AnimalFacts,
    EventFact,
    Flag,
    LossKind,
    Window,
    add_months,
    calving_window,
    classify_loss,
    heifer_birth_date_editable,
    last_calving_date_valid,
    project,
    resolve_stage,
    whole_months,
)
from smartbell.enums import DevelopmentStage, HeatOutcome, ReproState, Sex
from tests.domain.factories import (
    BIRTH,
    D0,
    HEIFER,
    SETTINGS,
    aborted,
    accident,
    alta,
    calved,
    check,
    day,
    followup,
    heat,
    illness,
    run,
    served,
)

D = DevelopmentStage


def test_dim_counts_from_the_last_calving_and_keeps_counting_while_dry() -> None:
    assert run(calved(0), today=10).dim == 10
    dry = run(calved(0), served(60), check(100, positive=True), today=300)
    assert (dry.repro_state, dry.dim) == (ReproState.SECA, 300)
    assert run(calved(0), served(60), check(100, positive=True), calved(343), today=347).dim == 4


def test_no_dim_before_the_first_calving() -> None:
    assert project(HEIFER, [alta(lactation_number=0)], SETTINGS, D0).dim is None


def test_window_width_comes_from_settings() -> None:
    wide = run(calved(0), today=1).next_heat
    narrow = run(
        calved(0), today=1, settings=dataclasses.replace(SETTINGS, heat_window_days=5)
    ).next_heat

    assert wide == Window(day(18), day(24))
    assert narrow == Window(day(19), day(23))


def test_an_even_width_stays_exact() -> None:
    settings = dataclasses.replace(SETTINGS, heat_window_days=4)
    window = run(calved(0), today=1, settings=settings).next_heat

    assert window is not None
    assert (window.end - window.start).days + 1 == 4


def test_next_heat_anchors_on_the_latest_of_each_kind_of_event() -> None:
    assert run(calved(0), today=1).next_heat == Window(day(18), day(24))
    assert run(calved(0), heat(50, HeatOutcome.NOT_INSEMINATED), today=51).next_heat == Window(
        day(68), day(74)
    )
    negative = (calved(0), served(60), check(100, positive=False))
    assert run(*negative, today=101).next_heat == Window(day(118), day(124))
    loss = (calved(0), served(60), check(100, positive=True), aborted(150))
    assert run(*loss, today=151).next_heat == Window(day(168), day(174))


def test_a_missed_heat_rolls_the_window_a_cycle_at_a_time() -> None:
    assert run(calved(0), today=24).next_heat == Window(day(18), day(24))
    assert run(calved(0), today=25).next_heat == Window(day(39), day(45))
    assert run(calved(0), today=100).next_heat == Window(day(102), day(108))


def test_a_zero_cycle_cannot_hang_the_roll_forward() -> None:
    settings = dataclasses.replace(SETTINGS, heat_cycle_days=0)

    window = run(calved(0), today=5, settings=settings).next_heat

    assert window is not None
    assert window.end >= day(5)


def test_heat_not_observed_moves_the_window_but_not_the_last_heat() -> None:
    projection = run(calved(0), heat(50, HeatOutcome.NOT_OBSERVED), today=51)

    assert projection.last_heat_date is None
    assert projection.next_heat == Window(day(68), day(74))


def test_pregnancy_check_window() -> None:
    assert run(calved(0), served(60), today=61).pregnancy_check == Window(day(95), day(105))


def test_expected_calving_dry_off_and_close_up() -> None:
    projection = run(calved(0), served(60), check(100, positive=True), today=101)

    assert projection.expected_calving_date == day(343)
    assert projection.calving == Window(day(340), day(346))
    assert projection.dry_off_date == day(283)
    assert projection.close_up_date == day(322)


def test_changing_gestation_days_changes_the_expected_calving() -> None:
    settings = dataclasses.replace(SETTINGS, gestation_days=280)

    projection = run(calved(0), served(60), check(100, positive=True), today=101, settings=settings)

    assert projection.expected_calving_date == day(340)
    assert projection.dry_off_date == day(280)


def test_settings_drive_the_vwp_and_the_check_window() -> None:
    settings = dataclasses.replace(
        SETTINGS, vwp_days=60, preg_check_min_days=28, preg_check_max_days=30
    )

    assert run(calved(0), today=59, settings=settings).repro_state is ReproState.RECIEN_PARIDA
    window = run(calved(0), served(70), today=71, settings=settings).pregnancy_check
    assert window == Window(day(98), day(100))


@pytest.mark.parametrize(
    ("days", "kind"),
    [
        (0, LossKind.EARLY_EMBRYONIC_DEATH),
        (41, LossKind.EARLY_EMBRYONIC_DEATH),
        (42, LossKind.ABORTION),
        (150, LossKind.ABORTION),
        (259, LossKind.ABORTION),
        (260, LossKind.CALVING),
        (283, LossKind.CALVING),
    ],
)
def test_loss_classification(days: int, kind: LossKind) -> None:
    assert classify_loss(D0, day(days), SETTINGS) is kind


def test_loss_classification_reads_the_settings() -> None:
    settings = dataclasses.replace(SETTINGS, abortion_min_days=30)

    assert classify_loss(D0, day(35), settings) is LossKind.ABORTION


def test_calving_window_is_the_gestation_either_side() -> None:
    assert calving_window(D0, SETTINGS) == Window(day(280), day(286))


def test_days_open_stop_at_conception() -> None:
    assert run(calved(0), today=90).days_open == 90
    assert run(calved(0), served(60), today=90).days_open == 90
    assert run(calved(0), served(60), check(100, positive=True), today=120).days_open == 60


def test_sick_days_and_the_flag() -> None:
    sick = run(illness(10), today=15)
    well = run(illness(10), followup(14), today=15)

    assert (sick.is_sick, sick.sick_since, sick.sick_days) == (True, day(10), 5)
    assert (well.is_sick, well.sick_since, well.sick_days) == (False, None, None)


def test_a_second_illness_keeps_the_first_sick_date() -> None:
    assert run(illness(10), accident(12), today=15).sick_since == day(10)


def test_a_changed_treatment_leaves_her_sick() -> None:
    assert run(illness(10), followup(12, success=False), today=15).is_sick is True


def test_a_fertile_heifer_past_thirty_months_is_warned_only_without_a_service() -> None:
    old = AnimalFacts(Sex.HEMBRA, BIRTH)
    today = add_months(BIRTH, 31)

    unserved = project(old, [alta(lactation_number=0)], SETTINGS, today)
    service = dataclasses.replace(served(0), occurred_on=add_months(BIRTH, 15))
    bred = project(old, [alta(lactation_number=0), service], SETTINGS, today)

    assert Flag.NOT_FERTILE in {warning.flag for warning in unserved.warnings}
    assert bred.warnings == ()


def test_age_validations() -> None:
    assert heifer_birth_date_editable(BIRTH, add_months(BIRTH, 24)) is True
    assert heifer_birth_date_editable(BIRTH, add_months(BIRTH, 25)) is False
    assert last_calving_date_valid(BIRTH, BIRTH + dt.timedelta(days=660)) is True
    assert last_calving_date_valid(BIRTH, BIRTH + dt.timedelta(days=659)) is False


def test_breeding_unlocks_at_twelve_months() -> None:
    birth = HEIFER.birth_date
    before = project(HEIFER, [], SETTINGS, add_months(birth, 12) - dt.timedelta(days=1))
    after = project(HEIFER, [], SETTINGS, add_months(birth, 12))

    assert (before.breeding_unlocked, after.breeding_unlocked) == (False, True)


def test_month_arithmetic_clamps_and_counts_whole_months() -> None:
    assert add_months(dt.date(2026, 1, 31), 1) == dt.date(2026, 2, 28)
    assert add_months(dt.date(2026, 12, 15), 1) == dt.date(2027, 1, 15)
    assert whole_months(dt.date(2026, 1, 31), dt.date(2026, 2, 28)) == 1
    assert whole_months(dt.date(2026, 1, 15), dt.date(2026, 2, 14)) == 0


@pytest.mark.parametrize(
    ("sex", "months", "state", "calved_before", "stage"),
    [
        (Sex.HEMBRA, 0, ReproState.VAQUILLA, False, D.TERNERA),
        (Sex.HEMBRA, 5, ReproState.VAQUILLA, False, D.TERNERA),
        (Sex.HEMBRA, 6, ReproState.VAQUILLA, False, D.DESTETADA),
        (Sex.HEMBRA, 11, ReproState.VAQUILLA, False, D.DESTETADA),
        (Sex.HEMBRA, 12, ReproState.VAQUILLA, False, D.NOVILLA),
        (Sex.HEMBRA, 27, ReproState.VAQUILLA, False, D.NOVILLA),
        (Sex.HEMBRA, 28, ReproState.VAQUILLA, False, D.VACA_ADULTA_VACIA),
        (Sex.HEMBRA, 20, ReproState.SERVIDA, False, D.A_VERIFICAR),
        (Sex.HEMBRA, 22, ReproState.GESTANTE, False, D.CARGADA),
        (Sex.HEMBRA, 50, ReproState.SECA, True, D.CARGADA),
        (Sex.HEMBRA, 50, ReproState.RECIEN_PARIDA, True, D.VACA_ADULTA),
        (Sex.HEMBRA, 50, ReproState.ABIERTA, True, D.VACA_ADULTA_VACIA),
        (Sex.MACHO, 0, None, False, D.BECERRO),
        (Sex.MACHO, 3, None, False, D.DESTETADO),
        (Sex.MACHO, 9, None, False, D.NOVILLO),
        (Sex.MACHO, 23, None, False, D.NOVILLO),
        (Sex.MACHO, 24, None, False, D.TORO),
    ],
)
def test_auto_stage(
    sex: Sex,
    months: int,
    state: ReproState | None,
    calved_before: bool,
    stage: DevelopmentStage,
) -> None:
    animal = AnimalFacts(sex, BIRTH)
    today = add_months(BIRTH, months)

    assert resolve_stage(animal, state, has_calved=calved_before, today=today) is stage


def test_a_chosen_stage_is_kept() -> None:
    animal = AnimalFacts(Sex.HEMBRA, BIRTH, D.NOVILLA)

    assert resolve_stage(animal, ReproState.GESTANTE, has_calved=False, today=D0) is D.NOVILLA


def test_projection_is_deterministic_whatever_order_the_events_arrive_in() -> None:
    events: list[EventFact] = [
        alta(lactation_number=1),
        calved(0),
        served(60),
        heat(81, HeatOutcome.NOT_INSEMINATED),
        served(102),
        check(140, positive=True),
        illness(150),
    ]
    baseline = project(HEIFER, events, SETTINGS, day(200))

    for seed in range(5):
        shuffled = random.Random(seed).sample(events, len(events))  # noqa: S311 - not crypto
        assert project(HEIFER, shuffled, SETTINGS, day(200)) == baseline
