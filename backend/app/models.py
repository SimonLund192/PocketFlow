from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Literal, Annotated
from datetime import datetime, timezone
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic models"""
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


class BalanceTrend(BaseModel):
    month: str
    personal: float
    shared: float


class ExpenseBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float


# ============================================================================
# LEGACY CATEGORY MODELS (for backward compatibility with existing routes)
# ============================================================================

class LegacyCategoryBase(BaseModel):
    """Legacy category model - kept for backward compatibility"""
    name: str
    type: Literal["income", "shared-expenses", "personal-expenses", "shared-savings", "fun"]
    icon: str
    color: str


class LegacyCategoryCreate(LegacyCategoryBase):
    pass


class LegacyCategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[Literal["income", "shared-expenses", "personal-expenses", "shared-savings", "fun"]] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class LegacyCategory(LegacyCategoryBase):
    """Legacy category response"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


# ============================================================================
# CATEGORIES, BUDGETS, AND BUDGET LINE ITEMS MODELS
# ============================================================================

# -----------------------------------------------------------------------------
# Category Models
# -----------------------------------------------------------------------------

class CategoryBase(BaseModel):
    """Base model for category data"""
    name: str = Field(..., min_length=1, max_length=100)
    type: Literal["income", "expense"] = Field(
        ..., 
        description="Category type: income or expense"
    )
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)


class CategoryCreate(CategoryBase):
    """Model for creating a new category"""
    pass


class CategoryUpdate(BaseModel):
    """Model for updating a category (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[Literal["income", "expense"]] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)


class CategoryInDB(CategoryBase):
    """Category as stored in MongoDB"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="The logged-in User_ID who owns this category")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda dt: dt.isoformat()}
    )


class CategoryResponse(CategoryBase):
    """Category response model for API"""
    id: str = Field(..., description="Category ID")
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda dt: dt.isoformat()}
    )


# -----------------------------------------------------------------------------
# Budget Models
# -----------------------------------------------------------------------------

class BudgetBase(BaseModel):
    """Base model for budget data"""
    month: str = Field(
        ..., 
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Budget month in YYYY-MM format"
    )


class BudgetCreate(BudgetBase):
    """Model for creating a new budget"""
    pass


class BudgetUpdate(BaseModel):
    """Model for updating a budget (all fields optional)"""
    month: Optional[str] = Field(
        None,
        pattern=r"^\d{4}-(0[1-9]|1[0-2])$",
        description="Budget month in YYYY-MM format"
    )


class BudgetInDB(BudgetBase):
    """Budget as stored in MongoDB"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="The logged-in User_ID who owns this budget")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda dt: dt.isoformat()}
    )


class BudgetResponse(BudgetBase):
    """Budget response model for API"""
    id: str = Field(..., description="Budget ID")
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda dt: dt.isoformat()}
    )


# -----------------------------------------------------------------------------
# Budget Line Item Models
# -----------------------------------------------------------------------------

class BudgetLineItemBase(BaseModel):
    """Base model for budget line item data"""
    name: str = Field(..., min_length=1, max_length=200, description="Line item name (e.g., 'Apartment')")
    category_id: str = Field(..., description="Reference to a category by ID")
    amount: float = Field(..., ge=0, description="Budget amount")
    owner_slot: Literal["user1", "user2", "shared"] = Field(
        ...,
        description="Owner slot: user1, user2, or shared (matches 2-slot model)"
    )


class BudgetLineItemCreate(BudgetLineItemBase):
    """Model for creating a new budget line item"""
    budget_id: str = Field(..., description="Reference to the budget this item belongs to")


class BudgetLineItemUpdate(BaseModel):
    """Model for updating a budget line item (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    owner_slot: Optional[Literal["user1", "user2", "shared"]] = None


class BudgetLineItemInDB(BudgetLineItemBase):
    """Budget line item as stored in MongoDB"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str = Field(..., description="The logged-in User_ID who owns this line item")
    budget_id: PyObjectId = Field(..., description="Reference to budget ObjectId")
    category_id: PyObjectId = Field(..., description="Reference to category ObjectId")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator('category_id', 'budget_id', mode='before')
    @classmethod
    def validate_object_ids(cls, v):
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError(f"Invalid ObjectId: {v}")
            return ObjectId(v)
        return v

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda dt: dt.isoformat()}
    )


class BudgetLineItemResponse(BaseModel):
    """Budget line item response model for API"""
    id: str = Field(..., description="Line item ID")
    user_id: str
    budget_id: str
    name: str
    category_id: str
    amount: float
    owner_slot: Literal["user1", "user2", "shared"]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={datetime: lambda dt: dt.isoformat()}
    )


class BudgetLineItemWithCategory(BudgetLineItemResponse):
    """Budget line item with populated category details"""
    category: Optional[CategoryResponse] = Field(
        None, 
        description="Populated category information"
    )


class BudgetWithItems(BudgetResponse):
    """Budget with all line items and populated categories"""
    line_items: list[BudgetLineItemWithCategory] = Field(
        default_factory=list,
        description="All budget line items with resolved categories"
    )


# ============================================================================
# MIGRATION MODELS (for backward compatibility)
# ============================================================================

class LegacyBudgetLineItem(BaseModel):
    """Legacy budget line item that stored category as string"""
    name: str
    category: str  # Old: stored as string
    amount: float
    owner_slot: Literal["user1", "user2", "shared"]

