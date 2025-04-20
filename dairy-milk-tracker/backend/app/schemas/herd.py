from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class HerdBase(BaseModel):
    name: str
    cow_count: int
    location_line1: Optional[str] = None
    location_line2: Optional[str] = None


class HerdCreate(HerdBase):
    pass


class Herd(HerdBase):
    id: int
    created_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True
