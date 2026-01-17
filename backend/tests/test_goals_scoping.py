import pytest


@pytest.mark.asyncio
async def test_user_a_cannot_update_or_delete_user_b_goal(client) -> None:
    user_a = "user-a"
    user_b = "user-b"

    # Create goal as B
    created = await client.post(
        "/api/goals",
        json={"name": "B goal", "target": 1000, "saved": 0, "color": "bg-green-500"},
        headers={"X-User-Id": user_b},
    )
    assert created.status_code == 201
    goal_id = created.json()["id"]

    # A should not see it
    list_a = await client.get("/api/goals", headers={"X-User-Id": user_a})
    assert list_a.status_code == 200
    assert all(g.get("id") != goal_id for g in list_a.json())

    # A cannot update it
    upd_a = await client.put(
        f"/api/goals/{goal_id}",
        json={"name": "Hacked", "target": 999},
        headers={"X-User-Id": user_a},
    )
    assert upd_a.status_code == 404

    # A cannot delete it
    del_a = await client.delete(
        f"/api/goals/{goal_id}", headers={"X-User-Id": user_a}
    )
    assert del_a.status_code == 404

    # B can update it
    upd_b = await client.put(
        f"/api/goals/{goal_id}",
        json={"name": "B goal updated", "target": 2000},
        headers={"X-User-Id": user_b},
    )
    assert upd_b.status_code == 200
    assert upd_b.json()["name"] == "B goal updated"

    # B can delete it
    del_b = await client.delete(
        f"/api/goals/{goal_id}", headers={"X-User-Id": user_b}
    )
    assert del_b.status_code == 200
