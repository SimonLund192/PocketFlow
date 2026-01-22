import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pocketflow")

client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]

logger = logging.getLogger(__name__)

async def get_database():
    """Get database instance"""
    return database

# Collections
transactions_collection = database.get_collection("transactions")
goals_collection = database.get_collection("goals")

# ============================================================================
# NEW COLLECTIONS: Categories, Budgets, Budget Line Items
# ============================================================================

categories_collection = database.get_collection("categories")
budgets_collection = database.get_collection("budgets")
budget_line_items_collection = database.get_collection("budget_line_items")


# ============================================================================
# DATABASE INDEXES
# ============================================================================

async def create_indexes():
    """
    Create all necessary indexes for the database collections.
    This should be called on application startup.
    """
    try:
        # Categories indexes
        await categories_collection.create_index("user_id")
        await categories_collection.create_index(
            [("user_id", 1), ("name", 1), ("type", 1)],
            unique=True,
            name="unique_category_per_user"
        )
        logger.info("Created indexes for categories collection")

        # Budgets indexes
        await budgets_collection.create_index("user_id")
        await budgets_collection.create_index(
            [("user_id", 1), ("month", 1)],
            unique=True,
            name="unique_budget_per_user_month"
        )
        logger.info("Created indexes for budgets collection")

        # Budget line items indexes
        await budget_line_items_collection.create_index("user_id")
        await budget_line_items_collection.create_index("budget_id")
        await budget_line_items_collection.create_index("category_id")
        await budget_line_items_collection.create_index(
            [("user_id", 1), ("budget_id", 1)],
            name="user_budget_items"
        )
        await budget_line_items_collection.create_index(
            [("user_id", 1), ("category_id", 1)],
            name="user_category_items"
        )
        logger.info("Created indexes for budget_line_items collection")

        # Legacy collections (if they exist)
        await transactions_collection.create_index("user_id")
        await goals_collection.create_index("user_id")
        logger.info("Created indexes for legacy collections")

    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        raise


async def drop_indexes():
    """
    Drop all indexes (useful for testing or migrations).
    Use with caution in production.
    """
    try:
        await categories_collection.drop_indexes()
        await budgets_collection.drop_indexes()
        await budget_line_items_collection.drop_indexes()
        logger.info("Dropped all indexes")
    except Exception as e:
        logger.error(f"Error dropping indexes: {e}")
        raise

