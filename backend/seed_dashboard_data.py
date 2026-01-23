
import asyncio
from datetime import datetime
from bson import ObjectId
from app.database import database
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

async def seed_dashboard_data():
    user_id = "696e6198a239aeb4401bd63c" # test@example.com
    
    # Collections
    cats_col = database["categories"]
    budgets_col = database["budgets"]
    items_col = database["budget_line_items"]
    
    # Clean up existing data for this user to avoid duplicates/confusion during dev
    await cats_col.delete_many({"user_id": user_id})
    await budgets_col.delete_many({"user_id": user_id})
    await items_col.delete_many({"user_id": user_id})

    print("Cleared existing data for user.")

    # 1. Create Categories
    categories = [
        {"user_id": user_id, "name": "Salary", "type": "income", "color": "green", "icon": "wallet"},
        {"user_id": user_id, "name": "Rent", "type": "expense", "color": "blue", "icon": "home"},
        {"user_id": user_id, "name": "Groceries", "type": "expense", "color": "orange", "icon": "shopping-cart"},
        {"user_id": user_id, "name": "Utilities", "type": "expense", "color": "yellow", "icon": "zap"},
        {"user_id": user_id, "name": "Entertainment", "type": "fun", "color": "purple", "icon": "film"},
        {"user_id": user_id, "name": "General Savings", "type": "savings", "color": "teal", "icon": "piggy-bank"},
        {"user_id": user_id, "name": "Investments", "type": "savings", "color": "cyan", "icon": "trending-up"},
    ]
    
    # Insert categories and keep track of IDs
    cat_map = {}
    for cat in categories:
        result = await cats_col.insert_one(cat)
        cat_map[cat["name"]] = result.inserted_id
        print(f"Created category: {cat['name']}")

    # 2. Create Budget for Current Month (2026-01)
    current_month = "2026-01"
    budget = {
        "user_id": user_id,
        "month": current_month,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    budget_result = await budgets_col.insert_one(budget)
    budget_id = budget_result.inserted_id
    print(f"Created budget for: {current_month}")

    # 3. Create Budget Line Items
    # Net Income = Total Income - Shared Expenses - Personal Expenses
    # Expected: 
    # Income: 50,000 (Salary)
    # Shared Expenses: 15,000 (Rent) + 2,000 (Utilities) = 17,000
    # Personal Expenses: 3,000 (Groceries - let's say user1) = 3,000
    # Savings: 5,000 (General Savings)
    # Fun (ignored): 1,000
    
    # Net Income = 50,000 - 17,000 - 3,000 = 30,000
    
    line_items = [
        {
            "user_id": user_id,
            "budget_id": budget_id,
            "category_id": cat_map["Salary"],
            "name": "Primary Job",
            "amount": 50000.0,
            "owner_slot": "user1", # Doesn't matter for income
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "user_id": user_id,
            "budget_id": budget_id,
            "category_id": cat_map["Rent"],
            "name": "Apartment Rent",
            "amount": 15000.0,
            "owner_slot": "shared",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "user_id": user_id,
            "budget_id": budget_id,
            "category_id": cat_map["Utilities"],
            "name": "Electric & Water",
            "amount": 2000.0,
            "owner_slot": "shared",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "user_id": user_id,
            "budget_id": budget_id,
            "category_id": cat_map["Groceries"],
            "name": "Weekly Shop",
            "amount": 3000.0,
            "owner_slot": "user1",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "user_id": user_id,
            "budget_id": budget_id,
            "category_id": cat_map["General Savings"],
            "name": "Rainy Day Fund",
            "amount": 5000.0,
            "owner_slot": "user1",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        },
        {
            "user_id": user_id,
            "budget_id": budget_id,
            "category_id": cat_map["Entertainment"],
            "name": "Movies & Games",
            "amount": 1000.0,
            "owner_slot": "user1",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    ]
    
    await items_col.insert_many(line_items)
    print(f"Created {len(line_items)} line items.")
    print("Dashboard seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_dashboard_data())
