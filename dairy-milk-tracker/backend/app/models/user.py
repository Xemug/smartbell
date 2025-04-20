from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True, default=None)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    membership_type = Column(String, default="free")  # free, annual, lifetime
    
    # Relationships
    herds = relationship("Herd", back_populates="owner", cascade="all, delete-orphan")
