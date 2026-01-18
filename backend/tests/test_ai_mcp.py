import pytest

from app.ai.mcp import McpToolRegistry, ToolSpec, UnknownToolError
from app.auth import UserContext


@pytest.mark.asyncio
async def test_mcp_registry_executes_correct_tool_with_args() -> None:
    calls = []

    async def add_tool(ctx: UserContext, args: dict):
        calls.append((ctx.user_id, args))
        return args["a"] + args["b"]

    reg = McpToolRegistry()
    reg.register(ToolSpec(name="add", description="Add two numbers", func=add_tool))

    ctx = UserContext(user_id="user-123")
    result = await reg.execute(ctx=ctx, tool_name="add", arguments={"a": 1, "b": 2})

    assert result == 3
    assert calls == [("user-123", {"a": 1, "b": 2})]


@pytest.mark.asyncio
async def test_mcp_unknown_tool_raises() -> None:
    reg = McpToolRegistry()
    ctx = UserContext(user_id="user-123")

    with pytest.raises(UnknownToolError):
        await reg.execute(ctx=ctx, tool_name="missing", arguments={})
