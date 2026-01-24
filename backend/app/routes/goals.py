from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database import goals_collection
from app.dependencies import get_current_user_id
from datetime import datetime, timezone
import uuid
from pymongo import UpdateOne

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
    priority: int
    created_at: datetime
    
    class Config:
        populate_by_name = True

class GoalReorder(BaseModel):
    goal_ids: List[str]

@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(goal: GoalCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new goal for the logged-in user."""
    
    # Calculate new priority (highest + 1)
    highest_priority_goal = await goals_collection.find_one(
        {"user_id": user_id},
        sort=[("priority", -1)]
    )
    new_priority = (highest_priority_goal["priority"] + 1) if highest_priority_goal and "priority" in highest_priority_goal else 1

    new_goal = {
        "_id": str(uuid.uuid4()), # Using UUID for ID to match potential frontend string IDs
        "user_id": user_id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": 0.0,
        "description": goal.description,
        "achieved": False,
        "priority": new_priority,
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
        priority=created_goal.get("priority", 0),
        created_at=created_goal["created_at"]
    )

@router.get("", response_model=List[GoalResponse])
async def get_goals(user_id: str = Depends(get_current_user_id)):
    """Get all goals for the logged-in user."""
    goals = []
    # Sort by priority ascending
    async for goal in goals_collection.find({"user_id": user_id}).sort("priority", 1):
        goals.append(GoalResponse(
            id=str(goal["_id"]), # Ensure string ID
            user_id=goal["user_id"],
            name=goal["name"],
            target_amount=goal["target_amount"],
            current_amount=goal["current_amount"],
            description=goal.get("description"),
            achieved=goal["achieved"],
            priority=goal.get("priority", 0),
            created_at=goal["created_at"]
        ))
    return goals

@router.put("/reorder", status_code=204)
async def reorder_goals(reorder_data: GoalReorder, user_id: str = Depends(get_current_user_id)):
    """Reorder goals based on the list of IDs provided."""
    goal_ids = reorder_data.goal_ids
    operations = []
    
    for index, goal_id in enumerate(goal_ids):
        operations.append(
            UpdateOne(
                {"_id": goal_id, "user_id": user_id}, 
                {"$set": {"priority": index + 1}}
            )
        )
    
    if operations:
        await goals_collection.bulk_write(operations)

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, goal: GoalBase, user_id: str = Depends(get_current_user_id)):
    """Update a goal for the logged-in user."""
    
    updated_goal = await goals_collection.find_one_and_update(
        {"_id": goal_id, "user_id": user_id},
        {"$set": {
            "name": goal.name,
            "target_amount": goal.target_amount,
            "description": goal.description,
            "updated_at": datetime.now(timezone.utc)
        }},
        return_document=True
    )
    
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    return GoalResponse(
        id=updated_goal["_id"],
        user_id=updated_goal["user_id"],
        name=updated_goal["name"],
        target_amount=updated_goal["target_amount"],
        current_amount=updated_goal["current_amount"],
        description=updated_goal.get("description"),
        achieved=updated_goal["achieved"],
        priority=updated_goal.get("priority", 0),
        created_at=updated_goal["created_at"]
    )

@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a goal for the logged-in user."""
    
    result = await goals_collection.delete_one({"_id": goal_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return None
