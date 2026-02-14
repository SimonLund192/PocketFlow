from typing import List, Dict, Any
import json
from datetime import datetime
from pathlib import Path
from bson import ObjectId
from .client import LLMClient
from .tools import tools_registry, get_tool_definitions, execute_save_budget_entries
from .schemas import (
    AIChatRequest, AIChatResponse, AIChatMessage,
    PendingAction, ProposedEntry,
)
from .logging import ai_logger
from app.database import database

MAX_TOOL_ITERATIONS = 10  # Safety limit for the ReAct loop


class AIAgent:
    def __init__(self):
        self.client = LLMClient()
        self.available_tools = get_tool_definitions()
        self.system_prompt_path = Path(__file__).parent / "system_prompt.txt"

    async def _load_system_prompt(self, user_id: str = "") -> str:
        """Load and format the system prompt with current date context and user names"""
        try:
            with open(self.system_prompt_path, 'r') as f:
                prompt_template = f.read()

            current_date = datetime.now().strftime("%B %d, %Y")
            current_month = datetime.now().strftime("%Y-%m")

            # Look up user names from the database
            user1_name = "User 1"
            user2_name = "Partner"
            if user_id and user_id != "test_user":
                try:
                    users_collection = database["users"]
                    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
                    if user_doc:
                        user1_name = user_doc.get("full_name") or user1_name
                        user2_name = user_doc.get("partner_name") or user2_name
                except Exception as e:
                    ai_logger.warning(f"Could not look up user names: {e}")

            return prompt_template.format(
                current_date=current_date,
                current_month=current_month,
                user1_name=user1_name,
                user2_name=user2_name,
            )
        except Exception as e:
            ai_logger.error(f"Error loading system prompt: {e}")
            return f"You are a helpful financial assistant. Today's date is {datetime.now().strftime('%B %d, %Y')}."

    async def process_request(self, request: AIChatRequest, user_id: str) -> AIChatResponse:
        """
        Multi-step ReAct agent loop.

        Flow:
        1. Send messages + tool schemas to LLM
        2. If LLM returns tool_calls → execute them → append results → loop (up to MAX_TOOL_ITERATIONS)
        3. If LLM returns a text response with no tool_calls → we're done
        4. Special case: if tool is 'propose_budget_entries' and returns action='confirm',
           we pause the loop and return a PendingAction to the frontend for confirmation.
        """
        messages = [msg.model_dump(exclude_none=True) for msg in request.messages]

        # Insert system message if not present
        if not messages or messages[0].get("role") != "system":
            system_message = {
                "role": "system",
                "content": await self._load_system_prompt(user_id)
            }
            messages.insert(0, system_message)

        # Handle confirmation of a pending action
        if request.confirm_action is not None:
            return await self._handle_confirmation(request, user_id, messages)

        try:
            all_tool_calls_log: List[Dict[str, Any]] = []

            for iteration in range(MAX_TOOL_ITERATIONS):
                ai_logger.info(f"ReAct loop iteration {iteration + 1}/{MAX_TOOL_ITERATIONS}")

                # Call LLM
                ai_message = await self.client.chat(
                    messages=messages,
                    tools=self.available_tools if self.available_tools else None
                )

                # No tool calls → final text response
                if not ai_message.tool_calls:
                    response_text = ai_message.content
                    return AIChatResponse(
                        message=AIChatMessage(role="assistant", content=response_text),
                        tool_calls=all_tool_calls_log,
                    )

                # Has tool calls → execute them
                messages.append(ai_message)

                for tool_call in ai_message.tool_calls:
                    function_name = tool_call.function.name
                    arguments = json.loads(tool_call.function.arguments)

                    all_tool_calls_log.append({
                        "name": function_name,
                        "arguments": arguments,
                        "id": tool_call.id,
                    })

                    if request.dry_run:
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": "Dry run: Tool execution skipped.",
                        })
                        continue

                    if function_name not in tools_registry:
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": json.dumps({"ok": False, "error": f"Unknown tool: {function_name}"}),
                        })
                        continue

                    # Execute the tool
                    tool_func = tools_registry[function_name]
                    ai_logger.info(f"Executing tool: {function_name} with args: {arguments}")
                    try:
                        result = await tool_func(user_id=user_id, **arguments)
                        content = json.dumps(result) if isinstance(result, dict) else str(result)
                    except Exception as e:
                        ai_logger.error(f"Tool execution error: {e}")
                        content = json.dumps({"ok": False, "error": str(e)})

                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": content,
                    })

                    # Check if this is a proposal that needs confirmation
                    if function_name == "propose_budget_entries":
                        try:
                            result_data = json.loads(content) if isinstance(content, str) else content
                        except (json.JSONDecodeError, TypeError):
                            result_data = {}

                        if result_data.get("ok") and result_data.get("action") == "confirm":
                            # Pause the loop — return proposal to user for confirmation
                            proposal_data = result_data.get("data", {})
                            entries = proposal_data.get("entries", [])
                            summary = proposal_data.get("summary", "")

                            pending = PendingAction(
                                action_type="save_budget_entries",
                                entries=[ProposedEntry(**e) for e in entries],
                                summary=summary,
                            )

                            # Get a final summary message from the LLM
                            # Use a user message as a hint — Mistral doesn't allow
                            # system messages after tool messages
                            messages.append({
                                "role": "user",
                                "content": "[SYSTEM NOTE: The entries have been validated. Present the summary clearly to the user and ask them to confirm or cancel. Do NOT call any more tools.]",
                            })
                            final_msg = await self.client.chat(
                                messages=messages,
                                tools=None,  # No tools — force text response
                            )

                            return AIChatResponse(
                                message=AIChatMessage(role="assistant", content=final_msg.content),
                                tool_calls=all_tool_calls_log,
                                pending_action=pending,
                            )

            # If we've exhausted iterations, return whatever we have
            ai_logger.warning(f"ReAct loop hit max iterations ({MAX_TOOL_ITERATIONS})")
            # Append a user hint so we don't end on a tool message (Mistral rejects that)
            messages.append({
                "role": "user",
                "content": "[SYSTEM NOTE: You've used the maximum number of tool calls. Please summarize what you've found so far and respond to the user. Do NOT call any more tools.]",
            })
            final_msg = await self.client.chat(messages=messages, tools=None)
            return AIChatResponse(
                message=AIChatMessage(role="assistant", content=final_msg.content),
                tool_calls=all_tool_calls_log,
                warnings=[f"Processing stopped after {MAX_TOOL_ITERATIONS} steps"],
            )

        except Exception as e:
            ai_logger.error(f"Error in agent processing: {str(e)}")
            raise e

    async def _handle_confirmation(
        self,
        request: AIChatRequest,
        user_id: str,
        messages: List[Dict[str, Any]],
    ) -> AIChatResponse:
        """Handle user's confirmation or rejection of a pending action."""

        if request.confirm_action == "yes":
            # Find the pending action in the last assistant message's context
            # The frontend sends the entries back in the request
            # We need to extract them from the conversation
            pending_entries = self._extract_pending_entries(request)

            if not pending_entries:
                return AIChatResponse(
                    message=AIChatMessage(
                        role="assistant",
                        content="I couldn't find the entries to save. Could you try again?"
                    ),
                    tool_calls=[],
                )

            # Execute the save
            result = await execute_save_budget_entries(user_id, pending_entries)

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

        else:
            # User rejected
            return AIChatResponse(
                message=AIChatMessage(
                    role="assistant",
                    content="No problem, I've cancelled that. Let me know if you'd like to try again or make changes.",
                ),
                tool_calls=[],
            )

    def _extract_pending_entries(self, request: AIChatRequest) -> list:
        """
        Extract pending entries from the request.
        The frontend sends them as a special message or in a dedicated field.
        """
        # Look for a system/tool message containing the pending entries
        for msg in reversed(request.messages):
            if msg.content and "PENDING_ENTRIES:" in (msg.content or ""):
                try:
                    json_str = msg.content.split("PENDING_ENTRIES:")[1].strip()
                    return json.loads(json_str)
                except (json.JSONDecodeError, IndexError):
                    pass
        return []
