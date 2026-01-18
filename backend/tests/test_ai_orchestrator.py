import json

import pytest

from app.ai.mcp import McpToolRegistry, ToolSpec
from app.ai.orchestrator import LlmMcpOrchestrator
from app.auth import UserContext
from app.ai.llm_client import LlmChatRequest, LlmChatResponse, LlmClient


class FakeLlm(LlmClient):
    def __init__(self, content: str):
        self._content = content
        self.calls = []

    async def chat(self, *, ctx: UserContext, request: LlmChatRequest) -> LlmChatResponse:
        self.calls.append((ctx.user_id, request))
        return LlmChatResponse(content=self._content)


@pytest.mark.asyncio
async def test_orchestrator_plans_but_does_not_execute_without_confirmation() -> None:
    calls = []

    async def tool(ctx: UserContext, args: dict):
        calls.append((ctx.user_id, args))
        return {"ok": True}

    reg = McpToolRegistry()
    reg.register(ToolSpec(name="create_transaction", description="tx", func=tool))

    plan = {
        "intent": "add grocery purchase",
        "steps": [{"tool_name": "create_transaction", "arguments": {"amount": 10}}],
        "requires_confirmation": True,
        "confirmation_message": "Create this transaction?",
    }

    llm = FakeLlm(content=json.dumps(plan))
    orch = LlmMcpOrchestrator(llm=llm, mcp=reg)

    ctx = UserContext(user_id="u1")

    planned = await orch.plan_from_text(ctx=ctx, text="I spent 10 on groceries")
    assert planned.status == "planned"
    assert planned.plan.intent == "add grocery purchase"

    blocked = await orch.execute_plan(ctx=ctx, plan=planned.plan, confirmed=False)
    assert blocked.status == "blocked"
    assert calls == []


@pytest.mark.asyncio
async def test_orchestrator_executes_tools_after_confirmation() -> None:
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

    llm = FakeLlm(content=json.dumps(plan))
    orch = LlmMcpOrchestrator(llm=llm, mcp=reg)

    ctx = UserContext(user_id="u1")

    planned = await orch.plan_from_text(ctx=ctx, text="I spent 10 on groceries")
    executed = await orch.execute_plan(ctx=ctx, plan=planned.plan, confirmed=True)

    assert executed.status == "executed"
    assert len(executed.results) == 1
    assert calls == [("u1", {"amount": 10})]


@pytest.mark.asyncio
async def test_orchestrator_invalid_llm_plan_is_rejected_safely() -> None:
    # Non-JSON response should never execute tools.
    reg = McpToolRegistry()

    llm = FakeLlm(content="not-json")
    orch = LlmMcpOrchestrator(llm=llm, mcp=reg)

    ctx = UserContext(user_id="u1")

    with pytest.raises(Exception):
        await orch.plan_from_text(ctx=ctx, text="do something")
