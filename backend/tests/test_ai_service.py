import pytest

from app.ai.llm_client import LlmChatRequest, LlmMessage, StubLlmClient
from app.ai.mcp import McpToolRegistry, ToolSpec
from app.ai.service import AIService, default_ai_service
from app.auth import UserContext


@pytest.mark.asyncio
async def test_ai_service_chat_forwards_ctx_and_request() -> None:
    ctx = UserContext(user_id="u1")
    service = AIService(llm=StubLlmClient(content="ok"), mcp=McpToolRegistry())

    resp = await service.chat(
        ctx=ctx,
        request=LlmChatRequest(messages=[LlmMessage(role="user", content="hi")]),
    )

    assert resp.content == "ok"


@pytest.mark.asyncio
async def test_ai_service_run_tool_forwards_ctx_and_args() -> None:
    ctx = UserContext(user_id="u2")

    calls = []

    async def tool(ctx: UserContext, args: dict):
        calls.append((ctx.user_id, args))
        return {"sum": args["a"] + args["b"]}

    reg = McpToolRegistry()
    reg.register(ToolSpec(name="sum", description="sum", func=tool))

    service = AIService(llm=StubLlmClient(), mcp=reg)

    out = await service.run_tool(ctx=ctx, tool_name="sum", arguments={"a": 2, "b": 3})

    assert out == {"sum": 5}
    assert calls == [("u2", {"a": 2, "b": 3})]


@pytest.mark.asyncio
async def test_default_ai_service_is_deterministic_and_user_scoped() -> None:
    ctx = UserContext(user_id="u3")
    service = default_ai_service()

    out = await service.run_tool(ctx=ctx, tool_name="echo", arguments={"x": 1})
    assert out == {"user_id": "u3", "args": {"x": 1}}
