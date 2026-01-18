from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence, Literal, Optional

from app.auth import UserContext


Role = Literal["system", "user", "assistant", "tool"]


@dataclass(frozen=True)
class LlmMessage:
    role: Role
    content: str


@dataclass(frozen=True)
class LlmChatRequest:
    """Provider-agnostic chat request.

    This intentionally stays minimal. Providers can map these fields to their
    own APIs elsewhere.
    """

    messages: Sequence[LlmMessage]
    model: Optional[str] = None
    temperature: float = 0.2


@dataclass(frozen=True)
class LlmChatResponse:
    content: str


class LlmClient(Protocol):
    """Abstraction boundary for an LLM provider.

    Implementations should be pure Python and easy to mock in tests.
    """

    async def chat(self, *, ctx: UserContext, request: LlmChatRequest) -> LlmChatResponse:  # noqa: D401
        ...


class StubLlmClient:
    """Deterministic LLM client for local development/tests.

    This client performs no network calls. It provides a predictable response
    and is safe to use in unit tests.
    """

    def __init__(self, content: str = ""):
        self._content = content

    async def chat(self, *, ctx: UserContext, request: LlmChatRequest) -> LlmChatResponse:
        # Ensure the abstraction stays user-scoped.
        _ = ctx.user_id

        if self._content:
            return LlmChatResponse(content=self._content)

        # Default: echo the latest user message to make it useful while still deterministic.
        last_user = next((m for m in reversed(request.messages) if m.role == "user"), None)
        return LlmChatResponse(content=last_user.content if last_user else "")
