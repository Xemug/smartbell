"""Vaccination plan per ranch (docs/domain-model.md §1 Vaccination and development)."""

import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from smartbell.db import Base
from smartbell.enums import (
    ColostrumType,
    DewormingFrequency,
    VaccinationPlanStatus,
    VaccineFrequency,
    VaccineStartBy,
    VaccineStartEvent,
)
from smartbell.models.columns import RanchId, UuidPk, str_enum


class VaccinationPlan(Base):
    __tablename__ = "vaccination_plans"
    __table_args__ = (
        UniqueConstraint("ranch_id", "version"),
        CheckConstraint(
            "first_insemination_weight_kg BETWEEN 330 AND 380", name="first_insemination_weight"
        ),
        CheckConstraint("weaning_age_days BETWEEN 60 AND 90", name="weaning_age"),
        CheckConstraint("first_deworming_days BETWEEN 90 AND 180", name="first_deworming"),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    first_insemination_weight_kg: Mapped[int | None]
    weaning_age_days: Mapped[int | None]
    first_deworming_days: Mapped[int | None]
    deworming_frequency: Mapped[DewormingFrequency | None] = mapped_column(
        str_enum(DewormingFrequency, "deworming_frequency")
    )
    colostrum_type: Mapped[ColostrumType | None] = mapped_column(
        str_enum(ColostrumType, "colostrum_type")
    )
    status: Mapped[VaccinationPlanStatus] = mapped_column(
        str_enum(VaccinationPlanStatus, "status"),
        default=VaccinationPlanStatus.PENDIENTE,
        server_default=VaccinationPlanStatus.PENDIENTE,
    )
    version: Mapped[int] = mapped_column(default=1, server_default="1")


class PlanVaccine(Base):
    __tablename__ = "plan_vaccines"

    id: Mapped[UuidPk]
    plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("vaccination_plans.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))
    dose_ml: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    dose_ml_per_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))
    start_by: Mapped[VaccineStartBy] = mapped_column(str_enum(VaccineStartBy, "start_by"))
    start_value: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    start_event: Mapped[VaccineStartEvent | None] = mapped_column(
        str_enum(VaccineStartEvent, "start_event")
    )
    frequency: Mapped[VaccineFrequency] = mapped_column(str_enum(VaccineFrequency, "frequency"))
    booster_count: Mapped[int | None]
    booster_every_months: Mapped[int | None]
