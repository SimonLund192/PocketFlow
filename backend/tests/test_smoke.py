from fastapi.testclient import TestClient

# Import the FastAPI app instance
from app.main import app


client = TestClient(app)


def test_root_returns_message() -> None:
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert "message" in data


def test_health_returns_healthy() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}
