from datetime import datetime

from fastapi import APIRouter, Depends

from app.auth import UserContext, get_user_context
from app.database import get_database
from app.models import Budget, BudgetMonth

router = APIRouter(prefix="/budget")


@router.get("/{month}")
async def get_budget(month: str, ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    budget = await db.budgets.find_one({"month": month, "user_id": ctx.user_id})
    if budget:
        budget["id"] = str(budget.pop("_id"))
        return budget

    return BudgetMonth(month=month, categories=[])


@router.post("/{month}")
async def save_budget(
    month: str,
    budget: Budget,
    ctx: UserContext = Depends(get_user_context),
):
    db = get_database()

    budget_dict = budget.model_dump()
    budget_dict["month"] = month
    budget_dict["user_id"] = ctx.user_id

    await db.budgets.update_one(
        {"month": month, "user_id": ctx.user_id},
        {"$set": budget_dict},
        upsert=True,
    )

    return {"message": "Budget saved successfully"}


@router.get("/lifetime/stats")
async def get_lifetime_budget_stats(ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    budgets = []
    async for budget in db.budgets.find({"user_id": ctx.user_id}):
        budgets.append(budget)

    total_budgeted = sum(
        category["budget"]
        for budget in budgets
        for category in budget.get("categories", [])
    )

    return {"total_budgeted": total_budgeted, "months_count": len(budgets)}


@router.get("/monthly/stats")
async def get_monthly_budget_stats(
    month: str = datetime.utcnow().strftime("%Y-%m"),
    ctx: UserContext = Depends(get_user_context),
):
    db = get_database()

    budget = await db.budgets.find_one({"month": month, "user_id": ctx.user_id})
    if not budget:
        return {"month": month, "total_budget": 0, "categories_count": 0}

    total_budget = sum(category["budget"] for category in budget.get("categories", []))

    return {
        "month": month,
        "total_budget": total_budget,
        "categories_count": len(budget.get("categories", [])),
    }
