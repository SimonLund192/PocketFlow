"""
Category Service
Handles business logic for category CRUD operations.
"""
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone

from app.database import categories_collection, budget_line_items_collection
from app.models import CategoryCreate, CategoryUpdate, CategoryInDB, CategoryResponse


class CategoryService:
    """Service for managing categories"""

    @staticmethod
    async def create_category(user_id: str, data: CategoryCreate) -> CategoryResponse:
        """
        Create a new category for the user.
        
        Args:
            user_id: The logged-in user's ID
            data: Category creation data
            
        Returns:
            Created category
            
        Raises:
            ValueError: If category with same (name, type) already exists
        """
        # Check for duplicate
        existing = await categories_collection.find_one({
            "user_id": user_id,
            "name": data.name,
            "type": data.type
        })
        
        if existing:
            raise ValueError(
                f"Category '{data.name}' of type '{data.type}' already exists"
            )
        
        # Create category document
        now = datetime.now(timezone.utc)
        category_doc = CategoryInDB(
            user_id=user_id,
            name=data.name,
            type=data.type,
            icon=data.icon,
            color=data.color,
            created_at=now,
            updated_at=now
        )
        
        # Insert into database
        doc_dict = category_doc.model_dump(by_alias=True, exclude_none=True)
        result = await categories_collection.insert_one(doc_dict)
        
        # Fetch and return created category
        created = await categories_collection.find_one({
            "_id": result.inserted_id,
            "user_id": user_id
        })
        
        if not created:
            raise RuntimeError("Failed to retrieve created category")
        
        return CategoryService._to_response(created)

    @staticmethod
    async def get_categories(
        user_id: str,
        category_type: Optional[str] = None
    ) -> List[CategoryResponse]:
        """
        Get all categories for the user, optionally filtered by type.
        
        Args:
            user_id: The logged-in user's ID
            category_type: Optional filter by category type
            
        Returns:
            List of categories
        """
        query = {"user_id": user_id}
        
        if category_type:
            query["type"] = category_type
        
        cursor = categories_collection.find(query).sort("name", 1)
        categories = await cursor.to_list(length=None)
        
        return [CategoryService._to_response(cat) for cat in categories]

    @staticmethod
    async def get_category(user_id: str, category_id: str) -> Optional[CategoryResponse]:
        """
        Get a single category by ID.
        
        Args:
            user_id: The logged-in user's ID
            category_id: The category ID
            
        Returns:
            Category if found, None otherwise
        """
        if not ObjectId.is_valid(category_id):
            return None
        
        category = await categories_collection.find_one({
            "_id": ObjectId(category_id),
            "user_id": user_id
        })
        
        if not category:
            return None
        
        return CategoryService._to_response(category)

    @staticmethod
    async def update_category(
        user_id: str,
        category_id: str,
        data: CategoryUpdate
    ) -> Optional[CategoryResponse]:
        """
        Update a category.
        
        Args:
            user_id: The logged-in user's ID
            category_id: The category ID to update
            data: Update data
            
        Returns:
            Updated category if found, None otherwise
            
        Raises:
            ValueError: If update would create a duplicate
        """
        if not ObjectId.is_valid(category_id):
            return None
        
        # Check if category exists
        existing = await categories_collection.find_one({
            "_id": ObjectId(category_id),
            "user_id": user_id
        })
        
        if not existing:
            return None
        
        # Build update document (only include provided fields)
        update_data = data.model_dump(exclude_none=True)
        
        if not update_data:
            # No fields to update, return existing
            return CategoryService._to_response(existing)
        
        # Check for duplicate if name or type is being changed
        if "name" in update_data or "type" in update_data:
            new_name = update_data.get("name", existing["name"])
            new_type = update_data.get("type", existing["type"])
            
            duplicate = await categories_collection.find_one({
                "_id": {"$ne": ObjectId(category_id)},
                "user_id": user_id,
                "name": new_name,
                "type": new_type
            })
            
            if duplicate:
                raise ValueError(
                    f"Category '{new_name}' of type '{new_type}' already exists"
                )
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update category
        result = await categories_collection.update_one(
            {
                "_id": ObjectId(category_id),
                "user_id": user_id
            },
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return None
        
        # Fetch and return updated category
        updated = await categories_collection.find_one({
            "_id": ObjectId(category_id),
            "user_id": user_id
        })
        
        return CategoryService._to_response(updated)

    @staticmethod
    async def delete_category(user_id: str, category_id: str) -> bool:
        """
        Delete a category if it's not in use.
        
        Args:
            user_id: The logged-in user's ID
            category_id: The category ID to delete
            
        Returns:
            True if deleted, False if not found
            
        Raises:
            ValueError: If category is in use by budget line items
        """
        if not ObjectId.is_valid(category_id):
            return False
        
        # Check if category exists
        existing = await categories_collection.find_one({
            "_id": ObjectId(category_id),
            "user_id": user_id
        })
        
        if not existing:
            return False
        
        # Check if category is in use
        usage_count = await budget_line_items_collection.count_documents({
            "user_id": user_id,
            "category_id": ObjectId(category_id)
        })
        
        if usage_count > 0:
            raise ValueError(
                f"Cannot delete category: it is used in {usage_count} budget line item(s)"
            )
        
        # Delete category
        result = await categories_collection.delete_one({
            "_id": ObjectId(category_id),
            "user_id": user_id
        })
        
        return result.deleted_count > 0

    @staticmethod
    def _to_response(category_doc: dict) -> CategoryResponse:
        """Convert MongoDB document to CategoryResponse"""
        # from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        return CategoryResponse(
            id=str(category_doc["_id"]),
            user_id=category_doc["user_id"],
            name=category_doc["name"],
            type=category_doc["type"],
            icon=category_doc.get("icon"),
            color=category_doc.get("color"),
            created_at=category_doc.get("created_at", now),
            updated_at=category_doc.get("updated_at", now)
        )
