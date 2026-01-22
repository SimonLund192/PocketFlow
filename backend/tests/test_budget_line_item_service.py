"""
Tests for BudgetLineItemService

Tests cover:
- CRUD operations
- Category validation
- Budget validation
- User isolation
- Include category feature
"""

import pytest
from datetime import datetime
from bson import ObjectId

from app.services.budget_line_item_service import BudgetLineItemService
from app.models import BudgetLineItemCreate, BudgetLineItemUpdate


@pytest.mark.asyncio
class TestBudgetLineItemService:
    """Test suite for BudgetLineItemService"""

    # -------------------------------------------------------------------------
    # Create Tests
    # -------------------------------------------------------------------------

    async def test_create_line_item_success(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test successful line item creation"""
        line_item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        result = await BudgetLineItemService.create_line_item(
            line_item_data, test_user_id
        )

        assert result.name == "Rent"
        assert result.amount == 1500.0
        assert result.owner_slot == "user1"
        assert result.user_id == test_user_id
        assert result.budget_id == str(sample_budget["_id"])
        assert result.category_id == str(sample_category["_id"])

    async def test_create_line_item_budget_not_found(
        self, db_session, test_user_id, sample_category
    ):
        """Test creating line item with non-existent budget"""
        fake_budget_id = str(ObjectId())
        line_item_data = BudgetLineItemCreate(
            budget_id=fake_budget_id,
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        with pytest.raises(ValueError, match="Budget not found"):
            await BudgetLineItemService.create_line_item(
                line_item_data, test_user_id
            )

    async def test_create_line_item_category_not_found(
        self, db_session, test_user_id, sample_budget
    ):
        """Test creating line item with non-existent category"""
        fake_category_id = str(ObjectId())
        line_item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=fake_category_id,
            amount=1500.0,
            owner_slot="user1"
        )

        with pytest.raises(ValueError, match="Category not found"):
            await BudgetLineItemService.create_line_item(
                line_item_data, test_user_id
            )

    async def test_create_line_item_inactive_category(
        self, db_session, test_user_id, sample_budget, sample_inactive_category
    ):
        """Test creating line item with inactive category"""
        line_item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_inactive_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        with pytest.raises(ValueError, match="Cannot use inactive category"):
            await BudgetLineItemService.create_line_item(
                line_item_data, test_user_id
            )

    async def test_create_line_item_different_user_budget(
        self, db_session, test_user_id, sample_category
    ):
        """Test creating line item with budget belonging to different user"""
        from app.database import budgets_collection

        # Create budget for different user
        other_budget = await budgets_collection.insert_one({
            "user_id": "other_user",
            "month": "2026-02",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        line_item_data = BudgetLineItemCreate(
            budget_id=str(other_budget.inserted_id),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        with pytest.raises(ValueError, match="Budget not found or access denied"):
            await BudgetLineItemService.create_line_item(
                line_item_data, test_user_id
            )

    async def test_create_line_item_different_user_category(
        self, db_session, test_user_id, sample_budget
    ):
        """Test creating line item with category belonging to different user"""
        from app.database import categories_collection

        # Create category for different user
        other_category = await categories_collection.insert_one({
            "user_id": "other_user",
            "name": "Other Housing",
            "type": "personal-expenses",
            "icon": "home",
            "color": "#FF0000",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        line_item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(other_category.inserted_id),
            amount=1500.0,
            owner_slot="user1"
        )

        with pytest.raises(ValueError, match="Category not found or access denied"):
            await BudgetLineItemService.create_line_item(
                line_item_data, test_user_id
            )

    # -------------------------------------------------------------------------
    # Get Tests
    # -------------------------------------------------------------------------

    async def test_get_line_items_empty(self, db_session, test_user_id):
        """Test getting line items when none exist"""
        result = await BudgetLineItemService.get_line_items(test_user_id)
        assert result == []

    async def test_get_line_items_multiple(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test getting multiple line items"""
        # Create two line items
        item1_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )
        item2_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Utilities",
            category_id=str(sample_category["_id"]),
            amount=200.0,
            owner_slot="shared"
        )

        await BudgetLineItemService.create_line_item(item1_data, test_user_id)
        await BudgetLineItemService.create_line_item(item2_data, test_user_id)

        result = await BudgetLineItemService.get_line_items(test_user_id)
        assert len(result) == 2
        # Should be sorted by created_at descending (newest first)
        assert result[0].name == "Utilities"
        assert result[1].name == "Rent"

    async def test_get_line_items_with_category(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test getting line items with populated category"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        await BudgetLineItemService.create_line_item(item_data, test_user_id)

        result = await BudgetLineItemService.get_line_items(
            test_user_id, include_category=True
        )

        assert len(result) == 1
        assert result[0].category is not None
        assert result[0].category.name == sample_category["name"]
        assert result[0].category.type == sample_category["type"]

    async def test_get_line_items_filter_by_budget(
        self, db_session, test_user_id, sample_category
    ):
        """Test filtering line items by budget"""
        from app.database import budgets_collection

        # Create two budgets
        budget1 = await budgets_collection.insert_one({
            "user_id": test_user_id,
            "month": "2026-01",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        budget2 = await budgets_collection.insert_one({
            "user_id": test_user_id,
            "month": "2026-02",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        # Create line items for each budget
        item1_data = BudgetLineItemCreate(
            budget_id=str(budget1.inserted_id),
            name="Rent Jan",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )
        item2_data = BudgetLineItemCreate(
            budget_id=str(budget2.inserted_id),
            name="Rent Feb",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        await BudgetLineItemService.create_line_item(item1_data, test_user_id)
        await BudgetLineItemService.create_line_item(item2_data, test_user_id)

        # Filter by budget 1
        result = await BudgetLineItemService.get_line_items(
            test_user_id, budget_id=str(budget1.inserted_id)
        )

        assert len(result) == 1
        assert result[0].name == "Rent Jan"

    async def test_get_line_items_user_isolation(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test that users can only see their own line items"""
        from app.database import budget_line_items_collection

        # Create line item for test user
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Test User Item",
            category_id=str(sample_category["_id"]),
            amount=100.0,
            owner_slot="user1"
        )
        await BudgetLineItemService.create_line_item(item_data, test_user_id)

        # Create line item for other user directly in DB
        await budget_line_items_collection.insert_one({
            "user_id": "other_user",
            "budget_id": ObjectId(),
            "name": "Other User Item",
            "category_id": ObjectId(),
            "amount": 200.0,
            "owner_slot": "user1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        # Test user should only see their own item
        result = await BudgetLineItemService.get_line_items(test_user_id)
        assert len(result) == 1
        assert result[0].name == "Test User Item"

    # -------------------------------------------------------------------------
    # Get Single Item Tests
    # -------------------------------------------------------------------------

    async def test_get_line_item_by_id(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test getting a single line item by ID"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)
        result = await BudgetLineItemService.get_line_item(created.id, test_user_id)

        assert result is not None
        assert result.id == created.id
        assert result.name == "Rent"

    async def test_get_line_item_not_found(self, db_session, test_user_id):
        """Test getting non-existent line item"""
        fake_id = str(ObjectId())
        result = await BudgetLineItemService.get_line_item(fake_id, test_user_id)
        assert result is None

    async def test_get_line_item_with_category(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test getting line item with populated category"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)
        result = await BudgetLineItemService.get_line_item(
            created.id, test_user_id, include_category=True
        )

        assert result is not None
        assert result.category is not None
        assert result.category.name == sample_category["name"]

    # -------------------------------------------------------------------------
    # Update Tests
    # -------------------------------------------------------------------------

    async def test_update_line_item_name(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test updating line item name"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)

        update_data = BudgetLineItemUpdate(name="Apartment Rent")
        result = await BudgetLineItemService.update_line_item(
            created.id, update_data, test_user_id
        )

        assert result is not None
        assert result.name == "Apartment Rent"
        assert result.amount == 1500.0  # Unchanged

    async def test_update_line_item_amount(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test updating line item amount"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)

        update_data = BudgetLineItemUpdate(amount=1600.0)
        result = await BudgetLineItemService.update_line_item(
            created.id, update_data, test_user_id
        )

        assert result is not None
        assert result.amount == 1600.0
        assert result.name == "Rent"  # Unchanged

    async def test_update_line_item_category(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test updating line item category"""
        from app.database import categories_collection

        # Create initial line item
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )
        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)

        # Create a new category
        new_category = await categories_collection.insert_one({
            "user_id": test_user_id,
            "name": "Utilities",
            "type": "shared-expenses",
            "icon": "bolt",
            "color": "#FFFF00",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        # Update to new category
        update_data = BudgetLineItemUpdate(category_id=str(new_category.inserted_id))
        result = await BudgetLineItemService.update_line_item(
            created.id, update_data, test_user_id
        )

        assert result is not None
        assert result.category_id == str(new_category.inserted_id)

    async def test_update_line_item_invalid_category(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test updating to non-existent category"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )
        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)

        fake_category_id = str(ObjectId())
        update_data = BudgetLineItemUpdate(category_id=fake_category_id)

        with pytest.raises(ValueError, match="Category not found"):
            await BudgetLineItemService.update_line_item(
                created.id, update_data, test_user_id
            )

    async def test_update_line_item_to_inactive_category(
        self, db_session, test_user_id, sample_budget, sample_category,
        sample_inactive_category
    ):
        """Test updating to inactive category"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )
        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)

        update_data = BudgetLineItemUpdate(
            category_id=str(sample_inactive_category["_id"])
        )

        with pytest.raises(ValueError, match="Cannot use inactive category"):
            await BudgetLineItemService.update_line_item(
                created.id, update_data, test_user_id
            )

    async def test_update_line_item_not_found(self, db_session, test_user_id):
        """Test updating non-existent line item"""
        fake_id = str(ObjectId())
        update_data = BudgetLineItemUpdate(name="New Name")

        result = await BudgetLineItemService.update_line_item(
            fake_id, update_data, test_user_id
        )
        assert result is None

    # -------------------------------------------------------------------------
    # Delete Tests
    # -------------------------------------------------------------------------

    async def test_delete_line_item_success(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test successful line item deletion"""
        item_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )

        created = await BudgetLineItemService.create_line_item(item_data, test_user_id)
        deleted = await BudgetLineItemService.delete_line_item(created.id, test_user_id)

        assert deleted is True

        # Verify it's gone
        result = await BudgetLineItemService.get_line_item(created.id, test_user_id)
        assert result is None

    async def test_delete_line_item_not_found(self, db_session, test_user_id):
        """Test deleting non-existent line item"""
        fake_id = str(ObjectId())
        deleted = await BudgetLineItemService.delete_line_item(fake_id, test_user_id)
        assert deleted is False

    # -------------------------------------------------------------------------
    # Get by Budget Tests
    # -------------------------------------------------------------------------

    async def test_get_line_items_by_budget(
        self, db_session, test_user_id, sample_budget, sample_category
    ):
        """Test getting line items by budget"""
        item1_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Rent",
            category_id=str(sample_category["_id"]),
            amount=1500.0,
            owner_slot="user1"
        )
        item2_data = BudgetLineItemCreate(
            budget_id=str(sample_budget["_id"]),
            name="Utilities",
            category_id=str(sample_category["_id"]),
            amount=200.0,
            owner_slot="shared"
        )

        await BudgetLineItemService.create_line_item(item1_data, test_user_id)
        await BudgetLineItemService.create_line_item(item2_data, test_user_id)

        result = await BudgetLineItemService.get_line_items_by_budget(
            str(sample_budget["_id"]), test_user_id
        )

        assert len(result) == 2
        # All items should have category populated (default True)
        assert all(item.category is not None for item in result)
