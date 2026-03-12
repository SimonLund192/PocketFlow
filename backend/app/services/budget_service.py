"""
Budget Service
Handles business logic for budget CRUD operations.
"""
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone

from app.database import budgets_collection, budget_line_items_collection, categories_collection
from app.models import (
    BudgetCreate,
    BudgetUpdate,
    BudgetInDB,
    BudgetResponse,
    BudgetDraftRowResponse,
    CategoryResponse,
)


class BudgetService:
    """Service for managing budgets"""

    @staticmethod
    async def ensure_budget(user_id: str, month: str) -> BudgetResponse:
        """Get the user's budget for a month, creating it if needed."""
        existing = await BudgetService.get_budget_by_month(user_id, month)
        if existing:
            return existing
        return await BudgetService.create_budget(user_id, BudgetCreate(month=month))

    @staticmethod
    async def create_budget(user_id: str, data: BudgetCreate) -> BudgetResponse:
        """
        Create a new budget for the user.
        
        Args:
            user_id: The logged-in user's ID
            data: Budget creation data
            
        Returns:
            Created budget
            
        Raises:
            ValueError: If budget for the same month already exists
        """
        # Check for duplicate (user can only have one budget per month)
        existing = await budgets_collection.find_one({
            "user_id": user_id,
            "month": data.month
        })
        
        if existing:
            raise ValueError(
                f"Budget for month '{data.month}' already exists"
            )
        
        # Create budget document
        budget_doc = BudgetInDB(
            user_id=user_id,
            month=data.month
        )
        
        # Insert into database
        doc_dict = budget_doc.model_dump(by_alias=True, exclude_none=True)
        result = await budgets_collection.insert_one(doc_dict)
        
        # Fetch and return created budget
        created = await budgets_collection.find_one({
            "_id": result.inserted_id,
            "user_id": user_id
        })
        
        if not created:
            raise RuntimeError("Failed to retrieve created budget")
        
        return BudgetService._to_response(created)

    @staticmethod
    async def get_budgets(user_id: str) -> List[BudgetResponse]:
        """
        Get all budgets for the user, sorted by month (newest first).
        
        Args:
            user_id: The logged-in user's ID
            
        Returns:
            List of budgets
        """
        cursor = budgets_collection.find({"user_id": user_id}).sort("month", -1)
        budgets = await cursor.to_list(length=None)
        
        return [BudgetService._to_response(budget) for budget in budgets]

    @staticmethod
    async def get_budget(user_id: str, budget_id: str) -> Optional[BudgetResponse]:
        """
        Get a single budget by ID.
        
        Args:
            user_id: The logged-in user's ID
            budget_id: The budget ID
            
        Returns:
            Budget if found, None otherwise
        """
        if not ObjectId.is_valid(budget_id):
            return None
        
        budget = await budgets_collection.find_one({
            "_id": ObjectId(budget_id),
            "user_id": user_id
        })
        
        if not budget:
            return None
        
        return BudgetService._to_response(budget)

    @staticmethod
    async def get_budget_by_month(user_id: str, month: str) -> Optional[BudgetResponse]:
        """
        Get a budget by month string.
        
        Args:
            user_id: The logged-in user's ID
            month: Month in YYYY-MM format
            
        Returns:
            Budget if found, None otherwise
        """
        budget = await budgets_collection.find_one({
            "user_id": user_id,
            "month": month
        })
        
        if not budget:
            return None
        
        return BudgetService._to_response(budget)

    @staticmethod
    async def update_budget(
        user_id: str,
        budget_id: str,
        data: BudgetUpdate
    ) -> Optional[BudgetResponse]:
        """
        Update a budget.
        
        Args:
            user_id: The logged-in user's ID
            budget_id: The budget ID to update
            data: Update data
            
        Returns:
            Updated budget if found, None otherwise
            
        Raises:
            ValueError: If update would create a duplicate month
        """
        if not ObjectId.is_valid(budget_id):
            return None
        
        # Check if budget exists
        existing = await budgets_collection.find_one({
            "_id": ObjectId(budget_id),
            "user_id": user_id
        })
        
        if not existing:
            return None
        
        # Build update document (only include provided fields)
        update_data = data.model_dump(exclude_none=True)
        
        if not update_data:
            # No fields to update, return existing
            return BudgetService._to_response(existing)
        
        # Check for duplicate month if month is being changed
        if "month" in update_data and update_data["month"] != existing["month"]:
            duplicate = await budgets_collection.find_one({
                "_id": {"$ne": ObjectId(budget_id)},
                "user_id": user_id,
                "month": update_data["month"]
            })
            
            if duplicate:
                raise ValueError(
                    f"Budget for month '{update_data['month']}' already exists"
                )
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update budget
        result = await budgets_collection.update_one(
            {
                "_id": ObjectId(budget_id),
                "user_id": user_id
            },
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return None
        
        # Fetch and return updated budget
        updated = await budgets_collection.find_one({
            "_id": ObjectId(budget_id),
            "user_id": user_id
        })
        
        return BudgetService._to_response(updated)

    @staticmethod
    async def delete_budget(user_id: str, budget_id: str) -> bool:
        """
        Delete a budget and all its line items.
        
        Args:
            user_id: The logged-in user's ID
            budget_id: The budget ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        if not ObjectId.is_valid(budget_id):
            return False
        
        # Check if budget exists
        existing = await budgets_collection.find_one({
            "_id": ObjectId(budget_id),
            "user_id": user_id
        })
        
        if not existing:
            return False
        
        # Delete all associated line items first
        await budget_line_items_collection.delete_many({
            "user_id": user_id,
            "budget_id": ObjectId(budget_id)
        })
        
        # Delete budget
        result = await budgets_collection.delete_one({
            "_id": ObjectId(budget_id),
            "user_id": user_id
        })
        
        return result.deleted_count > 0

    @staticmethod
    def _to_response(budget_doc: dict) -> BudgetResponse:
        """Convert MongoDB document to BudgetResponse"""
        return BudgetResponse(
            id=str(budget_doc["_id"]),
            user_id=budget_doc["user_id"],
            month=budget_doc["month"],
            created_at=budget_doc["created_at"],
            updated_at=budget_doc["updated_at"]
        )

    @staticmethod
    async def initialize_budget_month(
        user_id: str,
        month: str,
        mode: str,
    ) -> tuple[BudgetResponse, list[BudgetDraftRowResponse], Optional[str]]:
        """
        Initialize a month for draft editing.

        If the target month already has line items, they are returned unchanged.
        If not, the month can optionally be seeded from the most recent previous budget.
        """
        budget = await BudgetService.ensure_budget(user_id, month)
        budget_id_obj = ObjectId(budget.id)

        existing_items = await budget_line_items_collection.find(
            {"user_id": user_id, "budget_id": budget_id_obj}
        ).sort("created_at", 1).to_list(length=None)
        if existing_items:
            rows = await BudgetService._draft_rows_from_items(existing_items, user_id, "existing")
            return budget, rows, None

        source_budget_month = None
        if mode == "copy_previous":
            previous_budget = await budgets_collection.find_one(
                {"user_id": user_id, "month": {"$lt": month}},
                sort=[("month", -1)],
            )

            if previous_budget:
                source_budget_month = previous_budget["month"]
                previous_items = await budget_line_items_collection.find(
                    {"user_id": user_id, "budget_id": previous_budget["_id"]}
                ).sort("created_at", 1).to_list(length=None)

                if previous_items:
                    now = datetime.now(timezone.utc)
                    copies = []
                    for item in previous_items:
                        copies.append({
                            "user_id": user_id,
                            "budget_id": budget_id_obj,
                            "name": item["name"],
                            "category_id": item["category_id"],
                            "amount": item["amount"],
                            "owner_slot": item["owner_slot"],
                            "created_at": now,
                            "updated_at": now,
                        })
                    if copies:
                        await budget_line_items_collection.insert_many(copies)

        items = await budget_line_items_collection.find(
            {"user_id": user_id, "budget_id": budget_id_obj}
        ).sort("created_at", 1).to_list(length=None)
        source = "copied" if mode == "copy_previous" else "manual"
        rows = await BudgetService._draft_rows_from_items(items, user_id, source)
        return budget, rows, source_budget_month

    @staticmethod
    async def _draft_rows_from_items(
        items: list[dict],
        user_id: str,
        source: str,
    ) -> list[BudgetDraftRowResponse]:
        """Populate categories on a list of stored line items."""
        category_ids = list({item["category_id"] for item in items})
        categories = {}
        if category_ids:
            cursor = categories_collection.find(
                {"_id": {"$in": category_ids}, "user_id": user_id}
            )
            async for cat in cursor:
                categories[cat["_id"]] = CategoryResponse(
                    id=str(cat["_id"]),
                    user_id=cat["user_id"],
                    name=cat["name"],
                    type=cat["type"],
                    icon=cat.get("icon", ""),
                    color=cat.get("color", ""),
                    created_at=cat["created_at"],
                    updated_at=cat["updated_at"],
                )

        rows: list[BudgetDraftRowResponse] = []
        for item in items:
            category = categories.get(item["category_id"])
            rows.append(
                BudgetDraftRowResponse(
                    id=str(item["_id"]),
                    name=item["name"],
                    category_id=str(item["category_id"]),
                    amount=item["amount"],
                    owner_slot=item["owner_slot"],
                    include=True,
                    source=source,
                    needs_review=False,
                    category=category,
                )
            )
        return rows
