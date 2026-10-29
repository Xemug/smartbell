import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.database import Base, get_db
from app.auth import get_password_hash
from app.models.user import User


@pytest.fixture
def test_db(tmp_path):
    # Use a throwaway SQLite file per test: an in-memory aiosqlite database is not
    # shared between connections, and TestClient runs requests on its own event loop.
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'test.db'}", poolclass=NullPool
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )

    async def setup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # Create a test user
        async with TestingSessionLocal() as session:
            session.add(
                User(
                    email="test@example.com",
                    hashed_password=get_password_hash("password123"),
                    is_active=True,
                )
            )
            await session.commit()

    asyncio.run(setup())

    # Override the get_db dependency in the app
    async def override_get_db():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    asyncio.run(engine.dispose())


@pytest.fixture
def client(test_db):
    with TestClient(app) as c:
        yield c


def test_create_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@example.com"
    assert "id" in data


def test_login(client):
    # Authenticate and get access token
    response = client.post(
        "/api/auth/token",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_returns_401(client):
    response = client.post(
        "/api/auth/token",
        data={"username": "test@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


@pytest.mark.parametrize("port", [3000, 3001, 3002])
def test_login_cors_allows_any_local_dev_port(client, port):
    # npm start falls back to 3001, 3002, ... when 3000 is taken
    origin = f"http://localhost:{port}"
    preflight = client.options(
        "/api/auth/token",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
    )
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == origin

    response = client.post(
        "/api/auth/token",
        data={"username": "test@example.com", "password": "password123"},
        headers={"Origin": origin},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_rejects_non_local_origin(client):
    response = client.options(
        "/api/auth/token",
        headers={"Origin": "http://evil.example.com", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in response.headers


def test_create_herd(client):
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


def test_create_milk_production(client):
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
