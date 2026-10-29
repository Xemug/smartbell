from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3

from app.api.api import api_router
from app.database import Base, engine

app = FastAPI(title="Dairy Milk Tracker API")

# Set up CORS
# Allow the React dev server on any local port: `npm start` moves to 3001, 3002, ...
# when 3000 is already taken, and a fixed list then blocks every API call (including login).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
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
            # Import and run the fix_database script to handle all necessary migrations
            import sys
            sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from fix_database import check_and_fix_database
            
            print("Running database migration checks...")
            # Run the database fix function in a non-interactive mode
            check_and_fix_database(interactive=False)
            print("Database schema verification complete")
            
    except Exception as e:
        print(f"Warning: Error checking database schema: {str(e)}")
        print("If you encounter database issues, run 'python fix_database.py' manually")
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
