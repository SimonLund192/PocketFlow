"""API router aggregator.

This module composes per-feature routers located in `app/routes/`.

Important: The public URL structure must not change. `app/main.py` includes this
router under the `/api` prefix.
"""

from fastapi import APIRouter

from app.routes.budgets import router as budgets_router
from app.routes.dashboard import router as dashboard_router
from app.routes.goals import router as goals_router
from app.routes.transactions import router as transactions_router
from app.routes.users import router as users_router

router = APIRouter()

# Keep URLs unchanged by mounting each feature router at the root.
router.include_router(users_router)
router.include_router(transactions_router)
router.include_router(dashboard_router)
router.include_router(budgets_router)
router.include_router(goals_router)
