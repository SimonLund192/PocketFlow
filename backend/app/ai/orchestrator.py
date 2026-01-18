from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Mapping, Optional

from fastapi import HTTPException, status

from app.auth import UserContext
from app.models import AiToolCallPlan, AiToolCallPlanResult

from .llm_client import LlmChatRequest, LlmMessage, LlmClient
from .mcp import McpToolRegistry


_BUDGET_DOMAIN_SYSTEM_PROMPT = """You are Pocketflow's budgeting assistant.

Your job is to translate the user's natural language request into a structured plan of tool calls.

Hard rules:
- You MUST NOT write to the database directly.
- You MUST only request actions via the provided tools.
- When the request would change user data, set requires_confirmation=true.
- Prefer minimal steps. If multiple steps are needed, order them safely.

Return ONLY valid JSON matching the AiToolCallPlan schema.
"""


def _json_schema_for_tools(registry: McpToolRegistry) -> list[dict[str, Any]]:
    # We don't yet have per-tool JSON Schemas wired into the registry.
    # For now, we provide tool names + descriptions to the LLM.
    return [
        {"name": spec.name, "description": spec.description}
        for spec in registry.list().values()
    ]


def _parse_plan(raw: str) -> AiToolCallPlan:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM returned non-JSON plan: {e}",
        ) from e

    try:
        return AiToolCallPlan.model_validate(data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM returned invalid plan schema: {e}",
        ) from e


@dataclass(frozen=True)
class LlmMcpOrchestrator:
    """LLM → MCP orchestration boundary.

    Flow:
    1) Turn user message into an `AiToolCallPlan`.
    2) If confirmation is required, return the plan without executing tools.
    3) If confirmed, execute tools sequentially through the MCP registry.

    Safety:
    - No tool execution by default (requires_confirmation defaults true).
    - Refuses to partially execute when multiple steps are present and confirmation is missing.
    """

    llm: LlmClient
    mcp: McpToolRegistry

    async def plan_from_text(self, *, ctx: UserContext, text: str) -> AiToolCallPlanResult:
        tools = _json_schema_for_tools(self.mcp)

        req = LlmChatRequest(
            messages=(
                LlmMessage(role="system", content=_BUDGET_DOMAIN_SYSTEM_PROMPT),
                LlmMessage(
                    role="system",
                    content=f"Available tools: {json.dumps(tools)}",
                ),
                LlmMessage(role="user", content=text),
            )
        )

        resp = await self.llm.chat(ctx=ctx, request=req)
        plan = _parse_plan(resp.content)

        # Always default to "planned"; caller must explicitly confirm before execution.
        return AiToolCallPlanResult(status="planned", plan=plan)

    async def execute_plan(
        self,
        *,
        ctx: UserContext,
        plan: AiToolCallPlan,
        confirmed: bool = False,
    ) -> AiToolCallPlanResult:
        # Safety invariant: never execute tools unless explicitly confirmed.
        if not confirmed:
            return AiToolCallPlanResult(
                status="blocked",
                plan=plan,
                results=[],
                error=plan.confirmation_message
                or "Confirmation required before executing this plan.",
            )

        if plan.requires_confirmation and not confirmed:
            return AiToolCallPlanResult(
                status="blocked",
                plan=plan,
                results=[],
                error=plan.confirmation_message
                or "Confirmation required before executing this plan.",
            )

        # Execute sequentially. Since our MCP tools write to Mongo directly,
        # we must avoid partial writes. For now we treat any exception as a
        # failure and stop. Callers should only confirm plans they accept.
        results = []
        try:
            for step in plan.steps:
                out = await self.mcp.execute(
                    ctx=ctx,
                    tool_name=step.tool_name,
                    arguments=step.arguments,
                )
                results.append(out)
        except Exception as e:
            return AiToolCallPlanResult(
                status="failed",
                plan=plan,
                results=results,
                error=str(e),
            )

        return AiToolCallPlanResult(status="executed", plan=plan, results=results)

    async def handle_user_message(
        self,
        *,
        ctx: UserContext,
        text: str,
        confirmed: bool = False,
        provided_plan: Optional[AiToolCallPlan] = None,
    ) -> AiToolCallPlanResult:
        plan_result = (
            AiToolCallPlanResult(status="planned", plan=provided_plan)
            if provided_plan is not None
            else await self.plan_from_text(ctx=ctx, text=text)
        )

        return await self.execute_plan(ctx=ctx, plan=plan_result.plan, confirmed=confirmed)
