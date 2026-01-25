from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

# --- Chat Models ---

class AIChatMessage(BaseModel):
    role: Literal["system", "user", "assistant", "tool"]
    content: Optional[str] = None
    name: Optional[str] = None  # Required for tool role
    tool_call_id: Optional[str] = None # Required for tool role
    tool_calls: Optional[List[Any]] = None

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    session_id: Optional[str] = None
    dry_run: bool = False

class AIChatResponse(BaseModel):
    message: AIChatMessage
    tool_calls: List[Dict[str, Any]] = []
    warnings: List[str] = []

# --- Tool Argument Schemas ---

class CreateTransactionArgs(BaseModel):
    amount: float = Field(..., description="Transaction amount")
    description: str = Field(..., description="Transaction description or merchant")
    date: str = Field(..., description="Date formatted YYYY-MM-DD")
    category: str = Field(..., description="Category name (e.g. food, rent)")
    type: Literal["income", "expense"] = Field(..., description="Transaction type")

class ListTransactionsArgs(BaseModel):
    limit: int = Field(10, description="Max number of transactions to return")
    start_date: Optional[str] = Field(None, description="Filter from date YYYY-MM-DD")
    end_date: Optional[str] = Field(None, description="Filter to date YYYY-MM-DD")
    category: Optional[str] = Field(None, description="Filter by category name")

class DeleteTransactionArgs(BaseModel):
    transaction_id: str = Field(..., description="The ID of the transaction to delete")

class GetDashboardStatsArgs(BaseModel):
    pass # No args needed

