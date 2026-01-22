"""
API routes for budget line item operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Annotated

from app.models import (
    BudgetLineItemCreate,
    BudgetLineItemUpdate,
    BudgetLineItemResponse,
    BudgetLineItemWithCategory,
)
from app.services.budget_line_item_service import BudgetLineItemService
from app.dependencies import get_current_user_id

router = APIRouter(prefix="/api/budget-line-items", tags=["budget-line-items"])


@router.post("/", response_model=BudgetLineItemResponse, status_code=201)
async def create_line_item(
    line_item: BudgetLineItemCreate,
    user_id: Annotated[str, Depends(get_current_user_id)]
):
    """
    Create a new budget line item.

    Validates:
    - Budget exists and belongs to user
    - Category exists and belongs to user
    - Category is active
    """
    try:
        return await BudgetLineItemService.create_line_item(line_item, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[BudgetLineItemResponse] | list[BudgetLineItemWithCategory])
async def get_line_items(
    user_id: Annotated[str, Depends(get_current_user_id)],
    budget_id: str | None = Query(None, description="Filter by budget ID"),
    include_category: bool = Query(False, description="Include populated category details")
):
    """
    Get all line items for the logged-in user.

    Optional filters:
    - budget_id: Filter line items by budget
    - include_category: Populate category details
    """
    return await BudgetLineItemService.get_line_items(
        user_id=user_id,
        budget_id=budget_id,
        include_category=include_category
    )


@router.get("/{line_item_id}", response_model=BudgetLineItemResponse | BudgetLineItemWithCategory)
async def get_line_item(
    line_item_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)],
    include_category: bool = Query(False, description="Include populated category details")
):
    """
    Get a single line item by ID.
    """
    line_item = await BudgetLineItemService.get_line_item(
        line_item_id=line_item_id,
        user_id=user_id,
        include_category=include_category
    )
    if not line_item:
        raise HTTPException(status_code=404, detail="Line item not found")
    return line_item


@router.get("/budget/{budget_id}", response_model=list[BudgetLineItemWithCategory])
async def get_line_items_by_budget(
    budget_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)]
):
    """
    Get all line items for a specific budget (with category info populated).
    
    This is a convenience endpoint that always includes category details.
    """
    return await BudgetLineItemService.get_line_items_by_budget(
        budget_id=budget_id,
        user_id=user_id,
        include_category=True
    )


@router.put("/{line_item_id}", response_model=BudgetLineItemResponse)
async def update_line_item(
    line_item_id: str,
    update_data: BudgetLineItemUpdate,
    user_id: Annotated[str, Depends(get_current_user_id)]
):
    """
    Update a line item.

    Validates:
    - Line item exists and belongs to user
    - If category_id provided, category exists and belongs to user
    """
    try:
        line_item = await BudgetLineItemService.update_line_item(
            line_item_id=line_item_id,
            update_data=update_data,
            user_id=user_id
        )
        if not line_item:
            raise HTTPException(status_code=404, detail="Line item not found")
        return line_item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{line_item_id}", status_code=204)
async def delete_line_item(
    line_item_id: str,
    user_id: Annotated[str, Depends(get_current_user_id)]
):
    """
    Delete a line item.
    """
    deleted = await BudgetLineItemService.delete_line_item(line_item_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Line item not found")
