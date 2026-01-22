"""
Tests for Budget Service
"""
import pytest
from bson import ObjectId
from datetime import datetime

from app.services.budget_service import BudgetService
from app.models import BudgetCreate, BudgetUpdate


@pytest.mark.asyncio
class TestBudgetService:
    """Test suite for BudgetService"""

    async def test_create_budget_success(self, db_session, test_user_id):
        """Test successful budget creation"""
        data = BudgetCreate(month="2026-01")
        
        budget = await BudgetService.create_budget(test_user_id, data)
        
        assert budget.month == "2026-01"
        assert budget.user_id == test_user_id
        assert budget.id is not None
        assert budget.created_at is not None
        assert budget.updated_at is not None

    async def test_create_budget_duplicate_month_fails(self, db_session, test_user_id):
        """Test that creating duplicate budget for same month fails"""
        data = BudgetCreate(month="2026-01")
        
        # Create first budget
        await BudgetService.create_budget(test_user_id, data)
        
        # Try to create duplicate
        with pytest.raises(ValueError, match="already exists"):
            await BudgetService.create_budget(test_user_id, data)

    async def test_create_budget_different_users_same_month_allowed(self, db_session, test_user_id):
        """Test that different users can have budgets for the same month"""
        other_user_id = "other_user_123"
        data = BudgetCreate(month="2026-01")
        
        budget1 = await BudgetService.create_budget(test_user_id, data)
        budget2 = await BudgetService.create_budget(other_user_id, data)
        
        assert budget1.month == budget2.month
        assert budget1.user_id != budget2.user_id

    async def test_get_budgets_all(self, db_session, test_user_id):
        """Test getting all budgets"""
        # Create multiple budgets
        await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-02"))
        await BudgetService.create_budget(test_user_id, BudgetCreate(month="2025-12"))
        
        budgets = await BudgetService.get_budgets(test_user_id)
        
        assert len(budgets) == 3
        # Should be sorted by month descending (newest first)
        assert budgets[0].month == "2026-02"
        assert budgets[1].month == "2026-01"
        assert budgets[2].month == "2025-12"

    async def test_get_budgets_empty(self, db_session, test_user_id):
        """Test getting budgets when none exist"""
        budgets = await BudgetService.get_budgets(test_user_id)
        assert len(budgets) == 0

    async def test_get_budgets_user_isolation(self, db_session, test_user_id):
        """Test that users can only see their own budgets"""
        other_user_id = "other_user_123"
        
        # Create budget for test user
        await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        
        # Create budget for other user
        await BudgetService.create_budget(other_user_id, BudgetCreate(month="2026-02"))
        
        # Test user should only see their budget
        test_user_budgets = await BudgetService.get_budgets(test_user_id)
        assert len(test_user_budgets) == 1
        assert test_user_budgets[0].month == "2026-01"
        
        # Other user should only see their budget
        other_user_budgets = await BudgetService.get_budgets(other_user_id)
        assert len(other_user_budgets) == 1
        assert other_user_budgets[0].month == "2026-02"

    async def test_get_budget_by_id(self, db_session, test_user_id):
        """Test getting a single budget by ID"""
        created = await BudgetService.create_budget(
            test_user_id,
            BudgetCreate(month="2026-01")
        )
        
        budget = await BudgetService.get_budget(test_user_id, created.id)
        
        assert budget is not None
        assert budget.id == created.id
        assert budget.month == "2026-01"

    async def test_get_budget_invalid_id_returns_none(self, db_session, test_user_id):
        """Test that invalid budget ID returns None"""
        budget = await BudgetService.get_budget(test_user_id, "invalid_id")
        assert budget is None

    async def test_get_budget_not_found_returns_none(self, db_session, test_user_id):
        """Test that non-existent budget returns None"""
        fake_id = str(ObjectId())
        budget = await BudgetService.get_budget(test_user_id, fake_id)
        assert budget is None

    async def test_get_budget_different_user_returns_none(self, db_session, test_user_id):
        """Test that budget from different user returns None"""
        other_user_id = "other_user_123"
        
        created = await BudgetService.create_budget(
            other_user_id,
            BudgetCreate(month="2026-01")
        )
        
        # Test user should not be able to get other user's budget
        budget = await BudgetService.get_budget(test_user_id, created.id)
        assert budget is None

    async def test_get_budget_by_month(self, db_session, test_user_id):
        """Test getting budget by month string"""
        await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        
        budget = await BudgetService.get_budget_by_month(test_user_id, "2026-01")
        
        assert budget is not None
        assert budget.month == "2026-01"

    async def test_get_budget_by_month_not_found(self, db_session, test_user_id):
        """Test getting budget by non-existent month returns None"""
        budget = await BudgetService.get_budget_by_month(test_user_id, "2026-01")
        assert budget is None

    async def test_get_budget_by_month_user_isolation(self, db_session, test_user_id):
        """Test that get by month respects user isolation"""
        other_user_id = "other_user_123"
        
        await BudgetService.create_budget(other_user_id, BudgetCreate(month="2026-01"))
        
        # Test user should not find other user's budget
        budget = await BudgetService.get_budget_by_month(test_user_id, "2026-01")
        assert budget is None

    async def test_update_budget_success(self, db_session, test_user_id):
        """Test successful budget update"""
        created = await BudgetService.create_budget(
            test_user_id,
            BudgetCreate(month="2026-01")
        )
        
        update_data = BudgetUpdate(month="2026-02")
        updated = await BudgetService.update_budget(test_user_id, created.id, update_data)
        
        assert updated is not None
        assert updated.month == "2026-02"
        assert updated.updated_at > created.updated_at

    async def test_update_budget_duplicate_month_fails(self, db_session, test_user_id):
        """Test that updating to duplicate month fails"""
        await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        budget2 = await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-02"))
        
        # Try to update budget2 to have same month as first budget
        with pytest.raises(ValueError, match="already exists"):
            await BudgetService.update_budget(
                test_user_id,
                budget2.id,
                BudgetUpdate(month="2026-01")
            )

    async def test_update_budget_same_month_allowed(self, db_session, test_user_id):
        """Test that updating to same month is allowed (no-op)"""
        created = await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        
        # Update to same month should work
        updated = await BudgetService.update_budget(
            test_user_id,
            created.id,
            BudgetUpdate(month="2026-01")
        )
        
        assert updated is not None
        assert updated.month == "2026-01"

    async def test_update_budget_not_found(self, db_session, test_user_id):
        """Test updating non-existent budget returns None"""
        fake_id = str(ObjectId())
        update_data = BudgetUpdate(month="2026-02")
        
        result = await BudgetService.update_budget(test_user_id, fake_id, update_data)
        assert result is None

    async def test_update_budget_empty_update(self, db_session, test_user_id):
        """Test that empty update returns existing budget"""
        created = await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        
        update_data = BudgetUpdate()
        updated = await BudgetService.update_budget(test_user_id, created.id, update_data)
        
        assert updated.month == created.month

    async def test_delete_budget_success(self, db_session, test_user_id):
        """Test successful budget deletion"""
        created = await BudgetService.create_budget(
            test_user_id,
            BudgetCreate(month="2026-01")
        )
        
        deleted = await BudgetService.delete_budget(test_user_id, created.id)
        assert deleted is True
        
        # Verify budget no longer exists
        budget = await BudgetService.get_budget(test_user_id, created.id)
        assert budget is None

    async def test_delete_budget_not_found(self, db_session, test_user_id):
        """Test deleting non-existent budget returns False"""
        fake_id = str(ObjectId())
        deleted = await BudgetService.delete_budget(test_user_id, fake_id)
        assert deleted is False

    async def test_delete_budget_invalid_id(self, db_session, test_user_id):
        """Test deleting with invalid ID returns False"""
        deleted = await BudgetService.delete_budget(test_user_id, "invalid_id")
        assert deleted is False

    async def test_delete_budget_cascades_to_line_items(self, db_session, test_user_id):
        """Test that deleting budget also deletes associated line items"""
        from app.database import budget_line_items_collection
        
        # Create budget
        budget = await BudgetService.create_budget(test_user_id, BudgetCreate(month="2026-01"))
        
        # Create some line items for this budget
        line_item1 = {
            "user_id": test_user_id,
            "budget_id": ObjectId(budget.id),
            "name": "Test Item 1",
            "category_id": ObjectId(),
            "amount": 100.0,
            "owner_slot": "user1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        line_item2 = {
            "user_id": test_user_id,
            "budget_id": ObjectId(budget.id),
            "name": "Test Item 2",
            "category_id": ObjectId(),
            "amount": 200.0,
            "owner_slot": "shared",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await budget_line_items_collection.insert_one(line_item1)
        await budget_line_items_collection.insert_one(line_item2)
        
        # Verify line items exist
        count_before = await budget_line_items_collection.count_documents({
            "user_id": test_user_id,
            "budget_id": ObjectId(budget.id)
        })
        assert count_before == 2
        
        # Delete budget
        deleted = await BudgetService.delete_budget(test_user_id, budget.id)
        assert deleted is True
        
        # Verify line items are also deleted
        count_after = await budget_line_items_collection.count_documents({
            "user_id": test_user_id,
            "budget_id": ObjectId(budget.id)
        })
        assert count_after == 0

    async def test_delete_budget_user_isolation(self, db_session, test_user_id):
        """Test that user cannot delete another user's budget"""
        other_user_id = "other_user_123"
        
        # Create budget for other user
        created = await BudgetService.create_budget(
            other_user_id,
            BudgetCreate(month="2026-01")
        )
        
        # Test user tries to delete other user's budget
        deleted = await BudgetService.delete_budget(test_user_id, created.id)
        assert deleted is False
        
        # Verify budget still exists for other user
        budget = await BudgetService.get_budget(other_user_id, created.id)
        assert budget is not None
