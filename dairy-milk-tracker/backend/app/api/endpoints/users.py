from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.auth import get_current_active_user, get_password_hash
from app.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/profile", response_model=UserSchema)
async def update_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        # Update username if provided
        if user_data.username is not None:
            # Check if username already exists
            if user_data.username != current_user.username:
                result = await db.execute(select(User).where(User.username == user_data.username))
                existing_user = result.scalars().first()
                if existing_user:
                    raise HTTPException(status_code=400, detail="Username already in use")
            current_user.username = user_data.username
        
        # Update email if provided
        if user_data.email is not None:
            # Check if email already exists
            if user_data.email != current_user.email:
                result = await db.execute(select(User).where(User.email == user_data.email))
                existing_user = result.scalars().first()
                if existing_user:
                    raise HTTPException(status_code=400, detail="Email already in use")
            current_user.email = user_data.email
        
        # Update password if provided
        if user_data.password is not None and user_data.password.strip():
            current_user.hashed_password = get_password_hash(user_data.password)
        
        await db.commit()
        await db.refresh(current_user)
        
        return current_user
    except Exception as e:
        print(f"Error updating user profile: {str(e)}")
        raise


@router.put("/membership", response_model=UserSchema)
async def update_membership(
    membership_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Validate membership type
    valid_memberships = ["free", "annual", "lifetime"]
    if membership_type not in valid_memberships:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid membership type. Must be one of: {', '.join(valid_memberships)}",
        )
    
    # Update user membership
    current_user.membership_type = membership_type
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.delete("/", response_model=dict)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        await db.delete(current_user)
        await db.commit()
        return {"detail": "User account deleted successfully"}
    except Exception as e:
        print(f"Error deleting user account: {str(e)}")
        raise
