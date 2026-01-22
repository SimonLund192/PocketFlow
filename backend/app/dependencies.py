from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.security import verify_token
from app.database import database

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to get current user from JWT token
    Returns user email
    """
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data is None or token_data.email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token_data.email


async def get_current_user_id(current_user_email: str = Depends(get_current_user)) -> str:
    """
    Dependency to get current user's User_ID from their email.
    This is the logged-in User_ID that owns all data (categories, budgets, etc.)
    
    Returns:
        User_ID (string representation of MongoDB _id)
    """
    users_collection = database["users"]
    user = await users_collection.find_one({"email": current_user_email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return str(user["_id"])
