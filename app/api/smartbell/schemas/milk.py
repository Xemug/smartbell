"""Request and response bodies of the milk records API (docs/domain-model.md §7.3)."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from smartbell.enums import MilkDestination, MilkGranularity, MilkWarning

# Matches the columns: Numeric(10, 2) for the herd total, Numeric(7, 2) for one cow.
HerdLiters = Annotated[Decimal, Field(ge=0, le=99_999_999, decimal_places=2)]
CowLiters = Annotated[Decimal, Field(ge=0, le=999, decimal_places=2)]

# One body is one day's milking: a cow per destination, for a herd of up to 1000 milking cows.
MAX_COW_ENTRIES = 3000


class HerdLogIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: dt.date | None = None  # The ranch's today when omitted.
    total_liters: HerdLiters


class HerdLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: dt.date
    total_liters: Decimal
    entered_by: uuid.UUID | None


class CowLogEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    animal_id: uuid.UUID
    destination: MilkDestination = MilkDestination.TANQUE
    liters: CowLiters


class CowLogsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: dt.date | None = None  # The ranch's today when omitted.
    entries: list[CowLogEntry] = Field(min_length=1, max_length=MAX_COW_ENTRIES)


class CowLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    animal_id: uuid.UUID
    date: dt.date
    destination: MilkDestination
    liters: Decimal


class CowLogWarning(BaseModel):
    animal_id: uuid.UUID
    code: MilkWarning


class CowLogsOut(BaseModel):
    logs: list[CowLogOut]
    warnings: list[CowLogWarning]


class Bucket(BaseModel):
    start: dt.date
    end: dt.date  # Inclusive.
    total_liters: Decimal  # Sum of the herd logs in the bucket.
    days_logged: int
    avg_daily_liters: Decimal | None  # total ÷ days logged
    avg_liters_per_cow: Decimal | None  # avg daily ÷ lactating cows today
    by_destination: dict[MilkDestination, Decimal]  # Sum of the per-cow logs.


class LatestDay(BaseModel):
    date: dt.date
    total_liters: Decimal
    liters_per_cow: Decimal | None


class MilkSummary(BaseModel):
    granularity: MilkGranularity
    start: dt.date
    end: dt.date
    lactating_cows: int
    latest: LatestDay | None  # The newest herd log on or before `end`: the KPI tile.
    buckets: list[Bucket]


class PeakDay(BaseModel):
    date: dt.date
    liters: Decimal
    dim: int | None  # Days in milk on that day; unknown before her last calving.


class CowMilkStats(BaseModel):
    animal_id: uuid.UUID
    days_logged: int
    total_liters: Decimal
    avg_daily_liters: Decimal | None
    peak: PeakDay | None
