"""
Integration tests for Budget API endpoints
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch

from app.services.budget_service import BudgetService
from app.models import BudgetCreate


@pytest.mark.asyncio
class TestBudgetAPI:
    """Test suite for Budget API endpoints"""

    @pytest.fixture
    def mock_user_id(self):
        """Mock user ID for authentication"""
        return "test_user_123"

    @pytest.fixture
    def auth_headers(self):
        """Mock authorization headers"""
        return {"Authorization": "Bearer mock_token"}

    async def test_create_budget_success(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test successful budget creation via API"""
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.post(
                "/api/budgets/",
                json={"month": "2026-01"},
                headers=auth_headers
            )
        
        assert response.status_code == 201
        data = response.json()
        assert data["month"] == "2026-01"
        assert data["user_id"] == mock_user_id
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_budget_duplicate_month_fails(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test that creating duplicate budget for same month fails"""
        budget_data = {"month": "2026-01"}
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            # Create first budget
            response1 = await async_client.post(
                "/api/budgets/",
                json=budget_data,
                headers=auth_headers
            )
            assert response1.status_code == 201
            
            # Try to create duplicate
            response2 = await async_client.post(
                "/api/budgets/",
                json=budget_data,
                headers=auth_headers
            )
            assert response2.status_code == 400
            assert "already exists" in response2.json()["detail"]

    async def test_create_budget_validation_error(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test that invalid month format returns validation error"""
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.post(
                "/api/budgets/",
                json={"month": "2026-13"},  # Invalid month
                headers=auth_headers
            )
        
        assert response.status_code == 422  # Validation error

    async def test_get_all_budgets(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting all budgets"""
        # Create test budgets
        await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2026-01"))
        await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2026-02"))
        await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2025-12"))
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                "/api/budgets/",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Should be sorted by month descending
        assert data[0]["month"] == "2026-02"
        assert data[1]["month"] == "2026-01"
        assert data[2]["month"] == "2025-12"

    async def test_get_all_budgets_empty(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting budgets when none exist"""
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                "/api/budgets/",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        assert response.json() == []

    async def test_get_budget_by_id(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting a single budget by ID"""
        created = await BudgetService.create_budget(
            mock_user_id,
            BudgetCreate(month="2026-01")
        )
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                f"/api/budgets/{created.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created.id
        assert data["month"] == "2026-01"

    async def test_get_budget_not_found(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test getting non-existent budget returns 404"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                f"/api/budgets/{fake_id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_get_budget_by_month(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting budget by month"""
        await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2026-01"))
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                "/api/budgets/by-month/2026-01",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["month"] == "2026-01"

    async def test_get_budget_by_month_not_found(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test getting budget by non-existent month returns 404"""
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.get(
                "/api/budgets/by-month/2026-01",
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_update_budget_success(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test successful budget update"""
        created = await BudgetService.create_budget(
            mock_user_id,
            BudgetCreate(month="2026-01")
        )
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.put(
                f"/api/budgets/{created.id}",
                json={"month": "2026-02"},
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["month"] == "2026-02"

    async def test_update_budget_not_found(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test updating non-existent budget returns 404"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.put(
                f"/api/budgets/{fake_id}",
                json={"month": "2026-02"},
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_update_budget_duplicate_month_fails(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test that updating to duplicate month fails"""
        await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2026-01"))
        budget2 = await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2026-02"))
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.put(
                f"/api/budgets/{budget2.id}",
                json={"month": "2026-01"},
                headers=auth_headers
            )
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    async def test_delete_budget_success(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test successful budget deletion"""
        created = await BudgetService.create_budget(
            mock_user_id,
            BudgetCreate(month="2026-01")
        )
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.delete(
                f"/api/budgets/{created.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 204
        
        # Verify budget is deleted
        budget = await BudgetService.get_budget(mock_user_id, created.id)
        assert budget is None

    async def test_delete_budget_not_found(self, async_client: AsyncClient, mock_user_id, auth_headers):
        """Test deleting non-existent budget returns 404"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.delete(
                f"/api/budgets/{fake_id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404

    async def test_delete_budget_cascades_to_line_items(self, async_client: AsyncClient, db_session, mock_user_id, auth_headers):
        """Test that deleting budget also deletes line items"""
        from app.database import budget_line_items_collection
        from bson import ObjectId
        from datetime import datetime
        
        # Create budget
        budget = await BudgetService.create_budget(mock_user_id, BudgetCreate(month="2026-01"))
        
        # Create line items
        await budget_line_items_collection.insert_one({
            "user_id": mock_user_id,
            "budget_id": ObjectId(budget.id),
            "name": "Test Item",
            "category_id": ObjectId(),
            "amount": 100.0,
            "owner_slot": "user1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Verify line item exists
        count_before = await budget_line_items_collection.count_documents({
            "budget_id": ObjectId(budget.id)
        })
        assert count_before == 1
        
        # Delete budget
        with patch("app.routes.budgets.get_current_user_id", return_value=mock_user_id):
            response = await async_client.delete(
                f"/api/budgets/{budget.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 204
        
        # Verify line items are deleted
        count_after = await budget_line_items_collection.count_documents({
            "budget_id": ObjectId(budget.id)
        })
        assert count_after == 0

    async def test_user_isolation(self, async_client: AsyncClient, db_session, auth_headers):
        """Test that users cannot access each other's budgets"""
        user1_id = "user_1"
        user2_id = "user_2"
        
        # Create budget for user 1
        budget1 = await BudgetService.create_budget(user1_id, BudgetCreate(month="2026-01"))
        
        # User 2 tries to get user 1's budget
        with patch("app.routes.budgets.get_current_user_id", return_value=user2_id):
            response = await async_client.get(
                f"/api/budgets/{budget1.id}",
                headers=auth_headers
            )
        
        assert response.status_code == 404  # Should not find it
        
        # User 2 should only see their own budgets
        with patch("app.routes.budgets.get_current_user_id", return_value=user2_id):
            response = await async_client.get(
                "/api/budgets/",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        assert len(response.json()) == 0  # User 2 has no budgets
