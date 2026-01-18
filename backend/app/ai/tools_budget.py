from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Mapping, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.auth import UserContext
from app.database import get_database
from app.models import (
    BudgetBucket,
    McpCreateBudgetEntryInput,
    McpCreateGoalUpdateInput,
    McpCreateSavingsEntryInput,
    McpCreateTransactionInput,
    SavingsKind,
    TransactionCreate,
    TransactionType,
    TransactionCategory,
)


def _validate(model_cls, arguments: Mapping[str, Any]):
    try:
        return model_cls.model_validate(arguments)
    except ValidationError as e:
        # Tools are internal (not routes), but we still want the same consistent
        # status codes and structured errors that FastAPI uses.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors(),
        )


def _serialize_transaction(transaction: dict) -> dict:
    return {
        "_id": str(transaction["_id"]),
        "type": transaction["type"],
        "category": transaction["category"],
        "amount": transaction["amount"],
        "description": transaction.get("description"),
        "date": transaction.get("date"),
    }


async def tool_create_transaction(ctx: UserContext, args: Dict[str, Any]) -> dict:
    """MCP tool: create_transaction.

    Reuses the same insert behavior as the `/transactions` route:
    - stores `user_id`
    - defaults `date` if missing
    """

    inp = _validate(McpCreateTransactionInput, args)

    db = get_database()

    # Store the exact schema the routes use.
    transaction_dict = TransactionCreate(
        type=inp.type,
        category=inp.category,
        amount=inp.amount,
        description=inp.description,
        date=inp.date,
    ).model_dump()

    transaction_dict["user_id"] = ctx.user_id
    if transaction_dict.get("date") is None:
        transaction_dict["date"] = datetime.utcnow()

    result = await db.transactions.insert_one(transaction_dict)
    created = await db.transactions.find_one({"_id": result.inserted_id})
    return _serialize_transaction(created)


async def tool_create_savings_entry(ctx: UserContext, args: Dict[str, Any]) -> dict:
    """MCP tool: create_savings_entry.

    Savings are represented as expense transactions with specific categories.
    This makes the entry compatible with dashboard aggregation logic.
    """

    inp = _validate(McpCreateSavingsEntryInput, args)

    category = (
        TransactionCategory.SHARED_SAVINGS
        if inp.kind == SavingsKind.SHARED
        else TransactionCategory.PERSONAL_SAVINGS
    )

    return await tool_create_transaction(
        ctx,
        {
            "type": TransactionType.EXPENSE,
            "category": category,
            "amount": inp.amount,
            "description": inp.description,
            "date": inp.date,
        },
    )


async def tool_create_budget_entry(ctx: UserContext, args: Dict[str, Any]) -> dict:
    """MCP tool: create_budget_entry.

    Reuses the existing budget approach: a per-user, per-month document that
    stores eight arrays of `BudgetItem`.

    This tool upserts a single item into one bucket (array), keyed by item.id.
    """

    inp = _validate(McpCreateBudgetEntryInput, args)

    db = get_database()

    key = {"month": inp.month, "user_id": ctx.user_id}
    existing = await db.budgets.find_one(key)

    # Initialize an empty budget shape if needed.
    if existing is None:
        existing = {
            "month": inp.month,
            "user_id": ctx.user_id,
            "income_user1": [],
            "income_user2": [],
            "shared_expenses": [],
            "personal_user1": [],
            "personal_user2": [],
            "shared_savings": [],
            "personal_savings_user1": [],
            "personal_savings_user2": [],
        }

    bucket_name = inp.bucket.value
    bucket: List[dict] = list(existing.get(bucket_name) or [])

    new_item = inp.item.model_dump()

    replaced = False
    for idx, existing_item in enumerate(bucket):
        if existing_item.get("id") == new_item.get("id"):
            bucket[idx] = new_item
            replaced = True
            break

    if not replaced:
        bucket.append(new_item)

    existing[bucket_name] = bucket

    # Preserve the same keys as the route's upsert path.
    await db.budgets.update_one(key, {"$set": existing}, upsert=True)

    return {
        "month": inp.month,
        "user_id": ctx.user_id,
        "bucket": bucket_name,
        "item": new_item,
        "replaced": replaced,
    }


async def tool_create_goal_update(ctx: UserContext, args: Dict[str, Any]) -> dict:
    """MCP tool: create_goal_update.

    Mirrors the goals update route behavior:
    - validates goal ObjectId
    - scopes update by `user_id`
    """

    inp = _validate(McpCreateGoalUpdateInput, args)

    if not ObjectId.is_valid(inp.goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    update_dict = inp.update.model_dump(exclude_none=True)
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update",
        )

    db = get_database()

    result = await db.goals.update_one(
        {"_id": ObjectId(inp.goal_id), "user_id": ctx.user_id},
        {"$set": update_dict},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")

    updated = await db.goals.find_one(
        {"_id": ObjectId(inp.goal_id), "user_id": ctx.user_id}
    )

    # Align with goals route serialization.
    updated["id"] = str(updated.pop("_id"))
    return updated
