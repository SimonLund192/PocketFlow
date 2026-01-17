import pytest


@pytest.mark.asyncio
async def test_dashboard_endpoints_are_scoped_by_user(client):
    # Create transactions for user A (income + expense)
    await client.post(
        "/api/transactions",
        headers={"X-User-Id": "user-a"},
        json={
            "type": "income",
            "category": "Salary",
            "amount": 1000,
            "description": "A income",
            "date": "2026-01-10T00:00:00Z",
        },
    )
    await client.post(
        "/api/transactions",
        headers={"X-User-Id": "user-a"},
        json={
            "type": "expense",
            "category": "Rent",
            "amount": 200,
            "description": "A expense",
            "date": "2026-01-11T00:00:00Z",
        },
    )

    # Create transactions for user B with different values
    await client.post(
        "/api/transactions",
        headers={"X-User-Id": "user-b"},
        json={
            "type": "income",
            "category": "Salary",
            "amount": 3000,
            "description": "B income",
            "date": "2026-01-10T00:00:00Z",
        },
    )
    await client.post(
        "/api/transactions",
        headers={"X-User-Id": "user-b"},
        json={
            "type": "expense",
            "category": "Groceries",
            "amount": 500,
            "description": "B expense",
            "date": "2026-01-12T00:00:00Z",
        },
    )

    # Stats should differ between users
    res_a = await client.get("/api/dashboard/stats", headers={"X-User-Id": "user-a"})
    assert res_a.status_code == 200
    stats_a = res_a.json()
    assert isinstance(stats_a["net_income"], (int, float))

    res_b = await client.get("/api/dashboard/stats", headers={"X-User-Id": "user-b"})
    assert res_b.status_code == 200
    stats_b = res_b.json()
    assert isinstance(stats_b["net_income"], (int, float))
    assert stats_a["net_income"] != stats_b["net_income"]

    # Expense breakdown should differ and only include the user's categories
    bd_a = await client.get(
        "/api/dashboard/expense-breakdown", headers={"X-User-Id": "user-a"}
    )
    assert bd_a.status_code == 200
    categories_a = {row["category"] for row in bd_a.json()}
    assert categories_a == {"Rent"}

    bd_b = await client.get(
        "/api/dashboard/expense-breakdown", headers={"X-User-Id": "user-b"}
    )
    assert bd_b.status_code == 200
    categories_b = {row["category"] for row in bd_b.json()}
    assert categories_b == {"Groceries"}
