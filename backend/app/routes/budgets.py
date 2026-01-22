from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.models import BudgetCreate, BudgetUpdate, BudgetResponse
from app.dependencies import get_current_user_id
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new budget for the logged-in user.
    
    - **month**: Budget month in YYYY-MM format (e.g., "2026-01")
    
    Returns the created budget with timestamps.
    
    Raises:
        400: If budget for the same month already exists
    """
    try:
        budget = await BudgetService.create_budget(user_id, budget_data)
        return budget
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all budgets for the logged-in user.
    
    Returns budgets sorted by month (newest first).
    """
    budgets = await BudgetService.get_budgets(user_id)
    return budgets


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get a single budget by ID.
    
    Only returns the budget if it belongs to the logged-in user.
    
    Raises:
        404: If budget not found or doesn't belong to user
    """
    budget = await BudgetService.get_budget(user_id, budget_id)
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget


@router.get("/by-month/{month}", response_model=BudgetResponse)
async def get_budget_by_month(
    month: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get a budget by month.
    
    - **month**: Month in YYYY-MM format (e.g., "2026-01")
    
    Raises:
        404: If budget not found for that month
    """
    budget = await BudgetService.get_budget_by_month(user_id, month)
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget not found for month {month}"
        )
    
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    budget_data: BudgetUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update a budget.
    
    All fields are optional. Only provided fields will be updated.
    
    Raises:
        404: If budget not found or doesn't belong to user
        400: If update would create a duplicate month
    """
    try:
        budget = await BudgetService.update_budget(user_id, budget_id, budget_data)
        
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        return budget
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a budget and all its line items.
    
    This is a cascading delete - all budget line items will also be deleted.
    
    Raises:
        404: If budget not found or doesn't belong to user
    """
    deleted = await BudgetService.delete_budget(user_id, budget_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return None
