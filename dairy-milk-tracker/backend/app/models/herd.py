from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Herd(Base):
    __tablename__ = "herds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cow_count = Column(Integer)
    location_line1 = Column(String, nullable=True)
    location_line2 = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    owner = relationship("User", back_populates="herds")
    milk_records = relationship("MilkProduction", back_populates="herd")
