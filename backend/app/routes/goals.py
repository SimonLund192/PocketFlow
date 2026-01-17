from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import UserContext, get_user_context
from app.database import get_database
from app.models import Goal

router = APIRouter(prefix="/goals")


def _serialize_goal(goal) -> dict:
    goal["id"] = str(goal.pop("_id"))
    return goal


@router.get("", response_model=List[Goal])
async def get_goals(ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    goals = []
    async for goal in db.goals.find({"user_id": ctx.user_id}):
        goals.append(_serialize_goal(goal))

    return goals


@router.post("", response_model=Goal)
async def create_goal(goal: Goal, ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    goal_dict = goal.model_dump(exclude={"id"}, exclude_none=True)
    goal_dict["user_id"] = ctx.user_id

    result = await db.goals.insert_one(goal_dict)

    created = await db.goals.find_one({"_id": result.inserted_id})
    return _serialize_goal(created)


@router.put("/{goal_id}", response_model=Goal)
async def update_goal(
    goal_id: str,
    goal: Goal,
    ctx: UserContext = Depends(get_user_context),
):
    db = get_database()

    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    update = goal.model_dump(exclude={"id"}, exclude_none=True)

    result = await db.goals.update_one(
        {"_id": ObjectId(goal_id), "user_id": ctx.user_id},
        {"$set": update},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")

    updated = await db.goals.find_one({"_id": ObjectId(goal_id), "user_id": ctx.user_id})
    return _serialize_goal(updated)


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    result = await db.goals.delete_one({"_id": ObjectId(goal_id), "user_id": ctx.user_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")

    return {"message": "Goal deleted"}
