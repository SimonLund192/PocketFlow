"""
API integration tests for budget line items endpoints

Tests cover:
- All CRUD endpoints
- Authentication
- Validation
- User isolation
- Category population
"""

import pytest
from datetime import datetime, timezone
from bson import ObjectId
from unittest.mock import patch

from app.database import budget_line_items_collection


@pytest.mark.asyncio
class TestBudgetLineItemsAPI:
    """Test suite for budget line items API endpoints"""

    # -------------------------------------------------------------------------
    # Create Tests
    # -------------------------------------------------------------------------

    @patch("app.dependencies.get_current_user_id")
    async def test_create_line_item_success(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test successful line item creation"""
        mock_get_user.return_value = test_user_id

        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }

        response = await async_client.post("/api/budget-line-items/", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Rent"
        assert data["amount"] == 1500.0
        assert data["owner_slot"] == "user1"
        assert data["user_id"] == test_user_id
        assert "id" in data
        assert "created_at" in data

    @patch("app.dependencies.get_current_user_id")
    async def test_create_line_item_invalid_budget(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_category
    ):
        """Test creating line item with invalid budget"""
        mock_get_user.return_value = test_user_id

        payload = {
            "budget_id": str(ObjectId()),  # Non-existent budget
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }

        response = await async_client.post("/api/budget-line-items/", json=payload)

        assert response.status_code == 400
        assert "Budget not found" in response.json()["detail"]

    @patch("app.dependencies.get_current_user_id")
    async def test_create_line_item_invalid_category(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget
    ):
        """Test creating line item with invalid category"""
        mock_get_user.return_value = test_user_id

        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(ObjectId()),  # Non-existent category
            "amount": 1500.0,
            "owner_slot": "user1"
        }

        response = await async_client.post("/api/budget-line-items/", json=payload)

        assert response.status_code == 400
        assert "Category not found" in response.json()["detail"]

    @patch("app.dependencies.get_current_user_id")
    async def test_create_line_item_inactive_category(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_inactive_category
    ):
        """Test creating line item with inactive category"""
        mock_get_user.return_value = test_user_id

        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_inactive_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }

        response = await async_client.post("/api/budget-line-items/", json=payload)

        assert response.status_code == 400
        assert "inactive category" in response.json()["detail"].lower()

    @patch("app.dependencies.get_current_user_id")
    async def test_create_line_item_validation_errors(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test validation errors on line item creation"""
        mock_get_user.return_value = test_user_id

        # Missing required fields
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent"
            # Missing category_id, amount, owner_slot
        }

        response = await async_client.post("/api/budget-line-items/", json=payload)
        assert response.status_code == 422

        # Negative amount
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": -100.0,
            "owner_slot": "user1"
        }

        response = await async_client.post("/api/budget-line-items/", json=payload)
        assert response.status_code == 422

    # -------------------------------------------------------------------------
    # Get All Tests
    # -------------------------------------------------------------------------

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_items_empty(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id
    ):
        """Test getting line items when none exist"""
        mock_get_user.return_value = test_user_id

        response = await async_client.get("/api/budget-line-items/")

        assert response.status_code == 200
        assert response.json() == []

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_items_multiple(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test getting multiple line items"""
        mock_get_user.return_value = test_user_id

        # Create two line items
        payload1 = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        payload2 = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Utilities",
            "category_id": str(sample_category["_id"]),
            "amount": 200.0,
            "owner_slot": "shared"
        }

        await async_client.post("/api/budget-line-items/", json=payload1)
        await async_client.post("/api/budget-line-items/", json=payload2)

        response = await async_client.get("/api/budget-line-items/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Should be sorted by created_at descending
        assert data[0]["name"] == "Utilities"
        assert data[1]["name"] == "Rent"

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_items_with_category(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test getting line items with populated category"""
        mock_get_user.return_value = test_user_id

        # Create line item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        await async_client.post("/api/budget-line-items/", json=payload)

        # Get with category populated
        response = await async_client.get(
            "/api/budget-line-items/?include_category=true"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "category" in data[0]
        assert data[0]["category"]["name"] == sample_category["name"]

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_items_filter_by_budget(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_category
    ):
        """Test filtering line items by budget"""
        from app.database import budgets_collection

        mock_get_user.return_value = test_user_id

        # Create two budgets
        budget1 = await budgets_collection.insert_one({
            "user_id": test_user_id,
            "month": "2026-01",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        budget2 = await budgets_collection.insert_one({
            "user_id": test_user_id,
            "month": "2026-02",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })

        # Create items for each budget
        payload1 = {
            "budget_id": str(budget1.inserted_id),
            "name": "Rent Jan",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        payload2 = {
            "budget_id": str(budget2.inserted_id),
            "name": "Rent Feb",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }

        await async_client.post("/api/budget-line-items/", json=payload1)
        await async_client.post("/api/budget-line-items/", json=payload2)

        # Filter by budget 1
        response = await async_client.get(
            f"/api/budget-line-items/?budget_id={budget1.inserted_id}"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Rent Jan"

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_items_user_isolation(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test that users only see their own line items"""
        mock_get_user.return_value = test_user_id

        # Create item for test user
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Test User Item",
            "category_id": str(sample_category["_id"]),
            "amount": 100.0,
            "owner_slot": "user1"
        }
        await async_client.post("/api/budget-line-items/", json=payload)

        # Create item for other user directly in DB
        await budget_line_items_collection.insert_one({
            "user_id": "other_user",
            "budget_id": ObjectId(),
            "name": "Other User Item",
            "category_id": ObjectId(),
            "amount": 200.0,
            "owner_slot": "user1",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })

        response = await async_client.get("/api/budget-line-items/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test User Item"

    # -------------------------------------------------------------------------
    # Get Single Item Tests
    # -------------------------------------------------------------------------

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_item_by_id(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test getting a single line item"""
        mock_get_user.return_value = test_user_id

        # Create item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        create_response = await async_client.post("/api/budget-line-items/", json=payload)
        created_id = create_response.json()["id"]

        # Get item
        response = await async_client.get(f"/api/budget-line-items/{created_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_id
        assert data["name"] == "Rent"

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_item_not_found(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id
    ):
        """Test getting non-existent line item"""
        mock_get_user.return_value = test_user_id

        fake_id = str(ObjectId())
        response = await async_client.get(f"/api/budget-line-items/{fake_id}")

        assert response.status_code == 404

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_item_with_category(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test getting line item with populated category"""
        mock_get_user.return_value = test_user_id

        # Create item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        create_response = await async_client.post("/api/budget-line-items/", json=payload)
        created_id = create_response.json()["id"]

        # Get with category
        response = await async_client.get(
            f"/api/budget-line-items/{created_id}?include_category=true"
        )

        assert response.status_code == 200
        data = response.json()
        assert "category" in data
        assert data["category"]["name"] == sample_category["name"]

    # -------------------------------------------------------------------------
    # Get by Budget Tests
    # -------------------------------------------------------------------------

    @patch("app.dependencies.get_current_user_id")
    async def test_get_line_items_by_budget_endpoint(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test the convenience endpoint for getting items by budget"""
        mock_get_user.return_value = test_user_id

        # Create two items
        payload1 = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        payload2 = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Utilities",
            "category_id": str(sample_category["_id"]),
            "amount": 200.0,
            "owner_slot": "shared"
        }

        await async_client.post("/api/budget-line-items/", json=payload1)
        await async_client.post("/api/budget-line-items/", json=payload2)

        # Use convenience endpoint
        response = await async_client.get(
            f"/api/budget-line-items/budget/{sample_budget['_id']}"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Should include categories by default
        assert all("category" in item for item in data)

    # -------------------------------------------------------------------------
    # Update Tests
    # -------------------------------------------------------------------------

    @patch("app.dependencies.get_current_user_id")
    async def test_update_line_item_name(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test updating line item name"""
        mock_get_user.return_value = test_user_id

        # Create item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        create_response = await async_client.post("/api/budget-line-items/", json=payload)
        created_id = create_response.json()["id"]

        # Update name
        update_payload = {"name": "Apartment Rent"}
        response = await async_client.put(
            f"/api/budget-line-items/{created_id}",
            json=update_payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Apartment Rent"
        assert data["amount"] == 1500.0  # Unchanged

    @patch("app.dependencies.get_current_user_id")
    async def test_update_line_item_amount(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test updating line item amount"""
        mock_get_user.return_value = test_user_id

        # Create item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        create_response = await async_client.post("/api/budget-line-items/", json=payload)
        created_id = create_response.json()["id"]

        # Update amount
        update_payload = {"amount": 1600.0}
        response = await async_client.put(
            f"/api/budget-line-items/{created_id}",
            json=update_payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 1600.0

    @patch("app.dependencies.get_current_user_id")
    async def test_update_line_item_not_found(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id
    ):
        """Test updating non-existent line item"""
        mock_get_user.return_value = test_user_id

        fake_id = str(ObjectId())
        update_payload = {"name": "New Name"}
        response = await async_client.put(
            f"/api/budget-line-items/{fake_id}",
            json=update_payload
        )

        assert response.status_code == 404

    @patch("app.dependencies.get_current_user_id")
    async def test_update_line_item_invalid_category(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test updating to invalid category"""
        mock_get_user.return_value = test_user_id

        # Create item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        create_response = await async_client.post("/api/budget-line-items/", json=payload)
        created_id = create_response.json()["id"]

        # Update to invalid category
        update_payload = {"category_id": str(ObjectId())}
        response = await async_client.put(
            f"/api/budget-line-items/{created_id}",
            json=update_payload
        )

        assert response.status_code == 400
        assert "Category not found" in response.json()["detail"]

    # -------------------------------------------------------------------------
    # Delete Tests
    # -------------------------------------------------------------------------

    @patch("app.dependencies.get_current_user_id")
    async def test_delete_line_item_success(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id,
        sample_budget,
        sample_category
    ):
        """Test successful line item deletion"""
        mock_get_user.return_value = test_user_id

        # Create item
        payload = {
            "budget_id": str(sample_budget["_id"]),
            "name": "Rent",
            "category_id": str(sample_category["_id"]),
            "amount": 1500.0,
            "owner_slot": "user1"
        }
        create_response = await async_client.post("/api/budget-line-items/", json=payload)
        created_id = create_response.json()["id"]

        # Delete item
        response = await async_client.delete(f"/api/budget-line-items/{created_id}")

        assert response.status_code == 204

        # Verify deleted
        get_response = await async_client.get(f"/api/budget-line-items/{created_id}")
        assert get_response.status_code == 404

    @patch("app.dependencies.get_current_user_id")
    async def test_delete_line_item_not_found(
        self,
        mock_get_user,
        async_client,
        db_session,
        test_user_id
    ):
        """Test deleting non-existent line item"""
        mock_get_user.return_value = test_user_id

        fake_id = str(ObjectId())
        response = await async_client.delete(f"/api/budget-line-items/{fake_id}")

        assert response.status_code == 404
