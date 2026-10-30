"""Users, ranches and who belongs to what (docs/domain-model.md §1 Tenancy and access)."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, Float, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from smartbell.db import Base
from smartbell.enums import (
    HerdType,
    NotificationChannel,
    NotificationStatus,
    Role,
    VaccinationPlanStatus,
)
from smartbell.models.columns import Json, UuidPk, created_at, str_enum

DEFAULT_PREG_RECHECK_DAYS = [90, 180]


class User(Base):
    """No password here: identity is Firebase Auth, so `auth` upserts on `firebase_uid`."""

    __tablename__ = "users"

    id: Mapped[UuidPk]
    firebase_uid: Mapped[str | None] = mapped_column(String(128), unique=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20))  # E.164
    email: Mapped[str] = mapped_column(String(320), unique=True)
    photo_url: Mapped[str | None] = mapped_column(String(2048))
    created_at: Mapped[dt.datetime] = created_at()
    last_active_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Ranch(Base):
    __tablename__ = "ranches"

    id: Mapped[UuidPk]
    name: Mapped[str] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(String(300))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    # RESTRICT: ownership moves before the owner's user row can go.
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True
    )
    plan_id: Mapped[str | None] = mapped_column(String(100))  # RevenueCat entitlement, no table.
    vaccination_plan_status: Mapped[VaccinationPlanStatus] = mapped_column(
        str_enum(VaccinationPlanStatus, "vaccination_plan_status"),
        default=VaccinationPlanStatus.PENDIENTE,
        server_default=VaccinationPlanStatus.PENDIENTE,
    )
    created_at: Mapped[dt.datetime] = created_at()


class Membership(Base):
    __tablename__ = "memberships"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    ranch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ranches.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    role: Mapped[Role] = mapped_column(str_enum(Role, "role"))
    # Codes and role presets belong to `ranch-tenancy-permissions`.
    permissions: Mapped[list[str]] = mapped_column(Json, default=list, server_default="[]")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    ranch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ranches.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    channels: Mapped[list[str]] = mapped_column(
        Json,
        default=lambda: [NotificationChannel.IN_APP.value],
        server_default=f'["{NotificationChannel.IN_APP.value}"]',
    )


class RanchSettings(Base):
    """One row per ranch; the column defaults are the confirmed values of §1, §7.5 and §7.6."""

    __tablename__ = "ranch_settings"

    ranch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ranches.id", ondelete="CASCADE"), primary_key=True
    )
    gestation_days: Mapped[int] = mapped_column(default=283, server_default="283")
    heat_cycle_days: Mapped[int] = mapped_column(default=21, server_default="21")
    # Total width of the window (§7.6), not the ± of §3.3: 7 means 3 days either side.
    heat_window_days: Mapped[int] = mapped_column(default=7, server_default="7")
    vwp_days: Mapped[int] = mapped_column(default=45, server_default="45")
    preg_check_min_days: Mapped[int] = mapped_column(default=35, server_default="35")
    preg_check_max_days: Mapped[int] = mapped_column(default=45, server_default="45")
    preg_recheck_days: Mapped[list[int]] = mapped_column(
        Json,
        default=lambda: list(DEFAULT_PREG_RECHECK_DAYS),
        server_default=str(DEFAULT_PREG_RECHECK_DAYS),
    )
    dry_off_days_before_calving: Mapped[int] = mapped_column(default=60, server_default="60")
    close_up_days_before_calving: Mapped[int] = mapped_column(default=21, server_default="21")
    fresh_cow_dim: Mapped[int] = mapped_column(default=45, server_default="45")
    diet_change_dim: Mapped[int] = mapped_column(default=120, server_default="120")
    abortion_min_days: Mapped[int] = mapped_column(default=42, server_default="42")
    abortion_max_days: Mapped[int] = mapped_column(default=260, server_default="260")
    heifer_heat_alert_from_months: Mapped[int] = mapped_column(default=13, server_default="13")
    heifer_heat_alert_until_months: Mapped[int] = mapped_column(default=18, server_default="18")
    heifer_breeding_unlock_months: Mapped[int] = mapped_column(default=12, server_default="12")
    herd_type: Mapped[HerdType] = mapped_column(
        str_enum(HerdType, "herd_type"), default=HerdType.DAIRY, server_default=HerdType.DAIRY
    )
    value_per_registered_cow_mxn: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal(2100), server_default="2100"
    )
    target_cow_count: Mapped[int | None]  # The declared herd of the home banner (§7.5).


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UuidPk]
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    channel: Mapped[NotificationChannel] = mapped_column(str_enum(NotificationChannel, "channel"))
    template: Mapped[str] = mapped_column(String(100))
    vars: Mapped[dict[str, Any]] = mapped_column(Json, default=dict, server_default="{}")
    deep_link: Mapped[str | None] = mapped_column(String(2048))
    status: Mapped[NotificationStatus] = mapped_column(
        str_enum(NotificationStatus, "status"),
        default=NotificationStatus.PENDING,
        server_default=NotificationStatus.PENDING,
    )
    sent_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = created_at()
