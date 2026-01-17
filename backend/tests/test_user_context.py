import pytest


@pytest.mark.asyncio
async def test_user_scoped_endpoint_requires_x_user_id_header(client) -> None:
	# /api/transactions is user-scoped under the dev contract.
	res = await client.get("/api/transactions")
	assert res.status_code == 400
	assert res.json().get("detail") == "X-User-Id header is required"
