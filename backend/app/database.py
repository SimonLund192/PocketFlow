from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
db = Database()

async def connect_to_mongo():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://admin:admin123@mongodb:27017")
    db.client = AsyncIOMotorClient(mongodb_url)
    print("Connected to MongoDB")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")

def get_database():
    database_name = os.getenv("DATABASE_NAME", "pocketflow")
    return db.client[database_name]
