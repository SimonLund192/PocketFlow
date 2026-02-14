"""
Demo Data Seed Service
Seeds a user account with realistic demo budget data from a CSV file.
"""
import csv
import os
import logging
from datetime import datetime, timezone
from collections import defaultdict
from bson import ObjectId

from app.database import (
    categories_collection,
    budgets_collection,
    budget_line_items_collection,
    goals_collection,
)

logger = logging.getLogger(__name__)

# In Docker: __file__ = /app/app/services/demo_seed_service.py
# We need to get to /app/demo_data.csv (3 levels up from file)
CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "demo_data.csv",
)

# Map CSV "type" values to category types stored in the DB
TYPE_MAP = {
    "income": "income",
    "expense": "expense",
    "savings": "savings",
    "fun": "fun",
}

# Default emoji icon + hex color for demo categories, keyed by (name, type).
# Falls back to ("📦", "#6366f1") for categories not listed here.
DEMO_CATEGORY_STYLE: dict[str, tuple[str, str]] = {
    # Income
    "Salary": ("💰", "#22c55e"),
    "SU": ("🎓", "#3b82f6"),
    "Freelance": ("💻", "#6366f1"),
    # Expenses
    "Rent": ("🏠", "#ef4444"),
    "Groceries": ("🛒", "#f97316"),
    "Utilities": ("💡", "#eab308"),
    "Insurance": ("🛡️", "#3b82f6"),
    "Streaming": ("📺", "#a855f7"),
    "Phone & Internet": ("📱", "#14b8a6"),
    "Car": ("🚗", "#6366f1"),
    "Gas": ("⛽", "#f43f5e"),
    "Health & Fitness": ("🏋️", "#22c55e"),
    "Clothing": ("👕", "#ec4899"),
    "Subscriptions": ("📦", "#06b6d4"),
    "Public Transport": ("🌍", "#84cc16"),
    # Savings
    "Vacation": ("✈️", "#3b82f6"),
    "Emergency Fund": ("🛡️", "#ef4444"),
    "House Fund": ("🏠", "#22c55e"),
    "Investments": ("📈", "#6366f1"),
    # Fun
    "Dining Out": ("🍽️", "#f97316"),
    "Gaming": ("🎮", "#a855f7"),
    "Shopping": ("🛍️", "#ec4899"),
    "Travel": ("✈️", "#3b82f6"),
    "Hobbies": ("🎨", "#eab308"),
    "Gifts": ("🎁", "#ef4444"),
}


async def seed_demo_data(user_id: str) -> dict:
    """
    Seed the current user's account with demo budget data.

    Steps:
        1. Ensure all required categories exist (from the CSV).
        2. Ensure a budget document exists for each month in the CSV.
        3. Create budget line items for every row.
        4. Optionally seed a couple of goals.

    Returns a summary dict with counts of created objects.
    """
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Demo CSV not found at {CSV_PATH}")

    # ------------------------------------------------------------------
    # 1. Parse CSV rows
    # ------------------------------------------------------------------
    rows: list[dict] = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    if not rows:
        raise ValueError("Demo CSV is empty")

    # ------------------------------------------------------------------
    # 2. Ensure categories exist (idempotent)
    # ------------------------------------------------------------------
    # Collect unique (category_name, type) pairs from CSV
    needed_categories: set[tuple[str, str]] = set()
    for row in rows:
        cat_name = row["category"].strip()
        cat_type = TYPE_MAP.get(row["type"].strip(), row["type"].strip())
        needed_categories.add((cat_name, cat_type))

    # Fetch existing categories for this user
    existing_cats = await categories_collection.find({"user_id": user_id}).to_list(length=None)
    existing_map: dict[tuple[str, str], str] = {}
    for cat in existing_cats:
        key = (cat["name"], cat["type"])
        existing_map[key] = str(cat["_id"])

    categories_created = 0
    for cat_name, cat_type in needed_categories:
        if (cat_name, cat_type) in existing_map:
            continue
        now = datetime.now(timezone.utc)
        icon, color = DEMO_CATEGORY_STYLE.get(cat_name, ("📦", "#6366f1"))
        result = await categories_collection.insert_one({
            "user_id": user_id,
            "name": cat_name,
            "type": cat_type,
            "icon": icon,
            "color": color,
            "created_at": now,
            "updated_at": now,
        })
        existing_map[(cat_name, cat_type)] = str(result.inserted_id)
        categories_created += 1

    # ------------------------------------------------------------------
    # 3. Ensure budgets exist for each month (idempotent)
    # ------------------------------------------------------------------
    needed_months: set[str] = {row["month"].strip() for row in rows}

    existing_budgets = await budgets_collection.find({"user_id": user_id}).to_list(length=None)
    budget_map: dict[str, str] = {}
    for b in existing_budgets:
        budget_map[b["month"]] = str(b["_id"])

    budgets_created = 0
    for month in needed_months:
        if month in budget_map:
            continue
        now = datetime.now(timezone.utc)
        result = await budgets_collection.insert_one({
            "user_id": user_id,
            "month": month,
            "created_at": now,
            "updated_at": now,
        })
        budget_map[month] = str(result.inserted_id)
        budgets_created += 1

    # ------------------------------------------------------------------
    # 4. Create budget line items
    # ------------------------------------------------------------------
    line_items_created = 0
    for row in rows:
        cat_name = row["category"].strip()
        cat_type = TYPE_MAP.get(row["type"].strip(), row["type"].strip())
        month = row["month"].strip()
        name = row["name"].strip()
        amount = float(row["amount"])
        owner_slot = row["owner_slot"].strip()

        category_id = existing_map.get((cat_name, cat_type))
        budget_id = budget_map.get(month)

        if not category_id or not budget_id:
            logger.warning(
                f"Skipping line item '{name}': category or budget not found"
            )
            continue

        now = datetime.now(timezone.utc)
        await budget_line_items_collection.insert_one({
            "user_id": user_id,
            "budget_id": ObjectId(budget_id),
            "name": name,
            "category_id": ObjectId(category_id),
            "amount": amount,
            "owner_slot": owner_slot,
            "created_at": now,
            "updated_at": now,
        })
        line_items_created += 1

    # ------------------------------------------------------------------
    # 5. Seed a couple of demo goals
    # ------------------------------------------------------------------
    goals_created = 0
    demo_goals = [
        {
            "name": "Summer Vacation",
            "target_amount": 15000,
            "current_amount": 8000,
            "description": "Trip to Southern Europe",
            "type": "shared",
            "achieved": False,
            "priority": 1,
            "items": [
                {"name": "Flights", "amount": 5000, "url": None},
                {"name": "Hotels", "amount": 6000, "url": None},
                {"name": "Activities", "amount": 4000, "url": None},
            ],
        },
        {
            "name": "Emergency Fund",
            "target_amount": 50000,
            "current_amount": 26000,
            "description": "6 months of expenses as safety net",
            "type": "shared",
            "achieved": False,
            "priority": 2,
            "items": [],
        },
        {
            "name": "New Gaming Setup",
            "target_amount": 12000,
            "current_amount": 4500,
            "description": "PC + Monitor upgrade",
            "type": "fun",
            "achieved": False,
            "priority": 3,
            "items": [
                {"name": "GPU", "amount": 6000, "url": None},
                {"name": "Monitor", "amount": 4000, "url": None},
                {"name": "Peripherals", "amount": 2000, "url": None},
            ],
        },
    ]

    for goal in demo_goals:
        # Skip if goal with same name already exists
        existing = await goals_collection.find_one({
            "user_id": user_id,
            "name": goal["name"],
        })
        if existing:
            continue

        now = datetime.now(timezone.utc)
        await goals_collection.insert_one({
            "user_id": user_id,
            **goal,
            "created_at": now,
            "updated_at": now,
        })
        goals_created += 1

    summary = {
        "categories_created": categories_created,
        "budgets_created": budgets_created,
        "line_items_created": line_items_created,
        "goals_created": goals_created,
    }
    logger.info(f"Demo data seeded for user {user_id}: {summary}")
    return summary
