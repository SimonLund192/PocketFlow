from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.database import goals_collection
from app.dependencies import get_current_user_id
from datetime import datetime, timezone
import uuid
from pymongo import UpdateOne

router = APIRouter()

class GoalItem(BaseModel):
    url: Optional[str] = None
    name: str
    amount: float

class GoalBase(BaseModel):
    name: str
    target_amount: float
    description: Optional[str] = None
    type: Optional[str] = "shared" # "shared" or "fun"
    items: Optional[List[GoalItem]] = []

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: str
    user_id: str
    current_amount: float
    achieved: bool
    priority: int
    created_at: datetime
    type: str # Return actual type
    items: List[GoalItem]
    
    class Config:
        populate_by_name = True

class GoalReorder(BaseModel):
    goal_ids: List[str]

class GoalUpdate(BaseModel):
    name: str
    target_amount: float
    description: Optional[str] = None
    type: Optional[str] = None
    items: Optional[List[GoalItem]] = None

@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(goal: GoalCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new goal for the logged-in user."""
    
    goal_type = goal.type or "shared"
    
    # Calculate total from items if provided, otherwise use target_amount
    items_list = [item.model_dump() for item in (goal.items or [])]
    calculated_target = sum(item["amount"] for item in items_list) if items_list else goal.target_amount

    # Calculate new priority (highest + 1) within the specific type
    match_query = {
        "user_id": user_id,
        "$or": [{"type": goal_type}]
    }
    if goal_type == "shared":
        match_query["$or"].append({"type": {"$exists": False}})

    highest_priority_goal = await goals_collection.find_one(
        match_query,
        sort=[("priority", -1)]
    )
    new_priority = (highest_priority_goal["priority"] + 1) if highest_priority_goal and "priority" in highest_priority_goal else 1

    new_goal = {
        "_id": str(uuid.uuid4()), # Using UUID for ID to match potential frontend string IDs
        "user_id": user_id,
        "name": goal.name,
        "target_amount": calculated_target,
        "current_amount": 0.0,
        "description": goal.description,
        "type": goal_type,
        "items": items_list,
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
        type=created_goal.get("type", "shared"),
        items=[GoalItem(**item) for item in created_goal.get("items", [])],
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
            type=goal.get("type", "shared"), # Default to shared
            items=[GoalItem(**item) for item in goal.get("items", [])],
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
async def update_goal(goal_id: str, goal: GoalUpdate, user_id: str = Depends(get_current_user_id)):
    """Update a goal for the logged-in user."""
    
    # Calculate total from items if provided
    update_fields = {
        "name": goal.name,
        "description": goal.description,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # If items are provided, calculate target_amount from them
    if goal.items is not None:
        items_list = [item.model_dump() for item in goal.items]
        calculated_target = sum(item["amount"] for item in items_list)
        update_fields["target_amount"] = calculated_target
        update_fields["items"] = items_list
    else:
        update_fields["target_amount"] = goal.target_amount
    
    # Only update type if provided to avoid overwriting existing type with default
    if goal.type is not None:
        update_fields["type"] = goal.type
    
    updated_goal = await goals_collection.find_one_and_update(
        {"_id": goal_id, "user_id": user_id},
        {"$set": update_fields},
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
        type=updated_goal.get("type", "shared"),
        items=[GoalItem(**item) for item in updated_goal.get("items", [])],
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
