from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth import get_current_active_user
from app.database import get_db
from app.models.herd import Herd
from app.models.user import User
from app.schemas.herd import Herd as HerdSchema, HerdCreate

router = APIRouter()


@router.post("/", response_model=HerdSchema)
async def create_herd(
    herd: HerdCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db_herd = Herd(**herd.model_dump(), user_id=current_user.id)
    db.add(db_herd)
    await db.commit()
    await db.refresh(db_herd)
    return db_herd


@router.get("/", response_model=List[HerdSchema])
async def read_herds(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Herd)
        .where(Herd.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    herds = result.scalars().all()
    return herds


@router.get("/{herd_id}", response_model=HerdSchema)
async def read_herd(
    herd_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Herd).where(Herd.id == herd_id, Herd.user_id == current_user.id)
    )
    herd = result.scalars().first()
    if herd is None:
        raise HTTPException(status_code=404, detail="Herd not found")
    return herd


@router.put("/{herd_id}", response_model=HerdSchema)
async def update_herd(
    herd_id: int,
    herd: HerdCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Herd).where(Herd.id == herd_id, Herd.user_id == current_user.id)
    )
    db_herd = result.scalars().first()
    if db_herd is None:
        raise HTTPException(status_code=404, detail="Herd not found")
    
    # Update herd attributes
    for key, value in herd.model_dump().items():
        setattr(db_herd, key, value)
    
    await db.commit()
    await db.refresh(db_herd)
    return db_herd


@router.delete("/{herd_id}", response_model=HerdSchema)
async def delete_herd(
    herd_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Herd).where(Herd.id == herd_id, Herd.user_id == current_user.id)
    )
    db_herd = result.scalars().first()
    if db_herd is None:
        raise HTTPException(status_code=404, detail="Herd not found")
    
    await db.delete(db_herd)
    await db.commit()
    return db_herd
