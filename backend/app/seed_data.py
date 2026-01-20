import asyncio
from datetime import datetime, timedelta
from app.database import transactions_collection, goals_collection
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def seed_database():
    """Seed the database with sample data"""
    
    # Clear existing data
    await transactions_collection.delete_many({})
    await goals_collection.delete_many({})
    
    # Sample transactions
    now = datetime.now()
    transactions = [
        # Income
        {
            "amount": 35000,
            "category": "Salary",
            "type": "income",
            "description": "Monthly salary",
            "date": datetime(now.year, now.month, 1)
        },
        # Expenses
        {
            "amount": 17952,
            "category": "Rent",
            "type": "expense",
            "description": "Monthly rent",
            "date": datetime(now.year, now.month, 5)
        },
        {
            "amount": 1720,
            "category": "Bil",
            "type": "expense",
            "description": "Car payment",
            "date": datetime(now.year, now.month, 7)
        },
        {
            "amount": 924,
            "category": "Forsikring",
            "type": "expense",
            "description": "Insurance",
            "date": datetime(now.year, now.month, 10)
        },
        {
            "amount": 408,
            "category": "Website",
            "type": "expense",
            "description": "Website hosting",
            "date": datetime(now.year, now.month, 12)
        },
        {
            "amount": 354,
            "category": "Mobil",
            "type": "expense",
            "description": "Phone bill",
            "date": datetime(now.year, now.month, 15)
        },
        # Savings
        {
            "amount": 13000,
            "category": "General Savings",
            "type": "savings",
            "description": "Monthly savings",
            "date": datetime(now.year, now.month, 20)
        },
    ]
    
    await transactions_collection.insert_many(transactions)
    
    # Sample goals
    goals = [
        {
            "name": "Emergency Fund",
            "target_amount": 50000,
            "current_amount": 26000,
            "achieved": False,
            "deadline": datetime(now.year, 12, 31)
        },
        {
            "name": "Vacation Fund",
            "target_amount": 10000,
            "current_amount": 10000,
            "achieved": True,
            "deadline": datetime(now.year, 6, 30)
        },
    ]
    
    await goals_collection.insert_many(goals)
    
    print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
