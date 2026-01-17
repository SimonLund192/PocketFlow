import pytest


@pytest.mark.asyncio
async def test_user_scoped_endpoints_require_user_context_header(client) -> None:
    # A few representative, user-scoped endpoints.
    endpoints = [
        ("GET", "/api/transactions"),
        ("GET", "/api/dashboard/stats"),
        ("GET", "/api/dashboard/expense-breakdown"),
        ("GET", "/api/budget/2026-01"),
        ("GET", "/api/goals"),
    ]

    for method, path in endpoints:
        res = await getattr(client, method.lower())(path)
        assert res.status_code == 400
        assert res.json().get("detail") == "X-User-Id header is required"
