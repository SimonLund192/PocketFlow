from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from app.models import Transaction, TransactionCreate, DashboardStats, BalanceTrend, ExpenseBreakdown, TransactionType
from app.database import get_database
from bson import ObjectId

router = APIRouter()

def transaction_helper(transaction) -> dict:
    return {
        "_id": str(transaction["_id"]),
        "type": transaction["type"],
        "category": transaction["category"],
        "amount": transaction["amount"],
        "description": transaction.get("description", ""),
        "date": transaction["date"]
    }

@router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    """Get all transactions"""
    db = get_database()
    transactions = []
    async for transaction in db.transactions.find().sort("date", -1):
        transactions.append(transaction_helper(transaction))
    return transactions

@router.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction"""
    db = get_database()
    
    transaction_dict = transaction.model_dump()
    if transaction_dict["date"] is None:
        transaction_dict["date"] = datetime.utcnow()
    
    result = await db.transactions.insert_one(transaction_dict)
    new_transaction = await db.transactions.find_one({"_id": result.inserted_id})
    
    return transaction_helper(new_transaction)

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    db = get_database()
    
    # Calculate date ranges
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)
    
    # Get all transactions
    all_transactions = []
    async for transaction in db.transactions.find():
        all_transactions.append(transaction)
    
    # Get this month's transactions
    this_month_transactions = [
        t for t in all_transactions 
        if t["date"] >= start_of_month
    ]
    
    # Calculate this month's totals
    period_income = sum(
        t["amount"] for t in this_month_transactions 
        if t["type"] == "income"
    )
    
    # Calculate expenses by category
    shared_expenses = sum(
        t["amount"] for t in this_month_transactions 
        if t["type"] == "expense" and t["category"] in ["Rent", "Utilities", "Groceries", "Household"]
    )
    
    personal_expenses = sum(
        t["amount"] for t in this_month_transactions 
        if t["type"] == "expense" and t["category"] in ["Personal Food", "Transport", "Entertainment", "Shopping", "Healthcare"]
    )
    
    # Calculate savings (only shared savings for now)
    total_savings = sum(
        t["amount"] for t in this_month_transactions 
        if t["type"] == "expense" and t["category"] == "Shared Savings"
    )
    
    # Total expenses (shared + personal + savings)
    total_expenses = shared_expenses + personal_expenses + total_savings
    
    # Net income (income - all expenses)
    net_income = period_income - total_expenses
    
    # Calculate last month's net income for comparison
    last_month_transactions = [
        t for t in all_transactions 
        if start_of_last_month <= t["date"] < start_of_month
    ]
    
    last_month_income = sum(
        t["amount"] for t in last_month_transactions 
        if t["type"] == "income"
    )
    
    last_month_expenses = sum(
        t["amount"] for t in last_month_transactions 
        if t["type"] == "expense"
    )
    
    last_month_net_income = last_month_income - last_month_expenses
    
    # Calculate percentage change
    if last_month_net_income != 0:
        period_change_percentage = ((net_income - last_month_net_income) / abs(last_month_net_income)) * 100
    else:
        period_change_percentage = 0 if net_income == 0 else 100
    
    # Goals achieved (placeholder for future feature)
    goals_achieved = 0
    
    return DashboardStats(
        net_income=net_income,
        total_savings=total_savings,
        total_expenses=total_expenses,
        goals_achieved=goals_achieved,
        period_change_percentage=period_change_percentage,
        last_month_net_income=last_month_net_income
    )

@router.get("/dashboard/balance-trends", response_model=List[BalanceTrend])
async def get_balance_trends():
    """Get balance trends for the chart"""
    db = get_database()
    
    # Get all transactions sorted by date
    transactions = []
    async for transaction in db.transactions.find().sort("date", 1):
        transactions.append(transaction)
    
    if not transactions:
        return []
    
    # Calculate running balance
    balance_trends = []
    current_balance = 0
    
    # Group by date
    from collections import defaultdict
    daily_balances = defaultdict(float)
    
    for transaction in transactions:
        date_str = transaction["date"].strftime("%Y-%m-%d")
        if transaction["type"] == "income":
            current_balance += transaction["amount"]
        else:
            current_balance -= transaction["amount"]
        daily_balances[date_str] = current_balance
    
    # Convert to list
    for date_str, balance in sorted(daily_balances.items()):
        balance_trends.append(BalanceTrend(date=date_str, balance=balance))
    
    return balance_trends

@router.get("/dashboard/expense-breakdown", response_model=List[ExpenseBreakdown])
async def get_expense_breakdown():
    """Get expense breakdown by category for this month"""
    db = get_database()
    
    # Get current month
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get this month's expenses
    expenses = []
    async for transaction in db.transactions.find({
        "type": "expense",
        "date": {"$gte": start_of_month}
    }):
        expenses.append(transaction)
    
    # Group by category
    category_totals = {}
    total_expenses = 0
    
    for expense in expenses:
        category = expense["category"]
        amount = expense["amount"]
        category_totals[category] = category_totals.get(category, 0) + amount
        total_expenses += amount
    
    # Calculate percentages
    breakdown = []
    for category, amount in category_totals.items():
        percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
        breakdown.append(ExpenseBreakdown(
            category=category,
            amount=amount,
            percentage=percentage
        ))
    
    # Sort by amount descending
    breakdown.sort(key=lambda x: x.amount, reverse=True)
    
    return breakdown

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    """Delete a transaction"""
    db = get_database()
    
    try:
        result = await db.transactions.delete_one({"_id": ObjectId(transaction_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
