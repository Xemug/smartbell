from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3

from app.api.api import api_router
from app.database import Base, engine

app = FastAPI(title="Dairy Milk Tracker API")

# Set up CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # React default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


async def ensure_columns_exist():
    """Make sure all necessary columns exist in the database"""
    try:
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dairy_milk_tracker.db')
        
        # Only run if database already exists
        if os.path.exists(db_path):
            # Connect directly to SQLite to add columns if they don't exist
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check users table for username column
            cursor.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'username' not in columns:
                print("Adding username column to users table")
                cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
            
            # Check herds table for location columns
            cursor.execute("PRAGMA table_info(herds)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'location_line1' not in columns:
                print("Adding location_line1 column to herds table")
                cursor.execute("ALTER TABLE herds ADD COLUMN location_line1 TEXT")
            
            if 'location_line2' not in columns:
                print("Adding location_line2 column to herds table")
                cursor.execute("ALTER TABLE herds ADD COLUMN location_line2 TEXT")
            
            conn.commit()
            conn.close()
            print("Database schema updated successfully")
            
    except Exception as e:
        print(f"Warning: Error updating database schema: {str(e)}")
        # Continue anyway - tables will be created by SQLAlchemy if missing


@app.on_event("startup")
async def startup():
    # First ensure columns exist in the database
    await ensure_columns_exist()
    
    # Then create tables if they don't exist
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database tables created successfully")


@app.get("/")
async def root():
    return {"message": "Welcome to the Dairy Milk Tracker API"}
