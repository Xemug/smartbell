from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_password_hash,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, User as UserSchema

router = APIRouter()


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )


@router.post("/register", response_model=UserSchema)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Check if user exists
        from sqlalchemy.future import select
        result = await db.execute(select(User).filter(User.email == user.email))
        db_user = result.scalars().first()
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )
        
        # Set default username to email if not provided
        username = user.username if user.username else user.email
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email, 
            hashed_password=hashed_password,
            username=username
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )
