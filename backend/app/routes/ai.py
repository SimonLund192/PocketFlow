from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import UserContext, get_user_context
from app.models import AiConfirmRequest, AiDryRunRequest, AiDryRunResponse, AiToolCallPlanResult
from app.ai.llm_client import StubLlmClient
from app.ai.mcp import default_registry
from app.ai.orchestrator import LlmMcpOrchestrator


router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=AiDryRunResponse)
async def ai_chat(payload: AiDryRunRequest, ctx: UserContext = Depends(get_user_context)):
	orch = LlmMcpOrchestrator(llm=StubLlmClient(), mcp=default_registry())
	plan_id, planned = await orch.dry_run_from_text(ctx=ctx, text=payload.text)

	return AiDryRunResponse(
		status=planned.status,
		plan_id=plan_id,
		plan=planned.plan,
		summary=planned.error or "",
	)


# Backwards-compatible alias (US-AI-04 naming)
@router.post("/dry-run", response_model=AiDryRunResponse, include_in_schema=False)
async def ai_dry_run(payload: AiDryRunRequest, ctx: UserContext = Depends(get_user_context)):
	return await ai_chat(payload=payload, ctx=ctx)


@router.post("/confirm", response_model=AiToolCallPlanResult)
async def ai_confirm(payload: AiConfirmRequest, ctx: UserContext = Depends(get_user_context)):
	orch = LlmMcpOrchestrator(llm=StubLlmClient(), mcp=default_registry())
	res = await orch.confirm_and_execute(ctx=ctx, plan_id=payload.plan_id)

	# If invalid/expired, return 404.
	if res.status == "blocked" and res.error and "not found" in res.error.lower():
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=res.error)

	return res
