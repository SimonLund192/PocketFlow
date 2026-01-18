"""AI service boundary (no routes wired yet).

This package defines the backend AI abstraction layer:
- `llm_client.py`: provider-agnostic LLM interface
- `mcp.py`: explicit MCP tool registry + executor

Nothing in here should make network calls in tests.
"""
