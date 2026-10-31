"""Event payloads: one Pydantic model per event type (docs/domain-model.md §1, §7.4).

`validate_event_payload` is the single entry point. `smartbell.models.Event` runs it whenever the
ORM unit of work writes a payload. Bulk `insert()`/`update()` statements skip those hooks, so
write events with `session.add`, or call this first.
"""

from collections.abc import Mapping
from datetime import date
from typing import Annotated, Any, Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, TypeAdapter, model_validator

from smartbell.enums import (
    NATURAL_ABORTION_CAUSES,
    AbortionCause,
    AbortionKind,
    AnimalStatus,
    Breed,
    CalvingTiming,
    CorticoidSubtype,
    DevelopmentStage,
    DietChangeReason,
    DrugPresentation,
    EventType,
    HeatOutcome,
    Illness,
    MedicalTreatmentKind,
    PregnancyCheckMethod,
    PregnancyCheckResult,
    RemovalReason,
    ReproState,
    ServiceMethod,
    Sex,
    TreatmentFollowupOutcome,
    TreatmentType,
)

NonBlank = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Treatment(_Strict):
    type: TreatmentType
    corticoid_subtype: CorticoidSubtype | None = None
    presentation: DrugPresentation
    start_date: date
    duration_days: int = Field(default=5, ge=0)
    # None: nobody said. The engine then uses the default for the treatment, or the maximum (§3.6).
    withdrawal_days: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _subtype_only_for_corticoids(self) -> Self:
        if self.corticoid_subtype and self.type is not TreatmentType.CORTICOIDE:
            raise ValueError("corticoid_subtype applies only to CORTICOIDE treatments")
        return self


class DietChangeDetails(_Strict):
    reason: DietChangeReason
    diet: NonBlank
    diet_type: NonBlank | None = None
    daily_kg: float | None = Field(default=None, ge=0)
    daily_cost: float | None = Field(default=None, ge=0)


class GroupChangeDetails(_Strict):
    from_group_id: UUID | None = None  # None: the animal had no group yet.
    to_group_id: UUID

    @model_validator(mode="after")
    def _groups_differ(self) -> Self:
        if self.from_group_id == self.to_group_id:
            raise ValueError("to_group_id must differ from from_group_id")
        return self


class AltaPayload(_Strict):
    """The animal as registered: the initial snapshot, including the declared repro inputs."""

    type: Literal[EventType.ALTA] = EventType.ALTA
    control_id: NonBlank
    sex: Sex
    birth_date: date
    breed: Breed = Breed.HOLSTEIN
    status: AnimalStatus = AnimalStatus.ACTIVE
    development_stage: DevelopmentStage = DevelopmentStage.AUTO
    repro_stage: ReproState | None = None
    repro_stage_date: date | None = None
    lactation_number: int | None = Field(default=None, ge=0)
    last_calving_date: date | None = None
    group_id: UUID | None = None


class HeatPayload(_Strict):
    type: Literal[EventType.HEAT] = EventType.HEAT
    outcome: HeatOutcome
    clean: bool | None = None  # None only for NOT_OBSERVED: there was no heat to judge.
    bull_id: UUID | None = None
    method: ServiceMethod | None = None
    treatment: Treatment | None = None

    @model_validator(mode="after")
    def _fields_match_outcome(self) -> Self:
        inseminated = self.outcome is HeatOutcome.INSEMINATED
        if inseminated != (self.bull_id is not None) or inseminated != (self.method is not None):
            raise ValueError("bull_id and method are required for INSEMINATED, and only for it")
        medicated = self.outcome is HeatOutcome.DIRTY_MEDICATED
        if medicated != (self.treatment is not None):
            raise ValueError("treatment is required for DIRTY_MEDICATED, and only for it")
        expected_clean = {
            HeatOutcome.NOT_OBSERVED: None,
            HeatOutcome.DIRTY_MEDICATED: False,
            HeatOutcome.DIRTY_NOT_MEDICATED: False,
        }.get(self.outcome, True)
        if self.clean is not expected_clean:
            raise ValueError(f"clean must be {expected_clean} for {self.outcome}")
        return self


class PregnancyCheckPayload(_Strict):
    type: Literal[EventType.PREGNANCY_CHECK] = EventType.PREGNANCY_CHECK
    method: PregnancyCheckMethod
    result: PregnancyCheckResult
    description: NonBlank | None = None

    @model_validator(mode="after")
    def _negative_needs_description(self) -> Self:
        if self.result is PregnancyCheckResult.NEGATIVE and self.description is None:
            raise ValueError("description is required when the result is NEGATIVE")
        return self


class CalvingPayload(_Strict):
    type: Literal[EventType.CALVING] = EventType.CALVING
    timing: CalvingTiming
    calf_registered: bool
    calf_animal_id: UUID | None = None

    @model_validator(mode="after")
    def _calf_matches_flag(self) -> Self:
        if self.calf_registered != (self.calf_animal_id is not None):
            raise ValueError("calf_animal_id is required when calf_registered, and only then")
        return self


class AbortionPayload(_Strict):
    type: Literal[EventType.ABORTION] = EventType.ABORTION
    kind: AbortionKind
    cause: AbortionCause
    illness: Illness | None = None

    @model_validator(mode="after")
    def _cause_matches_kind(self) -> Self:
        if (self.kind is AbortionKind.NATURAL) != (self.cause in NATURAL_ABORTION_CAUSES):
            raise ValueError(f"{self.cause} is not a {self.kind} abortion cause")
        if (self.cause is AbortionCause.ENFERMEDAD) != (self.illness is not None):
            raise ValueError("illness is required when the cause is ENFERMEDAD, and only then")
        return self


class IllnessPayload(_Strict):
    type: Literal[EventType.ILLNESS] = EventType.ILLNESS
    illness: Illness
    treatment: Treatment
    diet_change: DietChangeDetails | None = None
    group_change: GroupChangeDetails | None = None


class AccidentPayload(_Strict):
    type: Literal[EventType.ACCIDENT] = EventType.ACCIDENT
    description: str | None = None
    treatment: Treatment
    diet_change: DietChangeDetails | None = None
    group_change: GroupChangeDetails | None = None


class MedicalTreatmentPayload(_Strict):
    type: Literal[EventType.MEDICAL_TREATMENT] = EventType.MEDICAL_TREATMENT
    kind: MedicalTreatmentKind
    treatment: Treatment


class TreatmentFollowupPayload(_Strict):
    type: Literal[EventType.TREATMENT_FOLLOWUP] = EventType.TREATMENT_FOLLOWUP
    outcome: TreatmentFollowupOutcome
    new_treatment: Treatment | None = None

    @model_validator(mode="after")
    def _change_needs_treatment(self) -> Self:
        changed = self.outcome is TreatmentFollowupOutcome.CHANGE
        if changed != (self.new_treatment is not None):
            raise ValueError("new_treatment is required when the outcome is CHANGE, and only then")
        return self


class DietChangePayload(DietChangeDetails):
    type: Literal[EventType.DIET_CHANGE] = EventType.DIET_CHANGE


class GroupChangePayload(GroupChangeDetails):
    type: Literal[EventType.GROUP_CHANGE] = EventType.GROUP_CHANGE


class VaccinationPayload(_Strict):
    type: Literal[EventType.VACCINATION] = EventType.VACCINATION
    vaccine_id: UUID
    dose_ml: float = Field(gt=0)


class WeightPayload(_Strict):
    type: Literal[EventType.WEIGHT] = EventType.WEIGHT
    kg: float = Field(gt=0)


class RemovalPayload(_Strict):
    type: Literal[EventType.REMOVAL] = EventType.REMOVAL
    reason: RemovalReason


EventPayload = Annotated[
    AltaPayload
    | HeatPayload
    | PregnancyCheckPayload
    | CalvingPayload
    | AbortionPayload
    | IllnessPayload
    | AccidentPayload
    | MedicalTreatmentPayload
    | TreatmentFollowupPayload
    | DietChangePayload
    | GroupChangePayload
    | VaccinationPayload
    | WeightPayload
    | RemovalPayload,
    Field(discriminator="type"),
]

_adapter: TypeAdapter[EventPayload] = TypeAdapter(EventPayload)


def validate_event_payload(event_type: EventType, payload: Mapping[str, Any]) -> EventPayload:
    """Parse `payload` as `event_type`'s model. Raises ValueError (ValidationError is one)."""
    tag = payload.get("type", event_type)
    if tag != event_type:
        raise ValueError(f"payload is tagged {tag}, not {event_type}")
    return _adapter.validate_python({**payload, "type": event_type})
