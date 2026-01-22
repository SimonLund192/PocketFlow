from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from app.database import get_database
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/database", tags=["database"])

@router.get("/collections", response_model=List[str])
async def get_collections(current_user: str = Depends(get_current_user)):
    """Get list of all collections in the database"""
    db = await get_database()
    collections = await db.list_collection_names()
    return collections

@router.get("/{collection_name}", response_model=List[Dict[str, Any]])
async def get_collection_data(
    collection_name: str,
    current_user: str = Depends(get_current_user),
    limit: int = 100
):
    """Get all documents from a specific collection"""
    db = await get_database()
    
    # Verify collection exists
    collections = await db.list_collection_names()
    if collection_name not in collections:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_name}' not found"
        )
    
    collection = db[collection_name]
    
    # For user-specific collections, filter by user
    users_collection = db["users"]
    user_doc = await users_collection.find_one({"email": current_user})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_id = str(user_doc["_id"])
    
    # Determine if collection should be filtered by user
    user_collections = ["transactions", "categories", "budgets", "goals"]
    
    if collection_name in user_collections:
        # Filter by user_id
        cursor = collection.find({"user_id": user_id}).limit(limit)
    elif collection_name == "users":
        # Only return current user's data
        cursor = collection.find({"_id": user_doc["_id"]}).limit(1)
    else:
        # Return all documents (for system collections)
        cursor = collection.find().limit(limit)
    
    documents = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for JSON serialization
    for doc in documents:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        if "user_id" in doc:
            doc["user_id"] = str(doc["user_id"])
    
    return documents

@router.get("/{collection_name}/count", response_model=Dict[str, int])
async def get_collection_count(
    collection_name: str,
    current_user: str = Depends(get_current_user)
):
    """Get count of documents in a collection"""
    db = await get_database()
    
    # Verify collection exists
    collections = await db.list_collection_names()
    if collection_name not in collections:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_name}' not found"
        )
    
    collection = db[collection_name]
    
    # Get user_id for filtering
    users_collection = db["users"]
    user_doc = await users_collection.find_one({"email": current_user})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_id = str(user_doc["_id"])
    
    # Determine if collection should be filtered by user
    user_collections = ["transactions", "categories", "budgets", "goals"]
    
    if collection_name in user_collections:
        count = await collection.count_documents({"user_id": user_id})
    elif collection_name == "users":
        count = 1  # Only current user
    else:
        count = await collection.count_documents({})
    
    return {"count": count}
