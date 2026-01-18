from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId  # type: ignore[import-not-found]

from app.auth import UserContext
from app.database import get_database
from app.models import AiAuditLogEntry


_COLLECTION = "ai_audit_logs"


def _serialize_id(doc: dict[str, Any]) -> dict[str, Any]:
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    return doc


async def create_audit_entry(
    *,
    ctx: UserContext,
    plan_id: str,
    user_text: str,
    proposed_plan: dict[str, Any],
) -> AiAuditLogEntry:
    db = get_database()
    now = datetime.utcnow()

    doc: dict[str, Any] = {
        "user_id": ctx.user_id,
        "plan_id": plan_id,
        "user_text": user_text,
        "proposed_plan": proposed_plan,
        "created_at": now,
    }

    res = await db[_COLLECTION].insert_one(doc)
    created = await db[_COLLECTION].find_one({"_id": res.inserted_id})
    assert created is not None
    _serialize_id(created)
    return AiAuditLogEntry.model_validate(created)


async def mark_executed(
    *,
    ctx: UserContext,
    plan_id: str,
    status: str,
    results: list[Any],
    error: Optional[str] = None,
) -> None:
    db = get_database()
    await db[_COLLECTION].update_one(
        {"user_id": ctx.user_id, "plan_id": plan_id},
        {
            "$set": {
                "executed_at": datetime.utcnow(),
                "execution_status": status,
                "executed_results": results,
                "execution_error": error,
            }
        },
    )


async def list_audit_entries(
    *,
    ctx: UserContext,
    limit: int = 50,
    before: Optional[datetime] = None,
) -> list[AiAuditLogEntry]:
    db = get_database()

    q: dict[str, Any] = {"user_id": ctx.user_id}
    if before is not None:
        q["created_at"] = {"$lt": before}

    cursor = db[_COLLECTION].find(q).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)

    out: list[AiAuditLogEntry] = []
    for d in docs:
        _serialize_id(d)
        out.append(AiAuditLogEntry.model_validate(d))
    return out
