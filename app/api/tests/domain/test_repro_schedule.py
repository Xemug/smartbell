"""What each event schedules (docs/domain-model.md §4 and §7.5): specs, never writes."""

from smartbell.domain.repro import (
    AlertSpec,
    Projection,
    ReminderKind,
    ReminderSpec,
    Window,
    add_months,
    project,
)
from smartbell.enums import AlertKind, DietChangeReason, EventType, HeatOutcome
from tests.domain.factories import (
    HEIFER,
    SETTINGS,
    aborted,
    accident,
    alta,
    calved,
    check,
    day,
    fact,
    followup,
    heat,
    illness,
    run,
    served,
)


def windows(projection: Projection, kind: AlertKind) -> list[Window]:
    return [alert.window for alert in projection.alerts if alert.kind is kind]


def kinds(projection: Projection) -> set[AlertKind]:
    return {alert.kind for alert in projection.alerts}


def reminder_kinds(projection: Projection) -> set[ReminderKind]:
    return {reminder.kind for reminder in projection.reminders}


def test_heat_not_served_schedules_the_next_window_and_the_wait() -> None:
    projection = run(calved(0), heat(50, HeatOutcome.NOT_INSEMINATED), today=51)

    assert windows(projection, AlertKind.HEAT) == [Window(day(68), day(74))]
    assert ReminderSpec(ReminderKind.WAIT_NEXT_CYCLE, day(68)) in projection.reminders


def test_medicated_heat_adds_the_milk_withdrawal_but_no_health_alert() -> None:
    projection = run(calved(0), heat(50, HeatOutcome.DIRTY_MEDICATED), today=51)

    assert ReminderSpec(ReminderKind.MILK_WITHDRAWAL, day(58)) in projection.reminders
    assert AlertKind.HEALTH not in kinds(projection)


def test_service_schedules_the_check_and_the_return_to_heat_watch() -> None:
    projection = run(calved(0), served(60), today=61)

    assert windows(projection, AlertKind.PREGNANCY_CHECK) == [Window(day(95), day(105))]
    assert windows(projection, AlertKind.HEAT) == [Window(day(78), day(84))]


def test_a_served_cow_is_not_told_to_wait_a_cycle() -> None:
    assert ReminderKind.WAIT_NEXT_CYCLE not in reminder_kinds(run(calved(0), served(60), today=61))


def test_the_watch_closes_when_no_heat_is_seen_or_its_window_passes() -> None:
    negated = run(calved(0), served(60), heat(81, HeatOutcome.NOT_OBSERVED), today=82)
    passed = run(calved(0), served(60), today=85)

    assert AlertKind.HEAT not in kinds(negated)
    assert AlertKind.HEAT not in kinds(passed)


def test_positive_check_schedules_calving_dry_off_close_up_and_rechecks() -> None:
    projection = run(calved(0), served(60), check(100, positive=True), today=101)

    assert windows(projection, AlertKind.CALVING) == [Window(day(340), day(346))]
    assert windows(projection, AlertKind.DRY_OFF) == [Window(day(283), day(283))]
    assert windows(projection, AlertKind.CLOSE_UP) == [Window(day(322), day(322))]
    assert windows(projection, AlertKind.PREG_RECHECK) == [
        Window(day(190), day(190)),
        Window(day(280), day(280)),
    ]
    assert AlertKind.PREGNANCY_CHECK not in kinds(projection)
    assert AlertKind.HEAT not in kinds(projection)


def test_a_recorded_recheck_drops_off_the_list() -> None:
    projection = run(
        calved(0), served(60), check(100, positive=True), check(190, positive=True), today=191
    )

    assert windows(projection, AlertKind.PREG_RECHECK) == [Window(day(280), day(280))]


def test_dry_off_alert_ends_once_she_is_dry_and_calving_stays() -> None:
    projection = run(calved(0), served(60), check(100, positive=True), today=290)

    assert AlertKind.DRY_OFF not in kinds(projection)
    assert AlertKind.CALVING in kinds(projection)


def test_a_heifer_gets_no_dry_off_task() -> None:
    events = [alta(lactation_number=0), served(30), check(70, positive=True)]

    assert AlertKind.DRY_OFF not in kinds(project(HEIFER, events, SETTINGS, day(71)))


def test_negative_check_schedules_the_next_heat() -> None:
    projection = run(calved(0), served(60), check(100, positive=False), today=101)

    assert windows(projection, AlertKind.HEAT) == [Window(day(118), day(124))]
    assert AlertKind.PREGNANCY_CHECK not in kinds(projection)


def test_calving_schedules_the_heat_and_the_calf_reminder_if_skipped() -> None:
    skipped = run(calved(0, registered=False), today=1)
    registered = run(calved(0), today=1)

    assert windows(skipped, AlertKind.HEAT) == [Window(day(18), day(24))]
    assert ReminderSpec(ReminderKind.HEIFER_TO_REGISTER, day(0)) in skipped.reminders
    assert ReminderKind.HEIFER_TO_REGISTER not in reminder_kinds(registered)
    assert ReminderKind.WAIT_NEXT_CYCLE not in reminder_kinds(registered)


def test_abortion_replaces_calving_and_dry_off_with_the_next_heat() -> None:
    projection = run(calved(0), served(60), check(100, positive=True), aborted(150), today=151)

    assert AlertKind.CALVING not in kinds(projection)
    assert AlertKind.DRY_OFF not in kinds(projection)
    assert windows(projection, AlertKind.HEAT) == [Window(day(168), day(174))]


def test_illness_schedules_health_and_withdrawal_until_it_ends() -> None:
    projection = run(calved(0), illness(10, withdrawal_days=5), today=11)
    after = run(calved(0), illness(10, withdrawal_days=5), today=21)

    assert windows(projection, AlertKind.HEALTH) == [Window(day(10), day(20))]
    assert ReminderSpec(ReminderKind.MILK_WITHDRAWAL, day(20)) in projection.reminders
    assert AlertKind.HEALTH not in kinds(after)
    assert ReminderKind.MILK_WITHDRAWAL not in reminder_kinds(after)


def test_followup_success_closes_health_but_not_the_withdrawal() -> None:
    projection = run(calved(0), illness(10, withdrawal_days=5), followup(12), today=13)

    assert AlertKind.HEALTH not in kinds(projection)
    assert ReminderKind.MILK_WITHDRAWAL in reminder_kinds(projection)


def test_a_new_illness_after_a_cure_does_not_inherit_the_old_health_date() -> None:
    projection = run(
        calved(0),
        illness(10, withdrawal_days=30),
        followup(12),
        illness(14, duration_days=1, withdrawal_days=1),
        today=15,
    )

    assert windows(projection, AlertKind.HEALTH) == [Window(day(14), day(16))]


def test_an_illness_that_ran_out_does_not_stretch_the_next_one() -> None:
    projection = run(illness(1, withdrawal_days=5), illness(200, withdrawal_days=5), today=201)

    assert windows(projection, AlertKind.HEALTH) == [Window(day(200), day(210))]


def test_changing_an_accident_treatment_keeps_the_accident_rule() -> None:
    projection = run(
        accident(10, withdrawal_days=0), followup(12, success=False, withdrawal_days=0), today=13
    )

    assert projection.milk_withdrawal_until is None
    assert AlertKind.HEALTH not in kinds(projection)


def test_accident_with_no_withdrawal_separates_no_milk() -> None:
    projection = run(calved(0), accident(10, withdrawal_days=0), today=11)

    assert projection.milk_withdrawal_until is None
    assert AlertKind.HEALTH not in kinds(projection)
    assert projection.is_sick is True


def test_a_never_calved_heifer_has_no_milk_reminder() -> None:
    events = [alta(lactation_number=0), illness(10, withdrawal_days=5)]

    projection = project(HEIFER, events, SETTINGS, day(11))

    assert AlertKind.HEALTH in kinds(projection)
    assert ReminderKind.MILK_WITHDRAWAL not in reminder_kinds(projection)


def test_diet_change_task_at_120_dim_until_it_is_done() -> None:
    due = Window(day(120), day(120))

    assert windows(run(calved(0), today=10), AlertKind.DIET_CHANGE) == [due]
    done = fact(EventType.DIET_CHANGE, 125, reason=DietChangeReason.ETAPA_REPRODUCTIVA, diet="Alta")
    assert AlertKind.DIET_CHANGE not in kinds(run(calved(0), done, today=130))
    early = fact(EventType.DIET_CHANGE, 50, reason=DietChangeReason.OTRA, diet="Alta")
    assert windows(run(calved(0), early, today=130), AlertKind.DIET_CHANGE) == [due]


def test_heifer_heat_alerts_start_at_13_months_and_end_at_18() -> None:
    birth = HEIFER.birth_date
    start = add_months(birth, 13)

    early = project(HEIFER, [alta(lactation_number=0)], SETTINGS, add_months(birth, 6))
    late = project(HEIFER, [alta(lactation_number=0)], SETTINGS, add_months(birth, 19))
    in_range = project(HEIFER, [alta(lactation_number=0)], SETTINGS, add_months(birth, 16))

    assert early.next_heat is not None
    assert early.next_heat.start == start
    assert late.next_heat is None
    assert windows(late, AlertKind.HEAT) == []
    assert windows(in_range, AlertKind.HEAT)


def test_the_18_month_cutoff_does_not_reach_a_heifer_whose_service_failed() -> None:
    birth = HEIFER.birth_date
    events = [alta(lactation_number=0), served(0), check(40, positive=False)]

    projection = project(HEIFER, events, SETTINGS, add_months(birth, 25))

    assert projection.next_heat is not None


def test_specs_are_data_for_the_caller_to_persist() -> None:
    projection = run(calved(0), today=1)

    assert all(isinstance(alert, AlertSpec) for alert in projection.alerts)
    assert all(isinstance(reminder, ReminderSpec) for reminder in projection.reminders)
