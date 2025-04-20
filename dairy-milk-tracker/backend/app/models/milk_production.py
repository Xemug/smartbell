from sqlalchemy import Column, ForeignKey, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MilkProduction(Base):
    __tablename__ = "milk_productions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), index=True)
    amount_liters = Column(Float)
    fat_percentage = Column(Float, nullable=True)
    protein_percentage = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    herd_id = Column(Integer, ForeignKey("herds.id"))
    
    # Relationships
    herd = relationship("Herd", back_populates="milk_records")
