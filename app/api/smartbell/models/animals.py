"""Animals and groups (docs/domain-model.md §1 and §7.1)."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from smartbell.db import Base
from smartbell.enums import (
    AnimalKind,
    AnimalStatus,
    Breed,
    CrossbreedLevel,
    DevelopmentStage,
    GroupKpiIndicator,
    GroupPreset,
    GroupSelection,
    GroupType,
    LactationState,
    RemovalReason,
    ReproState,
    Sex,
)
from smartbell.models.columns import Json, RanchId, UuidPk, created_at, str_enum

MALE_STAGES = (
    DevelopmentStage.AUTO,
    DevelopmentStage.BECERRO,
    DevelopmentStage.DESTETADO,
    DevelopmentStage.NOVILLO,
    DevelopmentStage.TORO,
)


def _in(values: tuple[str, ...]) -> str:
    return "(" + ", ".join(f"'{value}'" for value in values) + ")"


def derive_kind(sex: Sex, stage: DevelopmentStage, *, has_calved: bool) -> AnimalKind:
    """The list tab an animal falls in (§7.1). `kind` is stored only so lists can filter on it."""
    if sex is Sex.HEMBRA:
        return AnimalKind.VACA if has_calved else AnimalKind.VAQUILLA
    if stage is DevelopmentStage.TORO:
        return AnimalKind.TORO
    return AnimalKind.NOVILLO if stage is DevelopmentStage.NOVILLO else AnimalKind.BECERRO


class Group(Base):
    __tablename__ = "groups"
    __table_args__ = (
        CheckConstraint("(type = 'PRESET') = (preset IS NOT NULL)", name="preset_iff_type_preset"),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    name: Mapped[str] = mapped_column(String(60))
    description: Mapped[str | None] = mapped_column(String(120))
    type: Mapped[GroupType] = mapped_column(str_enum(GroupType, "type"))
    preset: Mapped[GroupPreset | None] = mapped_column(str_enum(GroupPreset, "preset"))
    selection: Mapped[GroupSelection] = mapped_column(
        str_enum(GroupSelection, "selection"),
        default=GroupSelection.MANUAL,
        server_default=GroupSelection.MANUAL,
    )
    auto_filter: Mapped[dict[str, Any] | None] = mapped_column(Json)
    kpi_indicator: Mapped[GroupKpiIndicator | None] = mapped_column(
        str_enum(GroupKpiIndicator, "kpi_indicator")
    )
    created_at: Mapped[dt.datetime] = created_at()


class Animal(Base):
    """Everything from `repro_state` down to `milk_withdrawal_until` is a projection of the
    animal's events: nullable, and written only by the repro engine (§2).
    """

    __tablename__ = "animals"
    __table_args__ = (
        Index("uq_animals_ranch_id_control_id", "ranch_id", "control_id", unique=True),
        Index(
            "uq_animals_ranch_id_siniiga",
            "ranch_id",
            "siniiga",
            unique=True,
            postgresql_where=text("siniiga IS NOT NULL"),
            sqlite_where=text("siniiga IS NOT NULL"),
        ),
        Index(
            "uq_animals_ranch_id_bull_name",
            "ranch_id",
            "name",
            unique=True,
            postgresql_where=text("name IS NOT NULL AND sex = 'MACHO'"),
            sqlite_where=text("name IS NOT NULL AND sex = 'MACHO'"),
        ),
        Index("ix_animals_ranch_id_status", "ranch_id", "status"),
        CheckConstraint(
            "crossbreed_level = 'FB' OR contributing_breed IS NOT NULL",
            name="contributing_breed_unless_fb",
        ),
        CheckConstraint(
            "(sex = 'HEMBRA' AND kind IN ('VACA', 'VAQUILLA'))"
            " OR (sex = 'MACHO' AND kind IN ('TORO', 'BECERRO', 'NOVILLO'))",
            name="kind_matches_sex",
        ),
        CheckConstraint(
            f"(sex = 'MACHO') = (development_stage IN {_in(MALE_STAGES)})"
            " OR development_stage = 'AUTO'",
            name="stage_matches_sex",
        ),
        CheckConstraint(
            "(status = 'REMOVED') = (removed_reason IS NOT NULL)",
            name="removed_reason_iff_removed",
        ),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    sex: Mapped[Sex] = mapped_column(str_enum(Sex, "sex"))
    kind: Mapped[AnimalKind] = mapped_column(str_enum(AnimalKind, "kind"))
    control_id: Mapped[str] = mapped_column(String(60))  # "Nombre o Número interno"
    name: Mapped[str | None] = mapped_column(String(60))
    siniiga: Mapped[str | None] = mapped_column(String(24))
    birth_date: Mapped[dt.date]
    breed: Mapped[Breed] = mapped_column(
        str_enum(Breed, "breed"), default=Breed.HOLSTEIN, server_default=Breed.HOLSTEIN
    )
    crossbreed_level: Mapped[CrossbreedLevel] = mapped_column(
        str_enum(CrossbreedLevel, "crossbreed_level"),
        default=CrossbreedLevel.FB,
        server_default=CrossbreedLevel.FB,
    )
    contributing_breed: Mapped[Breed | None] = mapped_column(str_enum(Breed, "contributing_breed"))
    development_stage: Mapped[DevelopmentStage] = mapped_column(
        str_enum(DevelopmentStage, "development_stage"),
        default=DevelopmentStage.AUTO,
        server_default=DevelopmentStage.AUTO,
    )
    photo_url: Mapped[str | None] = mapped_column(String(2048))
    # SET NULL: deleting a group first moves its animals to General; this is only the backstop.
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("groups.id", ondelete="SET NULL"), index=True
    )
    status: Mapped[AnimalStatus] = mapped_column(
        str_enum(AnimalStatus, "status"),
        default=AnimalStatus.ACTIVE,
        server_default=AnimalStatus.ACTIVE,
    )
    removed_reason: Mapped[RemovalReason | None] = mapped_column(
        str_enum(RemovalReason, "removed_reason")
    )
    removed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = created_at()

    dam_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("animals.id", ondelete="SET NULL"))
    sire_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("animals.id", ondelete="SET NULL"))
    birth_length_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    weight_birth_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    weight_weaning_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    weight_one_year_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))

    # Declared at registration: seeds the projection, which then owns the fields below.
    repro_stage: Mapped[ReproState | None] = mapped_column(str_enum(ReproState, "repro_stage"))
    repro_stage_date: Mapped[dt.date | None] = mapped_column(Date)

    repro_state: Mapped[ReproState | None] = mapped_column(str_enum(ReproState, "repro_state"))
    lactation_state: Mapped[LactationState | None] = mapped_column(
        str_enum(LactationState, "lactation_state")
    )
    lactation_number: Mapped[int | None]
    last_calving_date: Mapped[dt.date | None]
    last_heat_date: Mapped[dt.date | None]
    last_service_date: Mapped[dt.date | None]
    service_bull_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("animals.id", ondelete="SET NULL")
    )
    service_number_in_lactation: Mapped[int | None]
    pregnancy_confirmed_date: Mapped[dt.date | None]
    expected_calving_date: Mapped[dt.date | None]
    is_sick: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    sick_since: Mapped[dt.date | None]
    milk_withdrawal_until: Mapped[dt.date | None]
