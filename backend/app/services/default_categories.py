"""
Default Categories Service
Seeds a new user with common budget categories on registration.
"""
from datetime import datetime, timezone
from app.database import categories_collection

# Default categories to seed for every new user.
# Each tuple is (name, type, icon, color).
DEFAULT_CATEGORIES = [
    # Income
    ("Salary", "income", "💰", "#22c55e"),
    ("SU", "income", "🎓", "#16a34a"),
    ("Freelance", "income", "💻", "#15803d"),
    ("Side Hustle", "income", "🛠️", "#14532d"),

    # Expenses
    ("Rent", "expense", "🏠", "#ef4444"),
    ("Groceries", "expense", "🛒", "#f97316"),
    ("Utilities", "expense", "💡", "#eab308"),
    ("Insurance", "expense", "🛡️", "#a855f7"),
    ("Car", "expense", "🚗", "#3b82f6"),
    ("Gas", "expense", "⛽", "#6366f1"),
    ("Public Transport", "expense", "🚌", "#8b5cf6"),
    ("Phone & Internet", "expense", "📱", "#ec4899"),
    ("Streaming", "expense", "📺", "#d946ef"),
    ("Entertainment", "expense", "🎬", "#f43f5e"),
    ("Dining Out", "expense", "🍽️", "#fb923c"),
    ("Clothing", "expense", "👕", "#14b8a6"),
    ("Health & Fitness", "expense", "🏋️", "#10b981"),
    ("Pets", "expense", "🐾", "#84cc16"),
    ("Subscriptions", "expense", "📦", "#06b6d4"),
    ("Gifts", "expense", "🎁", "#e11d48"),

    # Savings
    ("Vacation", "savings", "✈️", "#0ea5e9"),
    ("Emergency Fund", "savings", "🆘", "#f59e0b"),
    ("Investments", "savings", "📈", "#22d3ee"),
    ("House Fund", "savings", "🏡", "#2dd4bf"),

    # Fun
    ("Hobbies", "fun", "🎨", "#a78bfa"),
    ("Gaming", "fun", "🎮", "#818cf8"),
    ("Travel", "fun", "🌍", "#38bdf8"),
    ("Shopping", "fun", "🛍️", "#fb7185"),
]


async def seed_default_categories(user_id: str) -> int:
    """
    Insert the default categories for a newly-registered user.

    Skips any category that already exists (safety net for idempotency).
    Returns the number of categories inserted.
    """
    now = datetime.now(timezone.utc)
    inserted = 0

    for name, cat_type, icon, color in DEFAULT_CATEGORIES:
        # Guard against duplicates (shouldn't happen for a fresh user)
        existing = await categories_collection.find_one({
            "user_id": user_id,
            "name": name,
            "type": cat_type,
        })
        if existing:
            continue

        await categories_collection.insert_one({
            "user_id": user_id,
            "name": name,
            "type": cat_type,
            "icon": icon,
            "color": color,
            "created_at": now,
            "updated_at": now,
        })
        inserted += 1

    return inserted
