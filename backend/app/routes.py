from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime, timedelta
from app.models import (
    Transaction, TransactionCreate, DashboardStats, BalanceTrend, SavingsTrend,
    ExpenseBreakdown, BudgetExpenseBreakdown, TransactionType, Budget, BudgetCreate, BudgetLifetimeStats, MonthlyStats,
    User, UserCreate, UserLogin, Token, UserResponse,
    Category, CategoryCreate, CategoryUpdate,
    Goal, GoalCreate, GoalUpdate, GoalOrderItem
)
from app.database import get_database
from app.auth import (
    get_password_hash, verify_password, create_access_token, get_current_user, get_current_user_id
)
from bson import ObjectId

router = APIRouter()


def _user_response_helper(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"],
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users():
    """Dev-only: list users.

    The app currently doesn't enforce auth end-to-end, so this endpoint exists
    to support local development and the dev user switcher.
    """

    db = get_database()
    users: List[UserResponse] = []
    async for user in db.users.find({}).sort("created_at", -1):
        users.append(_user_response_helper(user))
    return users


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate):
    """Dev-only: create a user.

    Note: This reuses the same schema as auth registration and hashes the
    password, but does not return the password hash.
    """

    db = get_database()

    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "created_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_dict)
    new_user = await db.users.find_one({"_id": result.inserted_id})

    return _user_response_helper(new_user)

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
async def get_transactions(user_id: str = Depends(get_current_user_id)):
    """Get all transactions"""
    db = get_database()
    transactions = []
    async for transaction in db.transactions.find({"user_id": user_id}).sort("date", -1):
        transactions.append(transaction_helper(transaction))
    return transactions

@router.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(transaction: TransactionCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new transaction"""
    db = get_database()
    
    transaction_dict = transaction.model_dump()
    transaction_dict["user_id"] = user_id
    if transaction_dict["date"] is None:
        transaction_dict["date"] = datetime.utcnow()
    
    result = await db.transactions.insert_one(transaction_dict)
    new_transaction = await db.transactions.find_one({"_id": result.inserted_id})
    
    return transaction_helper(new_transaction)


async def _get_user_transactions(db, user_id: str):
    """Fetch all transactions for a user.

    Dashboard endpoints use this to avoid accidentally aggregating across users.
    """
    transactions = []
    async for transaction in db.transactions.find({"user_id": user_id}):
        transactions.append(transaction)
    return transactions

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str = Depends(get_current_user_id)):
    """Get dashboard statistics"""
    db = get_database()
    
    # Calculate date ranges
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)
    
    all_transactions = await _get_user_transactions(db, user_id)
    
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

@router.get("/dashboard/balance-trends")
async def get_balance_trends(user_id: str = Depends(get_current_user_id)):
    """Get cumulative shared and personal savings trends over time"""
    db = get_database()
    
    # Get all budgets for the user, sorted by month
    budgets = []
    async for budget in db.budgets.find({"user_id": user_id}).sort("month", 1):
        budgets.append(budget)
    
    if not budgets:
        return []
    
    balance_trends = []
    cumulative_shared = 0.0
    cumulative_personal = 0.0
    
    for budget in budgets:
        # Calculate shared savings for this month
        month_shared = 0.0
        for item in budget.get("shared_savings", []):
            month_shared += item.get("value", 0.0)
        
        # Calculate personal savings for this month (both users)
        month_personal = 0.0
        for item in budget.get("personal_savings_user1", []):
            month_personal += item.get("value", 0.0)
        for item in budget.get("personal_savings_user2", []):
            month_personal += item.get("value", 0.0)
        
        # Add to cumulative totals
        cumulative_shared += month_shared
        cumulative_personal += month_personal
        
        # Format date as YYYY-MM-01 for the first of the month
        month_str = budget.get("month", "")
        if month_str:
            date_str = f"{month_str}-01"
        else:
            date_str = "2026-01-01"
        
        balance_trends.append({
            "date": date_str,
            "shared_savings": cumulative_shared,
            "personal_savings": cumulative_personal
        })
    
    return balance_trends

@router.get("/dashboard/savings-trends", response_model=List[SavingsTrend])
async def get_savings_trends(current_user: UserResponse = Depends(get_current_user)):
    """Get cumulative savings trends by month for the current user"""
    db = get_database()
    
    # Get all budgets for the user, sorted by month
    budgets = []
    async for budget in db.budgets.find({"user_id": current_user.id}).sort("month", 1):
        budgets.append(budget)
    
    if not budgets:
        return []
    
    savings_trends = []
    cumulative_shared = 0.0
    cumulative_personal = 0.0
    
    for budget in budgets:
        # Calculate shared savings for this month
        month_shared = 0.0
        for item in budget.get("shared_savings", []):
            month_shared += item.get("value", 0.0)
        
        # Calculate personal savings for this month (both users)
        month_personal = 0.0
        for item in budget.get("personal_savings_user1", []):
            month_personal += item.get("value", 0.0)
        for item in budget.get("personal_savings_user2", []):
            month_personal += item.get("value", 0.0)
        
        # Add to cumulative totals
        cumulative_shared += month_shared
        cumulative_personal += month_personal
        
        # Format month for display (YYYY-MM -> Month Year)
        month_str = budget.get("month", "")
        if month_str:
            from datetime import datetime
            try:
                month_date = datetime.strptime(month_str, "%Y-%m")
                display_month = month_date.strftime("%b %Y")
            except:
                display_month = month_str
        else:
            display_month = "Unknown"
        
        savings_trends.append(SavingsTrend(
            month=display_month,
            shared_savings=cumulative_shared,
            personal_savings=cumulative_personal,
            total_savings=cumulative_shared + cumulative_personal
        ))
    
    return savings_trends

@router.get("/dashboard/expense-breakdown", response_model=List[ExpenseBreakdown])
async def get_expense_breakdown(user_id: str = Depends(get_current_user_id)):
    """Get expense breakdown by category for this month"""
    db = get_database()
    
    # Get current month
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get this month's expenses
    expenses = []
    async for transaction in db.transactions.find({
        "user_id": user_id,
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

@router.get("/dashboard/budget-expense-breakdown", response_model=List[BudgetExpenseBreakdown])
async def get_budget_expense_breakdown(current_user: UserResponse = Depends(get_current_user)):
    """Get expense breakdown by category from budget data, showing shared vs personal expenses"""
    db = get_database()
    
    # Get all budgets for the current user
    category_data = {}  # {category: {shared: amount, personal: amount}}
    total_expenses = 0.0
    
    async for budget in db.budgets.find({"user_id": current_user.id}):
        # Process shared expenses
        for item in budget.get("shared_expenses", []):
            category = item.get("category", "Uncategorized")
            value = item.get("value", 0.0)
            if category not in category_data:
                category_data[category] = {"shared": 0.0, "personal": 0.0}
            category_data[category]["shared"] += value
            total_expenses += value
        
        # Process personal expenses from both users
        for item in budget.get("personal_user1", []):
            category = item.get("category", "Uncategorized")
            value = item.get("value", 0.0)
            if category not in category_data:
                category_data[category] = {"shared": 0.0, "personal": 0.0}
            category_data[category]["personal"] += value
            total_expenses += value
            
        for item in budget.get("personal_user2", []):
            category = item.get("category", "Uncategorized")
            value = item.get("value", 0.0)
            if category not in category_data:
                category_data[category] = {"shared": 0.0, "personal": 0.0}
            category_data[category]["personal"] += value
            total_expenses += value
    
    # Create breakdown list with percentages
    breakdown = []
    for category, amounts in category_data.items():
        if amounts["shared"] > 0:
            percentage = (amounts["shared"] / total_expenses * 100) if total_expenses > 0 else 0
            breakdown.append(BudgetExpenseBreakdown(
                category=category,
                amount=amounts["shared"],
                percentage=percentage,
                type="shared"
            ))
        if amounts["personal"] > 0:
            percentage = (amounts["personal"] / total_expenses * 100) if total_expenses > 0 else 0
            breakdown.append(BudgetExpenseBreakdown(
                category=category,
                amount=amounts["personal"],
                percentage=percentage,
                type="personal"
            ))
    
    # Sort by amount descending
    breakdown.sort(key=lambda x: x.amount, reverse=True)
    
    return breakdown

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str, user_id: str = Depends(get_current_user_id)
):
    """Delete a transaction"""
    db = get_database()

    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction id",
        )

    result = await db.transactions.delete_one(
        {"_id": ObjectId(transaction_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        # Owned-by-user not found (or doesn't exist)
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {"message": "Transaction deleted successfully"}

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

@router.get("/budget/monthly/stats", response_model=MonthlyStats)
async def get_monthly_budget_stats(current_user: UserResponse = Depends(get_current_user)):
    """Get current and previous month budget statistics for comparison"""
    db = get_database()
    from datetime import datetime
    
    # Get current month (YYYY-MM format)
    now = datetime.utcnow()
    current_month = f"{now.year}-{now.month:02d}"
    
    # Get previous month
    if now.month == 1:
        prev_month = f"{now.year - 1}-12"
    else:
        prev_month = f"{now.year}-{now.month - 1:02d}"
    
    # Function to calculate stats for a month
    async def get_month_stats(month: str):
        budget = await db.budgets.find_one({"user_id": current_user.id, "month": month})
        
        if not budget:
            return 0.0, 0.0, 0.0
        
        # Calculate income
        income = 0.0
        for item in budget.get("income_user1", []):
            income += item.get("value", 0.0)
        for item in budget.get("income_user2", []):
            income += item.get("value", 0.0)
        
        # Calculate expenses
        expenses = 0.0
        for item in budget.get("shared_expenses", []):
            expenses += item.get("value", 0.0)
        for item in budget.get("personal_user1", []):
            expenses += item.get("value", 0.0)
        for item in budget.get("personal_user2", []):
            expenses += item.get("value", 0.0)
        
        # Calculate savings
        savings = 0.0
        for item in budget.get("shared_savings", []):
            savings += item.get("value", 0.0)
        for item in budget.get("personal_savings_user1", []):
            savings += item.get("value", 0.0)
        for item in budget.get("personal_savings_user2", []):
            savings += item.get("value", 0.0)
        
        return income, expenses, savings
    
    # Get current and previous month stats
    current_income, current_expenses, current_savings = await get_month_stats(current_month)
    previous_income, previous_expenses, previous_savings = await get_month_stats(prev_month)
    
    return MonthlyStats(
        current_income=current_income,
        current_expenses=current_expenses,
        current_savings=current_savings,
        previous_income=previous_income,
        previous_expenses=previous_expenses,
        previous_savings=previous_savings
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

# Category endpoints
@router.get("/categories", response_model=List[dict])
async def get_categories(current_user: User = Depends(get_current_user)):
    """Get all categories for the current user"""
    db = get_database()
    
    categories = await db.categories.find({"user_id": str(current_user.id)}).to_list(None)
    
    # Convert ObjectId to string
    for category in categories:
        category["id"] = str(category["_id"])
        del category["_id"]
        del category["user_id"]
    
    return categories

@router.post("/categories", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_category(category_data: CategoryCreate, current_user: User = Depends(get_current_user)):
    """Create a new category"""
    db = get_database()
    
    # Check if category with same name and type already exists for this user
    existing_category = await db.categories.find_one({
        "user_id": str(current_user.id),
        "name": category_data.name,
        "type": category_data.type
    })
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_data.name}' already exists for {category_data.type}"
        )
    
    category_dict = {
        "user_id": str(current_user.id),
        "name": category_data.name,
        "icon": category_data.icon,
        "color": category_data.color,
        "type": category_data.type,
        "created_at": datetime.utcnow()
    }
    
    result = await db.categories.insert_one(category_dict)
    new_category = await db.categories.find_one({"_id": result.inserted_id})
    
    # Convert ObjectId to string
    new_category["id"] = str(new_category["_id"])
    del new_category["_id"]
    del new_category["user_id"]
    
    return new_category

@router.put("/categories/{category_id}", response_model=dict)
async def update_category(category_id: str, category_data: CategoryUpdate, current_user: User = Depends(get_current_user)):
    """Update a category"""
    db = get_database()
    
    # Check if category exists and belongs to current user
    existing_category = await db.categories.find_one({
        "_id": ObjectId(category_id),
        "user_id": str(current_user.id)
    })
    
    if not existing_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Build update dict with only provided fields
    update_data = {k: v for k, v in category_data.dict(exclude_unset=True).items() if v is not None}
    
    if update_data:
        await db.categories.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": update_data}
        )
    
    updated_category = await db.categories.find_one({"_id": ObjectId(category_id)})
    
    # Convert ObjectId to string
    updated_category["id"] = str(updated_category["_id"])
    del updated_category["_id"]
    del updated_category["user_id"]
    
    return updated_category

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: User = Depends(get_current_user)):
    """Delete a category"""
    db = get_database()
    
    # Check if category exists and belongs to current user
    existing_category = await db.categories.find_one({
        "_id": ObjectId(category_id),
        "user_id": str(current_user.id)
    })
    
    if not existing_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    await db.categories.delete_one({"_id": ObjectId(category_id)})
    
    return {"message": "Category deleted successfully"}

# Goal endpoints
@router.get("/goals", response_model=List[Goal], response_model_by_alias=False)
async def get_goals(user_id: str = Depends(get_current_user_id)):
    """Get all goals for the current user"""
    db = get_database()
    
    goals_cursor = db.goals.find({"user_id": user_id}).sort("order", 1)
    goals = await goals_cursor.to_list(length=None)
    
    result = [
        Goal(
            id=str(goal["_id"]),
            user_id=goal["user_id"],
            name=goal["name"],
            saved=goal["saved"],
            target=goal["target"],
            percentage=goal["percentage"],
            color=goal.get("color", "bg-green-500"),
            order=goal.get("order", 0),
            created_at=goal["created_at"]
        )
        for goal in goals
    ]
    
    return result

@router.post("/goals", response_model=Goal, response_model_by_alias=False, status_code=status.HTTP_201_CREATED)
async def create_goal(goal_data: GoalCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new goal"""
    db = get_database()
    
    # Get the highest order number for existing goals
    existing_goals = (
        await db.goals.find({"user_id": user_id}).sort("order", -1).limit(1).to_list(1)
    )
    next_order = (existing_goals[0].get("order", 0) + 1) if existing_goals else 0
    
    # Calculate percentage
    percentage = (goal_data.saved / goal_data.target * 100) if goal_data.target > 0 else 0
    
    goal_dict = {
        "user_id": user_id,
        "name": goal_data.name,
        "saved": goal_data.saved,
        "target": goal_data.target,
        "percentage": round(percentage, 2),
        "color": goal_data.color,
        "order": next_order,
        "created_at": datetime.utcnow()
    }
    
    result = await db.goals.insert_one(goal_dict)
    new_goal = await db.goals.find_one({"_id": result.inserted_id})
    
    return Goal(
        id=str(new_goal["_id"]),
        user_id=new_goal["user_id"],
        name=new_goal["name"],
        saved=new_goal["saved"],
        target=new_goal["target"],
        percentage=new_goal["percentage"],
        color=new_goal.get("color", "bg-green-500"),
        order=new_goal.get("order", 0),
        created_at=new_goal["created_at"]
    )

@router.put("/goals/{goal_id}", response_model=Goal, response_model_by_alias=False)
async def update_goal(goal_id: str, goal_data: GoalUpdate, user_id: str = Depends(get_current_user_id)):
    """Update an existing goal"""
    db = get_database()

    # Validate ObjectId format
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID format",
        )
    goal_object_id = ObjectId(goal_id)
    
    # Check if goal exists and belongs to user
    existing_goal = await db.goals.find_one({"_id": goal_object_id, "user_id": user_id})
    
    if not existing_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Build update dict with only provided fields
    update_dict = {}
    if goal_data.name is not None:
        update_dict["name"] = goal_data.name
    if goal_data.saved is not None:
        update_dict["saved"] = goal_data.saved
    if goal_data.target is not None:
        update_dict["target"] = goal_data.target
    if goal_data.color is not None:
        update_dict["color"] = goal_data.color
    if goal_data.order is not None:
        update_dict["order"] = goal_data.order
    
    # Recalculate percentage if saved or target changed
    if goal_data.saved is not None or goal_data.target is not None:
        saved = goal_data.saved if goal_data.saved is not None else existing_goal["saved"]
        target = goal_data.target if goal_data.target is not None else existing_goal["target"]
        update_dict["percentage"] = round((saved / target * 100) if target > 0 else 0, 2)
    
    if update_dict:
        result = await db.goals.update_one(
            {"_id": goal_object_id, "user_id": user_id},
            {"$set": update_dict},
        )
        if result.matched_count == 0:
            # Guard against cross-user updates.
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found",
            )

    updated_goal = await db.goals.find_one(
        {"_id": goal_object_id, "user_id": user_id}
    )
    if not updated_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    return Goal(
        id=str(updated_goal["_id"]),
        user_id=updated_goal["user_id"],
        name=updated_goal["name"],
        saved=updated_goal["saved"],
        target=updated_goal["target"],
        percentage=updated_goal["percentage"],
        color=updated_goal.get("color", "bg-green-500"),
        order=updated_goal.get("order", 0),
        created_at=updated_goal["created_at"]
    )

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a goal"""
    db = get_database()
    
    # Validate ObjectId format
    try:
        goal_object_id = ObjectId(goal_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID format"
        )
    
    # Check if goal exists and belongs to user
    existing_goal = await db.goals.find_one({"_id": goal_object_id, "user_id": user_id})
    
    if not existing_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    result = await db.goals.delete_one(
        {"_id": goal_object_id, "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )
    
    return {"message": "Goal deleted successfully"}

@router.patch("/goals/reorder")
async def reorder_goals(goal_orders: List[GoalOrderItem], user_id: str = Depends(get_current_user_id)):
    """Update the order of multiple goals at once"""
    db = get_database()
    
    # Update each goal's order
    for item in goal_orders:
        if not ObjectId.is_valid(item.id):
            continue

        goal_object_id = ObjectId(item.id)

        # Verify goal belongs to user and update order
        await db.goals.update_one(
            {"_id": goal_object_id, "user_id": user_id},
            {"$set": {"order": item.order}},
        )
    
    return {"message": "Goals reordered successfully"}

@router.delete("/admin/clear/goals")
async def clear_goals():
    """Clear all goals from the database"""
    db = get_database()
    
    result = await db.goals.delete_many({})
    return {
        "message": "All goals cleared successfully",
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
