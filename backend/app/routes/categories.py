from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.models import CategoryCreate, CategoryUpdate, CategoryResponse
from app.dependencies import get_current_user_id
from app.services.category_service import CategoryService

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new category for the logged-in user.
    
    - **name**: Category name (1-100 characters)
    - **type**: Category type (income or expense)
    - **icon**: Optional icon identifier
    - **color**: Optional color code
    
    Returns the created category with timestamps.
    
    Raises:
        400: If category with same (name, type) already exists
    """
    try:
        category = await CategoryService.create_category(user_id, category_data)
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    user_id: str = Depends(get_current_user_id),
    type: Optional[str] = Query(None, description="Filter by category type (income or expense)")
):
    """
    Get all categories for the logged-in user.
    
    Optionally filter by category type using the 'type' query parameter.
    
    Returns categories sorted by name.
    """
    categories = await CategoryService.get_categories(user_id, type)
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get a single category by ID.
    
    Only returns the category if it belongs to the logged-in user.
    
    Raises:
        404: If category not found or doesn't belong to user
    """
    category = await CategoryService.get_category(user_id, category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update a category.
    
    All fields are optional. Only provided fields will be updated.
    
    Raises:
        404: If category not found or doesn't belong to user
        400: If update would create a duplicate category
    """
    try:
        category = await CategoryService.update_category(user_id, category_id, category_data)
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a category.
    
    Cannot delete a category that is in use by budget line items.
    
    Raises:
        404: If category not found or doesn't belong to user
        400: If category is in use by budget line items
    """
    try:
        deleted = await CategoryService.delete_category(user_id, category_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
