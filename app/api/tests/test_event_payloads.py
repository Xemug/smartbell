"""Every event type accepts its valid payload and refuses what doesn't match it."""

from datetime import date
from typing import Any
from uuid import uuid4

import pytest
from pydantic import ValidationError

from smartbell.enums import EventType
from smartbell.schemas.events import (
    AltaPayload,
    HeatPayload,
    IllnessPayload,
    validate_event_payload,
)

TREATMENT = {"type": "ANTIBIOTICO", "presentation": "INYECCION", "start_date": "2026-10-01"}

VALID: dict[EventType, dict[str, Any]] = {
    EventType.ALTA: {"control_id": "00001", "sex": "HEMBRA", "birth_date": "2022-01-15"},
    EventType.HEAT: {"outcome": "NOT_OBSERVED"},
    EventType.PREGNANCY_CHECK: {"method": "TACTO", "result": "POSITIVE"},
    EventType.CALVING: {"timing": "ESPERADO", "calf_registered": False},
    EventType.ABORTION: {"kind": "NATURAL", "cause": "HORMONAL"},
    EventType.ILLNESS: {"illness": "MASTITIS", "treatment": TREATMENT},
    EventType.ACCIDENT: {"treatment": TREATMENT},
    EventType.MEDICAL_TREATMENT: {"kind": "VACUNAS", "treatment": TREATMENT},
    EventType.TREATMENT_FOLLOWUP: {"outcome": "SUCCESS"},
    EventType.DIET_CHANGE: {
        "reason": "OTRA",
        "diet": "Materia seca",
        "diet_type": "Materia Seca",
        "daily_kg": 20.5,
        "daily_cost": 110,
    },
    EventType.GROUP_CHANGE: {"from_group_id": str(uuid4()), "to_group_id": str(uuid4())},
    EventType.VACCINATION: {"vaccine_id": str(uuid4()), "dose_ml": 2},
    EventType.WEIGHT: {"kg": 410.5},
    EventType.REMOVAL: {"reason": "MUERTE"},
}

MISMATCHED: dict[EventType, dict[str, Any]] = {
    EventType.ALTA: {"control_id": "00001", "sex": "HEMBRA"},  # no birth date
    EventType.HEAT: {"outcome": "SOMETHING"},
    EventType.PREGNANCY_CHECK: {"method": "TACTO", "result": "NEGATIVE"},  # no description
    EventType.CALVING: {"timing": "ESPERADO", "calf_registered": True},  # no calf
    EventType.ABORTION: {"kind": "NATURAL", "cause": "VIRUS"},  # an induced cause
    EventType.ILLNESS: {"illness": "GRIPE", "treatment": TREATMENT},
    EventType.ACCIDENT: {"description": "Se cayó"},  # no treatment
    EventType.MEDICAL_TREATMENT: {"kind": "OTROS"},  # no treatment
    EventType.TREATMENT_FOLLOWUP: {"outcome": "CHANGE"},  # no new treatment
    EventType.DIET_CHANGE: {"reason": "OTRA"},  # no diet
    EventType.GROUP_CHANGE: {"from_group_id": str(uuid4())},  # no destination
    EventType.VACCINATION: {"vaccine_id": "not-a-uuid", "dose_ml": 2},
    EventType.WEIGHT: {"kg": 0},
    EventType.REMOVAL: {"reason": "PERDIDA"},
}


def test_every_event_type_is_covered() -> None:
    assert set(VALID) == set(MISMATCHED) == set(EventType)


@pytest.mark.parametrize("event_type", EventType)
def test_valid_payload_is_accepted(event_type: EventType) -> None:
    assert validate_event_payload(event_type, VALID[event_type]).type is event_type


@pytest.mark.parametrize("event_type", EventType)
def test_mismatched_payload_is_rejected(event_type: EventType) -> None:
    with pytest.raises(ValidationError):
        validate_event_payload(event_type, MISMATCHED[event_type])


@pytest.mark.parametrize("event_type", EventType)
def test_unknown_field_is_rejected(event_type: EventType) -> None:
    with pytest.raises(ValidationError):
        validate_event_payload(event_type, {**VALID[event_type], "surprise": 1})


def test_payload_tagged_with_another_type_is_rejected() -> None:
    with pytest.raises(ValueError, match="tagged"):
        validate_event_payload(EventType.WEIGHT, {"type": "HEAT", "kg": 400})


def test_another_types_payload_is_rejected() -> None:
    with pytest.raises(ValidationError):
        validate_event_payload(EventType.WEIGHT, VALID[EventType.REMOVAL])


def test_alta_defaults_to_holstein_auto_stage() -> None:
    parsed = validate_event_payload(EventType.ALTA, VALID[EventType.ALTA])

    assert isinstance(parsed, AltaPayload)
    assert parsed.breed == "HOLSTEIN"
    assert parsed.development_stage == "AUTO"


def test_treatment_defaults_to_five_days() -> None:
    parsed = validate_event_payload(EventType.ILLNESS, VALID[EventType.ILLNESS])

    assert isinstance(parsed, IllnessPayload)
    assert parsed.treatment.start_date == date(2026, 10, 1)
    assert (parsed.treatment.duration_days, parsed.treatment.withdrawal_days) == (5, None)


def test_inseminated_heat_needs_bull_and_method() -> None:
    inseminated = {"outcome": "INSEMINATED", "clean": True}
    with pytest.raises(ValidationError, match="bull_id"):
        validate_event_payload(EventType.HEAT, inseminated)

    parsed = validate_event_payload(
        EventType.HEAT, {**inseminated, "bull_id": str(uuid4()), "method": "MONTA"}
    )
    assert isinstance(parsed, HeatPayload)


@pytest.mark.parametrize(
    "payload",
    [
        {"outcome": "VWP", "clean": True, "bull_id": str(uuid4()), "method": "IA"},
        {"outcome": "DIRTY_MEDICATED", "clean": False},
        {"outcome": "VWP", "clean": True, "treatment": TREATMENT},
        {"outcome": "DIRTY_NOT_MEDICATED", "clean": True},
        {"outcome": "NOT_INSEMINATED", "clean": False},
        {"outcome": "NOT_OBSERVED", "clean": True},
    ],
)
def test_heat_fields_must_match_the_outcome(payload: dict[str, Any]) -> None:
    with pytest.raises(ValidationError):
        validate_event_payload(EventType.HEAT, payload)


def test_illness_abortion_needs_the_illness() -> None:
    induced = {"kind": "INDUCIDO", "cause": "ENFERMEDAD"}
    with pytest.raises(ValidationError, match="illness"):
        validate_event_payload(EventType.ABORTION, induced)

    validate_event_payload(EventType.ABORTION, {**induced, "illness": "BRUCELOSIS"})


def test_induced_abortion_refuses_a_natural_cause() -> None:
    with pytest.raises(ValidationError, match="abortion cause"):
        validate_event_payload(EventType.ABORTION, {"kind": "INDUCIDO", "cause": "HORMONAL"})


def test_blank_negative_description_is_rejected() -> None:
    with pytest.raises(ValidationError):
        validate_event_payload(
            EventType.PREGNANCY_CHECK,
            {"method": "TACTO", "result": "NEGATIVE", "description": "   "},
        )


def test_corticoid_subtype_only_on_corticoids() -> None:
    treatment = {**TREATMENT, "corticoid_subtype": "CORTISONA"}
    with pytest.raises(ValidationError, match="corticoid_subtype"):
        validate_event_payload(EventType.ACCIDENT, {"treatment": treatment})

    validate_event_payload(EventType.ACCIDENT, {"treatment": {**treatment, "type": "CORTICOIDE"}})


def test_group_change_must_change_the_group() -> None:
    group_id = str(uuid4())
    with pytest.raises(ValidationError, match="differ"):
        validate_event_payload(
            EventType.GROUP_CHANGE, {"from_group_id": group_id, "to_group_id": group_id}
        )
