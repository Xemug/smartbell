"""Milk logs (docs/domain-model.md §7.3)."""

import datetime as dt
import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from smartbell.db import Base
from smartbell.enums import MilkDestination
from smartbell.models.columns import RanchId, UuidPk, created_at, str_enum


class MilkHerdLog(Base):
    """One row per ranch per day; re-entering a day overwrites it."""

    __tablename__ = "milk_herd_logs"
    __table_args__ = (
        UniqueConstraint("ranch_id", "date"),
        CheckConstraint("total_liters >= 0", name="total_liters_not_negative"),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ranches.id", ondelete="CASCADE"))
    date: Mapped[dt.date]
    total_liters: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    entered_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[dt.datetime] = created_at()


class MilkCowLog(Base):
    __tablename__ = "milk_cow_logs"
    __table_args__ = (
        Index("ix_milk_cow_logs_animal_id_date", "animal_id", "date"),
        CheckConstraint("liters >= 0", name="liters_not_negative"),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    animal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("animals.id", ondelete="CASCADE"))
    date: Mapped[dt.date]
    liters: Mapped[Decimal] = mapped_column(Numeric(7, 2))
    destination: Mapped[MilkDestination] = mapped_column(str_enum(MilkDestination, "destination"))
    created_at: Mapped[dt.datetime] = created_at()
