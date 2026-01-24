from typing import List, Dict, Any
import json
from .client import LLMClient
from .tools import tools_registry, get_tool_definitions
from .schemas import AgentRequest, AgentResponse, AgentMessage
from .logging import ai_logger

class AIAgent:
    def __init__(self):
        self.client = LLMClient()
        self.available_tools = get_tool_definitions()

    async def process_request(self, request: AgentRequest) -> AgentResponse:
        messages = [msg.model_dump(exclude_none=True) for msg in request.conversation_history]
        messages.append({"role": "user", "content": request.message})

        try:
            # First LLM call
            ai_message = await self.client.chat(
                messages=messages,
                tools=self.available_tools if self.available_tools else None
            )

            # Handle tool calls if any
            if ai_message.tool_calls:
                messages.append(ai_message)  # Add assistant message with tool calls
                
                for tool_call in ai_message.tool_calls:
                    function_name = tool_call.function.name
                    arguments = json.loads(tool_call.function.arguments)
                    
                    if function_name in tools_registry:
                        tool_func = tools_registry[function_name]
                        # Execute tool
                        ai_logger.info(f"Executing tool: {function_name} with args: {arguments}")
                        result = await tool_func(**arguments)
                        
                        # Add tool result to conversation
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": str(result)
                        })
                
                # Get final response after tool execution
                final_response = await self.client.chat(messages=messages)
                response_text = final_response.content
                
                # Update history
                updated_history = [AgentMessage(**msg) if isinstance(msg, dict) else AgentMessage(**msg.model_dump()) for msg in messages]
                if final_response.content:
                     updated_history.append(AgentMessage(role="assistant", content=final_response.content))
                
                return AgentResponse(
                    response=response_text or "",
                    conversation_updated=updated_history
                )
            else:
                response_text = ai_message.content
                updated_history = [AgentMessage(**msg) for msg in messages]
                updated_history.append(AgentMessage(role="assistant", content=response_text))
                
                return AgentResponse(
                    response=response_text,
                    conversation_updated=updated_history
                )

        except Exception as e:
            ai_logger.error(f"Error in agent processing: {str(e)}")
            raise e
