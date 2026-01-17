from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_user_scoped_endpoint_requires_x_user_id_header() -> None:
    # /api/transactions is user-scoped under the dev contract.
    res = client.get("/api/transactions")
    assert res.status_code == 400
    assert res.json() == {"detail": "Missing required X-User-Id header"}
