"""Request and response bodies of the animal registry (docs/domain-model.md §1, §3.11, §7.1, §7.7).

Rules that need only the body live here. Rules that need the database or the ranch's date (unique
IDs, dates not in the future, a heifer's age) live in `smartbell.services.animals`.
"""

import datetime as dt
import re
import uuid
from decimal import Decimal
from typing import Annotated, Any, Literal

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    StringConstraints,
)

from smartbell.domain.repro import Window
from smartbell.enums import (
    AnimalKind,
    AnimalStatus,
    Breed,
    CrossbreedLevel,
    DamStatus,
    DevelopmentStage,
    GroupPreset,
    LactationState,
    RemovalReason,
    ReproState,
    Sex,
)

# §1: letters (ñ and accented vowels included), digits and spaces. Hyphens too: the form's
# placeholder is "0000-0000-0000".
_CONTROL_ID = re.compile(r"[0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ \-]+")
_SINIIGA_SEPARATORS = re.compile(r"[\s\-]")


def _control_id(value: str) -> str:
    if not _CONTROL_ID.fullmatch(value):
        raise ValueError("El ID contiene caracteres no válidos")
    return value


def normalize_siniiga(value: str) -> str:
    """§7.7: the user types 10 digits (state 01-32, then the animal's 8). The stored form is
    `MX-00-EE-NNNN-NNNN`, which is also accepted as input."""
    digits = _SINIIGA_SEPARATORS.sub("", value).upper()
    if digits.startswith("MX00"):
        digits = digits[4:]
    if not re.fullmatch(r"[0-9]{10}", digits):
        raise ValueError("El SINIIGA debe tener 10 dígitos")
    if not 1 <= int(digits[:2]) <= 32:
        raise ValueError("El estado del SINIIGA debe ser de 01 a 32")
    return f"MX-00-{digits[:2]}-{digits[2:6]}-{digits[6:]}"


def _blank_is_none(value: Any) -> Any:
    return None if isinstance(value, str) and not value.strip() else value


ControlId = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=60),
    AfterValidator(_control_id),
]
# An empty field means no SINIIGA (it is optional, §7.7).
Siniiga = Annotated[
    Annotated[str, AfterValidator(normalize_siniiga)] | None, BeforeValidator(_blank_is_none)
]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
PhotoUrl = Annotated[str, StringConstraints(max_length=2048, pattern=r"^https://")]
Kilograms = Annotated[Decimal, Field(ge=0, le=9999, decimal_places=1)]
Centimeters = Annotated[Decimal, Field(ge=0, le=999, decimal_places=1)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ParentCreate(_Strict):
    """A dam or sire registered inline. Its sex comes from the slot it fills."""

    control_id: ControlId
    birth_date: dt.date
    name: Name | None = None
    siniiga: Siniiga = None
    breed: Breed = Breed.HOLSTEIN
    crossbreed_level: CrossbreedLevel = CrossbreedLevel.FB
    contributing_breed: Breed | None = None
    development_stage: DevelopmentStage = DevelopmentStage.AUTO
    group_id: uuid.UUID | None = None


class AnimalCreate(ParentCreate):
    """ "Nombre o Número interno" and the birth date are the only required fields (§7.1)."""

    sex: Sex = Sex.HEMBRA  # The form's toggle starts on Hembra.
    photo_url: PhotoUrl | None = None
    birth_length_cm: Centimeters | None = None
    weight_birth_kg: Kilograms | None = None
    weight_weaning_kg: Kilograms | None = None
    weight_one_year_kg: Kilograms | None = None
    # Onboarding repro inputs (females only). They go on the ALTA event and seed the projection;
    # `repro_stage_date` is the date of the declared stage (heat for ABIERTA, service for SERVIDA,
    # diagnosis for GESTANTE, dry-off for SECA).
    repro_stage: ReproState | None = None
    repro_stage_date: dt.date | None = None
    lactation_number: int | None = Field(default=None, ge=0, le=30)
    last_calving_date: dt.date | None = None
    last_service_date: dt.date | None = None
    # Parents: an existing animal of this ranch by id, or a new one created first.
    dam_id: uuid.UUID | None = None
    dam: ParentCreate | None = None
    sire_id: uuid.UUID | None = None
    sire: ParentCreate | None = None
    dam_status: DamStatus | None = None  # Anything but VIVA writes a REMOVAL on the dam.


class AnimalUpdate(_Strict):
    """Fields left out are kept. Sex and the onboarding repro inputs can't be edited: the events
    are the record from then on."""

    control_id: ControlId | None = None
    birth_date: dt.date | None = None
    name: Name | None = None
    siniiga: Siniiga = None
    breed: Breed | None = None
    crossbreed_level: CrossbreedLevel | None = None
    contributing_breed: Breed | None = None
    development_stage: DevelopmentStage | None = None
    group_id: uuid.UUID | None = None
    photo_url: PhotoUrl | None = None
    birth_length_cm: Centimeters | None = None
    weight_birth_kg: Kilograms | None = None
    weight_weaning_kg: Kilograms | None = None
    weight_one_year_kg: Kilograms | None = None
    dam_id: uuid.UUID | None = None
    sire_id: uuid.UUID | None = None


# Fields that may not be cleared with an explicit null.
REQUIRED_ON_UPDATE = frozenset(
    {"control_id", "birth_date", "breed", "crossbreed_level", "development_stage"}
)


class AnimalRemoval(_Strict):
    """Baja. ERROR_REGISTRO deletes the animal and its events; the other reasons keep them."""

    reason: RemovalReason
    removed_on: dt.date | None = None  # Defaults to the ranch's today.


class AnimalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sex: Sex
    kind: AnimalKind
    control_id: str
    name: str | None
    siniiga: str | None
    birth_date: dt.date
    breed: Breed
    crossbreed_level: CrossbreedLevel
    contributing_breed: Breed | None
    development_stage: DevelopmentStage
    photo_url: str | None
    group_id: uuid.UUID | None
    status: AnimalStatus
    removed_reason: RemovalReason | None
    removed_at: dt.datetime | None
    dam_id: uuid.UUID | None
    sire_id: uuid.UUID | None
    birth_length_cm: float | None
    weight_birth_kg: float | None
    weight_weaning_kg: float | None
    weight_one_year_kg: float | None
    repro_state: ReproState | None
    lactation_state: LactationState | None
    lactation_number: int | None
    last_calving_date: dt.date | None
    last_heat_date: dt.date | None
    last_service_date: dt.date | None
    service_number_in_lactation: int | None
    pregnancy_confirmed_date: dt.date | None
    expected_calving_date: dt.date | None
    is_sick: bool
    sick_since: dt.date | None
    milk_withdrawal_until: dt.date | None


class WindowOut(BaseModel):
    start: dt.date
    end: dt.date


def window_out(window: Window | None) -> WindowOut | None:
    return None if window is None else WindowOut(start=window.start, end=window.end)


class ProjectionOut(BaseModel):
    """The engine's view of the animal today: what the list columns don't hold."""

    development_stage: DevelopmentStage  # AUTO resolved.
    dim: int | None
    days_open: int | None
    breeding_unlocked: bool
    next_heat: WindowOut | None
    pregnancy_check: WindowOut | None
    calving: WindowOut | None
    dry_off_date: dt.date | None
    close_up_date: dt.date | None
    # Flag names; NOT_FERTILE is the §3.11 "> 30 months" advice.
    warnings: list[str]


class AnimalDetail(AnimalOut):
    projection: ProjectionOut


class AnimalCreated(AnimalDetail):
    """The new animal, plus every animal the request created (inline parents first)."""

    created_ids: list[uuid.UUID]


class AnimalPage(BaseModel):
    items: list[AnimalOut]
    total: int
    page: int
    page_size: int


Health = Literal["SALUDABLE", "ENFERMA"]
SortKey = Literal[
    "control_id",
    "-control_id",
    "birth_date",
    "-birth_date",
    "created_at",
    "-created_at",
    "last_calving_date",
    "-last_calving_date",
    "expected_calving_date",
    "-expected_calving_date",
]
GroupFilter = uuid.UUID | GroupPreset
