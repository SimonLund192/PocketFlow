from typing import List, Dict, Any
import json
from .client import LLMClient
from .tools import tools_registry, get_tool_definitions
from .schemas import AIChatRequest, AIChatResponse, AIChatMessage
from .logging import ai_logger

class AIAgent:
    def __init__(self):
        self.client = LLMClient()
        self.available_tools = get_tool_definitions()

    async def process_request(self, request: AIChatRequest) -> AIChatResponse:
        messages = [msg.model_dump(exclude_none=True) for msg in request.messages]

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
                            # TODO: Validate args against pydantic models if needed
                            result = await tool_func(**arguments)
                            content = str(result)
                        except Exception as e:
                            content = f"Error executing tool: {str(e)}"
                        
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
