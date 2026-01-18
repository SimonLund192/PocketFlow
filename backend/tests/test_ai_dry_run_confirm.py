import json

import pytest
from app.database import get_database

from app.ai.mcp import McpToolRegistry, ToolSpec
from app.ai.orchestrator import LlmMcpOrchestrator
from app.auth import UserContext
from app.ai.llm_client import LlmChatRequest, LlmChatResponse, LlmClient
from app.ai.plan_store import InMemoryPlanStore


class FakeLlm(LlmClient):
	def __init__(self, content: str):
		self._content = content

	async def chat(self, *, ctx: UserContext, request: LlmChatRequest) -> LlmChatResponse:
		return LlmChatResponse(content=self._content)


@pytest.mark.asyncio
async def test_dry_run_returns_plan_and_does_not_execute() -> None:
	calls = []

	async def tool(ctx: UserContext, args: dict):
		calls.append((ctx.user_id, args))
		return {"ok": True}

	reg = McpToolRegistry()
	reg.register(ToolSpec(name="create_budget_entry", description="budget", func=tool))

	plan = {
		"intent": "add rent and food",
		"steps": [
			{"tool_name": "create_budget_entry", "arguments": {"month": "2026-01", "bucket": "shared_expenses", "item": {"id": "1", "name": "Rent", "value": 9000}}},
		],
		"requires_confirmation": True,
		"confirmation_message": "Add these budget entries?",
	}

	orch = LlmMcpOrchestrator(
		llm=FakeLlm(content=json.dumps(plan)),
		mcp=reg,
		plan_store=InMemoryPlanStore(ttl_seconds=60),
	)

	ctx = UserContext(user_id="u1")
	plan_id, res = await orch.dry_run_from_text(ctx=ctx, text="add rent 9000")

	assert res.status == "planned"
	assert plan_id
	assert calls == []
	assert "create_budget_entry" in (res.error or "")


@pytest.mark.asyncio
async def test_ai_chat_endpoint_returns_proposal_and_confirm_writes(client) -> None:
	"""Integration: /api/ai/chat -> planned, /api/ai/confirm -> writes."""
	# Use the deterministic stub LLM (wired in routes) which returns a plan.
	# We don't assert the exact plan (it's stub-defined), only the shape.
	res = await client.post(
		"/api/ai/chat",
		json={"text": "Add rent 9000"},
		headers={"X-User-Id": "user-a"},
	)
	assert res.status_code == 200
	data = res.json()
	assert data["status"] == "planned"
	assert data["plan_id"]
	assert "plan" in data
	assert "summary" in data

	# Ensure chat didn't write anything.
	db = get_database()
	docs = await db.transactions.find({"user_id": "user-a"}).to_list(length=50)
	assert docs == []

	confirm = await client.post(
		"/api/ai/confirm",
		json={"plan_id": data["plan_id"]},
		headers={"X-User-Id": "user-a"},
	)
	assert confirm.status_code == 200
	out = confirm.json()
	assert out["status"] == "executed"


@pytest.mark.asyncio
async def test_ai_confirm_isolation_user_cannot_confirm_other_users_plan(client) -> None:
	res = await client.post(
		"/api/ai/chat",
		json={"text": "Add groceries 10"},
		headers={"X-User-Id": "user-a"},
	)
	assert res.status_code == 200
	plan_id = res.json()["plan_id"]

	# Different user should not be able to confirm.
	confirm = await client.post(
		"/api/ai/confirm",
		json={"plan_id": plan_id},
		headers={"X-User-Id": "user-b"},
	)
	assert confirm.status_code in (404, 403)


@pytest.mark.asyncio
async def test_confirm_executes_only_after_confirmation() -> None:
	calls = []

	async def tool(ctx: UserContext, args: dict):
		calls.append((ctx.user_id, args))
		return {"ok": True, "args": args}

	reg = McpToolRegistry()
	reg.register(ToolSpec(name="create_transaction", description="tx", func=tool))

	plan = {
		"intent": "add grocery purchase",
		"steps": [{"tool_name": "create_transaction", "arguments": {"amount": 10}}],
		"requires_confirmation": True,
		"confirmation_message": "Create this transaction?",
	}

	store = InMemoryPlanStore(ttl_seconds=60)
	orch = LlmMcpOrchestrator(llm=FakeLlm(content=json.dumps(plan)), mcp=reg, plan_store=store)
	ctx = UserContext(user_id="u1")

	plan_id, _ = await orch.dry_run_from_text(ctx=ctx, text="I spent 10")
	assert calls == []

	executed = await orch.confirm_and_execute(ctx=ctx, plan_id=plan_id)
	assert executed.status == "executed"
	assert calls == [("u1", {"amount": 10})]

	# Plan is one-time use.
	blocked = await orch.confirm_and_execute(ctx=ctx, plan_id=plan_id)
	assert blocked.status == "blocked"


@pytest.mark.asyncio
async def test_user_cannot_confirm_another_users_plan() -> None:
	async def tool(ctx: UserContext, args: dict):
		return {"ok": True}

	reg = McpToolRegistry()
	reg.register(ToolSpec(name="create_transaction", description="tx", func=tool))

	plan = {
		"intent": "add tx",
		"steps": [{"tool_name": "create_transaction", "arguments": {"amount": 10}}],
		"requires_confirmation": True,
	}

	store = InMemoryPlanStore(ttl_seconds=60)
	orch = LlmMcpOrchestrator(llm=FakeLlm(content=json.dumps(plan)), mcp=reg, plan_store=store)

	ctx_a = UserContext(user_id="user-a")
	ctx_b = UserContext(user_id="user-b")

	plan_id, _ = await orch.dry_run_from_text(ctx=ctx_a, text="I spent 10")
	res = await orch.confirm_and_execute(ctx=ctx_b, plan_id=plan_id)
	assert res.status == "blocked"
