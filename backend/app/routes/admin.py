"""
Admin routes for database management
"""
import logging
import re
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user_id
from app.database import database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================================
# Legacy → emoji/hex migration maps (mirrors frontend category-utils.ts)
# ============================================================================

LEGACY_ICON_TO_EMOJI: dict[str, str] = {
    "dollar": "💰",
    "moneybag": "💰",
    "minus": "💰",
    "car": "🚗",
    "house": "🏠",
    "gamepad": "🎮",
    "subscription": "📱",
    "horse": "🐾",
    "receipt": "🛒",
    "cart": "🛒",
    "food": "🍽️",
    "plane": "✈️",
    "heart": "❤️",
    "book": "🎓",
    "lightbulb": "💡",
    "gift": "🎁",
    "coffee": "☕",
    "fitness": "🏋️",
    "pet": "🐾",
    "music": "🎵",
    "piggy-bank": "💰",
    "landmark": "🏠",
    "shield": "🛡️",
    "globe": "🌍",
    "zap": "⚡",
}

LEGACY_COLOR_TO_HEX: dict[str, str] = {
    "blue": "#3b82f6",
    "pink": "#ec4899",
    "red": "#ef4444",
    "yellow": "#eab308",
    "green": "#22c55e",
    "purple": "#a855f7",
    "orange": "#f97316",
    "indigo": "#6366f1",
}

_LEGACY_KEY_RE = re.compile(r"^[a-z0-9-]+$")


def _is_legacy_icon(icon: str | None) -> bool:
    """True if the icon is a short ASCII key like 'dollar', not an emoji."""
    if not icon:
        return False
    return bool(_LEGACY_KEY_RE.match(icon))


def _is_legacy_color(color: str | None) -> bool:
    """True if the color is a name like 'blue', not a '#hex' string."""
    if not color:
        return False
    return not color.startswith("#")


@router.delete("/clear-transactions")
async def clear_transactions(user_id: str = Depends(get_current_user_id)):
    """
    Clear all transactions for the current user
    """
    transactions_collection = database["transactions"]
    result = await transactions_collection.delete_many({"user_id": user_id})
    return {
        "message": f"Cleared {result.deleted_count} transactions",
        "deleted_count": result.deleted_count
    }


@router.delete("/clear-budgets")
async def clear_budgets(user_id: str = Depends(get_current_user_id)):
    """
    Clear all budgets and budget line items for the current user
    """
    budgets_collection = database["budgets"]
    budget_line_items_collection = database["budget_line_items"]
    
    # Delete all budgets
    budgets_result = await budgets_collection.delete_many({"user_id": user_id})
    
    # Delete all budget line items
    line_items_result = await budget_line_items_collection.delete_many({"user_id": user_id})
    
    return {
        "message": f"Cleared {budgets_result.deleted_count} budgets and {line_items_result.deleted_count} line items",
        "budgets_deleted": budgets_result.deleted_count,
        "line_items_deleted": line_items_result.deleted_count
    }


@router.delete("/clear-categories")
async def clear_categories(user_id: str = Depends(get_current_user_id)):
    """
    Clear all categories for the current user
    """
    categories_collection = database["categories"]
    result = await categories_collection.delete_many({"user_id": user_id})
    return {
        "message": f"Cleared {result.deleted_count} categories",
        "deleted_count": result.deleted_count
    }


@router.delete("/clear-goals")
async def clear_goals(user_id: str = Depends(get_current_user_id)):
    """
    Clear all goals for the current user
    """
    goals_collection = database["goals"]
    result = await goals_collection.delete_many({"user_id": user_id})
    return {
        "message": f"Cleared {result.deleted_count} goals",
        "deleted_count": result.deleted_count
    }


@router.delete("/clear-all")
async def clear_all_data(user_id: str = Depends(get_current_user_id)):
    """
    Clear ALL data for the current user
    WARNING: This cannot be undone!
    """
    transactions_collection = database["transactions"]
    budgets_collection = database["budgets"]
    budget_line_items_collection = database["budget_line_items"]
    categories_collection = database["categories"]
    goals_collection = database["goals"]
    
    # Delete all data
    transactions_result = await transactions_collection.delete_many({"user_id": user_id})
    budgets_result = await budgets_collection.delete_many({"user_id": user_id})
    line_items_result = await budget_line_items_collection.delete_many({"user_id": user_id})
    categories_result = await categories_collection.delete_many({"user_id": user_id})
    goals_result = await goals_collection.delete_many({"user_id": user_id})
    
    total_deleted = (
        transactions_result.deleted_count +
        budgets_result.deleted_count +
        line_items_result.deleted_count +
        categories_result.deleted_count +
        goals_result.deleted_count
    )
    
    return {
        "message": f"Cleared all data ({total_deleted} total records)",
        "transactions_deleted": transactions_result.deleted_count,
        "budgets_deleted": budgets_result.deleted_count,
        "line_items_deleted": line_items_result.deleted_count,
        "categories_deleted": categories_result.deleted_count,
        "goals_deleted": goals_result.deleted_count,
        "total_deleted": total_deleted
    }


@router.post("/migrate-category-icons")
async def migrate_category_icons(user_id: str = Depends(get_current_user_id)):
    """
    Migrate all legacy icon/color values to emoji + hex format for the current user.

    Legacy icons are short ASCII keys like "dollar", "car".
    Legacy colors are named strings like "blue", "red".

    After migration they become emoji strings ("💰", "🚗") and hex codes ("#3b82f6", "#ef4444").

    Categories that already use the new format or have no icon/color are skipped.
    """
    categories_collection = database["categories"]

    cursor = categories_collection.find({"user_id": user_id})
    updated = 0
    skipped = 0
    unmapped_icons: list[str] = []
    unmapped_colors: list[str] = []

    async for cat in cursor:
        icon = cat.get("icon") or ""
        color = cat.get("color") or ""
        updates: dict[str, str] = {}

        # Migrate icon
        if _is_legacy_icon(icon):
            new_icon = LEGACY_ICON_TO_EMOJI.get(icon)
            if new_icon:
                updates["icon"] = new_icon
            else:
                unmapped_icons.append(icon)

        # Migrate color
        if _is_legacy_color(color):
            new_color = LEGACY_COLOR_TO_HEX.get(color)
            if new_color:
                updates["color"] = new_color
            else:
                unmapped_colors.append(color)

        if updates:
            await categories_collection.update_one(
                {"_id": cat["_id"]},
                {"$set": updates},
            )
            updated += 1
            logger.info(
                "Migrated category '%s' (id=%s): %s",
                cat.get("name"),
                cat["_id"],
                updates,
            )
        else:
            skipped += 1

    result = {
        "message": f"Migration complete: {updated} updated, {skipped} skipped",
        "updated": updated,
        "skipped": skipped,
    }
    if unmapped_icons:
        result["unmapped_icons"] = list(set(unmapped_icons))
    if unmapped_colors:
        result["unmapped_colors"] = list(set(unmapped_colors))

    return result
