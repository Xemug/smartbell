"""Every ORM model. Importing this package registers all tables on `Base.metadata`."""

from smartbell.models.animals import Animal, Group, derive_kind
from smartbell.models.events import DeletionRequest, Event
from smartbell.models.milk import MilkCowLog, MilkHerdLog
from smartbell.models.tenancy import (
    Membership,
    Notification,
    NotificationPreference,
    Ranch,
    RanchSettings,
    User,
)
from smartbell.models.vaccination import PlanVaccine, VaccinationPlan
from smartbell.models.work import Alert, HistoryEntry, Task

__all__ = [
    "Alert",
    "Animal",
    "DeletionRequest",
    "Event",
    "Group",
    "HistoryEntry",
    "Membership",
    "MilkCowLog",
    "MilkHerdLog",
    "Notification",
    "NotificationPreference",
    "PlanVaccine",
    "Ranch",
    "RanchSettings",
    "Task",
    "User",
    "VaccinationPlan",
    "derive_kind",
]
