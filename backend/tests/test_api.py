import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test the root endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
    
    assert response.status_code == 200
    assert response.json() == {"message": "PocketFlow API is running"}


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test the health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_dashboard_stats_endpoint():
    """Test the dashboard stats endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/dashboard/stats")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that all required fields are present
    assert "net_income" in data
    assert "savings" in data
    assert "expenses" in data
    assert "goals_achieved" in data
    assert "income_change" in data
    assert "savings_change" in data
    assert "expenses_change" in data


@pytest.mark.asyncio
async def test_balance_trends_endpoint():
    """Test the balance trends endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/dashboard/balance-trends")
    
    assert response.status_code == 200
    data = response.json()
    
    # Should return a list
    assert isinstance(data, list)
    
    # If there's data, check the structure
    if len(data) > 0:
        assert "month" in data[0]
        assert "personal" in data[0]
        assert "shared" in data[0]


@pytest.mark.asyncio
async def test_expense_breakdown_endpoint():
    """Test the expense breakdown endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/dashboard/expense-breakdown")
    
    assert response.status_code == 200
    data = response.json()
    
    # Should return a list
    assert isinstance(data, list)
