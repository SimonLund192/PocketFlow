import asyncio
from app.database import database

async def check_users():
    users = await database['users'].find({}).to_list(None)
    print(f"Total users: {len(users)}")
    for user in users:
        print(f"  - {user.get('email')}")

if __name__ == "__main__":
    asyncio.run(check_users())
