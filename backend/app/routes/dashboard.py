from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends

from app.auth import UserContext, get_user_context
from app.database import get_database
from app.models import DashboardStats, ExpenseBreakdown

router = APIRouter(prefix="/dashboard")


async def _get_user_transactions(db, user_id: str):
    transactions = []
    async for transaction in db.transactions.find({"user_id": user_id}):
        transactions.append(transaction)
    return transactions


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)

    all_transactions = await _get_user_transactions(db, ctx.user_id)

    this_month_transactions = [t for t in all_transactions if t["date"] >= start_of_month]

    period_income = sum(
        t["amount"] for t in this_month_transactions if t["type"] == "income"
    )

    shared_expenses = sum(
        t["amount"]
        for t in this_month_transactions
        if t["type"] == "expense"
        and t["category"] in ["Rent", "Utilities", "Groceries", "Household"]
    )

    personal_expenses = sum(
        t["amount"]
        for t in this_month_transactions
        if t["type"] == "expense"
        and t["category"]
        in ["Personal Food", "Transport", "Entertainment", "Shopping", "Healthcare"]
    )

    total_savings = sum(
        t["amount"]
        for t in this_month_transactions
        if t["type"] == "expense" and t["category"] == "Shared Savings"
    )

    total_expenses = shared_expenses + personal_expenses + total_savings
    net_income = period_income - total_expenses

    last_month_transactions = [
        t for t in all_transactions if start_of_last_month <= t["date"] < start_of_month
    ]

    last_month_income = sum(
        t["amount"] for t in last_month_transactions if t["type"] == "income"
    )
    last_month_expenses = sum(
        t["amount"] for t in last_month_transactions if t["type"] == "expense"
    )
    last_month_net_income = last_month_income - last_month_expenses

    if last_month_net_income != 0:
        period_change_percentage = (
            (net_income - last_month_net_income) / abs(last_month_net_income)
        ) * 100
    else:
        period_change_percentage = 0 if net_income == 0 else 100

    return DashboardStats(
        net_income=net_income,
        total_savings=total_savings,
        total_expenses=total_expenses,
        goals_achieved=0,
        period_change_percentage=period_change_percentage,
        last_month_net_income=last_month_net_income,
    )


@router.get("/expense-breakdown", response_model=List[ExpenseBreakdown])
async def get_expense_breakdown(ctx: UserContext = Depends(get_user_context)):
    db = get_database()

    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    expenses = []
    async for transaction in db.transactions.find(
        {
            "user_id": ctx.user_id,
            "type": "expense",
            "date": {"$gte": start_of_month},
        }
    ):
        expenses.append(transaction)

    category_totals = {}
    total_expenses = 0

    for expense in expenses:
        category = expense["category"]
        amount = expense["amount"]
        category_totals[category] = category_totals.get(category, 0) + amount
        total_expenses += amount

    breakdown: List[ExpenseBreakdown] = []
    for category, amount in category_totals.items():
        percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
        breakdown.append(
            ExpenseBreakdown(category=category, amount=amount, percentage=percentage)
        )

    breakdown.sort(key=lambda x: x.amount, reverse=True)
    return breakdown
