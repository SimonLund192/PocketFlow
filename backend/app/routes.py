from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timedelta
from app.models import (
    Transaction, TransactionCreate, DashboardStats, BalanceTrend, 
    ExpenseBreakdown, TransactionType, Budget, BudgetCreate, BudgetLifetimeStats,
    User, UserCreate, UserLogin, Token, UserResponse
)
from app.database import get_database
from app.auth import (
    get_password_hash, verify_password, create_access_token, get_current_user
)
from bson import ObjectId

router = APIRouter()

# Authentication endpoints
@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    new_user = await db.users.find_one({"_id": result.inserted_id})
    
    return UserResponse(
        id=str(new_user["_id"]),
        email=new_user["email"],
        full_name=new_user["full_name"],
        created_at=new_user["created_at"]
    )

@router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login user and return JWT token"""
    db = get_database()
    
    # Find user
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"]})
    
    return Token(access_token=access_token, token_type="bearer")

@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user


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

# Budget endpoints
def budget_helper(budget) -> dict:
    return {
        "_id": str(budget["_id"]),
        "user_id": budget.get("user_id"),
        "month": budget["month"],
        "income_user1": budget.get("income_user1", []),
        "income_user2": budget.get("income_user2", []),
        "shared_expenses": budget.get("shared_expenses", []),
        "personal_user1": budget.get("personal_user1", []),
        "personal_user2": budget.get("personal_user2", []),
        "shared_savings": budget.get("shared_savings", []),
        "personal_savings_user1": budget.get("personal_savings_user1", []),
        "personal_savings_user2": budget.get("personal_savings_user2", []),
        "created_at": budget.get("created_at"),
        "updated_at": budget.get("updated_at")
    }

@router.get("/budget/{month}", response_model=Budget)
async def get_budget(month: str, current_user: UserResponse = Depends(get_current_user)):
    """Get budget for a specific month (format: YYYY-MM)"""
    db = get_database()
    
    budget = await db.budgets.find_one({"month": month, "user_id": current_user.id})
    if not budget:
        # Return empty budget structure if not found
        return {
            "user_id": current_user.id,
            "month": month,
            "income_user1": [],
            "income_user2": [],
            "shared_expenses": [],
            "personal_user1": [],
            "personal_user2": [],
            "shared_savings": [],
            "personal_savings_user1": [],
            "personal_savings_user2": []
        }
    
    return budget_helper(budget)

@router.post("/budget/{month}", response_model=Budget)
async def save_budget(month: str, budget_data: BudgetCreate, current_user: UserResponse = Depends(get_current_user)):
    """Save or update budget for a specific month"""
    db = get_database()
    
    budget_dict = budget_data.model_dump()
    budget_dict["user_id"] = current_user.id
    budget_dict["month"] = month
    budget_dict["updated_at"] = datetime.utcnow()
    
    # Check if budget exists for this user and month
    existing = await db.budgets.find_one({"month": month, "user_id": current_user.id})
    
    if existing:
        # Update existing budget
        budget_dict["created_at"] = existing.get("created_at", datetime.utcnow())
        await db.budgets.update_one(
            {"month": month, "user_id": current_user.id},
            {"$set": budget_dict}
        )
        result = await db.budgets.find_one({"month": month, "user_id": current_user.id})
    else:
        # Create new budget
        budget_dict["created_at"] = datetime.utcnow()
        result = await db.budgets.insert_one(budget_dict)
        result = await db.budgets.find_one({"_id": result.inserted_id})
    
    return budget_helper(result)

@router.get("/budget/lifetime/stats", response_model=BudgetLifetimeStats)
async def get_lifetime_budget_stats(current_user: UserResponse = Depends(get_current_user)):
    """Get lifetime budget statistics across all months for the current user"""
    db = get_database()
    
    total_income = 0.0
    total_shared_expenses = 0.0
    total_personal_expenses = 0.0
    total_shared_savings = 0.0
    
    async for budget in db.budgets.find({"user_id": current_user.id}):
        # Sum income from both users
        for item in budget.get("income_user1", []):
            total_income += item.get("value", 0.0)
        for item in budget.get("income_user2", []):
            total_income += item.get("value", 0.0)
        
        # Sum shared expenses
        for item in budget.get("shared_expenses", []):
            total_shared_expenses += item.get("value", 0.0)
        
        # Sum personal expenses from both users
        for item in budget.get("personal_user1", []):
            total_personal_expenses += item.get("value", 0.0)
        for item in budget.get("personal_user2", []):
            total_personal_expenses += item.get("value", 0.0)
        
        # Sum shared savings
        for item in budget.get("shared_savings", []):
            total_shared_savings += item.get("value", 0.0)
    
    remaining = total_income - total_shared_expenses - total_personal_expenses - total_shared_savings
    
    return BudgetLifetimeStats(
        total_income=total_income,
        total_shared_expenses=total_shared_expenses,
        total_personal_expenses=total_personal_expenses,
        total_shared_savings=total_shared_savings,
        remaining=remaining
    )

# Admin endpoints for clearing data
@router.delete("/admin/clear/transactions")
async def clear_transactions():
    """Clear all transactions from the database"""
    db = get_database()
    
    result = await db.transactions.delete_many({})
    return {
        "message": "All transactions cleared successfully",
        "deleted_count": result.deleted_count
    }

@router.delete("/admin/clear/budgets")
async def clear_budgets():
    """Clear all budgets from the database"""
    db = get_database()
    
    result = await db.budgets.delete_many({})
    return {
        "message": "All budgets cleared successfully",
        "deleted_count": result.deleted_count
    }

@router.delete("/admin/clear/all")
async def clear_all_data():
    """Clear all data from the database (transactions and budgets)"""
    db = get_database()
    
    transactions_result = await db.transactions.delete_many({})
    budgets_result = await db.budgets.delete_many({})
    
    return {
        "message": "All data cleared successfully",
        "transactions_deleted": transactions_result.deleted_count,
        "budgets_deleted": budgets_result.deleted_count,
        "total_deleted": transactions_result.deleted_count + budgets_result.deleted_count
    }
