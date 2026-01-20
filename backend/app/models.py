from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema):
        schema.update(type="string")
        return schema


class TransactionBase(BaseModel):
    amount: float
    category: str
    type: Literal["income", "expense", "savings"]
    description: Optional[str] = None
    date: datetime


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DashboardStats(BaseModel):
    net_income: float
    savings: float
    expenses: float
    goals_achieved: int
    income_change: float
    savings_change: float
    expenses_change: float


class BalanceTrend(BaseModel):
    month: str
    personal: float
    shared: float


class ExpenseBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
