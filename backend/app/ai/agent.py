from typing import List, Dict, Any
import json
from datetime import datetime
from pathlib import Path
from .client import LLMClient
from .tools import tools_registry, get_tool_definitions
from .schemas import AIChatRequest, AIChatResponse, AIChatMessage
from .logging import ai_logger

class AIAgent:
    def __init__(self):
        self.client = LLMClient()
        self.available_tools = get_tool_definitions()
        self.system_prompt_path = Path(__file__).parent / "system_prompt.txt"
    
    def _load_system_prompt(self) -> str:
        """Load and format the system prompt with current date context"""
        try:
            with open(self.system_prompt_path, 'r') as f:
                prompt_template = f.read()
            
            current_date = datetime.now().strftime("%B %d, %Y")  # e.g., "January 25, 2026"
            current_month = datetime.now().strftime("%Y-%m")  # e.g., "2026-01"
            
            return prompt_template.format(
                current_date=current_date,
                current_month=current_month
            )
        except Exception as e:
            ai_logger.error(f"Error loading system prompt: {e}")
            # Fallback to basic prompt
            return f"You are a helpful financial assistant. Today's date is {datetime.now().strftime('%B %d, %Y')}."

    async def process_request(self, request: AIChatRequest, user_id: str) -> AIChatResponse:
        messages = [msg.model_dump(exclude_none=True) for msg in request.messages]
        
        # Add system message with current date and context if not already present
        if not messages or messages[0].get("role") != "system":
            system_message = {
                "role": "system",
                "content": self._load_system_prompt()
            }
            messages.insert(0, system_message)

        try:
            # First LLM call
            ai_message = await self.client.chat(
                messages=messages,
                tools=self.available_tools if self.available_tools else None
            )

            response_tool_calls_log = []
            
            # Handle tool calls if any
            if ai_message.tool_calls:
                # Convert Mistral ToolCall object to dictionary manually or assume strict dict behavior
                # The SDK might return objects, need to be careful with appending to messages
                # To be generic, let's treat ai_message as compatible.
                messages.append(ai_message) 
                
                for tool_call in ai_message.tool_calls:
                    function_name = tool_call.function.name
                    arguments = json.loads(tool_call.function.arguments)
                    
                    response_tool_calls_log.append({
                        "name": function_name,
                        "arguments": arguments,
                        "id": tool_call.id
                    })

                    if request.dry_run:
                         # Skip execution in dry_run
                         messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": "Dry run: Tool execution skipped."
                        })
                         continue

                    if function_name in tools_registry:
                        tool_func = tools_registry[function_name]
                        # Execute tool
                        ai_logger.info(f"Executing tool: {function_name} with args: {arguments}")
                        try:
                            # Pass user_id for safe scoping
                            result = await tool_func(user_id=user_id, **arguments)
                            content = str(result)
                        except Exception as e:
                            content = f"{{\"ok\": False, \"error\": \"{str(e)}\"}}"
                        
                        # Add tool result to conversation
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": content
                        })
                
                # Get final response after tool execution
                final_response = await self.client.chat(messages=messages)
                response_text = final_response.content
                
                final_msg = AIChatMessage(role="assistant", content=response_text)
                return AIChatResponse(
                    message=final_msg,
                    tool_calls=response_tool_calls_log
                )
            else:
                response_text = ai_message.content
                final_msg = AIChatMessage(role="assistant", content=response_text)
                
                return AIChatResponse(
                    message=final_msg,
                    tool_calls=[]
                )

        except Exception as e:
            ai_logger.error(f"Error in agent processing: {str(e)}")
            raise e
