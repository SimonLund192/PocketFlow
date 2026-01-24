from typing import List, Dict, Any, Optional, AsyncGenerator
import openai
from .config import ai_config

class LLMClient:
    def __init__(self):
        self.client = openai.AsyncOpenAI(
            api_key=ai_config.MISTRAL_API_KEY,
            base_url=ai_config.AI_BASE_URL
        )
        self.model = ai_config.AI_MODEL

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: str = "auto"
    ) -> Any:
        try:
            params = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
            }
            
            if tools:
                params["tools"] = tools
                params["tool_choice"] = tool_choice

            response = await self.client.chat.completions.create(**params)
            return response.choices[0].message
        except Exception as e:
            # Handle API errors, rate limits, etc.
            raise e

    async def stream_response(
        self, 
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[Any, None]:
        # Implementation for streaming responses
        pass
