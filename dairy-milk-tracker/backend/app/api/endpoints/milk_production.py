from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta

from app.auth import get_current_active_user
from app.database import get_db
from app.models.herd import Herd
from app.models.milk_production import MilkProduction
from app.models.user import User
from app.schemas.milk_production import (
    MilkProduction as MilkProductionSchema,
    MilkProductionCreate,
    MilkProductionStats,
)

router = APIRouter()


@router.post("/", response_model=MilkProductionSchema)
async def create_milk_production(
    milk_production: MilkProductionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Verify herd belongs to user
    result = await db.execute(
        select(Herd).where(
            Herd.id == milk_production.herd_id, Herd.user_id == current_user.id
        )
    )
    herd = result.scalars().first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")
    
    db_milk_production = MilkProduction(**milk_production.model_dump())
    db.add(db_milk_production)
    await db.commit()
    await db.refresh(db_milk_production)
    return db_milk_production


@router.get("/", response_model=List[MilkProductionSchema])
async def read_milk_productions(
    herd_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Base query joining milk production with herds to filter by user
    query = select(MilkProduction).join(Herd).where(Herd.user_id == current_user.id)
    
    # Filter by herd if specified
    if herd_id:
        query = query.where(MilkProduction.herd_id == herd_id)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    milk_productions = result.scalars().all()
    return milk_productions


@router.get("/stats", response_model=MilkProductionStats)
async def get_milk_production_stats(
    herd_id: int = None,
    time_span: str = None,  # 'week', 'month', 'year'
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Base query to filter by user's herds
    query = (
        select(
            func.sum(MilkProduction.amount_liters).label("total_liters"),
            func.count(MilkProduction.date.distinct()).label("days_recorded"),
        )
        .join(Herd)
        .where(Herd.user_id == current_user.id)
    )
    
    # Time filter
    if time_span:
        today = datetime.now().date()
        if time_span == "week":
            start_date = today - timedelta(days=7)
        elif time_span == "month":
            start_date = today - timedelta(days=30)
        elif time_span == "year":
            start_date = today - timedelta(days=365)
        else:
            start_date = None
            
        if start_date:
            query = query.where(MilkProduction.date >= start_date)
    
    # Filter by herd if specified
    herd = None
    if herd_id:
        # Verify herd belongs to user
        herd_result = await db.execute(
            select(Herd).where(Herd.id == herd_id, Herd.user_id == current_user.id)
        )
        herd = herd_result.scalars().first()
        if not herd:
            raise HTTPException(status_code=404, detail="Herd not found")
        
        query = query.where(MilkProduction.herd_id == herd_id)
    
    result = await db.execute(query)
    stats = result.fetchone()
    
    if not stats or stats.total_liters is None:
        return MilkProductionStats(total_liters=0, average_per_day=0, days_recorded=0, liters_per_cow=0)
    
    average_per_day = stats.total_liters / stats.days_recorded if stats.days_recorded > 0 else 0
    
    # Calculate liters per cow if herd is specified
    liters_per_cow = 0
    if herd and herd.cow_count > 0 and stats.days_recorded > 0:
        liters_per_cow = (stats.total_liters / stats.days_recorded) / herd.cow_count
    
    return MilkProductionStats(
        total_liters=stats.total_liters,
        average_per_day=average_per_day,
        days_recorded=stats.days_recorded,
        liters_per_cow=liters_per_cow
    )


@router.get("/{milk_production_id}", response_model=MilkProductionSchema)
async def read_milk_production(
    milk_production_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Query joining milk production with herds to filter by user
    result = await db.execute(
        select(MilkProduction)
        .join(Herd)
        .where(
            MilkProduction.id == milk_production_id, Herd.user_id == current_user.id
        )
    )
    milk_production = result.scalars().first()
    
    if milk_production is None:
        raise HTTPException(status_code=404, detail="Milk production record not found")
    
    return milk_production


@router.put("/{milk_production_id}", response_model=MilkProductionSchema)
async def update_milk_production(
    milk_production_id: int,
    milk_production: MilkProductionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        # Verify herd belongs to user
        herd_result = await db.execute(
            select(Herd).where(
                Herd.id == milk_production.herd_id, Herd.user_id == current_user.id
            )
        )
        herd = herd_result.scalars().first()
        if not herd:
            raise HTTPException(status_code=404, detail="Herd not found")
        
        # Get the existing milk production record
        record_result = await db.execute(
            select(MilkProduction)
            .join(Herd)
            .where(
                MilkProduction.id == milk_production_id, Herd.user_id == current_user.id
            )
        )
        db_milk_production = record_result.scalars().first()
        
        if db_milk_production is None:
            raise HTTPException(status_code=404, detail="Milk production record not found")
        
        # Update record attributes
        for key, value in milk_production.model_dump().items():
            setattr(db_milk_production, key, value)
        
        await db.commit()
        await db.refresh(db_milk_production)
        
        return db_milk_production
    
    except Exception as e:
        print(f"Error updating milk production: {str(e)}")
        raise


@router.delete("/{milk_production_id}", response_model=MilkProductionSchema)
async def delete_milk_production(
    milk_production_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Query joining milk production with herds to filter by user
    result = await db.execute(
        select(MilkProduction)
        .join(Herd)
        .where(
            MilkProduction.id == milk_production_id, Herd.user_id == current_user.id
        )
    )
    milk_production = result.scalars().first()
    
    if milk_production is None:
        raise HTTPException(status_code=404, detail="Milk production record not found")
    
    await db.delete(milk_production)
    await db.commit()
    
    return milk_production
