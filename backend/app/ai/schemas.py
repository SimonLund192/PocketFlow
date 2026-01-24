from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AgentMessage(BaseModel):
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[Any]] = None

class AgentRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    conversation_history: List[AgentMessage] = []

class AgentResponse(BaseModel):
    response: str
    tool_calls: Optional[List[Any]] = None
    conversation_updated: List[AgentMessage]
