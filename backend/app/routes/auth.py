from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from pydantic import BaseModel
from datetime import timedelta
from app.database import get_database
from app.dependencies import get_current_user
from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    UserLogin,
    UserRegister,
    Token
)

class UserUpdate(BaseModel):
    partner_name: Optional[str] = None
    full_name: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    partner_name: Optional[str] = None

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    """Register a new user"""
    db = await get_database()
    users_collection = db["users"]
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "created_at": None,  # Will be set by MongoDB
        "is_active": True
    }
    
    # Insert user
    result = await users_collection.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    
    # Return token and user info
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": str(result.inserted_id),
            "email": user_data.email,
            "full_name": user_data.full_name
        }
    )

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login user and return access token"""
    db = await get_database()
    users_collection = db["users"]
    
    # Find user
    user = await users_collection.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    
    # Return token and user info
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"]
        }
    )

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserProfile)
async def read_users_me(email: str = Depends(get_current_user)):
    """Get current user profile"""
    db = await get_database()
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "partner_name": user.get("partner_name")
    }

@router.patch("/me", response_model=UserProfile)
async def update_user_me(user_update: UserUpdate, email: str = Depends(get_current_user)):
    """Update current user profile"""
    db = await get_database()
    
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        # If no data to update, just return current user
        user = await db["users"].find_one({"email": email})
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name"),
            "partner_name": user.get("partner_name")
        }
    
    await db["users"].update_one(
        {"email": email},
        {"$set": update_data}
    )
    
    updated_user = await db["users"].find_one({"email": email})
    return {
        "id": str(updated_user["_id"]),
        "email": updated_user["email"],
        "full_name": updated_user.get("full_name"),
        "partner_name": updated_user.get("partner_name")
    }
