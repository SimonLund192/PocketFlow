import pytest


@pytest.mark.asyncio
async def test_budget_month_is_scoped_by_user(client):
    month = "2026-01"

    # User A saves a budget for a month
    res_save_a = await client.post(
        f"/api/budget/{month}",
        headers={"X-User-Id": "user-a"},
        json={
            "income_user1": [{"id": "1", "name": "Salary", "category": "Salary", "value": 1000}],
            "income_user2": [],
            "shared_expenses": [],
            "personal_user1": [],
            "personal_user2": [],
            "shared_savings": [],
            "personal_savings_user1": [],
            "personal_savings_user2": [],
        },
    )
    assert res_save_a.status_code == 200

    # User B should NOT see user A's data for same month (should get the empty structure)
    res_get_b = await client.get(
        f"/api/budget/{month}", headers={"X-User-Id": "user-b"}
    )
    assert res_get_b.status_code == 200
    data_b = res_get_b.json()
    assert data_b["user_id"] == "user-b"
    assert data_b["income_user1"] == []

    # User A still sees theirs
    res_get_a = await client.get(
        f"/api/budget/{month}", headers={"X-User-Id": "user-a"}
    )
    assert res_get_a.status_code == 200
    data_a = res_get_a.json()
    assert data_a["user_id"] == "user-a"
    assert len(data_a["income_user1"]) == 1
    assert data_a["income_user1"][0]["value"] == 1000


@pytest.mark.asyncio
async def test_budget_lifetime_stats_are_scoped_by_user(client):
    # Seed two users with different budget data
    await client.post(
        "/api/budget/2026-01",
        headers={"X-User-Id": "user-a"},
        json={
            "income_user1": [{"id": "1", "name": "Salary", "category": "Salary", "value": 1000}],
            "income_user2": [],
            "shared_expenses": [{"id": "2", "name": "Rent", "category": "Rent", "value": 300}],
            "personal_user1": [],
            "personal_user2": [],
            "shared_savings": [{"id": "3", "name": "Savings", "category": "Savings", "value": 100}],
            "personal_savings_user1": [],
            "personal_savings_user2": [],
        },
    )
    await client.post(
        "/api/budget/2026-01",
        headers={"X-User-Id": "user-b"},
        json={
            "income_user1": [{"id": "1", "name": "Salary", "category": "Salary", "value": 5000}],
            "income_user2": [],
            "shared_expenses": [{"id": "2", "name": "Rent", "category": "Rent", "value": 1200}],
            "personal_user1": [],
            "personal_user2": [],
            "shared_savings": [{"id": "3", "name": "Savings", "category": "Savings", "value": 700}],
            "personal_savings_user1": [],
            "personal_savings_user2": [],
        },
    )

    stats_a = (await client.get("/api/budget/lifetime/stats", headers={"X-User-Id": "user-a"})).json()
    stats_b = (await client.get("/api/budget/lifetime/stats", headers={"X-User-Id": "user-b"})).json()

    assert stats_a["total_income"] == 1000
    assert stats_b["total_income"] == 5000
    assert stats_a["total_shared_expenses"] == 300
    assert stats_b["total_shared_expenses"] == 1200
    assert stats_a["total_shared_savings"] == 100
    assert stats_b["total_shared_savings"] == 700
