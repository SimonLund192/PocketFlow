"""
Migration script to convert legacy string category references to ObjectId references.

This script handles migration of budget_line_items that store category as a string
to the new format that stores category_id as an ObjectId reference.

Usage:
    python -m app.migrations.migrate_categories_to_objectid [--dry-run]
"""

import asyncio
import logging
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from typing import Dict, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CategoryMigration:
    """Handles migration from string categories to ObjectId references"""

    def __init__(self, db_client):
        self.db = db_client.pocketflow
        self.categories_collection = self.db.categories
        self.line_items_collection = self.db.budget_line_items
        self.stats = {
            "total_items": 0,
            "already_migrated": 0,
            "successfully_migrated": 0,
            "failed": 0,
            "orphaned": 0,
        }

    async def build_category_mapping(self) -> Dict[str, Dict[str, ObjectId]]:
        """
        Build a mapping of {user_id: {category_name: category_id}} for lookup.

        Returns:
            Dict mapping user_id -> category_name -> ObjectId
        """
        logger.info("Building category mapping...")
        mapping = {}

        cursor = self.categories_collection.find({})
        async for category in cursor:
            user_id = category["user_id"]
            name = category["name"]
            category_id = category["_id"]

            if user_id not in mapping:
                mapping[user_id] = {}

            mapping[user_id][name] = category_id

        logger.info(f"Built mapping for {len(mapping)} users with categories")
        return mapping

    async def migrate_line_item(
        self,
        line_item: dict,
        category_mapping: Dict[str, Dict[str, ObjectId]],
        dry_run: bool = False
    ) -> bool:
        """
        Migrate a single line item from string category to ObjectId.

        Args:
            line_item: The line item document
            category_mapping: Mapping of user_id -> category_name -> ObjectId
            dry_run: If True, only log what would be done

        Returns:
            True if migrated successfully, False otherwise
        """
        item_id = line_item["_id"]
        user_id = line_item["user_id"]

        # Check if already migrated (has category_id field)
        if "category_id" in line_item and isinstance(line_item["category_id"], ObjectId):
            logger.debug(f"Line item {item_id} already migrated")
            self.stats["already_migrated"] += 1
            return True

        # Get the old string category
        old_category = line_item.get("category")
        if not old_category:
            logger.warning(f"Line item {item_id} has no category field")
            self.stats["failed"] += 1
            return False

        # Look up the category ObjectId
        user_categories = category_mapping.get(user_id, {})
        category_id = user_categories.get(old_category)

        if not category_id:
            logger.warning(
                f"Line item {item_id}: No category found for user {user_id} "
                f"with name '{old_category}' - orphaned line item"
            )
            self.stats["orphaned"] += 1
            return False

        # Perform migration
        if dry_run:
            logger.info(
                f"[DRY RUN] Would migrate line item {item_id}: "
                f"'{old_category}' -> {category_id}"
            )
            self.stats["successfully_migrated"] += 1
            return True

        try:
            result = await self.line_items_collection.update_one(
                {"_id": item_id},
                {
                    "$set": {
                        "category_id": category_id,
                        "updated_at": datetime.now(timezone.utc),
                        "_migrated_at": datetime.now(timezone.utc),
                    },
                    "$unset": {"category": ""}  # Remove old string field
                }
            )

            if result.modified_count > 0:
                logger.info(
                    f"Migrated line item {item_id}: '{old_category}' -> {category_id}"
                )
                self.stats["successfully_migrated"] += 1
                return True
            else:
                logger.error(f"Failed to update line item {item_id}")
                self.stats["failed"] += 1
                return False

        except Exception as e:
            logger.error(f"Error migrating line item {item_id}: {e}")
            self.stats["failed"] += 1
            return False

    async def run_migration(self, dry_run: bool = False):
        """
        Run the full migration process.

        Args:
            dry_run: If True, only log what would be done without making changes
        """
        logger.info("=" * 60)
        logger.info("Starting category migration")
        logger.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
        logger.info("=" * 60)

        # Build category mapping
        category_mapping = await self.build_category_mapping()

        # Get all line items
        cursor = self.line_items_collection.find({})
        line_items = await cursor.to_list(length=None)
        self.stats["total_items"] = len(line_items)

        logger.info(f"Found {self.stats['total_items']} budget line items to process")

        # Migrate each line item
        for line_item in line_items:
            await self.migrate_line_item(line_item, category_mapping, dry_run)

        # Print summary
        self.print_summary(dry_run)

    def print_summary(self, dry_run: bool):
        """Print migration summary statistics"""
        logger.info("=" * 60)
        logger.info(f"Migration {'DRY RUN ' if dry_run else ''}Summary")
        logger.info("=" * 60)
        logger.info(f"Total line items:        {self.stats['total_items']}")
        logger.info(f"Already migrated:        {self.stats['already_migrated']}")
        logger.info(f"Successfully migrated:   {self.stats['successfully_migrated']}")
        logger.info(f"Failed:                  {self.stats['failed']}")
        logger.info(f"Orphaned (no category):  {self.stats['orphaned']}")
        logger.info("=" * 60)

        if self.stats["orphaned"] > 0:
            logger.warning(
                f"\n{self.stats['orphaned']} orphaned line items found! "
                "These have category names that don't exist in the categories collection."
            )
            logger.warning(
                "You may need to:\n"
                "  1. Create missing categories\n"
                "  2. Manually assign categories to these line items\n"
                "  3. Delete orphaned line items"
            )


async def main():
    """Main entry point for migration script"""
    # Check for dry-run flag
    dry_run = "--dry-run" in sys.argv

    # Get MongoDB connection string from environment
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    logger.info(f"Connecting to MongoDB at: {mongo_uri}")

    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_uri)

    try:
        # Test connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")

        # Run migration
        migration = CategoryMigration(client)
        await migration.run_migration(dry_run=dry_run)

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        client.close()
        logger.info("Database connection closed")


if __name__ == "__main__":
    asyncio.run(main())
