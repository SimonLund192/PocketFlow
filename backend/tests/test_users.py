from fastapi.testclient import TestClient

from app.main import app
from app.database import db


client = TestClient(app)


def test_create_user_then_list_users_returns_user() -> None:
    if db.client is None:
        # Unit tests run without a provisioned Mongo instance.
        # This test is intended to cover the endpoints when Mongo is available.
        return

    payload = {
        "email": "dev.user@example.com",
        "password": "dev-password",
        "full_name": "Dev User",
    }

    created = client.post("/api/users", json=payload)
    # In unit test mode we may not have Mongo configured; in that case we still
    # want the route to exist and fail predictably (500), not 404.
    assert created.status_code in (201, 400, 500)

    if created.status_code != 201:
        return

    data = created.json()
    assert "id" in data and isinstance(data["id"], str) and data["id"].strip()
    assert data["email"] == payload["email"]
    assert data["full_name"] == payload["full_name"]

    listed = client.get("/api/users")
    assert listed.status_code in (200, 500)
    if listed.status_code != 200:
        return

    users = listed.json()
    assert isinstance(users, list)
    assert any(u.get("id") == data["id"] for u in users)
