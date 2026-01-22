import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from app.main import app
from app.database import database, categories_collection, budgets_collection, budget_line_items_collection


@pytest_asyncio.fixture
async def async_client():
    """Create an async test client"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def db_session():
    """
    Setup and teardown for database tests.
    Clears test collections before and after each test.
    """
    # Clear collections before test
    await categories_collection.delete_many({})
    await budgets_collection.delete_many({})
    await budget_line_items_collection.delete_many({})
    
    yield database
    
    # Clear collections after test
    await categories_collection.delete_many({})
    await budgets_collection.delete_many({})
    await budget_line_items_collection.delete_many({})


@pytest.fixture
def test_user_id():
    """Fixture providing a test user ID"""
    return "test_user_123"


@pytest_asyncio.fixture
async def sample_category(db_session, test_user_id):
    """Create a sample active category for testing"""
    category_doc = {
        "user_id": test_user_id,
        "name": "Housing",
        "type": "personal-expenses",
        "icon": "home",
        "color": "#FF5733",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await categories_collection.insert_one(category_doc)
    category_doc["_id"] = result.inserted_id
    return category_doc


@pytest_asyncio.fixture
async def sample_inactive_category(db_session, test_user_id):
    """Create a sample inactive category for testing"""
    category_doc = {
        "user_id": test_user_id,
        "name": "Deprecated",
        "type": "personal-expenses",
        "icon": "archive",
        "color": "#888888",
        "is_active": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await categories_collection.insert_one(category_doc)
    category_doc["_id"] = result.inserted_id
    return category_doc


@pytest_asyncio.fixture
async def sample_budget(db_session, test_user_id):
    """Create a sample budget for testing"""
    budget_doc = {
        "user_id": test_user_id,
        "month": "2026-01",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await budgets_collection.insert_one(budget_doc)
    budget_doc["_id"] = result.inserted_id
    return budget_doc
