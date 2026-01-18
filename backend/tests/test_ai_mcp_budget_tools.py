import pytest

from bson import ObjectId

from app.ai.mcp import default_registry
from app.auth import UserContext
from app.database import get_database


@pytest.mark.asyncio
async def test_mcp_create_transaction_is_user_scoped() -> None:
    registry = default_registry()
    db = get_database()

    ctx_a = UserContext(user_id="user-a")
    ctx_b = UserContext(user_id="user-b")

    created = await registry.execute(
        ctx=ctx_a,
        tool_name="create_transaction",
        arguments={
            "type": "expense",
            "category": "Groceries",
            "amount": 12.5,
            "description": "Apples",
        },
    )

    assert created["type"] == "expense"
    assert created["category"] == "Groceries"

    # Only A should see it
    docs_a = await db.transactions.find({"user_id": "user-a"}).to_list(length=50)
    docs_b = await db.transactions.find({"user_id": "user-b"}).to_list(length=50)
    assert len(docs_a) == 1
    assert len(docs_b) == 0


@pytest.mark.asyncio
async def test_mcp_create_savings_entry_creates_expense_transaction() -> None:
    registry = default_registry()
    db = get_database()

    ctx = UserContext(user_id="user-a")

    created = await registry.execute(
        ctx=ctx,
        tool_name="create_savings_entry",
        arguments={
            "amount": 99.0,
            "kind": "personal",
            "description": "Emergency fund",
        },
    )

    assert created["type"] == "expense"
    assert created["category"] == "Personal Savings"
    assert created["amount"] == 99.0

    doc = await db.transactions.find_one(
        {"user_id": "user-a", "category": "Personal Savings"}
    )
    assert doc is not None


@pytest.mark.asyncio
async def test_mcp_create_budget_entry_upserts_into_existing_budget_shape() -> None:
    registry = default_registry()
    db = get_database()

    ctx = UserContext(user_id="user-a")

    # Create an initial budget doc matching the existing budget route shape.
    await db.budgets.insert_one(
        {
            "month": "2026-01",
            "user_id": "user-a",
            "income_user1": [],
            "income_user2": [],
            "shared_expenses": [],
            "personal_user1": [],
            "personal_user2": [],
            "shared_savings": [],
            "personal_savings_user1": [],
            "personal_savings_user2": [],
        }
    )

    item = {
        "id": "1",
        "name": "Food",
        "category": "Groceries",
        "value": 250.0,
    }

    res = await registry.execute(
        ctx=ctx,
        tool_name="create_budget_entry",
        arguments={
            "month": "2026-01",
            "bucket": "shared_expenses",
            "item": item,
        },
    )

    assert res["bucket"] == "shared_expenses"
    assert res["item"]["id"] == "1"

    doc = await db.budgets.find_one({"month": "2026-01", "user_id": "user-a"})
    assert doc is not None
    assert len(doc["shared_expenses"]) == 1
    assert doc["shared_expenses"][0]["value"] == 250.0


@pytest.mark.asyncio
async def test_mcp_create_goal_update_is_user_scoped() -> None:
    registry = default_registry()
    db = get_database()

    # Goal belongs to user-b
    goal_id = ObjectId()
    await db.goals.insert_one(
        {
            "_id": goal_id,
            "user_id": "user-b",
            "name": "B goal",
            "saved": 0.0,
            "target": 100.0,
            "percentage": 0.0,
            "color": "bg-green-500",
            "order": 0,
        }
    )

    # User-a cannot update it
    ctx_a = UserContext(user_id="user-a")
    with pytest.raises(Exception):
        await registry.execute(
            ctx=ctx_a,
            tool_name="create_goal_update",
            arguments={
                "goal_id": str(goal_id),
                "update": {"saved": 50.0},
            },
        )

    # User-b can
    ctx_b = UserContext(user_id="user-b")
    updated = await registry.execute(
        ctx=ctx_b,
        tool_name="create_goal_update",
        arguments={
            "goal_id": str(goal_id),
            "update": {"saved": 50.0},
        },
    )

    assert updated["id"] == str(goal_id)
    assert updated["saved"] == 50.0


@pytest.mark.asyncio
async def test_mcp_create_transaction_rejects_invalid_amount() -> None:
    registry = default_registry()
    ctx = UserContext(user_id="user-a")

    with pytest.raises(Exception):
        await registry.execute(
            ctx=ctx,
            tool_name="create_transaction",
            arguments={
                "type": "expense",
                "category": "Groceries",
                "amount": -1,
            },
        )
