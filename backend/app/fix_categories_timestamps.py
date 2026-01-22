"""
Fix existing categories that are missing created_at/updated_at timestamps
"""
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def fix_timestamps():
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client["pocketflow"]
    categories_collection = db["categories"]
    
    # Find categories missing timestamps
    now = datetime.now(timezone.utc)
    
    # Update categories missing created_at
    result1 = await categories_collection.update_many(
        {"created_at": {"$exists": False}},
        {"$set": {"created_at": now}}
    )
    print(f"Added created_at to {result1.modified_count} categories")
    
    # Update categories missing updated_at
    result2 = await categories_collection.update_many(
        {"updated_at": {"$exists": False}},
        {"$set": {"updated_at": now}}
    )
    print(f"Added updated_at to {result2.modified_count} categories")
    
    # Show all categories
    categories = await categories_collection.find({}).to_list(None)
    print(f"\nTotal categories: {len(categories)}")
    for cat in categories:
        print(f"  - {cat.get('name')} ({cat.get('type')}): created_at={cat.get('created_at')}, updated_at={cat.get('updated_at')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_timestamps())
