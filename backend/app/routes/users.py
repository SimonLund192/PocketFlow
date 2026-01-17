from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException, status

from app.auth import get_password_hash
from app.database import get_database
from app.models import UserCreate, UserResponse

router = APIRouter()


def _user_response_helper(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"],
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users():
    """Dev-only: list users.

    The app currently doesn't enforce auth end-to-end, so this endpoint exists
    to support local development and the dev user switcher.
    """

    db = get_database()
    users: List[UserResponse] = []
    async for user in db.users.find({}).sort("created_at", -1):
        users.append(_user_response_helper(user))
    return users


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate):
    """Dev-only: create a user.

    Note: This reuses the same schema as auth registration and hashes the
    password, but does not return the password hash.
    """

    db = get_database()

    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "created_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_dict)
    new_user = await db.users.find_one({"_id": result.inserted_id})

    return _user_response_helper(new_user)
