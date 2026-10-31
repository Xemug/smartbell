"""The reproductive engine: a pure fold over an animal's events (docs/domain-model.md §2-§4, §7).

`project` is the only way the projection fields on an animal get their values. It does no I/O and
never reads the clock, so (animal, events, settings, today) always gives the same answer; `import-
linter` keeps it that way (`[tool.importlinter]` in pyproject.toml). The inputs are plain
dataclasses, not ORM rows, and `smartbell.services.projection` does the conversion and the writing.

Alerts and reminders come back as specs describing what should be open now. Nothing is stored here:
whoever persists them treats a pending alert that is no longer in the list as closed by the event.
"""

import datetime as dt
import uuid
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from enum import StrEnum, auto
from typing import Any

from smartbell.domain.withdrawal import separates_milk, withdrawal_until
from smartbell.enums import (
    AlertKind,
    DevelopmentStage,
    EventType,
    HeatOutcome,
    LactationState,
    MedicalTreatmentKind,
    PregnancyCheckResult,
    ReproState,
    Sex,
    TreatmentFollowupOutcome,
)
from smartbell.schemas.events import (
    AccidentPayload,
    AltaPayload,
    CalvingPayload,
    EventPayload,
    HeatPayload,
    IllnessPayload,
    MedicalTreatmentPayload,
    PregnancyCheckPayload,
    Treatment,
    TreatmentFollowupPayload,
    validate_event_payload,
)

# Age rules of §3.10, §3.11 and the stage labels of §7.1. They come from the designs and biology
# and aren't ranch settings, unlike the months the heifer alerts use.
FEMALE_WEANED_FROM_MONTHS = 6
FEMALE_NOVILLA_FROM_MONTHS = 12
ADULT_AFTER_MONTHS = 27
MALE_WEANED_FROM_MONTHS = 3
MALE_NOVILLO_FROM_MONTHS = 9
MALE_TORO_FROM_MONTHS = 24
HEIFER_INFERTILE_AFTER_MONTHS = 30
HEIFER_EDITABLE_UNTIL_MONTHS = 24
MIN_DAYS_BIRTH_TO_CALVING = 660

PREGNANT_STATES = frozenset({ReproState.GESTANTE, ReproState.SECA})
ADULT_STAGES = frozenset({DevelopmentStage.VACA_ADULTA, DevelopmentStage.VACA_ADULTA_VACIA})
UNDATED_STAGES = frozenset(
    {DevelopmentStage.AUTO, DevelopmentStage.CARGADA, DevelopmentStage.A_VERIFICAR}
)
# Only these touch the state, so nothing else is parsed: a weight can't stop a ranch's projection.
FOLDED_EVENT_TYPES = frozenset(
    {
        EventType.HEAT,
        EventType.PREGNANCY_CHECK,
        EventType.CALVING,
        EventType.ILLNESS,
        EventType.ACCIDENT,
        EventType.MEDICAL_TREATMENT,
        EventType.TREATMENT_FOLLOWUP,
    }
)
DRY_OFF_ALERT_DAYS_BEFORE = (10, 5, 0)  # Confirmed by the user (§7.6).
EPOCH = dt.datetime(1970, 1, 1, tzinfo=dt.UTC)


@dataclass(frozen=True)
class ReproSettings:
    """The RanchSettings the engine reads (§1, §7.5)."""

    gestation_days: int
    heat_cycle_days: int
    heat_window_days: int  # Total width (§7.6): 7 means 3 days either side.
    vwp_days: int
    preg_check_min_days: int
    preg_check_max_days: int
    preg_recheck_days: tuple[int, ...]
    dry_off_days_before_calving: int
    close_up_days_before_calving: int
    diet_change_dim: int
    abortion_min_days: int
    abortion_max_days: int
    heifer_heat_alert_from_months: int
    heifer_heat_alert_until_months: int
    heifer_breeding_unlock_months: int


@dataclass(frozen=True)
class AnimalFacts:
    sex: Sex
    birth_date: dt.date
    development_stage: DevelopmentStage = DevelopmentStage.AUTO
    repro_stage: ReproState | None = None
    repro_stage_date: dt.date | None = None


@dataclass(frozen=True)
class EventFact:
    type: EventType
    occurred_on: dt.date
    payload: Mapping[str, Any]
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    created_at: dt.datetime = EPOCH


@dataclass(frozen=True)
class Window:
    """A forecast is a range, rendered as "entre los días X al Y". Both ends are included."""

    start: dt.date
    end: dt.date

    @classmethod
    def around(cls, center: dt.date, width: int) -> "Window":
        days = max(width, 1) - 1
        start = center - dt.timedelta(days=days // 2)
        return cls(start, start + dt.timedelta(days=days))

    def shifted(self, days: int) -> "Window":
        delta = dt.timedelta(days=days)
        return Window(self.start + delta, self.end + delta)


class ReminderKind(StrEnum):
    WAIT_NEXT_CYCLE = auto()
    MILK_WITHDRAWAL = auto()
    HEIFER_TO_REGISTER = auto()


@dataclass(frozen=True)
class AlertSpec:
    kind: AlertKind
    window: Window


@dataclass(frozen=True)
class ReminderSpec:
    kind: ReminderKind
    due_on: dt.date


class Flag(StrEnum):
    HEAT_DURING_VWP = auto()  # Served inside the voluntary waiting period: allowed, but warned.
    NOT_FERTILE = auto()  # §3.11 "no ha sido fértil".
    UNEXPECTED_EVENT = auto()  # §2 has no such transition: the state stays put unless noted.
    INVALID_EVENT = auto()  # A payload that no longer parses: skipped, not fatal.
    MISSING_STAGE_DATE = auto()  # A declared stage whose date is needed and wasn't given.


@dataclass(frozen=True)
class ReproWarning:
    flag: Flag
    on: dt.date


class LossKind(StrEnum):
    EARLY_EMBRYONIC_DEATH = auto()
    ABORTION = auto()
    CALVING = auto()


@dataclass(frozen=True)
class Projection:
    repro_state: ReproState | None
    lactation_state: LactationState | None
    lactation_number: int | None
    last_calving_date: dt.date | None
    last_heat_date: dt.date | None
    last_service_date: dt.date | None
    service_bull_id: uuid.UUID | None
    service_number_in_lactation: int | None
    pregnancy_confirmed_date: dt.date | None
    expected_calving_date: dt.date | None
    is_sick: bool
    sick_since: dt.date | None
    milk_withdrawal_until: dt.date | None
    removed: bool
    has_calved: bool
    development_stage: DevelopmentStage
    dim: int | None
    days_open: int | None
    sick_days: int | None
    breeding_unlocked: bool
    next_heat: Window | None
    pregnancy_check: Window | None
    calving: Window | None
    dry_off_date: dt.date | None
    close_up_date: dt.date | None
    alerts: tuple[AlertSpec, ...]
    reminders: tuple[ReminderSpec, ...]
    warnings: tuple[ReproWarning, ...]


def add_months(day: dt.date, months: int) -> dt.date:
    month_index = day.year * 12 + day.month - 1 + months
    year, month = month_index // 12, month_index % 12 + 1
    next_month = dt.date(year + month // 12, month % 12 + 1, 1)
    last_day = (next_month - dt.timedelta(days=1)).day
    return dt.date(year, month, min(day.day, last_day))


def whole_months(since: dt.date, until: dt.date) -> int:
    months = (until.year - since.year) * 12 + until.month - since.month
    return months if add_months(since, months) <= until else months - 1


def classify_loss(service_date: dt.date, on: dt.date, settings: ReproSettings) -> LossKind:
    """§3.9. Early embryonic death is logged as a negative check, and a late loss as a calving."""
    days = (on - service_date).days
    if days < settings.abortion_min_days:
        return LossKind.EARLY_EMBRYONIC_DEATH
    return LossKind.ABORTION if days < settings.abortion_max_days else LossKind.CALVING


def calving_window(service_date: dt.date, settings: ReproSettings) -> Window:
    """§3.5."""
    center = service_date + dt.timedelta(days=settings.gestation_days)
    return Window.around(center, settings.heat_window_days)


def heifer_birth_date_editable(birth_date: dt.date, today: dt.date) -> bool:
    """§3.11."""
    return today <= add_months(birth_date, HEIFER_EDITABLE_UNTIL_MONTHS)


def last_calving_date_valid(birth_date: dt.date, last_calving: dt.date) -> bool:
    """§3.11."""
    return (last_calving - birth_date).days >= MIN_DAYS_BIRTH_TO_CALVING


def resolve_stage(
    animal: AnimalFacts, state: ReproState | None, *, has_calved: bool, today: dt.date
) -> DevelopmentStage:
    """§7.1 AUTO, from age + sex + projection. A stage the user chose is kept as it is."""
    if animal.development_stage is not DevelopmentStage.AUTO:
        return animal.development_stage
    months = whole_months(animal.birth_date, today)
    if animal.sex is Sex.MACHO:
        if months < MALE_WEANED_FROM_MONTHS:
            return DevelopmentStage.BECERRO
        if months < MALE_NOVILLO_FROM_MONTHS:
            return DevelopmentStage.DESTETADO
        return DevelopmentStage.NOVILLO if months < MALE_TORO_FROM_MONTHS else DevelopmentStage.TORO
    if state in PREGNANT_STATES:
        return DevelopmentStage.CARGADA
    if state is ReproState.SERVIDA:
        return DevelopmentStage.A_VERIFICAR
    if has_calved or months > ADULT_AFTER_MONTHS:
        if state is ReproState.RECIEN_PARIDA:
            return DevelopmentStage.VACA_ADULTA
        return DevelopmentStage.VACA_ADULTA_VACIA
    if months < FEMALE_WEANED_FROM_MONTHS:
        return DevelopmentStage.TERNERA
    if months < FEMALE_NOVILLA_FROM_MONTHS:
        return DevelopmentStage.DESTETADA
    return DevelopmentStage.NOVILLA


@dataclass
class _Fold:
    animal: AnimalFacts
    settings: ReproSettings
    state: ReproState | None = None
    lactation_state: LactationState | None = None
    lactation_number: int | None = None
    last_calving: dt.date | None = None
    last_heat: dt.date | None = None
    last_service: dt.date | None = None
    bull_id: uuid.UUID | None = None
    service_number: int | None = None
    open_service: dt.date | None = None  # The service still being judged, unlike last_service.
    estimated_until: dt.date | None = None  # While set, a service logged by then replaces it.
    confirmed_on: dt.date | None = None
    expected_calving: dt.date | None = None
    rechecks_done: int = 0
    heat_anchor: dt.date | None = None  # Unlike last_heat, a heat "not observed" moves this too.
    anchor_is_heat: bool = False
    return_watch_closed: bool = False
    calf_pending: bool = False
    last_diet_change: dt.date | None = None
    sick_since: dt.date | None = None
    health_from: dt.date | None = None
    health_until: dt.date | None = None
    withdrawal_until: dt.date | None = None
    treating: tuple[EventType, MedicalTreatmentKind | None] = (EventType.ILLNESS, None)
    removed: bool = False
    warnings: list[ReproWarning] = field(default_factory=list)

    @property
    def has_calved(self) -> bool:
        return self.lactation_state is not None

    def warn(self, flag: Flag, on: dt.date) -> None:
        self.warnings.append(ReproWarning(flag, on))

    def registered_adult(self, registered_on: dt.date | None) -> bool:
        """§7.1: an adult female defaults to one lactation. Age is taken at registration, so a
        heifer doesn't turn into a cow by growing up."""
        stage = self.animal.development_stage
        if stage in ADULT_STAGES:
            return True
        if stage not in UNDATED_STAGES or registered_on is None:
            return False
        return registered_on > add_months(self.animal.birth_date, ADULT_AFTER_MONTHS)

    def seed(self, alta: AltaPayload | None, registered_on: dt.date | None = None) -> None:
        """Start from what was declared at registration (§7.1). See the card for what the one
        generic `repro_stage_date` means at each stage."""
        if self.animal.sex is not Sex.HEMBRA:
            return
        declared = self.animal.repro_stage
        on = self.animal.repro_stage_date
        adult = self.registered_adult(registered_on)
        number = alta.lactation_number if alta else None
        self.lactation_number = 1 if number is None and adult else number or 0
        self.last_calving = alta.last_calving_date if alta else None
        if declared is ReproState.RECIEN_PARIDA:
            self.last_calving = self.last_calving or on
            self.lactation_number = max(self.lactation_number, 1)
        if self.last_calving is not None:
            self.lactation_number = max(self.lactation_number, 1)
        if self.lactation_number > 0:
            dry = declared is ReproState.SECA
            self.lactation_state = LactationState.SECA if dry else LactationState.LACTANDO
        self.service_number = 0
        self.heat_anchor = self.last_calving
        self.state = declared or self._default_state()
        if declared is None or self.state is ReproState.VAQUILLA:
            return
        if self.state is ReproState.RECIEN_PARIDA:
            if self.last_calving is None:  # Without a calving nothing would ever end her VWP.
                self.warn(Flag.MISSING_STAGE_DATE, self.animal.birth_date)
                self.state = ReproState.ABIERTA
        elif on is None:
            self.warn(Flag.MISSING_STAGE_DATE, self.animal.birth_date)
        elif self.state is ReproState.ABIERTA:
            self.last_heat = self.heat_anchor = on
            self.anchor_is_heat = True
        elif self.state is ReproState.SERVIDA:
            self.last_service = self.open_service = on
            self.last_heat = self.heat_anchor = on
            self.service_number = 1
        else:
            self.seed_pregnancy(on, alta.last_service_date if alta else None)

    def seed_pregnancy(self, on: dt.date, service: dt.date | None) -> None:
        """GESTANTE declares the diagnosis date and SECA the dry-off date. The service is the true
        reference (§7.6): with none declared it is estimated, until a logged one replaces it."""
        settings = self.settings
        if self.state is ReproState.GESTANTE:
            self.confirmed_on = on
        if service is None:
            self.estimated_until = on
            if self.state is ReproState.GESTANTE:
                service = on - dt.timedelta(days=settings.preg_check_max_days)
            else:
                back = settings.gestation_days - settings.dry_off_days_before_calving
                service = on - dt.timedelta(days=back)
        self.service_number = 1
        self.set_pregnancy_service(service)

    def set_pregnancy_service(self, service: dt.date) -> None:
        self.last_service = self.open_service = service
        self.expected_calving = service + dt.timedelta(days=self.settings.gestation_days)

    def _default_state(self) -> ReproState:
        if not self.has_calved:
            return ReproState.VAQUILLA
        calving_known = self.last_calving is not None
        return ReproState.RECIEN_PARIDA if calving_known else ReproState.ABIERTA

    def advance(self, on: dt.date) -> None:
        """The date-driven transitions of §2, which the daily job only re-runs."""
        if self.removed:
            return
        settings = self.settings
        if self.state is ReproState.RECIEN_PARIDA and self.last_calving is not None:
            if on >= self.last_calving + dt.timedelta(days=settings.vwp_days):
                self.state = ReproState.ABIERTA
        dry_off = self.dry_off_date
        if self.state is ReproState.GESTANTE and dry_off is not None and on >= dry_off:
            self.state = ReproState.SECA
            if self.has_calved:
                self.lactation_state = LactationState.SECA

    @property
    def dry_off_date(self) -> dt.date | None:
        if self.expected_calving is None:
            return None
        return self.expected_calving - dt.timedelta(days=self.settings.dry_off_days_before_calving)

    @property
    def close_up_date(self) -> dt.date | None:
        if self.expected_calving is None:
            return None
        days = self.settings.close_up_days_before_calving
        return self.expected_calving - dt.timedelta(days=days)

    def clear_pregnancy(self) -> None:
        self.open_service = self.confirmed_on = self.expected_calving = None
        self.estimated_until = None
        self.rechecks_done = 0
        self.return_watch_closed = False

    def open_after(self, on: dt.date) -> None:
        self.state = ReproState.ABIERTA
        self.clear_pregnancy()
        self.heat_anchor = on
        self.anchor_is_heat = False

    def apply(self, event: EventFact) -> None:
        on = event.occurred_on
        if event.type is EventType.ABORTION:
            self.on_abortion(on)
        elif event.type is EventType.DIET_CHANGE:
            self.last_diet_change = on
        elif event.type is EventType.REMOVAL:
            self.removed = True
        elif event.type in FOLDED_EVENT_TYPES:
            try:
                payload = validate_event_payload(event.type, event.payload)
            except ValueError:  # One bad row must not stop the fold, here or for the whole ranch.
                self.warn(Flag.INVALID_EVENT, on)
                return
            self.apply_payload(event.type, payload, on)

    def apply_payload(self, event_type: EventType, payload: EventPayload, on: dt.date) -> None:
        match payload:
            case HeatPayload():
                self.on_heat(payload, on)
            case PregnancyCheckPayload():
                self.on_check(payload, on)
            case CalvingPayload():
                self.on_calving(payload, on)
            case IllnessPayload() | AccidentPayload():
                self.sick_since = self.sick_since or on
                self.treat(event_type, payload.treatment, on)
            case MedicalTreatmentPayload():
                self.treat(event_type, payload.treatment, on, payload.kind)
            case TreatmentFollowupPayload():
                self.on_followup(payload, on)

    def on_heat(self, payload: HeatPayload, on: dt.date) -> None:
        if self.animal.sex is not Sex.HEMBRA:
            return
        outcome = payload.outcome
        observed = outcome is not HeatOutcome.NOT_OBSERVED
        if payload.treatment is not None:
            self.treat(EventType.HEAT, payload.treatment, on)
        if self.state in PREGNANT_STATES:
            logged = outcome is HeatOutcome.INSEMINATED
            if logged and self.estimated_until is not None and on <= self.estimated_until:
                self.estimated_until = None
                self.set_pregnancy_service(on)
                self.last_heat = on
                self.bull_id = payload.bull_id
            elif observed:
                self.warn(Flag.UNEXPECTED_EVENT, on)
            return
        if outcome is HeatOutcome.VWP and self.state is ReproState.ABIERTA:
            self.warn(Flag.UNEXPECTED_EVENT, on)  # Her VWP is over: kept as a heat, but flagged.
        if self.state is ReproState.SERVIDA:
            if not observed:  # "No entró en celo": the service still stands.
                self.return_watch_closed = True
                return
            self.open_after(on)  # §7.6: a return to heat means the service failed.
        if observed:
            self.last_heat = on
        self.heat_anchor = on
        self.anchor_is_heat = True
        if outcome is HeatOutcome.INSEMINATED:
            vwp = dt.timedelta(days=self.settings.vwp_days)
            if self.last_calving is not None and on < self.last_calving + vwp:
                self.warn(Flag.HEAT_DURING_VWP, on)
            self.state = ReproState.SERVIDA
            self.last_service = self.open_service = on
            self.bull_id = payload.bull_id
            self.service_number = (self.service_number or 0) + 1

    def on_check(self, payload: PregnancyCheckPayload, on: dt.date) -> None:
        positive = payload.result is PregnancyCheckResult.POSITIVE
        if self.state is ReproState.SERVIDA:
            if positive:
                self.state = ReproState.GESTANTE
                self.confirmed_on = on
                if self.open_service is not None:  # A declared service may have no date.
                    gestation = dt.timedelta(days=self.settings.gestation_days)
                    self.expected_calving = self.open_service + gestation
            else:
                self.open_after(on)
        elif self.state in PREGNANT_STATES:  # The re-checks of §7.5.
            if positive:
                self.rechecks_done += 1
            else:
                self.open_after(on)
        else:
            self.warn(Flag.UNEXPECTED_EVENT, on)

    def on_calving(self, payload: CalvingPayload, on: dt.date) -> None:
        if self.animal.sex is not Sex.HEMBRA:
            return
        if self.state not in PREGNANT_STATES:
            self.warn(Flag.UNEXPECTED_EVENT, on)  # She calved all the same, so it still counts.
        self.state = ReproState.RECIEN_PARIDA
        self.lactation_state = LactationState.LACTANDO
        self.lactation_number = (self.lactation_number or 0) + 1
        self.last_calving = on
        self.service_number = 0
        self.clear_pregnancy()
        self.heat_anchor = on
        self.anchor_is_heat = False
        self.calf_pending = not payload.calf_registered

    def on_abortion(self, on: dt.date) -> None:
        if self.state in PREGNANT_STATES or self.state is ReproState.SERVIDA:
            if self.state is ReproState.SERVIDA:
                self.warn(Flag.UNEXPECTED_EVENT, on)
            self.open_after(on)  # §7.6: ready to be bred again. The lactation doesn't change.
        else:
            self.warn(Flag.UNEXPECTED_EVENT, on)

    def on_followup(self, payload: TreatmentFollowupPayload, on: dt.date) -> None:
        if payload.outcome is TreatmentFollowupOutcome.SUCCESS:
            self.sick_since = self.health_from = self.health_until = None
        elif payload.new_treatment is not None:
            self.treat(EventType.TREATMENT_FOLLOWUP, payload.new_treatment, on)

    def treat(
        self,
        event_type: EventType,
        treatment: Treatment,
        on: dt.date,
        medical_kind: MedicalTreatmentKind | None = None,
    ) -> None:
        if event_type is EventType.TREATMENT_FOLLOWUP:  # §3.14 follows what is being treated.
            event_type, medical_kind = self.treating
        elif event_type is not EventType.HEAT:
            self.treating = (event_type, medical_kind)
        if not separates_milk(event_type, treatment, medical_kind):
            return
        until = withdrawal_until(treatment, medical_kind)
        # Never shortened: a later, milder drug doesn't clear what the earlier one left in the milk.
        self.withdrawal_until = max(until, self.withdrawal_until or until)
        if event_type is not EventType.HEAT:
            if self.health_until is not None and self.health_until < on:
                self.health_from = self.health_until = None  # That episode ran out on its own.
            self.health_from = self.health_from or on
            self.health_until = max(until, self.health_until or until)

    def next_heat(self, today: dt.date) -> Window | None:
        """§3.3, rolled on a cycle at a time ("cada celo perdido hay que esperar 21 días")."""
        if self.state not in (ReproState.VAQUILLA, ReproState.RECIEN_PARIDA, ReproState.ABIERTA):
            return None
        settings = self.settings
        heifer = self.state is ReproState.VAQUILLA  # §3.10 stops at her first service, not later.
        step = max(settings.heat_cycle_days, 1)
        alerts_from = add_months(self.animal.birth_date, settings.heifer_heat_alert_from_months)
        if self.heat_anchor is not None:
            center = self.heat_anchor + dt.timedelta(days=settings.heat_cycle_days)
            window = Window.around(center, settings.heat_window_days)
        elif heifer:
            window = Window.around(alerts_from, settings.heat_window_days).shifted(
                (settings.heat_window_days - 1) // 2
            )
        else:
            return None
        while window.end < today or (heifer and window.start < alerts_from):
            window = window.shifted(step)
        if heifer:
            last = add_months(self.animal.birth_date, settings.heifer_heat_alert_until_months)
            if window.start > last:
                return None
        return window

    def pregnancy_check(self) -> Window | None:
        if self.state is not ReproState.SERVIDA or self.open_service is None:
            return None
        return Window(
            self.open_service + dt.timedelta(days=self.settings.preg_check_min_days),
            self.open_service + dt.timedelta(days=self.settings.preg_check_max_days),
        )

    def calving(self) -> Window | None:
        if self.expected_calving is None or self.open_service is None:
            return None
        return calving_window(self.open_service, self.settings)

    def schedule(
        self, today: dt.date, next_heat: Window | None
    ) -> tuple[list[AlertSpec], list[ReminderSpec]]:
        """§4 and §7.5, as what should be open given where the animal is now."""
        alerts: list[AlertSpec] = []
        reminders: list[ReminderSpec] = []
        if self.removed:
            return alerts, reminders
        if next_heat is not None:
            alerts.append(AlertSpec(AlertKind.HEAT, next_heat))
            if self.anchor_is_heat:
                reminders.append(ReminderSpec(ReminderKind.WAIT_NEXT_CYCLE, next_heat.start))
        self.schedule_pregnancy(today, alerts)
        self.schedule_health(today, alerts, reminders)
        settings = self.settings
        if self.lactation_state is LactationState.LACTANDO and self.last_calving is not None:
            diet_due = self.last_calving + dt.timedelta(days=settings.diet_change_dim)
            if self.last_diet_change is None or self.last_diet_change < diet_due:
                alerts.append(AlertSpec(AlertKind.DIET_CHANGE, Window(diet_due, diet_due)))
        if self.calf_pending and self.last_calving is not None:
            reminders.append(ReminderSpec(ReminderKind.HEIFER_TO_REGISTER, self.last_calving))
        return alerts, reminders

    def schedule_pregnancy(self, today: dt.date, alerts: list[AlertSpec]) -> None:
        settings = self.settings
        check = self.pregnancy_check()
        if check is not None and self.open_service is not None:
            alerts.append(AlertSpec(AlertKind.PREGNANCY_CHECK, check))
            center = self.open_service + dt.timedelta(days=settings.heat_cycle_days)
            watch = Window.around(center, settings.heat_window_days)
            if watch.end >= today and not self.return_watch_closed:
                alerts.append(AlertSpec(AlertKind.HEAT, watch))
        calving = self.calving()
        if self.state not in PREGNANT_STATES or calving is None:
            return
        alerts.append(AlertSpec(AlertKind.CALVING, calving))
        dry_off, close_up = self.dry_off_date, self.close_up_date
        if self.has_calved and dry_off is not None:
            for days in DRY_OFF_ALERT_DAYS_BEFORE:
                due = dry_off - dt.timedelta(days=days)
                if due >= today:  # A passed reminder gives way to the next one.
                    alerts.append(AlertSpec(AlertKind.DRY_OFF, Window(due, due)))
        if close_up is not None:
            alerts.append(AlertSpec(AlertKind.CLOSE_UP, Window(close_up, close_up)))
        if self.confirmed_on is not None:
            for days in settings.preg_recheck_days[self.rechecks_done :]:
                due = self.confirmed_on + dt.timedelta(days=days)
                alerts.append(AlertSpec(AlertKind.PREG_RECHECK, Window(due, due)))

    def schedule_health(
        self, today: dt.date, alerts: list[AlertSpec], reminders: list[ReminderSpec]
    ) -> None:
        if self.health_from is not None and self.health_until is not None:
            if self.health_until >= today:
                alerts.append(
                    AlertSpec(AlertKind.HEALTH, Window(self.health_from, self.health_until))
                )
        if self.has_calved and self.withdrawal_until is not None:
            if self.withdrawal_until >= today:
                reminders.append(ReminderSpec(ReminderKind.MILK_WITHDRAWAL, self.withdrawal_until))

    def result(self, today: dt.date) -> Projection:
        female = self.animal.sex is Sex.HEMBRA
        if female and not self.has_calved and not self.removed:
            limit = add_months(self.animal.birth_date, HEIFER_INFERTILE_AFTER_MONTHS)
            if today > limit and self.last_service is None:
                self.warn(Flag.NOT_FERTILE, today)
        next_heat = None if self.removed else self.next_heat(today)
        alerts, reminders = self.schedule(today, next_heat)
        calved = self.last_calving
        conception = self.open_service if self.state in PREGNANT_STATES else None
        unlock = self.settings.heifer_breeding_unlock_months
        return Projection(
            repro_state=self.state,
            lactation_state=self.lactation_state,
            lactation_number=self.lactation_number,
            last_calving_date=calved,
            last_heat_date=self.last_heat,
            last_service_date=self.last_service,
            service_bull_id=self.bull_id,
            service_number_in_lactation=self.service_number,
            pregnancy_confirmed_date=self.confirmed_on,
            expected_calving_date=self.expected_calving,
            is_sick=self.sick_since is not None,
            sick_since=self.sick_since,
            milk_withdrawal_until=self.withdrawal_until if female else None,
            removed=self.removed,
            has_calved=self.has_calved,
            development_stage=resolve_stage(
                self.animal, self.state, has_calved=self.has_calved, today=today
            ),
            dim=None if calved is None else (today - calved).days,
            days_open=None if calved is None else ((conception or today) - calved).days,
            sick_days=None if self.sick_since is None else (today - self.sick_since).days,
            breeding_unlocked=female
            and (self.has_calved or whole_months(self.animal.birth_date, today) >= unlock),
            next_heat=next_heat,
            pregnancy_check=self.pregnancy_check(),
            calving=self.calving(),
            dry_off_date=self.dry_off_date,
            close_up_date=self.close_up_date,
            alerts=tuple(alerts),
            reminders=tuple(reminders),
            warnings=tuple(self.warnings),
        )


def project(
    animal: AnimalFacts,
    events: Iterable[EventFact],
    settings: ReproSettings,
    today: dt.date,
) -> Projection:
    """Fold `events` as of `today`. Later events are ignored, and their order in the input isn't
    significant: ALTA comes first, then occurred_on, then the order they were recorded in."""
    ordered = sorted(
        (event for event in events if event.occurred_on <= today or event.type is EventType.ALTA),
        key=lambda event: (
            event.type is not EventType.ALTA,
            event.occurred_on,
            event.created_at,
            event.id,
        ),
    )
    fold = _Fold(animal, settings)
    alta, registered_on = None, None
    if ordered and ordered[0].type is EventType.ALTA:
        registered_on = ordered[0].occurred_on
        try:
            parsed = validate_event_payload(EventType.ALTA, ordered[0].payload)
            alta = parsed if isinstance(parsed, AltaPayload) else None
        except ValueError:
            fold.warn(Flag.INVALID_EVENT, registered_on)
    fold.seed(alta, registered_on)
    for event in ordered:
        if event.type is EventType.ALTA or fold.removed:
            continue
        fold.advance(event.occurred_on)
        fold.apply(event)
    fold.advance(today)
    return fold.result(today)
