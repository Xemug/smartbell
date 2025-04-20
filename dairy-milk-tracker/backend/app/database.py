from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import os

# Ensuring an absolute path for the database file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'dairy_milk_tracker.db')
SQLALCHEMY_DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

print(f"Database URL: {SQLALCHEMY_DATABASE_URL}")

# Create engine with connection pool settings
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    # Add connection pool settings for better stability
    pool_size=5,  # Default number of connections
    max_overflow=10,  # Maximum number of connections to create above pool_size
    pool_timeout=30,  # Seconds to wait before giving up obtaining a connection 
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True  # Verify connection validity before using it
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine, 
    class_=AsyncSession,
    expire_on_commit=False  # Prevent detached instance errors
)

Base = declarative_base()


async def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        await db.close()
