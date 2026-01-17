import pytest


@pytest.mark.asyncio
async def test_root_returns_message(client) -> None:
    res = await client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_health_returns_healthy(client) -> None:
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}
