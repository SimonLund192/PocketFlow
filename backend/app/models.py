from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Literal, Annotated
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
        )

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

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class DashboardStats(BaseModel):
    net_income: float
    savings: float
    expenses: float
    goals_achieved: int
    income_change: float
    savings_change: float


class CategoryBase(BaseModel):
    name: str
    type: Literal["income", "shared-expenses", "personal-expenses", "shared-savings", "fun"]
    icon: str
    color: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["income", "shared-expenses", "personal-expenses", "shared-savings", "fun"]] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class Category(CategoryBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


class BalanceTrend(BaseModel):
    month: str
    personal: float
    shared: float


class ExpenseBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
