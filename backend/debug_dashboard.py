
import asyncio
from app.database import budgets_collection, budget_line_items_collection, categories_collection
from datetime import datetime
import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

async def debug_stats():
    print("--- Debugging Dashboard Stats ---")
    
    # 1. Check Date
    now = datetime.now()
    current_month_str = now.strftime("%Y-%m")
    print(f"Current System Time: {now}")
    print(f"Target Month String: {current_month_str}")
    
    # 2. List All Budgets
    print("\n--- All Budgets ---")
    budgets = await budgets_collection.find().to_list(length=100)
    for b in budgets:
        print(f"ID: {b['_id']}, User: {b.get('user_id')}, Month: {b.get('month')}")
        
    # 3. Find Target Budget
    # Note: The code in dashboard.py uses find_one({"month": ...}) without user_id filter!
    target_budget = await budgets_collection.find_one({"month": current_month_str})
    
    if not target_budget:
        print(f"\n[FAIL] No budget found for month {current_month_str}")
        print("This is why net income is 0.")
        return

    print(f"\n[SUCCESS] Found budget for {current_month_str}: {target_budget['_id']}")
    
    # 4. Calculate Stats for this budget
    print("\n--- Line Items for this Budget ---")
    budget_id = target_budget["_id"]
    
    total_income = 0
    shared_expenses = 0
    personal_expenses = 0
    total_savings = 0
    
    async for item in budget_line_items_collection.find({"budget_id": budget_id}):
        category = await categories_collection.find_one({"_id": item["category_id"]})
        
        category_name = "Unknown"
        category_type = "Unknown"
        
        if category:
            category_name = category.get("name")
            category_type = category.get("type")
            
        amount = item.get("amount", 0)
        owner_slot = item.get("owner_slot", "")
        
        print(f"Item: {item.get('name'):<20} | Amount: {amount:<10} | Type: {category_type:<10} | Slot: {owner_slot}")
        
        if category_type == "income":
            total_income += amount
        elif category_type == "expense":
            if owner_slot == "shared":
                shared_expenses += amount
            elif owner_slot in ["user1", "user2"]:
                personal_expenses += amount
        elif category_type == "savings":
            total_savings += amount

    print("\n--- Calculated Stats ---")
    print(f"Total Income: {total_income}")
    print(f"Shared Expenses: {shared_expenses}")
    print(f"Personal Expenses: {personal_expenses}")
    
    net_income = total_income - shared_expenses - personal_expenses
    print(f"NET INCOME: {net_income}")

if __name__ == "__main__":
    asyncio.run(debug_stats())
