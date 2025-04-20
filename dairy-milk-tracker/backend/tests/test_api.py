import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
import asyncio

from app.main import app
from app.database import Base, get_db
from app.auth import get_password_hash
from app.models.user import User

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


# Create a dependency that will override the original get_db dependency
async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


# Override the get_db dependency in the app
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def test_db():
    # Create the database and tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create a test user
    async with TestingSessionLocal() as session:
        test_user = User(
            email="test@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        session.add(test_user)
        await session.commit()
    
    yield
    
    # Drop all tables after the test is complete
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.mark.asyncio
async def test_create_user(client, test_db):
    response = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_login(client, test_db):
    # Authenticate and get access token
    response = client.post(
        "/api/auth/token",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_create_herd(client, test_db):
    # First login to get token
    response = client.post(
        "/api/auth/token",
        data={"username": "test@example.com", "password": "password123"},
    )
    token = response.json()["access_token"]
    
    # Create a herd
    response = client.post(
        "/api/herds/",
        json={"name": "Test Herd", "cow_count": 10},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Herd"
    assert data["cow_count"] == 10
    assert "id" in data


@pytest.mark.asyncio
async def test_create_milk_production(client, test_db):
    # First login to get token
    response = client.post(
        "/api/auth/token",
        data={"username": "test@example.com", "password": "password123"},
    )
    token = response.json()["access_token"]
    
    # Create a herd
    response = client.post(
        "/api/herds/",
        json={"name": "Test Herd", "cow_count": 10},
        headers={"Authorization": f"Bearer {token}"},
    )
    herd_id = response.json()["id"]
    
    # Create a milk production record
    response = client.post(
        "/api/milk-production/",
        json={
            "herd_id": herd_id,
            "date": "2025-04-19T10:00:00Z",
            "amount_liters": 150.5,
            "fat_percentage": 3.5,
            "protein_percentage": 3.2,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["herd_id"] == herd_id
    assert data["amount_liters"] == 150.5
    assert data["fat_percentage"] == 3.5
