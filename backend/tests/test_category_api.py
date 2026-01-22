"""
Integration tests for Category API endpoints
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch

from app.services.category_service import CategoryService
from app.models import CategoryCreate


@pytest.mark.asyncio
class TestCategoryAPI:
    """Test suite for Category API endpoints"""

    @pytest.fixture
    def mock_user_id(self):
        """Mock user ID for authentication"""
        return "test_user_123"

    @pytest.fixture
    def auth_headers(self):
        """Mock authorization headers"""
        return {"Authorization": "Bearer mock_token"}

    async def test_create_category_success(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test successful category creation via API"""
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.post(
                "/api/categories/",
                json={
                    "name": "Groceries",
                    "type": "expense",
                    "icon": "shopping-cart",
                    "color": "#FF5733"
                },
                headers=auth_headers
            )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Groceries"
        assert data["type"] == "expense"
        assert data["user_id"] == mock_user_id
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_category_duplicate_fails(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test that creating duplicate category fails"""
        category_data = {
            "name": "Rent",
            "type": "expense",
            "icon": "home",
            "color": "#0099FF"
        }
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            # Create first category
            response1 = await async_client.post(
                "/api/categories/",
                json=category_data,
                headers=auth_headers
            )
            assert response1.status_code == 201
            
            # Try to create duplicate
            response2 = await async_client.post(
                "/api/categories/",
                json=category_data,
                headers=auth_headers
            )
            assert response2.status_code == 400
            assert "already exists" in response2.json()["detail"]

    async def test_create_category_validation_error(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test that invalid data returns validation error"""
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.post(
                "/api/categories/",
                json={
                    "name": "",  # Empty name should fail
                    "type": "expense"
                },
                headers=auth_headers
            )
        
        assert response.status_code == 422  # Validation error

    async def test_get_all_categories(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting all categories"""
        # Create test categories
        await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Salary", type="income", icon="dollar", color="#00FF00")
        )
        await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Groceries", type="expense", icon="cart", color="#FF0000")
        )
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                "/api/categories/",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Should be sorted by name
        assert data[0]["name"] == "Groceries"
        assert data[1]["name"] == "Salary"

    async def test_get_categories_filtered_by_type(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test filtering categories by type"""
        await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Salary", type="income", icon="dollar", color="#00FF00")
        )
        await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Groceries", type="expense", icon="cart", color="#FF0000")
        )
        await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Rent", type="expense", icon="home", color="#0000FF")
        )
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                "/api/categories/?type=expense",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(cat["type"] == "expense" for cat in data)

    async def test_get_category_by_id(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting a single category by ID"""
        created = await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Test", type="expense", icon="test", color="#000000")
        )
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                f"/api/categories/{created.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created.id
        assert data["name"] == "Test"

    async def test_get_category_not_found(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test getting non-existent category returns 404"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                f"/api/categories/{fake_id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_update_category_success(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test successful category update"""
        created = await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Old Name", type="expense", icon="old", color="#000000")
        )
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.put(
                f"/api/categories/{created.id}",
                json={
                    "name": "New Name",
                    "color": "#FFFFFF"
                },
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["color"] == "#FFFFFF"
        assert data["icon"] == "old"  # Unchanged

    async def test_update_category_not_found(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test updating non-existent category returns 404"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.put(
                f"/api/categories/{fake_id}",
                json={"name": "New Name"},
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_update_category_duplicate_fails(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test that updating to duplicate fails"""
        await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="Existing", type="expense", icon="star", color="#FF0000")
        )
        category2 = await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="ToUpdate", type="expense", icon="moon", color="#0000FF")
        )
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.put(
                f"/api/categories/{category2.id}",
                json={"name": "Existing"},
                headers=auth_headers
            )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    async def test_delete_category_success(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test successful category deletion"""
        created = await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="To Delete", type="expense", icon="trash", color="#FF0000")
        )
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.delete(
                f"/api/categories/{created.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 204
        
        # Verify category is deleted
        category = await CategoryService.get_category(mock_user_id, created.id)
        assert category is None

    async def test_delete_category_not_found(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test deleting non-existent category returns 404"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.delete(
                f"/api/categories/{fake_id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_delete_category_in_use_fails(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test that deleting category in use fails"""
        from app.database import budget_line_items_collection
        from bson import ObjectId
        from datetime import datetime
        
        # Create category
        category = await CategoryService.create_category(
            mock_user_id,
            CategoryCreate(name="In Use", type="expense", icon="lock", color="#FF0000")
        )
        
        # Create budget line item using this category
        await budget_line_items_collection.insert_one({
            "user_id": mock_user_id,
            "budget_id": ObjectId(),
            "name": "Test Item",
            "category_id": ObjectId(category.id),
            "amount": 100.0,
            "owner_slot": "user1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        with patch("app.routes.categories.get_current_user_id", return_value=mock_user_id):
            response = await async_client.delete(
                f"/api/categories/{category.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 400
        assert "Cannot delete category" in response.json()["detail"]

    async def test_user_isolation(self, async_client: AsyncClient, db_session, auth_headers):
        """Test that users cannot access each other's categories"""
        user1_id = "user_1"
        user2_id = "user_2"
        
        # Create category for user 1
        category1 = await CategoryService.create_category(
            user1_id,
            CategoryCreate(name="User1 Category", type="expense", icon="star", color="#FF0000")
        )
        
        # User 2 tries to get user 1's category
        with patch("app.routes.categories.get_current_user_id", return_value=user2_id):
            response = await async_client.get(
                f"/api/categories/{category1.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404  # Should not find it
        
        # User 2 should only see their own categories
        with patch("app.routes.categories.get_current_user_id", return_value=user2_id):
            response = await async_client.get(
                "/api/categories/",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        assert len(response.json()) == 0  # User 2 has no categories
