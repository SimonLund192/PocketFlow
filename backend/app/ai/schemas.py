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
    confirm_action: Optional[str] = None  # "yes" or "no" — user's response to a pending action

class ProposedEntry(BaseModel):
    """A single budget line item proposed by the AI for confirmation"""
    name: str = Field(..., description="Line item name (e.g. 'Milk, butter, bread')")
    category_name: str = Field(..., description="Category name to use")
    category_id: str = Field(..., description="Category ObjectId")
    category_type: str = Field(..., description="Category type: income, expense, savings, fun")
    amount: float = Field(..., ge=0, description="Amount in DKK")
    owner_slot: Literal["user1", "user2", "shared"] = Field(..., description="Owner slot")
    month: str = Field(..., description="Budget month YYYY-MM")

class PendingAction(BaseModel):
    """Action waiting for user confirmation"""
    action_type: str = Field(..., description="Type: 'save_budget_entries'")
    entries: List[ProposedEntry] = []
    summary: str = Field("", description="Human-readable summary of what will be saved")

class AIChatResponse(BaseModel):
    message: AIChatMessage
    tool_calls: List[Dict[str, Any]] = []
    warnings: List[str] = []
    pending_action: Optional[PendingAction] = None  # Set when AI proposes entries for confirmation

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

