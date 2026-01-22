from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId
from app.database import get_database
from app.models import Category, CategoryCreate, CategoryUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("/", response_model=List[Category])
async def get_categories(current_user: str = Depends(get_current_user)):
    """Get all categories for the current user"""
    db = await get_database()
    categories_collection = db["categories"]
    
    # Find user by email to get user_id
    users_collection = db["users"]
    user = await users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_id = str(user["_id"])
    
    # Get all categories for this user
    categories = []
    async for category in categories_collection.find({"user_id": user_id}):
        categories.append(Category(**category))
    
    return categories


@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: str = Depends(get_current_user)
):
    """Create a new category"""
    db = await get_database()
    categories_collection = db["categories"]
    users_collection = db["users"]
    
    # Find user by email to get user_id
    user = await users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_id = str(user["_id"])
    
    # Create category document
    category_doc = {
        "user_id": user_id,
        "name": category_data.name,
        "type": category_data.type,
        "icon": category_data.icon,
        "color": category_data.color,
    }
    
    # Insert category
    result = await categories_collection.insert_one(category_doc)
    category_doc["_id"] = result.inserted_id
    
    return Category(**category_doc)


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update a category"""
    db = await get_database()
    categories_collection = db["categories"]
    users_collection = db["users"]
    
    # Find user by email to get user_id
    user = await users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_id = str(user["_id"])
    
    # Check if category exists and belongs to user
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category ID")
    
    category = await categories_collection.find_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    # Build update document
    update_data = {k: v for k, v in category_data.model_dump(exclude_unset=True).items() if v is not None}
    
    if not update_data:
        return Category(**category)
    
    # Update category
    await categories_collection.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )
    
    # Get updated category
    updated_category = await categories_collection.find_one({"_id": ObjectId(category_id)})
    return Category(**updated_category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: str = Depends(get_current_user)
):
    """Delete a category"""
    db = await get_database()
    categories_collection = db["categories"]
    users_collection = db["users"]
    
    # Find user by email to get user_id
    user = await users_collection.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_id = str(user["_id"])
    
    # Check if category exists and belongs to user
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category ID")
    
    result = await categories_collection.delete_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    return None
