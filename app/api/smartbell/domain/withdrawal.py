"""Milk withdrawal (docs/domain-model.md §3.6 and §3.14). Pure: no I/O, no clock."""

import datetime as dt

from smartbell.enums import DrugPresentation, EventType, MedicalTreatmentKind, TreatmentType
from smartbell.schemas.events import Treatment

# §3.6. Each value is the top of the range in the withdrawal note, which is what the note asks for
# when nobody says what was given. These are drug facts, not ranch preferences, so they don't live
# in RanchSettings. ANTIINFLAMATORIO and QUIRURGICO have no value: they fall to the maximum.
WITHDRAWAL_DAYS_BY_TYPE = {
    TreatmentType.CORTICOIDE: 21,
    TreatmentType.ANTIBIOTICO: 10,
    TreatmentType.ANTISEPTICO: 3,
    TreatmentType.ANTIBACTERIANO: 3,
    TreatmentType.ANTIMICROBIANO: 42,
    TreatmentType.ANTIPARASITARIO: 42,
    TreatmentType.ANTIMICOTICO: 3,
}
HEAT_SYNC_WITHDRAWAL_DAYS = 2
TOPICAL_WITHDRAWAL_DAYS = 0
MAX_WITHDRAWAL_DAYS = max(WITHDRAWAL_DAYS_BY_TYPE.values())


def withdrawal_days(treatment: Treatment, medical_kind: MedicalTreatmentKind | None = None) -> int:
    """What the user entered, else the default for the treatment, else the maximum."""
    if treatment.withdrawal_days is not None:
        return treatment.withdrawal_days
    if medical_kind is MedicalTreatmentKind.SINCRONIZACION_CELO:
        return HEAT_SYNC_WITHDRAWAL_DAYS
    if treatment.presentation is DrugPresentation.TOPICO:
        return TOPICAL_WITHDRAWAL_DAYS
    return WITHDRAWAL_DAYS_BY_TYPE.get(treatment.type, MAX_WITHDRAWAL_DAYS)


def withdrawal_until(
    treatment: Treatment, medical_kind: MedicalTreatmentKind | None = None
) -> dt.date:
    """§3.6: treatment start + duration + withdrawal."""
    days = treatment.duration_days + withdrawal_days(treatment, medical_kind)
    return treatment.start_date + dt.timedelta(days=days)


def separates_milk(
    event_type: EventType,
    treatment: Treatment,
    medical_kind: MedicalTreatmentKind | None = None,
) -> bool:
    """§3.14: every illness; accidents and medical treatments only if the milk is affected."""
    return event_type is EventType.ILLNESS or withdrawal_days(treatment, medical_kind) > 0
