from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping, Optional

from app.auth import UserContext

from .llm_client import LlmChatRequest, LlmChatResponse, LlmClient, StubLlmClient
from .mcp import McpToolRegistry, default_registry


@dataclass(frozen=True)
class AIService:
    """Minimal service boundary for AI capabilities.

    This composes:
    - an LLM client (provider-agnostic)
    - an MCP tool registry/executor

    Routing is intentionally not wired yet; endpoints can later depend on this
    service without knowing which provider/tools are running underneath.
    """

    llm: LlmClient
    mcp: McpToolRegistry

    async def chat(self, *, ctx: UserContext, request: LlmChatRequest) -> LlmChatResponse:
        return await self.llm.chat(ctx=ctx, request=request)

    async def run_tool(
        self,
        *,
        ctx: UserContext,
        tool_name: str,
        arguments: Optional[Mapping[str, Any]] = None,
    ) -> Any:
        return await self.mcp.execute(ctx=ctx, tool_name=tool_name, arguments=arguments)


def default_ai_service() -> AIService:
    """Factory for a safe default AI service.

    Uses deterministic components (no network calls) to keep local development
    and tests stable until a real provider is configured.
    """

    return AIService(llm=StubLlmClient(), mcp=default_registry())
