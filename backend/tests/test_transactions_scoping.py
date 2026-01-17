import pytest


@pytest.mark.asyncio
async def test_user_a_cannot_see_or_delete_user_b_transactions(client) -> None:
    # This test expects a running MongoDB and real endpoints.
    # It verifies user scoping: cannot see or delete another user's transactions.

    user_a = "user-a"
    user_b = "user-b"

    payload = {
        "type": "expense",
        "category": "Groceries",
        "amount": 12.34,
        "description": "B only",
    }

    created_b = await client.post(
        "/api/transactions", json=payload, headers={"X-User-Id": user_b}
    )
    assert created_b.status_code == 201
    tx_b_id = created_b.json()["_id"]

    # A should not see B's transaction
    list_a = await client.get("/api/transactions", headers={"X-User-Id": user_a})
    assert list_a.status_code == 200
    assert all(t.get("_id") != tx_b_id for t in list_a.json())

    # A should not be able to delete B's transaction
    del_a = await client.delete(
        f"/api/transactions/{tx_b_id}", headers={"X-User-Id": user_a}
    )
    assert del_a.status_code == 404

    # B can delete their own transaction
    del_b = await client.delete(
        f"/api/transactions/{tx_b_id}", headers={"X-User-Id": user_b}
    )
    assert del_b.status_code == 200
