import os
import uuid

import httpx
import pytest
import pytest_asyncio

from app.database import db
from app.main import app
from app.database import connect_to_mongo, close_mongo_connection


def _mongo_url_for_tests() -> str:
	# Prefer explicit test env var, then reuse dev default.
	return os.getenv("MONGODB_URL_TEST") or os.getenv(
		"MONGODB_URL", "mongodb://admin:admin123@localhost:27018"
	)


@pytest.fixture(scope="session", autouse=True)
def _mongo_env() -> None:
	# Ensure the FastAPI startup hook connects to the test Mongo, not the docker-internal hostname.
	os.environ["MONGODB_URL_TEST"] = _mongo_url_for_tests()


@pytest.fixture(scope="session")
def test_db_name() -> str:
	# Unique DB per test run to avoid clobbering local/dev data.
	return f"pocketflow_test_{uuid.uuid4().hex}"


@pytest_asyncio.fixture()
async def client(test_db_name: str) -> httpx.AsyncClient:
	# Ensure app code uses the isolated test DB.
	os.environ["DATABASE_NAME"] = test_db_name

	# httpx's ASGITransport doesn't guarantee FastAPI lifespan events,
	# so we explicitly run startup/shutdown to initialize Motor.
	await connect_to_mongo()

	transport = httpx.ASGITransport(app=app)
	async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
		yield c

	# Cleanup DB after the test.
	if db.client is not None:
		try:
			await db.client.drop_database(test_db_name)
		finally:
			await close_mongo_connection()


@pytest_asyncio.fixture(autouse=True)
async def clear_collections(client: httpx.AsyncClient, test_db_name: str):
	# Clean known collections before each test for isolation.
	# Rely on app startup to initialize db.client.
	if db.client is None:
		return

	database = db.client[test_db_name]
	for name in ["transactions", "users", "budgets", "categories", "goals"]:
		await database[name].delete_many({})
