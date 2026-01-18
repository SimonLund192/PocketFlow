import pytest
from app.database import get_database


@pytest.mark.asyncio
async def test_ai_audit_log_created_on_chat_and_updated_on_confirm(client) -> None:
    # Create proposal
    res = await client.post(
        "/api/ai/chat",
        json={"text": "Add rent 9000"},
        headers={"X-User-Id": "user-a"},
    )
    assert res.status_code == 200
    plan_id = res.json()["plan_id"]

    db = get_database()

    # Audit entry should exist for the proposing user.
    audit = await db.ai_audit_logs.find_one({"user_id": "user-a", "plan_id": plan_id})
    assert audit is not None
    assert audit["user_text"] == "Add rent 9000"
    assert "proposed_plan" in audit
    assert audit.get("executed_at") is None

    # Confirm execution
    confirm = await client.post(
        "/api/ai/confirm",
        json={"plan_id": plan_id},
        headers={"X-User-Id": "user-a"},
    )
    assert confirm.status_code == 200

    updated = await db.ai_audit_logs.find_one({"user_id": "user-a", "plan_id": plan_id})
    assert updated is not None
    assert updated.get("executed_at") is not None
    assert updated.get("execution_status") == "executed"
    assert isinstance(updated.get("executed_results"), list)


@pytest.mark.asyncio
async def test_ai_audit_log_is_user_scoped(client) -> None:
    res = await client.post(
        "/api/ai/chat",
        json={"text": "Add groceries 10"},
        headers={"X-User-Id": "user-a"},
    )
    assert res.status_code == 200
    plan_id = res.json()["plan_id"]

    # Other user should not see user-a's audit logs
    out = await client.get(
        "/api/ai/audit",
        headers={"X-User-Id": "user-b"},
    )
    assert out.status_code == 200
    items = out.json()["items"]
    assert all(item["user_id"] == "user-b" for item in items)
    assert all(item["plan_id"] != plan_id for item in items)
