"""
Demo Data Route
Provides an endpoint to seed a user account with demo budget data.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user_id
from app.services.demo_seed_service import seed_demo_data
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/seed")
async def seed_demo(user_id: str = Depends(get_current_user_id)):
    """
    Seed the current user's account with realistic demo budget data.

    This creates categories, budgets (3 months), budget line items,
    and a few goals so the user can see how the app looks with data.

    Idempotent for categories/budgets/goals (won't duplicate).
    Line items are always appended — call this only once per user.
    """
    try:
        summary = await seed_demo_data(user_id)
        return {
            "message": "Demo data seeded successfully!",
            "summary": summary,
        }
    except FileNotFoundError as e:
        logger.error(f"Demo seed failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Demo data file not found on server.",
        )
    except Exception as e:
        logger.error(f"Demo seed failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed demo data: {str(e)}",
        )
