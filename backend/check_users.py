
import asyncio
from app.database import database
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

async def check_users():
    users = await database["users"].find().to_list(100)
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"- {user['email']} (ID: {user['_id']})")

if __name__ == "__main__":
    asyncio.run(check_users())
