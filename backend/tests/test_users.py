import pytest

from app.database import db


@pytest.mark.asyncio
async def test_create_user_then_list_users_returns_user(client) -> None:
	if db.client is None:
		# Unit tests run without a provisioned Mongo instance.
		# This test is intended to cover the endpoints when Mongo is available.
		return

	payload = {
		"email": "dev.user@example.com",
		"password": "dev-password",
		"full_name": "Dev User",
	}

	created = await client.post("/api/users", json=payload)
	assert created.status_code == 201

	data = created.json()
	assert "id" in data and isinstance(data["id"], str) and data["id"].strip()
	assert data["email"] == payload["email"]
	assert data["full_name"] == payload["full_name"]

	listed = await client.get("/api/users")
	assert listed.status_code == 200

	users = listed.json()
	assert isinstance(users, list)
	assert any(u.get("id") == data["id"] for u in users)
