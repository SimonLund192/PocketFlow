from fastapi import APIRouter, Depends
from typing import List
from app.models import DashboardStats, BalanceTrend, ExpenseBreakdown
from app.database import transactions_collection, goals_collection, budget_line_items_collection, categories_collection, budgets_collection
from app.dependencies import get_current_user_id
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    """Get dashboard statistics - calculates from specific budget (current month)"""
    # Get current month in YYYY-MM format
    current_month_str = datetime.now().strftime("%Y-%m")
    
    # Try to find budget for current month first
    budget = await budgets_collection.find_one({
        "month": current_month_str,
        "user_id": user_id
    })
    
    total_income = 0
    shared_expenses = 0
    personal_expenses = 0  # user1 + user2 expenses
    total_savings = 0
    
    # Only calculate stats if budget exists for this month
    if budget:
        budget_id = budget["_id"]
        
        # Get budget line items for THIS budget only
        async for item in budget_line_items_collection.find({"budget_id": budget_id}):
            category = await categories_collection.find_one({"_id": item["category_id"]})
            
            if category:
                category_type = category.get("type")
                amount = item.get("amount", 0)
                owner_slot = item.get("owner_slot", "")
                
                if category_type == "income":
                    total_income += amount
                elif category_type == "expense":
                    if owner_slot == "shared":
                        shared_expenses += amount
                    elif owner_slot in ["user1", "user2"]:
                        personal_expenses += amount
                elif category_type == "savings":
                    total_savings += amount
                # Note: "fun" category is not included in NET INCOME calculation
    
    # NET INCOME = Total Income - Shared Expenses - Personal Expenses
    net_income = total_income - shared_expenses - personal_expenses
    
    # Count achieved goals
    goals_achieved = await goals_collection.count_documents({"achieved": True})
    
    return DashboardStats(
        net_income=net_income,
        savings=total_savings,
        expenses=shared_expenses + personal_expenses,
        goals_achieved=goals_achieved,
        income_change=0.0,
        savings_change=0.0,
        expenses_change=0.0
    )


@router.get("/balance-trends", response_model=List[BalanceTrend])
async def get_balance_trends():
    """Get balance trends for chart"""
    trends = []
    
    # Generate sample data for the last 14 months
    now = datetime.now()
    personal_base = 4000
    shared_base = 8000
    
    for i in range(14):
        month_date = now - timedelta(days=30 * (13 - i))
        month_str = month_date.strftime("%b. %Y")
        
        trends.append(BalanceTrend(
            month=month_str,
            personal=personal_base + (i * 500),
            shared=shared_base + (i * 500) if i < 12 else shared_base + (i * 1000)
        ))
    
    return trends


@router.get("/expense-breakdown", response_model=List[ExpenseBreakdown])
async def get_expense_breakdown():
    """Get expense breakdown by category"""
    # Calculate expenses by category for current month
    now = datetime.now()
    first_day = datetime(now.year, now.month, 1)
    
    pipeline = [
        {"$match": {"type": "expense", "date": {"$gte": first_day}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    
    category_totals = {}
    total_expenses = 0
    
    async for result in transactions_collection.aggregate(pipeline):
        category_totals[result["_id"]] = result["total"]
        total_expenses += result["total"]
    
    # Calculate percentages
    breakdown = []
    for category, amount in category_totals.items():
        percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
        breakdown.append(ExpenseBreakdown(
            category=category,
            amount=amount,
            percentage=round(percentage, 1)
        ))
    
    return sorted(breakdown, key=lambda x: x.amount, reverse=True)
