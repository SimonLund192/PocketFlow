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
    total_expenses = 0
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
                    # Sum of Shared Expenses and Personal Expenses
                    if owner_slot in ["shared", "user1", "user2"]:
                        total_expenses += amount
                elif category_type == "savings":
                    # Only include Shared Savings
                    if owner_slot == "shared":
                        total_savings += amount
                elif category_type == "fun":
                    # Include all Fun
                    total_savings += amount
    
    # NET INCOME = Total Income - Total Expenses
    net_income = total_income - total_expenses
    
    # Calculate lifetime shared savings for goal achievement calculation
    pipeline = [
        # 1. Match budgets for this user
        {"$match": {"user_id": user_id}},
        # 2. Lookup line items
        {
            "$lookup": {
                "from": "budget_line_items",
                "localField": "_id",
                "foreignField": "budget_id",
                "as": "items"
            }
        },
        # 3. Unwind items
        {"$unwind": "$items"},
        # 4. Lookup category for each item
        {
            "$lookup": {
                "from": "categories",
                "localField": "items.category_id",
                "foreignField": "_id",
                "as": "category"
            }
        },
        # 5. Unwind category (should be 1:1)
        {"$unwind": "$category"},
        # 6. Filter for Shared Savings
        {
            "$match": {
                "category.type": "savings",
                "items.owner_slot": "shared"
            }
        },
        # 7. Sum amount
        {
            "$group": {
                "_id": None,
                "total_shared_savings": {"$sum": "$items.amount"}
            }
        }
    ]
    
    aggregation_result = await budgets_collection.aggregate(pipeline).to_list(length=1)
    lifetime_shared_savings = aggregation_result[0]["total_shared_savings"] if aggregation_result else 0.0
    
    # Calculate achieved goals based on hierarchy
    goals_achieved_count = 0
    remaining_savings = lifetime_shared_savings
    
    # Get all goals sorted by priority
    cursor = goals_collection.find({"user_id": user_id}).sort("priority", 1)
    async for goal in cursor:
        target = goal.get("target_amount", 0)
        # Avoid division by zero or weird logic if target is 0. 
        # If target is 0, is it achieved? Let's say yes, or skip. 
        # Usually target > 0.
        if target <= 0:
            # If target is 0, technically it's achieved instantly? 
            # Or invalid. Let's assume invalid/skip to be safe, or count it.
            # Let's count it as achieved if it exists, effectively free.
            goals_achieved_count += 1
            continue
            
        amount_for_goal = min(remaining_savings, target)
        
        # Check completion. Using a small epsilon for float comparison safety? 
        # Or simplistic >= logic. Standard is fine for currency usually if consistent.
        if amount_for_goal >= target:
            goals_achieved_count += 1
            
        # Deduct used savings
        remaining_savings = max(0, remaining_savings - amount_for_goal)
        
        # Optimization: If no savings left, subsequent goals with target > 0 won't be achieved
        if remaining_savings <= 0:
            # Continue checking if there are 0-target goals? 
            # Or just break. Assuming remaining goals have target > 0.
            pass
            
    goals_achieved = goals_achieved_count
    
    return DashboardStats(
        net_income=net_income,
        savings=total_savings,
        expenses=total_expenses,
        goals_achieved=goals_achieved,
        income_change=0.0,
        savings_change=0.0,
        expenses_change=0.0
    )


@router.get("/balance-trends", response_model=List[BalanceTrend])
async def get_balance_trends(user_id: str = Depends(get_current_user_id)):
    """
    Get balance trends for chart (Lifetime Savings).
    - Shared (Blue): Cumulative 'savings' type with 'shared' slot
    - Personal (Green): Cumulative 'fun' type
    """
    trends = []
    
    # 1. Get all budgets for the user, sorted by date ascending
    cursor = budgets_collection.find({"user_id": user_id}).sort("month", 1)
    budgets = await cursor.to_list(length=None)
    
    cumulative_shared = 0.0
    cumulative_fun = 0.0
    
    for budget in budgets:
        budget_id = budget["_id"]
        month_str = budget["month"] # "YYYY-MM"
        
        # Format month for chart (e.g. "Jan. 2026")
        dt = datetime.strptime(month_str, "%Y-%m")
        display_month = dt.strftime("%b. %Y")
        
        monthly_shared = 0.0
        monthly_fun = 0.0
        
        # 2. Get line items for this budget
        async for item in budget_line_items_collection.find({"budget_id": budget_id}):
            category = await categories_collection.find_one({"_id": item["category_id"]})
            if not category:
                continue
                
            cat_type = category.get("type")
            amount = item.get("amount", 0)
            slot = item.get("owner_slot", "")
            
            if cat_type == "savings" and slot == "shared":
                monthly_shared += amount
            elif cat_type == "fun":
                # Assuming all 'fun' is counted as the "Green Line" per requirements
                monthly_fun += amount
                
        cumulative_shared += monthly_shared
        cumulative_fun += monthly_fun
        
        trends.append(BalanceTrend(
            month=display_month,
            personal=cumulative_fun, # Mapped to Green line
            shared=cumulative_shared # Mapped to Blue line
        ))
    
    # If no data, return empty or sample? Let's return empty if no budgets.
    if not trends:
        # Fallback to empty list so chart shows empty state instead of potentially confusing dummy data
        return []
        
    return trends


@router.get("/expense-breakdown", response_model=List[ExpenseBreakdown])
async def get_expense_breakdown(user_id: str = Depends(get_current_user_id)):
    """
    Get expense breakdown by category for the current user's current month budget.
    Only includes items where category type is 'expense' (Shared + Personal).
    """
    current_month_str = datetime.now().strftime("%Y-%m")
    
    # Try to find budget for current month first
    budget = await budgets_collection.find_one({
        "month": current_month_str,
        "user_id": user_id
    })
    
    if not budget:
        return []
        
    budget_id = budget["_id"]
    category_totals = {}
    total_expenses = 0
    
    # Get budget line items
    async for item in budget_line_items_collection.find({"budget_id": budget_id}):
        category = await categories_collection.find_one({"_id": item["category_id"]})
        if not category:
            continue
            
        # Filter for Expense type
        if category.get("type") != "expense":
            continue
            
        # Includes Shared and Personal (user1/user2)
        # Note: If we wanted to restrict personal to ONLY the current user slot, we might need more logic
        # But request says "categories from shared expenses and personal expenses" which usually implies all expenses in the budget.
        
        amount = item.get("amount", 0)
        cat_name = category.get("name", "Unknown")
        
        category_totals[cat_name] = category_totals.get(cat_name, 0) + amount
        total_expenses += amount
    
    # Calculate percentages
    breakdown = []
    for category_name, amount in category_totals.items():
        percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
        breakdown.append(ExpenseBreakdown(
            category=category_name,
            amount=amount,
            percentage=round(percentage, 1)
        ))
    
    return sorted(breakdown, key=lambda x: x.amount, reverse=True)
