from fastapi import APIRouter
from typing import List
from app.models import DashboardStats, BalanceTrend, ExpenseBreakdown
from app.database import transactions_collection, goals_collection
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    # Calculate current month stats
    now = datetime.now()
    first_day_current = datetime(now.year, now.month, 1)
    
    # Get current month transactions
    current_income = 0
    current_expenses = 0
    current_savings = 0
    
    async for transaction in transactions_collection.find({"date": {"$gte": first_day_current}}):
        if transaction["type"] == "income":
            current_income += transaction["amount"]
        elif transaction["type"] == "expense":
            current_expenses += transaction["amount"]
        elif transaction["type"] == "savings":
            current_savings += transaction["amount"]
    
    net_income = current_income - current_expenses
    
    # Count achieved goals
    goals_achieved = await goals_collection.count_documents({"achieved": True})
    
    return DashboardStats(
        net_income=net_income,
        savings=current_savings,
        expenses=current_expenses,
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
