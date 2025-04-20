from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class MilkProductionBase(BaseModel):
    date: datetime
    amount_liters: float
    fat_percentage: Optional[float] = None
    protein_percentage: Optional[float] = None


class MilkProductionCreate(MilkProductionBase):
    herd_id: int


class MilkProduction(MilkProductionBase):
    id: int
    created_at: datetime
    herd_id: int
    
    class Config:
        from_attributes = True


class MilkProductionStats(BaseModel):
    total_liters: float
    average_per_day: float
    days_recorded: int
    liters_per_cow: float = 0
