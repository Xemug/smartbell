"""Alerts, tasks and the history feed (docs/domain-model.md §1 and §7.2)."""

import datetime as dt
import uuid
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from smartbell.db import Base
from smartbell.enums import (
    AlertKind,
    AlertStatus,
    HistoryCategory,
    TaskCategory,
    TaskFrequency,
    TaskKind,
    TaskSource,
    TaskStatus,
)
from smartbell.models.columns import Json, RanchId, UuidPk, created_at, str_enum


class Alert(Base):
    """Internal: people see these only as automatic tasks and off-app notifications."""

    __tablename__ = "alerts"
    __table_args__ = (
        UniqueConstraint("animal_id", "kind", "window_start", "window_end"),
        CheckConstraint("window_end >= window_start", name="window_order"),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    animal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("animals.id", ondelete="CASCADE"))
    kind: Mapped[AlertKind] = mapped_column(str_enum(AlertKind, "kind"))
    window_start: Mapped[dt.date]
    window_end: Mapped[dt.date]
    status: Mapped[AlertStatus] = mapped_column(
        str_enum(AlertStatus, "status"),
        default=AlertStatus.PENDING,
        server_default=AlertStatus.PENDING,
    )
    follow_up_day: Mapped[int] = mapped_column(default=0, server_default="0")
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    resolved_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    resulting_event_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("events.id", ondelete="SET NULL")
    )
    created_at: Mapped[dt.datetime] = created_at()


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_ranch_id_due_date", "ranch_id", "due_date"),
        # An open alert has exactly one open task, which is what makes the upsert idempotent.
        Index(
            "uq_tasks_open_alert_id",
            "alert_id",
            unique=True,
            postgresql_where=text("status = 'OPEN' AND alert_id IS NOT NULL"),
            sqlite_where=text("status = 'OPEN' AND alert_id IS NOT NULL"),
        ),
    )

    id: Mapped[UuidPk]
    ranch_id: Mapped[RanchId]
    source: Mapped[TaskSource] = mapped_column(str_enum(TaskSource, "source"))
    kind: Mapped[TaskKind] = mapped_column(str_enum(TaskKind, "kind"))
    title: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[dt.date]
    frequency: Mapped[TaskFrequency] = mapped_column(
        str_enum(TaskFrequency, "frequency"),
        default=TaskFrequency.ONCE,
        server_default=TaskFrequency.ONCE,
    )
    category: Mapped[TaskCategory | None] = mapped_column(str_enum(TaskCategory, "category"))
    animal_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("animals.id", ondelete="CASCADE"), index=True
    )
    assignee_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    notes: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[TaskStatus] = mapped_column(
        str_enum(TaskStatus, "status"), default=TaskStatus.OPEN, server_default=TaskStatus.OPEN
    )
    completed_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    completed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    linked_event_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("events.id", ondelete="SET NULL")
    )
    alert_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("alerts.id", ondelete="SET NULL"))
    completion_rule: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[dt.datetime] = created_at()


class HistoryEntry(Base):
    __tablename__ = "history_entries"
    __table_args__ = (Index("ix_history_entries_ranch_id_created_at", "ranch_id", "created_at"),)

    id: Mapped[UuidPk]
    ranch_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ranches.id", ondelete="CASCADE"))
    # SET NULL: deleting a user keeps their entries.
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    category: Mapped[HistoryCategory] = mapped_column(str_enum(HistoryCategory, "category"))
    event_key: Mapped[str] = mapped_column(String(100))
    refs: Mapped[dict[str, Any]] = mapped_column(Json, default=dict, server_default="{}")
    n: Mapped[int] = mapped_column(default=1, server_default="1")
    created_at: Mapped[dt.datetime] = created_at()
