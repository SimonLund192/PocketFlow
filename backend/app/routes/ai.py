from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from app.ai.agent import AIAgent
from app.ai.schemas import AIChatRequest, AIChatResponse
from app.dependencies import get_current_user_id
import logging

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger(__name__)

# Initialize the AI agent
ai_agent = AIAgent()


async def get_optional_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Get user_id from authorization header if present, otherwise use a default test user.
    This allows the AI chat to work during development even without authentication.
    """
    if not authorization:
        logger.warning("No authorization header provided, using default user")
        return "test_user"
    
    try:
        # Try to get the actual user ID
        from app.dependencies import security, get_current_user, get_current_user_id as get_real_user_id
        from fastapi.security import HTTPAuthorizationCredentials
        
        # Parse the token from the header
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            logger.warning("Empty token provided, using default user")
            return "test_user"
        
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        user_email = await get_current_user(credentials)
        
        # Get the actual user_id from the database
        from app.database import database
        users_collection = database["users"]
        user = await users_collection.find_one({"email": user_email})
        
        if user:
            return str(user["_id"])
        else:
            logger.warning(f"User not found for email {user_email}, using default user")
            return "test_user"
            
    except Exception as e:
        logger.warning(f"Error getting user_id: {e}, using default user")
        return "test_user"


@router.post("/chat", response_model=AIChatResponse)
async def chat(
    request: AIChatRequest,
    user_id: str = Depends(get_optional_user_id)
):
    """
    Chat with AI assistant
    
    The AI assistant can help with:
    - Answering questions about your budget and finances
    - Creating transactions
    - Analyzing spending patterns
    - Providing financial insights
    """
    try:
        logger.info(f"AI chat request from user {user_id}")
        response = await ai_agent.process_request(request, user_id)
        return response
    except Exception as e:
        logger.error(f"Error processing AI chat request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing AI chat request: {str(e)}"
        )
