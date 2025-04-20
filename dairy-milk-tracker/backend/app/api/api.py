from fastapi import APIRouter

from app.api.endpoints import auth, herds, milk_production, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(herds.router, prefix="/herds", tags=["herds"])
api_router.include_router(
    milk_production.router, prefix="/milk-production", tags=["milk-production"]
)
