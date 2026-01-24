from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database import goals_collection
from app.dependencies import get_current_user_id
from datetime import datetime, timezone
import uuid

router = APIRouter()

class GoalBase(BaseModel):
    name: str
    target_amount: float
    description: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: str
    user_id: str
    current_amount: float
    achieved: bool
    created_at: datetime
    
    class Config:
        populate_by_name = True

@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(goal: GoalCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new goal for the logged-in user."""
    
    new_goal = {
        "_id": str(uuid.uuid4()), # Using UUID for ID to match potential frontend string IDs
        "user_id": user_id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": 0.0,
        "description": goal.description,
        "achieved": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await goals_collection.insert_one(new_goal)
    created_goal = await goals_collection.find_one({"_id": result.inserted_id})
    
    if not created_goal:
        raise HTTPException(status_code=500, detail="Failed to create goal")
        
    return GoalResponse(
        id=created_goal["_id"],
        user_id=created_goal["user_id"],
        name=created_goal["name"],
        target_amount=created_goal["target_amount"],
        current_amount=created_goal["current_amount"],
        description=created_goal.get("description"),
        achieved=created_goal["achieved"],
        created_at=created_goal["created_at"]
    )

@router.get("", response_model=List[GoalResponse])
async def get_goals(user_id: str = Depends(get_current_user_id)):
    """Get all goals for the logged-in user."""
    goals = []
    async for goal in goals_collection.find({"user_id": user_id}):
        goals.append(GoalResponse(
            id=str(goal["_id"]), # Ensure string ID
            user_id=goal["user_id"],
            name=goal["name"],
            target_amount=goal["target_amount"],
            current_amount=goal["current_amount"],
            description=goal.get("description"),
            achieved=goal["achieved"],
            created_at=goal["created_at"]
        ))
    return goals
