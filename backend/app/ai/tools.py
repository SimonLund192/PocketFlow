from typing import List, Dict, Any, Callable
from functools import wraps
from datetime import datetime
from bson import ObjectId
from app.database import budget_line_items_collection, budgets_collection, categories_collection, goals_collection
from .schemas import CreateTransactionArgs, ListTransactionsArgs, DeleteTransactionArgs, GetDashboardStatsArgs

# Registry to store available tools
tools_registry: Dict[str, Callable] = {}

def register_tool(name: str):
    """Decorator to register a function as an AI tool."""
    def decorator(func: Callable):
        tools_registry[name] = func
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def get_tool_definitions() -> List[Dict[str, Any]]:
    """
    Return the JSON schema definitions for all registered tools
    for the LLM.
    """
    definitions = []
    
    # Updated tool definitions for budget-based system
    definitions.append({
        "type": "function",
        "function": {
            "name": "get_budget_summary",
            "description": "Get budget summary including income, expenses, and savings for the current month or a specific month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "string",
                        "description": "Optional month in YYYY-MM format. Defaults to current month."
                    }
                }
            }
        }
    })
    
    definitions.append({
        "type": "function",
        "function": {
            "name": "get_income_breakdown",
            "description": "Get detailed breakdown of income by category for the current or specified month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "string",
                        "description": "Optional month in YYYY-MM format. Defaults to current month."
                    }
                }
            }
        }
    })
    
    definitions.append({
        "type": "function",
        "function": {
            "name": "get_expense_breakdown",
            "description": "Get detailed breakdown of expenses by category for the current or specified month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "string",
                        "description": "Optional month in YYYY-MM format. Defaults to current month."
                    }
                }
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "get_savings_breakdown",
            "description": "Get detailed breakdown of savings and fun spending for the current or specified month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "string",
                        "description": "Optional month in YYYY-MM format. Defaults to current month."
                    }
                }
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "get_lifetime_savings",
            "description": "Get lifetime (all-time) savings across all months.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "get_goals_summary",
            "description": "Get all savings goals for the user, including their name, target amount, amount saved so far, priority, type (shared or fun), completion status, and the current month's total savings contribution. Use this to answer questions about goal progress and time-to-completion estimates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "string",
                        "description": "Optional month in YYYY-MM format to get that month's savings rate. Defaults to current month."
                    }
                }
            }
        }
    })

    return definitions

# --- Tool Implementations ---
# --- Tool Implementations ---

@register_tool("get_budget_summary")
async def get_budget_summary(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get budget summary for a specific month"""
    try:
        month = kwargs.get("month", datetime.now().strftime("%Y-%m"))
        
        # Find budget for the month
        budget = await budgets_collection.find_one({
            "month": month,
            "user_id": user_id
        })
        
        if not budget:
            return {
                "ok": True,
                "data": {
                    "month": month,
                    "currency": "DKK",
                    "total_income": 0,
                    "total_expenses": 0,
                    "total_savings": 0,
                    "net_income": 0,
                    "message": f"No budget found for {month}"
                }
            }
        
        budget_id = budget["_id"]
        
        total_income = 0
        total_expenses = 0
        total_savings = 0
        
        # Get budget line items
        async for item in budget_line_items_collection.find({"budget_id": budget_id}):
            category = await categories_collection.find_one({"_id": item["category_id"]})
            
            if category:
                category_type = category.get("type")
                amount = item.get("amount", 0)
                owner_slot = item.get("owner_slot", "")
                
                if category_type == "income":
                    total_income += amount
                elif category_type == "expense":
                    total_expenses += amount
                elif category_type == "savings":
                    if owner_slot == "shared":
                        total_savings += amount
                elif category_type == "fun":
                    total_savings += amount
        
        net_income = total_income - total_expenses
        
        return {
            "ok": True,
            "data": {
                "month": month,
                "currency": "DKK",
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_savings": total_savings,
                "net_income": net_income,
                "savings_rate": (total_savings / total_income * 100) if total_income > 0 else 0
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "BUDGET_SUMMARY_ERROR"}

@register_tool("get_income_breakdown")
async def get_income_breakdown(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get detailed income breakdown by category"""
    try:
        month = kwargs.get("month", datetime.now().strftime("%Y-%m"))
        
        budget = await budgets_collection.find_one({
            "month": month,
            "user_id": user_id
        })
        
        if not budget:
            return {"ok": True, "data": {"month": month, "currency": "DKK", "income_items": [], "total": 0}}
        
        budget_id = budget["_id"]
        income_items = []
        total = 0
        
        async for item in budget_line_items_collection.find({"budget_id": budget_id}):
            category = await categories_collection.find_one({"_id": item["category_id"]})
            
            if category and category.get("type") == "income":
                amount = item.get("amount", 0)
                income_items.append({
                    "name": item.get("name", "Unnamed"),
                    "category": category.get("name", "Unknown"),
                    "amount": amount,
                    "owner": item.get("owner_slot", "unknown")
                })
                total += amount
        
        return {
            "ok": True,
            "data": {
                "month": month,
                "currency": "DKK",
                "income_items": income_items,
                "total": total
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "INCOME_BREAKDOWN_ERROR"}

@register_tool("get_expense_breakdown")
async def get_expense_breakdown(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get detailed expense breakdown by category"""
    try:
        month = kwargs.get("month", datetime.now().strftime("%Y-%m"))
        
        budget = await budgets_collection.find_one({
            "month": month,
            "user_id": user_id
        })
        
        if not budget:
            return {"ok": True, "data": {"month": month, "currency": "DKK", "expense_items": [], "total": 0}}
        
        budget_id = budget["_id"]
        expense_items = []
        total = 0
        
        async for item in budget_line_items_collection.find({"budget_id": budget_id}):
            category = await categories_collection.find_one({"_id": item["category_id"]})
            
            if category and category.get("type") == "expense":
                amount = item.get("amount", 0)
                expense_items.append({
                    "name": item.get("name", "Unnamed"),
                    "category": category.get("name", "Unknown"),
                    "amount": amount,
                    "owner": item.get("owner_slot", "unknown")
                })
                total += amount
        
        return {
            "ok": True,
            "data": {
                "month": month,
                "currency": "DKK",
                "expense_items": expense_items,
                "total": total
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "EXPENSE_BREAKDOWN_ERROR"}

@register_tool("get_savings_breakdown")
async def get_savings_breakdown(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get detailed savings and fun breakdown"""
    try:
        month = kwargs.get("month", datetime.now().strftime("%Y-%m"))
        
        budget = await budgets_collection.find_one({
            "month": month,
            "user_id": user_id
        })
        
        if not budget:
            return {"ok": True, "data": {"month": month, "currency": "DKK", "savings_items": [], "fun_items": [], "total": 0}}
        
        budget_id = budget["_id"]
        savings_items = []
        fun_items = []
        total = 0
        
        async for item in budget_line_items_collection.find({"budget_id": budget_id}):
            category = await categories_collection.find_one({"_id": item["category_id"]})
            
            if category:
                amount = item.get("amount", 0)
                item_data = {
                    "name": item.get("name", "Unnamed"),
                    "category": category.get("name", "Unknown"),
                    "amount": amount,
                    "owner": item.get("owner_slot", "unknown")
                }
                
                if category.get("type") == "savings" and item.get("owner_slot") == "shared":
                    savings_items.append(item_data)
                    total += amount
                elif category.get("type") == "fun":
                    fun_items.append(item_data)
                    total += amount
        
        return {
            "ok": True,
            "data": {
                "month": month,
                "currency": "DKK",
                "savings_items": savings_items,
                "fun_items": fun_items,
                "total": total
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "SAVINGS_BREAKDOWN_ERROR"}

@register_tool("get_lifetime_savings")
async def get_lifetime_savings(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get lifetime savings across all budgets"""
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$lookup": {
                    "from": "budget_line_items",
                    "localField": "_id",
                    "foreignField": "budget_id",
                    "as": "items"
                }
            },
            {"$unwind": "$items"},
            {
                "$lookup": {
                    "from": "categories",
                    "localField": "items.category_id",
                    "foreignField": "_id",
                    "as": "category"
                }
            },
            {"$unwind": "$category"},
            {
                "$group": {
                    "_id": None,
                    "total_shared_savings": {
                        "$sum": {
                            "$cond": [
                                {"$and": [
                                    {"$eq": ["$category.type", "savings"]},
                                    {"$eq": ["$items.owner_slot", "shared"]}
                                ]},
                                "$items.amount",
                                0
                            ]
                        }
                    },
                    "total_fun_savings": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$category.type", "fun"]},
                                "$items.amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]
        
        result = await budgets_collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            shared_savings = result[0].get("total_shared_savings", 0)
            fun_savings = result[0].get("total_fun_savings", 0)
            total_savings = shared_savings + fun_savings
        else:
            shared_savings = 0
            fun_savings = 0
            total_savings = 0
        
        return {
            "ok": True,
            "data": {
                "currency": "DKK",
                "lifetime_shared_savings": shared_savings,
                "lifetime_fun_savings": fun_savings,
                "lifetime_total_savings": total_savings
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "LIFETIME_SAVINGS_ERROR"}


@register_tool("get_goals_summary")
async def get_goals_summary(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get all goals with progress and current month savings rate"""
    try:
        month = kwargs.get("month", datetime.now().strftime("%Y-%m"))

        # 1. Fetch all goals for the user
        goals_cursor = goals_collection.find({"user_id": user_id}).sort("priority", 1)
        all_goals = await goals_cursor.to_list(length=100)

        # 2. Calculate lifetime savings (shared + fun) to determine goal progress
        lifetime_pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$lookup": {
                    "from": "budget_line_items",
                    "localField": "_id",
                    "foreignField": "budget_id",
                    "as": "items"
                }
            },
            {"$unwind": "$items"},
            {
                "$lookup": {
                    "from": "categories",
                    "localField": "items.category_id",
                    "foreignField": "_id",
                    "as": "category"
                }
            },
            {"$unwind": "$category"},
            {
                "$group": {
                    "_id": None,
                    "total_shared_savings": {
                        "$sum": {
                            "$cond": [
                                {"$and": [
                                    {"$eq": ["$category.type", "savings"]},
                                    {"$eq": ["$items.owner_slot", "shared"]}
                                ]},
                                "$items.amount",
                                0
                            ]
                        }
                    },
                    "total_fun_savings": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$category.type", "fun"]},
                                "$items.amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]
        lifetime_result = await budgets_collection.aggregate(lifetime_pipeline).to_list(length=1)
        lifetime_shared = lifetime_result[0]["total_shared_savings"] if lifetime_result else 0
        lifetime_fun = lifetime_result[0]["total_fun_savings"] if lifetime_result else 0

        # 3. Get THIS MONTH's savings to compute monthly savings rate
        monthly_pipeline = [
            {"$match": {"user_id": user_id, "month": month}},
            {
                "$lookup": {
                    "from": "budget_line_items",
                    "localField": "_id",
                    "foreignField": "budget_id",
                    "as": "items"
                }
            },
            {"$unwind": "$items"},
            {
                "$lookup": {
                    "from": "categories",
                    "localField": "items.category_id",
                    "foreignField": "_id",
                    "as": "category"
                }
            },
            {"$unwind": "$category"},
            {
                "$group": {
                    "_id": None,
                    "monthly_shared_savings": {
                        "$sum": {
                            "$cond": [
                                {"$and": [
                                    {"$eq": ["$category.type", "savings"]},
                                    {"$eq": ["$items.owner_slot", "shared"]}
                                ]},
                                "$items.amount",
                                0
                            ]
                        }
                    },
                    "monthly_fun_savings": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$category.type", "fun"]},
                                "$items.amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]
        monthly_result = await budgets_collection.aggregate(monthly_pipeline).to_list(length=1)
        monthly_shared = monthly_result[0]["monthly_shared_savings"] if monthly_result else 0
        monthly_fun = monthly_result[0]["monthly_fun_savings"] if monthly_result else 0

        # 4. Distribute lifetime savings hierarchically across goals (same logic as frontend)
        def distribute_savings(goal_list: list, available: float) -> list:
            remaining = available
            result = []
            for g in goal_list:
                target = g.get("target_amount", 0)
                saved = min(remaining, target)
                remaining = max(0, remaining - saved)
                result.append({
                    "name": g.get("name", "Unnamed"),
                    "target": target,
                    "saved": round(saved, 2),
                    "remaining": round(max(target - saved, 0), 2),
                    "progress_pct": round((saved / target * 100) if target > 0 else 0, 1),
                    "completed": saved >= target,
                    "priority": g.get("priority", 0),
                    "type": g.get("type", "shared"),
                    "description": g.get("description", ""),
                })
            return result

        shared_goals = sorted(
            [g for g in all_goals if g.get("type", "shared") == "shared"],
            key=lambda g: g.get("priority", 0)
        )
        fun_goals = sorted(
            [g for g in all_goals if g.get("type") == "fun"],
            key=lambda g: g.get("priority", 0)
        )

        goals_data = distribute_savings(shared_goals, lifetime_shared) + distribute_savings(fun_goals, lifetime_fun)

        return {
            "ok": True,
            "data": {
                "currency": "DKK",
                "goals": goals_data,
                "lifetime_shared_savings": round(lifetime_shared, 2),
                "lifetime_fun_savings": round(lifetime_fun, 2),
                "monthly_shared_savings": round(monthly_shared, 2),
                "monthly_fun_savings": round(monthly_fun, 2),
                "month_used_for_rate": month,
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "GOALS_SUMMARY_ERROR"}
