from typing import List, Dict, Any, Optional
from mistralai import Mistral
from .config import ai_config

class LLMClient:
    def __init__(self):
        self.client = Mistral(api_key=ai_config.MISTRAL_API_KEY)
        self.model = ai_config.AI_MODEL

    async def chat(
        self, 
        messages: List[Dict[str, str]], 
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: str = "auto"
    ) -> Any:
        try:
            params = {
                "model": self.model,
                "messages": messages,
            }
            if tools:
                params["tools"] = tools
                params["tool_choice"] = tool_choice

            response = await self.client.chat.complete_async(**params)
            return response.choices[0].message
        except Exception as e:
            # Handle API errors
            raise e

