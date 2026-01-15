from pydantic import BaseModel, Field
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
    total_balance: float
    total_period_change: float
    period_change_percentage: float
    total_period_expenses: float
    total_period_income: float
    last_month_balance: float

class BalanceTrend(BaseModel):
    date: str
    balance: float

class ExpenseBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
