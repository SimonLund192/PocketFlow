"""
Tests for Category Service
"""
import pytest
from bson import ObjectId
from datetime import datetime

from app.services.category_service import CategoryService
from app.models import CategoryCreate, CategoryUpdate


@pytest.mark.asyncio
class TestCategoryService:
    """Test suite for CategoryService"""

    async def test_create_category_success(self, db_session, test_user_id):
        """Test successful category creation"""
        data = CategoryCreate(
            name="Groceries",
            type="expense",
            icon="shopping-cart",
            color="#FF5733"
        )
        
        category = await CategoryService.create_category(test_user_id, data)
        
        assert category.name == "Groceries"
        assert category.type == "expense"
        assert category.icon == "shopping-cart"
        assert category.color == "#FF5733"
        assert category.user_id == test_user_id
        assert category.id is not None
        assert category.created_at is not None
        assert category.updated_at is not None

    async def test_create_category_duplicate_fails(self, db_session, test_user_id):
        """Test that creating duplicate category fails"""
        data = CategoryCreate(
            name="Rent",
            type="expense",
            icon="home",
            color="#0099FF"
        )
        
        # Create first category
        await CategoryService.create_category(test_user_id, data)
        
        # Try to create duplicate
        with pytest.raises(ValueError, match="already exists"):
            await CategoryService.create_category(test_user_id, data)

    async def test_create_category_same_name_different_type_allowed(self, db_session, test_user_id):
        """Test that same name with different type is allowed"""
        data1 = CategoryCreate(name="Bonus", type="income", icon="dollar", color="#00FF00")
        data2 = CategoryCreate(name="Bonus", type="expense", icon="gift", color="#FF0000")
        
        category1 = await CategoryService.create_category(test_user_id, data1)
        category2 = await CategoryService.create_category(test_user_id, data2)
        
        assert category1.name == category2.name
        assert category1.type != category2.type

    async def test_get_categories_all(self, db_session, test_user_id):
        """Test getting all categories"""
        # Create multiple categories
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Salary", type="income", icon="dollar", color="#00FF00")
        )
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Groceries", type="expense", icon="cart", color="#FF0000")
        )
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Rent", type="expense", icon="home", color="#0000FF")
        )
        
        categories = await CategoryService.get_categories(test_user_id)
        
        assert len(categories) == 3
        # Should be sorted by name
        assert categories[0].name == "Groceries"
        assert categories[1].name == "Rent"
        assert categories[2].name == "Salary"

    async def test_get_categories_filtered_by_type(self, db_session, test_user_id):
        """Test getting categories filtered by type"""
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Salary", type="income", icon="dollar", color="#00FF00")
        )
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Groceries", type="expense", icon="cart", color="#FF0000")
        )
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Rent", type="expense", icon="home", color="#0000FF")
        )
        
        expense_categories = await CategoryService.get_categories(test_user_id, "expense")
        
        assert len(expense_categories) == 2
        assert all(cat.type == "expense" for cat in expense_categories)

    async def test_get_categories_user_isolation(self, db_session, test_user_id):
        """Test that users can only see their own categories"""
        other_user_id = "other_user_123"
        
        # Create category for test user
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="My Category", type="expense", icon="star", color="#FF0000")
        )
        
        # Create category for other user
        await CategoryService.create_category(
            other_user_id,
            CategoryCreate(name="Their Category", type="expense", icon="moon", color="#0000FF")
        )
        
        # Test user should only see their category
        test_user_categories = await CategoryService.get_categories(test_user_id)
        assert len(test_user_categories) == 1
        assert test_user_categories[0].name == "My Category"
        
        # Other user should only see their category
        other_user_categories = await CategoryService.get_categories(other_user_id)
        assert len(other_user_categories) == 1
        assert other_user_categories[0].name == "Their Category"

    async def test_get_category_by_id(self, db_session, test_user_id):
        """Test getting a single category by ID"""
        created = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Test", type="expense", icon="test", color="#000000")
        )
        
        category = await CategoryService.get_category(test_user_id, created.id)
        
        assert category is not None
        assert category.id == created.id
        assert category.name == "Test"

    async def test_get_category_invalid_id_returns_none(self, db_session, test_user_id):
        """Test that invalid category ID returns None"""
        category = await CategoryService.get_category(test_user_id, "invalid_id")
        assert category is None

    async def test_get_category_not_found_returns_none(self, db_session, test_user_id):
        """Test that non-existent category returns None"""
        fake_id = str(ObjectId())
        category = await CategoryService.get_category(test_user_id, fake_id)
        assert category is None

    async def test_get_category_different_user_returns_none(self, db_session, test_user_id):
        """Test that category from different user returns None"""
        other_user_id = "other_user_123"
        
        created = await CategoryService.create_category(
            other_user_id,
            CategoryCreate(name="Their Category", type="expense", icon="star", color="#FF0000")
        )
        
        # Test user should not be able to get other user's category
        category = await CategoryService.get_category(test_user_id, created.id)
        assert category is None

    async def test_update_category_success(self, db_session, test_user_id):
        """Test successful category update"""
        created = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Old Name", type="expense", icon="old", color="#000000")
        )
        
        update_data = CategoryUpdate(
            name="New Name",
            icon="new",
            color="#FFFFFF"
        )
        
        updated = await CategoryService.update_category(test_user_id, created.id, update_data)
        
        assert updated is not None
        assert updated.name == "New Name"
        assert updated.icon == "new"
        assert updated.color == "#FFFFFF"
        assert updated.type == "expense"  # Unchanged
        assert updated.updated_at > created.updated_at

    async def test_update_category_partial_update(self, db_session, test_user_id):
        """Test partial category update"""
        created = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Test", type="expense", icon="test", color="#000000")
        )
        
        update_data = CategoryUpdate(name="Updated Name")
        updated = await CategoryService.update_category(test_user_id, created.id, update_data)
        
        assert updated.name == "Updated Name"
        assert updated.icon == "test"  # Unchanged
        assert updated.color == "#000000"  # Unchanged

    async def test_update_category_duplicate_fails(self, db_session, test_user_id):
        """Test that updating to duplicate name/type fails"""
        await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Existing", type="expense", icon="star", color="#FF0000")
        )
        
        category2 = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="ToUpdate", type="expense", icon="moon", color="#0000FF")
        )
        
        # Try to update category2 to have same name as existing
        with pytest.raises(ValueError, match="already exists"):
            await CategoryService.update_category(
                test_user_id,
                category2.id,
                CategoryUpdate(name="Existing")
            )

    async def test_update_category_not_found(self, db_session, test_user_id):
        """Test updating non-existent category returns None"""
        fake_id = str(ObjectId())
        update_data = CategoryUpdate(name="New Name")
        
        result = await CategoryService.update_category(test_user_id, fake_id, update_data)
        assert result is None

    async def test_update_category_empty_update(self, db_session, test_user_id):
        """Test that empty update returns existing category"""
        created = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="Test", type="expense", icon="test", color="#000000")
        )
        
        update_data = CategoryUpdate()
        updated = await CategoryService.update_category(test_user_id, created.id, update_data)
        
        assert updated.name == created.name
        assert updated.type == created.type

    async def test_delete_category_success(self, db_session, test_user_id):
        """Test successful category deletion"""
        created = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="To Delete", type="expense", icon="trash", color="#FF0000")
        )
        
        deleted = await CategoryService.delete_category(test_user_id, created.id)
        assert deleted is True
        
        # Verify category no longer exists
        category = await CategoryService.get_category(test_user_id, created.id)
        assert category is None

    async def test_delete_category_not_found(self, db_session, test_user_id):
        """Test deleting non-existent category returns False"""
        fake_id = str(ObjectId())
        deleted = await CategoryService.delete_category(test_user_id, fake_id)
        assert deleted is False

    async def test_delete_category_invalid_id(self, db_session, test_user_id):
        """Test deleting with invalid ID returns False"""
        deleted = await CategoryService.delete_category(test_user_id, "invalid_id")
        assert deleted is False

    async def test_delete_category_in_use_fails(self, db_session, test_user_id):
        """Test that deleting category in use by line items fails"""
        from app.database import budget_line_items_collection
        
        # Create category
        category = await CategoryService.create_category(
            test_user_id,
            CategoryCreate(name="In Use", type="expense", icon="lock", color="#FF0000")
        )
        
        # Create a budget line item using this category
        await budget_line_items_collection.insert_one({
            "user_id": test_user_id,
            "budget_id": ObjectId(),
            "name": "Test Item",
            "category_id": ObjectId(category.id),
            "amount": 100.0,
            "owner_slot": "user1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Try to delete category
        with pytest.raises(ValueError, match="Cannot delete category"):
            await CategoryService.delete_category(test_user_id, category.id)
