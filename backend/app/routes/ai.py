from fastapi import APIRouter, Depends
from app.ai.agent import AIAgent
from app.ai.schemas import AIChatRequest, AIChatResponse
from app.dependencies import get_current_user

router = APIRouter()
agent = AIAgent()

@router.post("/api/ai/chat", response_model=AIChatResponse)
async def chat(
    request: AIChatRequest,
    current_user: str = Depends(get_current_user)
) -> AIChatResponse:
    """
    Chat with the AI assistant.
    
    The AI can help with:
    - Viewing transactions and dashboard stats
    - Creating new transactions
    - Analyzing spending patterns
    - Answering budget-related questions
    """
    return await agent.process_request(request, user_id=current_user)
