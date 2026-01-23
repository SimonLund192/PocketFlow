"""
Service layer for budget line item operations.

Handles business logic, validation, and database operations for budget line items.
"""

from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from app.database import budget_line_items_collection, budgets_collection, categories_collection
from app.models import (
    BudgetLineItemCreate,
    BudgetLineItemUpdate,
    BudgetLineItemInDB,
    BudgetLineItemResponse,
    BudgetLineItemWithCategory,
    CategoryResponse,
)


class BudgetLineItemService:
    """Service for managing budget line items with category validation"""

    @staticmethod
    async def create_line_item(
        line_item_data: BudgetLineItemCreate,
        user_id: str
    ) -> BudgetLineItemResponse:
        """
        Create a new budget line item.

        Validates:
        1. Budget exists and belongs to user
        2. Category exists and belongs to user
        3. Category is active

        Args:
            line_item_data: Line item creation data
            user_id: The logged-in User_ID

        Returns:
            BudgetLineItemResponse: The created line item

        Raises:
            ValueError: If budget or category doesn't exist or doesn't belong to user
        """
        # Validate budget exists and belongs to user
        budget_id_obj = ObjectId(line_item_data.budget_id)
        budget = await budgets_collection.find_one({
            "_id": budget_id_obj,
            "user_id": user_id
        })
        if not budget:
            raise ValueError("Budget not found or access denied")

        # Validate category exists and belongs to user
        category_id_obj = ObjectId(line_item_data.category_id)
        category = await categories_collection.find_one({
            "_id": category_id_obj,
            "user_id": user_id
        })
        if not category:
            raise ValueError("Category not found or access denied")

        # Validate category is active
        if not category.get("is_active", True):
            raise ValueError("Cannot use inactive category")

        # Create line item document
        now = datetime.now(timezone.utc)
        line_item_doc = {
            "user_id": user_id,
            "budget_id": budget_id_obj,
            "name": line_item_data.name,
            "category_id": category_id_obj,
            "amount": line_item_data.amount,
            "owner_slot": line_item_data.owner_slot,
            "created_at": now,
            "updated_at": now,
        }

        result = await budget_line_items_collection.insert_one(line_item_doc)
        line_item_doc["_id"] = result.inserted_id

        # Convert to response model
        return BudgetLineItemResponse(
            id=str(line_item_doc["_id"]),
            user_id=line_item_doc["user_id"],
            budget_id=str(line_item_doc["budget_id"]),
            name=line_item_doc["name"],
            category_id=str(line_item_doc["category_id"]),
            amount=line_item_doc["amount"],
            owner_slot=line_item_doc["owner_slot"],
            created_at=line_item_doc["created_at"],
            updated_at=line_item_doc["updated_at"],
        )

    @staticmethod
    async def get_line_items(
        user_id: str,
        budget_id: Optional[str] = None,
        include_category: bool = False
    ) -> list[BudgetLineItemResponse] | list[BudgetLineItemWithCategory]:
        """
        Get all line items for the logged-in user, optionally filtered by budget.

        Args:
            user_id: The logged-in User_ID
            budget_id: Optional budget ID to filter by
            include_category: Whether to populate category details

        Returns:
            List of line items, optionally with category info
        """
        # Build query
        query = {"user_id": user_id}
        if budget_id:
            query["budget_id"] = ObjectId(budget_id)

        # Fetch line items (sorted by created_at descending)
        cursor = budget_line_items_collection.find(query).sort("created_at", -1)
        line_items = await cursor.to_list(length=None)

        if not include_category:
            # Return simple response without category
            return [
                BudgetLineItemResponse(
                    id=str(item["_id"]),
                    user_id=item["user_id"],
                    budget_id=str(item["budget_id"]),
                    name=item["name"],
                    category_id=str(item["category_id"]),
                    amount=item["amount"],
                    owner_slot=item["owner_slot"],
                    created_at=item["created_at"],
                    updated_at=item["updated_at"],
                )
                for item in line_items
            ]

        # Populate category information
        result_with_category = []
        for item in line_items:
            category = await categories_collection.find_one({
                "_id": item["category_id"],
                "user_id": user_id
            })

            category_data = None
            if category:
                category_data = CategoryResponse(
                    id=str(category["_id"]),
                    user_id=category["user_id"],
                    name=category["name"],
                    type=category["type"],
                    icon=category["icon"],
                    color=category["color"],
                    # is_active=category.get("is_active", True),
                    created_at=category["created_at"],
                    updated_at=category["updated_at"],
                )

            result_with_category.append(
                BudgetLineItemWithCategory(
                    id=str(item["_id"]),
                    user_id=item["user_id"],
                    budget_id=str(item["budget_id"]),
                    name=item["name"],
                    category_id=str(item["category_id"]),
                    amount=item["amount"],
                    owner_slot=item["owner_slot"],
                    created_at=item["created_at"],
                    updated_at=item["updated_at"],
                    category=category_data,
                )
            )

        return result_with_category

    @staticmethod
    async def get_line_item(
        line_item_id: str,
        user_id: str,
        include_category: bool = False
    ) -> Optional[BudgetLineItemResponse] | Optional[BudgetLineItemWithCategory]:
        """
        Get a single line item by ID.

        Args:
            line_item_id: The line item ID
            user_id: The logged-in User_ID
            include_category: Whether to populate category details

        Returns:
            Line item or None if not found
        """
        line_item = await budget_line_items_collection.find_one({
            "_id": ObjectId(line_item_id),
            "user_id": user_id
        })

        if not line_item:
            return None

        if not include_category:
            return BudgetLineItemResponse(
                id=str(line_item["_id"]),
                user_id=line_item["user_id"],
                budget_id=str(line_item["budget_id"]),
                name=line_item["name"],
                category_id=str(line_item["category_id"]),
                amount=line_item["amount"],
                owner_slot=line_item["owner_slot"],
                created_at=line_item["created_at"],
                updated_at=line_item["updated_at"],
            )

        # Populate category
        category = await categories_collection.find_one({
            "_id": line_item["category_id"],
            "user_id": user_id
        })

        category_data = None
        if category:
            category_data = CategoryResponse(
                id=str(category["_id"]),
                user_id=category["user_id"],
                name=category["name"],
                type=category["type"],
                icon=category["icon"],
                color=category["color"],
                # is_active=category.get("is_active", True),
                created_at=category["created_at"],
                updated_at=category["updated_at"],
            )

        return BudgetLineItemWithCategory(
            id=str(line_item["_id"]),
            user_id=line_item["user_id"],
            budget_id=str(line_item["budget_id"]),
            name=line_item["name"],
            category_id=str(line_item["category_id"]),
            amount=line_item["amount"],
            owner_slot=line_item["owner_slot"],
            created_at=line_item["created_at"],
            updated_at=line_item["updated_at"],
            category=category_data,
        )

    @staticmethod
    async def update_line_item(
        line_item_id: str,
        update_data: BudgetLineItemUpdate,
        user_id: str
    ) -> Optional[BudgetLineItemResponse]:
        """
        Update a line item.

        Validates:
        1. Line item exists and belongs to user
        2. If category_id is provided, category exists and belongs to user

        Args:
            line_item_id: The line item ID
            update_data: Update data
            user_id: The logged-in User_ID

        Returns:
            Updated line item or None if not found

        Raises:
            ValueError: If category doesn't exist or doesn't belong to user
        """
        # Check if line item exists and belongs to user
        existing = await budget_line_items_collection.find_one({
            "_id": ObjectId(line_item_id),
            "user_id": user_id
        })

        if not existing:
            return None

        # Build update document
        update_dict = update_data.model_dump(exclude_unset=True)

        # If category_id is being updated, validate it
        if "category_id" in update_dict:
            category_id_obj = ObjectId(update_dict["category_id"])
            category = await categories_collection.find_one({
                "_id": category_id_obj,
                "user_id": user_id
            })
            if not category:
                raise ValueError("Category not found or access denied")

            # Validate category is active
            if not category.get("is_active", True):
                raise ValueError("Cannot use inactive category")

            # Convert to ObjectId for storage
            update_dict["category_id"] = category_id_obj

        # Always update the updated_at timestamp
        update_dict["updated_at"] = datetime.now(timezone.utc)

        # Update in database
        result = await budget_line_items_collection.find_one_and_update(
            {"_id": ObjectId(line_item_id), "user_id": user_id},
            {"$set": update_dict},
            return_document=True
        )

        if not result:
            return None

        return BudgetLineItemResponse(
            id=str(result["_id"]),
            user_id=result["user_id"],
            budget_id=str(result["budget_id"]),
            name=result["name"],
            category_id=str(result["category_id"]),
            amount=result["amount"],
            owner_slot=result["owner_slot"],
            created_at=result["created_at"],
            updated_at=result["updated_at"],
        )

    @staticmethod
    async def delete_line_item(line_item_id: str, user_id: str) -> bool:
        """
        Delete a line item.

        Args:
            line_item_id: The line item ID
            user_id: The logged-in User_ID

        Returns:
            True if deleted, False if not found
        """
        result = await budget_line_items_collection.delete_one({
            "_id": ObjectId(line_item_id),
            "user_id": user_id
        })
        return result.deleted_count > 0

    @staticmethod
    async def get_line_items_by_budget(
        budget_id: str,
        user_id: str,
        include_category: bool = True
    ) -> list[BudgetLineItemWithCategory]:
        """
        Get all line items for a specific budget.

        This is a convenience method that wraps get_line_items with budget_id filter.

        Args:
            budget_id: The budget ID
            user_id: The logged-in User_ID
            include_category: Whether to populate category details (default True)

        Returns:
            List of line items with category info
        """
        return await BudgetLineItemService.get_line_items(
            user_id=user_id,
            budget_id=budget_id,
            include_category=include_category
        )
