"""WhatsApp support copy and the fake-door tap log (v4 tasks inventory §1.13-1.14, §3.5)."""

import datetime as dt
import uuid

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from smartbell.db import Base
from smartbell.enums import FakeDoorFeature
from smartbell.models.columns import UuidPk, created_at, str_enum

SUPPORT_SETTINGS_ID = 1
DEFAULT_WHATSAPP_NUMBER = "523334056398"  # 333-405-6398 with Mexico's 52, as wa.me wants it.


class SupportSettings(Base):
    """A single row (id 1), so the number and copy change with an admin call, not a deploy.

    A null message means "use the app's own translated copy"; set one to override it.
    """

    __tablename__ = "support_settings"
    __table_args__ = (CheckConstraint(f"id = {SUPPORT_SETTINGS_ID}", name="single_row"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    whatsapp_number: Mapped[str] = mapped_column(
        String(15), default=DEFAULT_WHATSAPP_NUMBER, server_default=DEFAULT_WHATSAPP_NUMBER
    )
    support_message: Mapped[str | None] = mapped_column(String(500))
    payment_message: Mapped[str | None] = mapped_column(String(500))
    # Carries a `{nombre}` placeholder for the feature's name.
    feature_message: Mapped[str | None] = mapped_column(String(500))
    community_url: Mapped[str | None] = mapped_column(String(500))
    updated_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class FakeDoorTap(Base):
    """One row per tap on an unbuilt feature: the demand signal for the deferred modules."""

    __tablename__ = "fake_door_taps"
    __table_args__ = (Index("ix_fake_door_taps_feature_created_at", "feature", "created_at"),)

    id: Mapped[UuidPk]
    feature: Mapped[FakeDoorFeature] = mapped_column(str_enum(FakeDoorFeature, "feature"))
    # SET NULL keeps the count when an account goes.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    created_at: Mapped[dt.datetime] = created_at()
