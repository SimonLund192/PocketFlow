"""
Seed script to populate the database with sample data
Run this after starting docker-compose to get sample data for the dashboard
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random

async def seed_database():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27018")
    db = client["pocketflow"]
    
    # Clear existing data
    await db.transactions.delete_many({})
    print("Cleared existing transactions")
    
    # Sample data categories
    categories_income = ["Salary", "Freelance", "Investment"]
    categories_shared_expenses = ["Rent", "Utilities", "Groceries", "Household"]
    categories_personal_expenses = ["Personal Food", "Transport", "Entertainment", "Shopping", "Healthcare"]
    categories_savings = ["Shared Savings", "Personal Savings"]
    
    transactions = []
    
    # Generate data for the last 6 months
    start_date = datetime.utcnow() - timedelta(days=180)
    current_date = start_date
    
    # Track which day of month for recurring payments
    day_of_month = current_date.day
    
    # Generate transactions day by day
    while current_date <= datetime.utcnow():
        day_of_month = current_date.day
        
        # Monthly salary on the 1st
        if day_of_month == 1:
            transactions.append({
                "type": "income",
                "category": "Salary",
                "amount": float(random.randint(4500, 5500)),
                "description": "Monthly salary",
                "date": current_date
            })
        
        # Occasional freelance income
        if random.random() < 0.03:  # ~3% chance per day
            transactions.append({
                "type": "income",
                "category": "Freelance",
                "amount": float(random.randint(500, 1500)),
                "description": "Freelance project payment",
                "date": current_date
            })
        
        # Monthly rent on the 1st
        if day_of_month == 1:
            transactions.append({
                "type": "expense",
                "category": "Rent",
                "amount": 1200.0,
                "description": "Monthly rent (shared)",
                "date": current_date
            })
        
        # Utilities on the 5th
        if day_of_month == 5:
            transactions.append({
                "type": "expense",
                "category": "Utilities",
                "amount": float(random.randint(100, 200)),
                "description": "Utilities (shared)",
                "date": current_date
            })
        
        # Groceries 2-3 times per week (shared)
        if random.random() < 0.35:  # ~35% chance = ~2-3 times/week
            transactions.append({
                "type": "expense",
                "category": "Groceries",
                "amount": float(random.randint(50, 150)),
                "description": "Grocery shopping (shared)",
                "date": current_date
            })
        
        # Household items occasionally
        if random.random() < 0.05:
            transactions.append({
                "type": "expense",
                "category": "Household",
                "amount": float(random.randint(20, 100)),
                "description": "Household items (shared)",
                "date": current_date
            })
        
        # Personal expenses - more frequent
        num_personal = random.randint(1, 3)
        for _ in range(num_personal):
            category = random.choice(categories_personal_expenses)
            
            # Different amount ranges for different categories
            if category == "Transport":
                amount = random.randint(5, 30)
            elif category == "Personal Food":
                amount = random.randint(10, 50)
            elif category == "Entertainment":
                amount = random.randint(15, 80)
            elif category == "Shopping":
                amount = random.randint(20, 150)
            elif category == "Healthcare":
                amount = random.randint(30, 200)
            else:
                amount = random.randint(10, 100)
            
            transactions.append({
                "type": "expense",
                "category": category,
                "amount": float(amount),
                "description": f"{category}",
                "date": current_date
            })
        
        # Savings on the 2nd of each month
        if day_of_month == 2:
            transactions.append({
                "type": "expense",
                "category": "Shared Savings",
                "amount": 300.0,
                "description": "Monthly shared savings contribution",
                "date": current_date
            })
            
            transactions.append({
                "type": "expense",
                "category": "Personal Savings",
                "amount": float(random.randint(200, 500)),
                "description": "Monthly personal savings",
                "date": current_date
            })
        
        current_date += timedelta(days=1)
    
    # Insert all transactions
    if transactions:
        result = await db.transactions.insert_many(transactions)
        print(f"Inserted {len(result.inserted_ids)} transactions")
    
    # Print summary
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expenses
    
    # Category breakdown
    print(f"\n=== Summary ===")
    print(f"Total Income: ${total_income:,.2f}")
    print(f"Total Expenses: ${total_expenses:,.2f}")
    print(f"Balance: ${balance:,.2f}")
    
    # Shared vs Personal
    shared_expenses = sum(t["amount"] for t in transactions 
                         if t["type"] == "expense" and t["category"] in categories_shared_expenses)
    personal_expenses = sum(t["amount"] for t in transactions 
                           if t["type"] == "expense" and t["category"] in categories_personal_expenses)
    savings_total = sum(t["amount"] for t in transactions 
                       if t["type"] == "expense" and t["category"] in categories_savings)
    
    print(f"\nShared Expenses: ${shared_expenses:,.2f}")
    print(f"Personal Expenses: ${personal_expenses:,.2f}")
    print(f"Total Savings: ${savings_total:,.2f}")
    print(f"\nDatabase seeded successfully! 🌱")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
