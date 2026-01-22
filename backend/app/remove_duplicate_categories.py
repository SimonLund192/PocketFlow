"""
Remove duplicate categories
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def remove_duplicates():
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client["pocketflow"]
    categories_collection = db["categories"]
    
    # Find all categories
    categories = await categories_collection.find({}).to_list(None)
    print(f"Total categories before cleanup: {len(categories)}")
    
    # Group by (user_id, name, type)
    seen = {}
    duplicates_to_remove = []
    
    for cat in categories:
        # Use lowercase name for comparison to handle case-insensitive duplicates
        key = (cat.get('user_id'), cat.get('name', '').lower(), cat.get('type'))
        if key in seen:
            # This is a duplicate, mark for removal (keep the first one)
            duplicates_to_remove.append(cat['_id'])
            print(f"  Duplicate found: {cat.get('name')} ({cat.get('type')}) - will remove")
        else:
            seen[key] = cat
    
    # Remove duplicates
    if duplicates_to_remove:
        result = await categories_collection.delete_many({'_id': {'$in': duplicates_to_remove}})
        print(f"\nRemoved {result.deleted_count} duplicate categories")
    else:
        print("\nNo duplicates found")
    
    # Show remaining categories
    categories = await categories_collection.find({}).to_list(None)
    print(f"\nTotal categories after cleanup: {len(categories)}")
    for cat in categories:
        print(f"  - {cat.get('name')} ({cat.get('type')})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_duplicates())
