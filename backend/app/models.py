from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionCategory(str, Enum):
    # Income categories
    SALARY = "Salary"
    FREELANCE = "Freelance"
    INVESTMENT = "Investment"
    
    # Shared expenses
    RENT = "Rent"
    UTILITIES = "Utilities"
    GROCERIES = "Groceries"
    HOUSEHOLD = "Household"
    
    # Personal expenses
    PERSONAL_FOOD = "Personal Food"
    TRANSPORT = "Transport"
    ENTERTAINMENT = "Entertainment"
    SHOPPING = "Shopping"
    HEALTHCARE = "Healthcare"
    
    # Savings
    SHARED_SAVINGS = "Shared Savings"
    PERSONAL_SAVINGS = "Personal Savings"
    
    OTHER = "Other"

class Transaction(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    type: TransactionType
    category: TransactionCategory
    amount: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "type": "expense",
                "category": "Food",
                "amount": 45.50,
                "description": "Grocery shopping",
                "date": "2026-01-15T10:30:00"
            }
        }

class TransactionCreate(BaseModel):
    type: TransactionType
    category: TransactionCategory
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class DashboardStats(BaseModel):
    net_income: float
    total_savings: float
    total_expenses: float
    goals_achieved: int
    period_change_percentage: float
    last_month_net_income: float

class BalanceTrend(BaseModel):
    date: str
    balance: float

class SavingsTrend(BaseModel):
    month: str
    shared_savings: float
    personal_savings: float
    total_savings: float

class ExpenseBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float

class BudgetExpenseBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    type: str  # 'shared' or 'personal'

class BudgetItem(BaseModel):
    id: str
    name: Optional[str] = None
    category: Optional[str] = None
    value: float
    user: Optional[str] = None

class Budget(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # User who owns this budget
    month: str  # Format: YYYY-MM
    income_user1: List[BudgetItem] = Field(default_factory=list)
    income_user2: List[BudgetItem] = Field(default_factory=list)
    shared_expenses: List[BudgetItem] = Field(default_factory=list)
    personal_user1: List[BudgetItem] = Field(default_factory=list)
    personal_user2: List[BudgetItem] = Field(default_factory=list)
    shared_savings: List[BudgetItem] = Field(default_factory=list)
    personal_savings_user1: List[BudgetItem] = Field(default_factory=list)
    personal_savings_user2: List[BudgetItem] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class BudgetCreate(BaseModel):
    income_user1: List[BudgetItem] = Field(default_factory=list)
    income_user2: List[BudgetItem] = Field(default_factory=list)
    shared_expenses: List[BudgetItem] = Field(default_factory=list)
    personal_user1: List[BudgetItem] = Field(default_factory=list)
    personal_user2: List[BudgetItem] = Field(default_factory=list)
    shared_savings: List[BudgetItem] = Field(default_factory=list)
    personal_savings_user1: List[BudgetItem] = Field(default_factory=list)
    personal_savings_user2: List[BudgetItem] = Field(default_factory=list)

class BudgetLifetimeStats(BaseModel):
    total_income: float
    total_shared_expenses: float
    total_personal_expenses: float
    total_shared_savings: float
    remaining: float

class MonthlyStats(BaseModel):
    current_income: float
    current_expenses: float
    current_savings: float
    previous_income: float
    previous_expenses: float
    previous_savings: float

# User Models
class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    full_name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime

# Category Models
class Category(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # User who owns this category
    name: str
    icon: str
    color: str
    type: str  # 'income', 'expense', or 'savings'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class CategoryCreate(BaseModel):
    name: str
    icon: str
    color: str
    type: str  # 'income' or 'expense'

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    type: Optional[str] = None

# Goal Models
class Goal(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # User who owns this goal
    name: str
    saved: float = 0.0
    target: float
    percentage: float = 0.0
    color: str = "bg-green-500"
    order: int = 0  # Order/priority of the goal (lower number = higher priority)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "user123",
                "name": "Buy a car",
                "saved": 5000.0,
                "target": 20000.0,
                "percentage": 25.0,
                "color": "bg-green-500",
                "order": 0
            }
        }
    }

class GoalCreate(BaseModel):
    name: str
    target: float
    saved: Optional[float] = 0.0
    color: Optional[str] = "bg-green-500"

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    saved: Optional[float] = None
    target: Optional[float] = None
    color: Optional[str] = None
    order: Optional[int] = None

class GoalOrderItem(BaseModel):
    id: str
    order: int
