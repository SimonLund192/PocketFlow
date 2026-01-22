"""
Admin routes for database management
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user_id
from app.database import database

router = APIRouter(prefix="/admin", tags=["admin"])


@router.delete("/clear-transactions")
async def clear_transactions(user_id: str = Depends(get_current_user_id)):
    """
    Clear all transactions for the current user
    """
    transactions_collection = database["transactions"]
    result = await transactions_collection.delete_many({"user_id": user_id})
    return {
        "message": f"Cleared {result.deleted_count} transactions",
        "deleted_count": result.deleted_count
    }


@router.delete("/clear-budgets")
async def clear_budgets(user_id: str = Depends(get_current_user_id)):
    """
    Clear all budgets and budget line items for the current user
    """
    budgets_collection = database["budgets"]
    budget_line_items_collection = database["budget_line_items"]
    
    # Delete all budgets
    budgets_result = await budgets_collection.delete_many({"user_id": user_id})
    
    # Delete all budget line items
    line_items_result = await budget_line_items_collection.delete_many({"user_id": user_id})
    
    return {
        "message": f"Cleared {budgets_result.deleted_count} budgets and {line_items_result.deleted_count} line items",
        "budgets_deleted": budgets_result.deleted_count,
        "line_items_deleted": line_items_result.deleted_count
    }


@router.delete("/clear-categories")
async def clear_categories(user_id: str = Depends(get_current_user_id)):
    """
    Clear all categories for the current user
    """
    categories_collection = database["categories"]
    result = await categories_collection.delete_many({"user_id": user_id})
    return {
        "message": f"Cleared {result.deleted_count} categories",
        "deleted_count": result.deleted_count
    }


@router.delete("/clear-goals")
async def clear_goals(user_id: str = Depends(get_current_user_id)):
    """
    Clear all goals for the current user
    """
    goals_collection = database["goals"]
    result = await goals_collection.delete_many({"user_id": user_id})
    return {
        "message": f"Cleared {result.deleted_count} goals",
        "deleted_count": result.deleted_count
    }


@router.delete("/clear-all")
async def clear_all_data(user_id: str = Depends(get_current_user_id)):
    """
    Clear ALL data for the current user
    WARNING: This cannot be undone!
    """
    transactions_collection = database["transactions"]
    budgets_collection = database["budgets"]
    budget_line_items_collection = database["budget_line_items"]
    categories_collection = database["categories"]
    goals_collection = database["goals"]
    
    # Delete all data
    transactions_result = await transactions_collection.delete_many({"user_id": user_id})
    budgets_result = await budgets_collection.delete_many({"user_id": user_id})
    line_items_result = await budget_line_items_collection.delete_many({"user_id": user_id})
    categories_result = await categories_collection.delete_many({"user_id": user_id})
    goals_result = await goals_collection.delete_many({"user_id": user_id})
    
    total_deleted = (
        transactions_result.deleted_count +
        budgets_result.deleted_count +
        line_items_result.deleted_count +
        categories_result.deleted_count +
        goals_result.deleted_count
    )
    
    return {
        "message": f"Cleared all data ({total_deleted} total records)",
        "transactions_deleted": transactions_result.deleted_count,
        "budgets_deleted": budgets_result.deleted_count,
        "line_items_deleted": line_items_result.deleted_count,
        "categories_deleted": categories_result.deleted_count,
        "goals_deleted": goals_result.deleted_count,
        "total_deleted": total_deleted
    }
