import pytest

from app.ai.llm_client import (
    LlmChatRequest,
    LlmMessage,
    StubLlmClient,
)
from app.auth import UserContext


@pytest.mark.asyncio
async def test_stub_llm_client_echoes_last_user_message() -> None:
    ctx = UserContext(user_id="user-a")
    client = StubLlmClient()

    resp = await client.chat(
        ctx=ctx,
        request=LlmChatRequest(
            messages=[
                LlmMessage(role="system", content="You are helpful."),
                LlmMessage(role="user", content="hello"),
                LlmMessage(role="assistant", content="hi"),
                LlmMessage(role="user", content="final"),
            ]
        ),
    )

    assert resp.content == "final"


@pytest.mark.asyncio
async def test_stub_llm_client_returns_configured_content() -> None:
    ctx = UserContext(user_id="user-a")
    client = StubLlmClient(content="fixed")

    resp = await client.chat(
        ctx=ctx,
        request=LlmChatRequest(messages=[LlmMessage(role="user", content="ignored")]),
    )

    assert resp.content == "fixed"
