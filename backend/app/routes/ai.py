from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from typing import Optional
from app.ai.agent import AIAgent
from app.ai.schemas import AIChatRequest, AIChatResponse, AIChatMessage
from app.ai.tools import execute_save_budget_entries
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
        # Normalize email to lowercase for case-insensitive lookup
        normalized_email = user_email.strip().lower()
        user = await users_collection.find_one({"email": normalized_email})
        
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
    Chat with AI assistant.

    Supports multi-step tool-calling (ReAct loop).
    When the AI proposes budget entries, the response includes a `pending_action`
    that the frontend should present for confirmation.
    
    To confirm a pending action, send another request with `confirm_action: "yes"` 
    and include the pending entries as a special message.
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


@router.post("/confirm", response_model=AIChatResponse)
async def confirm_action(
    entries: list[dict],
    user_id: str = Depends(get_optional_user_id)
):
    """
    Confirm and execute a pending action (save budget entries).
    The frontend sends the proposed entries that the user approved.
    """
    try:
        logger.info(f"Confirming {len(entries)} entries for user {user_id}")
        result = await execute_save_budget_entries(user_id, entries)

        if result.get("ok"):
            saved_count = result["data"]["saved_count"]
            saved_items = result["data"]["saved"]
            lines = []
            for item in saved_items:
                lines.append(f"  ✅ {item['name']} — {item['amount']:,.0f} kr. ({item['category_name']})")
            detail = "\n".join(lines)

            return AIChatResponse(
                message=AIChatMessage(
                    role="assistant",
                    content=f"Done! I've saved {saved_count} budget entries:\n\n{detail}\n\nYour budget has been updated.",
                ),
                tool_calls=[{"name": "save_budget_entries", "arguments": {"count": saved_count}, "id": "confirmation"}],
            )
        else:
            return AIChatResponse(
                message=AIChatMessage(
                    role="assistant",
                    content=f"There was an error saving the entries: {result.get('error', 'Unknown error')}. Please try again.",
                ),
                tool_calls=[],
            )
    except Exception as e:
        logger.error(f"Error confirming action: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error confirming action: {str(e)}"
        )


@router.post("/upload-csv", response_model=AIChatResponse)
async def upload_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_optional_user_id)
):
    """
    Upload a CSV bank statement file. The AI will parse it,
    categorize the transactions, and propose budget entries for confirmation.
    """
    try:
        logger.info(f"CSV upload from user {user_id}: {file.filename}")

        # Read file content
        content = await file.read()
        csv_text = content.decode("utf-8", errors="replace")

        if not csv_text.strip():
            raise HTTPException(status_code=400, detail="Empty CSV file")

        # Determine the current month for the prompt
        from datetime import datetime
        current_month = datetime.now().strftime("%Y-%m")

        # Create a chat request that includes the CSV data
        # The AI agent will use parse_csv_data + get_user_categories + propose_budget_entries
        csv_message = (
            f"I've uploaded a CSV bank statement. Please parse it, categorize each transaction "
            f"into my existing budget categories, and propose budget entries for {current_month}.\n\n"
            f"Here is the CSV data:\n```\n{csv_text}\n```"
        )

        request = AIChatRequest(
            messages=[
                AIChatMessage(role="user", content=csv_message),
            ],
        )

        response = await ai_agent.process_request(request, user_id)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing CSV upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV: {str(e)}"
        )
