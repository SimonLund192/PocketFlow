from typing import List, Dict, Any, Callable, Optional
from functools import wraps
from datetime import datetime, timezone
from bson import ObjectId
from app.database import budget_line_items_collection, budgets_collection, categories_collection, goals_collection
from .schemas import CreateTransactionArgs, ListTransactionsArgs, DeleteTransactionArgs, GetDashboardStatsArgs
import json
import csv
import io
import re
import uuid

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

    definitions.append({
        "type": "function",
        "function": {
            "name": "create_goal",
            "description": "Create a new savings goal for the user. Use this when the user explicitly asks to add or create a goal. If items are provided, target_amount can be omitted because it will be calculated from the item amounts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Goal name, e.g. 'Italy trip' or 'New sofa'"
                    },
                    "goal_type": {
                        "type": "string",
                        "description": "Goal type: shared for shared savings goals, fun for personal/fun goals. Defaults to shared.",
                        "enum": ["shared", "fun"]
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional note describing why the goal matters"
                    },
                    "target_amount": {
                        "type": "number",
                        "description": "Optional total target in DKK. Required if items are not provided."
                    },
                    "items": {
                        "type": "array",
                        "description": "Optional itemized steps that make up the goal total.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Item or step name"
                                },
                                "amount": {
                                    "type": "number",
                                    "description": "Item amount in DKK"
                                },
                                "url": {
                                    "type": "string",
                                    "description": "Optional link for the item"
                                }
                            },
                            "required": ["name", "amount"]
                        }
                    }
                },
                "required": ["name"]
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "update_goal",
            "description": "Update an existing goal by name. Use this when the user explicitly asks to rename a goal, change its target, switch between shared/fun, edit the description, or replace its itemized steps. Call get_goals_summary first if you need to inspect the current goals.",
            "parameters": {
                "type": "object",
                "properties": {
                    "goal_name": {
                        "type": "string",
                        "description": "Exact goal name to update"
                    },
                    "new_name": {
                        "type": "string",
                        "description": "Optional replacement goal name"
                    },
                    "goal_type": {
                        "type": "string",
                        "description": "Optional new goal type",
                        "enum": ["shared", "fun"]
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional new description. Use an empty string to clear it."
                    },
                    "target_amount": {
                        "type": "number",
                        "description": "Optional new target amount in DKK. If items are provided, the total will be recalculated from those items."
                    },
                    "items": {
                        "type": "array",
                        "description": "Optional replacement list of goal items/steps.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Item or step name"
                                },
                                "amount": {
                                    "type": "number",
                                    "description": "Item amount in DKK"
                                },
                                "url": {
                                    "type": "string",
                                    "description": "Optional link for the item"
                                }
                            },
                            "required": ["name", "amount"]
                        }
                    }
                },
                "required": ["goal_name"]
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "delete_goal",
            "description": "Delete an existing goal by name. Use this only when the user explicitly asks to remove or delete a goal. Call get_goals_summary first if you need to verify the name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "goal_name": {
                        "type": "string",
                        "description": "Exact goal name to delete"
                    }
                },
                "required": ["goal_name"]
            }
        }
    })

    # --- Write / Action Tools ---

    definitions.append({
        "type": "function",
        "function": {
            "name": "get_user_categories",
            "description": "Get all available budget categories for the user. Returns category id, name, and type (income, expense, savings, fun). ALWAYS call this first before proposing budget entries so you can map user descriptions to real categories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_type": {
                        "type": "string",
                        "description": "Optional filter: 'income', 'expense', 'savings', or 'fun'. If omitted, returns all categories.",
                        "enum": ["income", "expense", "savings", "fun"]
                    }
                }
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "propose_budget_entries",
            "description": "Propose one or more budget line items to be saved. The user will be asked to confirm before anything is actually saved. Use this after you have determined the correct categories. Each entry needs: name (description), category_id, amount, owner_slot ('user1', 'user2', or 'shared'), and month (YYYY-MM). The system will return the proposal and ask the user to confirm.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entries": {
                        "type": "array",
                        "description": "Array of proposed budget line items",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Line item name/description (e.g. 'Groceries - milk, butter, bread')"
                                },
                                "category_id": {
                                    "type": "string",
                                    "description": "The ObjectId of the category to use (from get_user_categories)"
                                },
                                "category_name": {
                                    "type": "string",
                                    "description": "The name of the category (for display)"
                                },
                                "category_type": {
                                    "type": "string",
                                    "description": "The type of the category: income, expense, savings, fun"
                                },
                                "amount": {
                                    "type": "number",
                                    "description": "Amount in DKK"
                                },
                                "owner_slot": {
                                    "type": "string",
                                    "description": "Who this belongs to: 'user1', 'user2', or 'shared'",
                                    "enum": ["user1", "user2", "shared"]
                                },
                                "month": {
                                    "type": "string",
                                    "description": "Budget month in YYYY-MM format"
                                }
                            },
                            "required": ["name", "category_id", "category_name", "category_type", "amount", "owner_slot", "month"]
                        }
                    }
                },
                "required": ["entries"]
            }
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "parse_csv_data",
            "description": "Parse CSV bank data that the user has pasted or uploaded. The CSV content is provided as a raw string. This tool will parse it and return structured rows with date, description, and amount. After parsing, you should call get_user_categories and then propose_budget_entries to categorize and save the entries.",
            "parameters": {
                "type": "object",
                "properties": {
                    "csv_content": {
                        "type": "string",
                        "description": "Raw CSV content as a string"
                    }
                },
                "required": ["csv_content"]
            }
        }
    })

    return definitions

# --- Tool Implementations ---
# --- Tool Implementations ---

def _normalize_goal_type(value: Optional[str]) -> str:
    if value == "fun":
        return "fun"
    return "shared"


def _sanitize_goal_items(items: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    sanitized: List[Dict[str, Any]] = []
    for raw in items or []:
        name = str(raw.get("name", "")).strip()
        amount = float(raw.get("amount", 0) or 0)
        url = str(raw.get("url", "") or "").strip()

        if not name or amount <= 0:
            continue

        item: Dict[str, Any] = {
            "name": name,
            "amount": amount,
        }
        if url:
            item["url"] = url
        sanitized.append(item)

    return sanitized


def _resolve_goal_target(target_amount: Optional[float], items: List[Dict[str, Any]]) -> float:
    if items:
        return round(sum(float(item["amount"]) for item in items), 2)

    target = float(target_amount or 0)
    if target <= 0:
        raise ValueError("A goal needs either itemized steps or a positive target_amount.")
    return round(target, 2)


async def _find_goal_for_user(user_id: str, goal_name: str) -> Optional[Dict[str, Any]]:
    normalized_name = goal_name.strip()
    if not normalized_name:
        return None
    escaped_name = re.escape(normalized_name)

    exact_match = await goals_collection.find_one({
        "user_id": user_id,
        "name": {"$regex": f"^{escaped_name}$", "$options": "i"},
    })
    if exact_match:
        return exact_match

    starts_with_matches = await goals_collection.find({
        "user_id": user_id,
        "name": {"$regex": f"^{escaped_name}", "$options": "i"},
    }).to_list(length=2)
    if len(starts_with_matches) == 1:
        return starts_with_matches[0]

    return None

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
                    "id": str(g.get("_id", "")),
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


# =============================================================================
# WRITE TOOLS — These allow the AI to create and edit goals / budget entries
# =============================================================================

@register_tool("create_goal")
async def create_goal(user_id: str, **kwargs) -> Dict[str, Any]:
    """Create a goal for the user."""
    try:
        name = str(kwargs.get("name", "")).strip()
        if not name:
            return {"ok": False, "error": "Goal name is required", "code": "CREATE_GOAL_NAME_REQUIRED"}

        goal_type = _normalize_goal_type(kwargs.get("goal_type"))
        description = kwargs.get("description")
        items = _sanitize_goal_items(kwargs.get("items"))
        target_amount = _resolve_goal_target(kwargs.get("target_amount"), items)

        match_query: Dict[str, Any] = {"user_id": user_id, "$or": [{"type": goal_type}]}
        if goal_type == "shared":
            match_query["$or"].append({"type": {"$exists": False}})

        highest_priority_goal = await goals_collection.find_one(
            match_query,
            sort=[("priority", -1)],
        )
        new_priority = (highest_priority_goal["priority"] + 1) if highest_priority_goal and "priority" in highest_priority_goal else 1

        now = datetime.now(timezone.utc)
        new_goal = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": name,
            "target_amount": target_amount,
            "current_amount": 0.0,
            "description": description.strip() if isinstance(description, str) else description,
            "type": goal_type,
            "items": items,
            "achieved": False,
            "priority": new_priority,
            "created_at": now,
            "updated_at": now,
        }

        await goals_collection.insert_one(new_goal)

        return {
            "ok": True,
            "data": {
                "goal": {
                    "id": new_goal["_id"],
                    "name": new_goal["name"],
                    "target_amount": new_goal["target_amount"],
                    "description": new_goal["description"] or "",
                    "type": new_goal["type"],
                    "priority": new_goal["priority"],
                    "items": new_goal["items"],
                }
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "CREATE_GOAL_ERROR"}


@register_tool("update_goal")
async def update_goal(user_id: str, **kwargs) -> Dict[str, Any]:
    """Update a goal for the user."""
    try:
        goal_name = str(kwargs.get("goal_name", "")).strip()
        goal = await _find_goal_for_user(user_id, goal_name)
        if not goal:
            return {
                "ok": False,
                "error": f"Could not find a unique goal named '{goal_name}'. Ask the user to clarify the exact goal name.",
                "code": "UPDATE_GOAL_NOT_FOUND",
            }

        items_arg = kwargs.get("items")
        items = _sanitize_goal_items(items_arg) if items_arg is not None else None
        update_fields: Dict[str, Any] = {
            "updated_at": datetime.now(timezone.utc),
        }

        new_name = kwargs.get("new_name")
        if isinstance(new_name, str) and new_name.strip():
            update_fields["name"] = new_name.strip()

        if "goal_type" in kwargs:
            update_fields["type"] = _normalize_goal_type(kwargs.get("goal_type"))

        if "description" in kwargs:
            description = kwargs.get("description")
            update_fields["description"] = description.strip() if isinstance(description, str) else description

        if items is not None:
            update_fields["items"] = items
            update_fields["target_amount"] = _resolve_goal_target(kwargs.get("target_amount"), items)
        elif "target_amount" in kwargs:
            target_amount = float(kwargs.get("target_amount") or 0)
            if target_amount <= 0:
                return {"ok": False, "error": "target_amount must be positive", "code": "UPDATE_GOAL_INVALID_TARGET"}
            update_fields["target_amount"] = round(target_amount, 2)

        if len(update_fields) == 1:
            return {"ok": False, "error": "No changes were provided", "code": "UPDATE_GOAL_NO_CHANGES"}

        updated_goal = await goals_collection.find_one_and_update(
            {"_id": goal["_id"], "user_id": user_id},
            {"$set": update_fields},
            return_document=True,
        )
        if not updated_goal:
            return {"ok": False, "error": "Goal not found", "code": "UPDATE_GOAL_NOT_FOUND"}

        return {
            "ok": True,
            "data": {
                "goal": {
                    "id": updated_goal["_id"],
                    "name": updated_goal.get("name", ""),
                    "target_amount": round(float(updated_goal.get("target_amount", 0)), 2),
                    "description": updated_goal.get("description", "") or "",
                    "type": updated_goal.get("type", "shared"),
                    "priority": updated_goal.get("priority", 0),
                    "items": updated_goal.get("items", []),
                }
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "UPDATE_GOAL_ERROR"}


@register_tool("delete_goal")
async def delete_goal(user_id: str, **kwargs) -> Dict[str, Any]:
    """Delete a goal for the user."""
    try:
        goal_name = str(kwargs.get("goal_name", "")).strip()
        goal = await _find_goal_for_user(user_id, goal_name)
        if not goal:
            return {
                "ok": False,
                "error": f"Could not find a unique goal named '{goal_name}'. Ask the user to clarify the exact goal name.",
                "code": "DELETE_GOAL_NOT_FOUND",
            }

        result = await goals_collection.delete_one({"_id": goal["_id"], "user_id": user_id})
        if result.deleted_count == 0:
            return {"ok": False, "error": "Goal not found", "code": "DELETE_GOAL_NOT_FOUND"}

        return {
            "ok": True,
            "data": {
                "deleted_goal": {
                    "id": str(goal["_id"]),
                    "name": goal.get("name", ""),
                }
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "DELETE_GOAL_ERROR"}

@register_tool("get_user_categories")
async def get_user_categories(user_id: str, **kwargs) -> Dict[str, Any]:
    """Get all categories for the user, optionally filtered by type"""
    try:
        category_type = kwargs.get("category_type")
        query: Dict[str, Any] = {"user_id": user_id}
        if category_type:
            query["type"] = category_type

        cursor = categories_collection.find(query).sort("name", 1)
        categories = await cursor.to_list(length=200)

        items = []
        for cat in categories:
            items.append({
                "id": str(cat["_id"]),
                "name": cat.get("name", ""),
                "type": cat.get("type", ""),
                "icon": cat.get("icon", ""),
            })

        return {
            "ok": True,
            "data": {
                "categories": items,
                "count": len(items),
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "GET_CATEGORIES_ERROR"}


@register_tool("propose_budget_entries")
async def propose_budget_entries(user_id: str, **kwargs) -> Dict[str, Any]:
    """
    Validate proposed entries and return them for confirmation.
    This does NOT save anything — it just validates that the categories exist
    and returns a structured proposal.
    """
    try:
        entries = kwargs.get("entries", [])
        if not entries:
            return {"ok": False, "error": "No entries provided"}

        validated = []
        warnings = []

        for i, entry in enumerate(entries):
            category_id_str = entry.get("category_id", "")
            if not ObjectId.is_valid(category_id_str):
                warnings.append(f"Entry {i + 1}: Invalid category_id '{category_id_str}'")
                continue

            # Verify category exists and belongs to user
            category = await categories_collection.find_one({
                "_id": ObjectId(category_id_str),
                "user_id": user_id,
            })
            if not category:
                warnings.append(f"Entry {i + 1}: Category '{entry.get('category_name', category_id_str)}' not found for this user")
                continue

            amount = entry.get("amount", 0)
            if amount <= 0:
                warnings.append(f"Entry {i + 1}: Amount must be positive, got {amount}")
                continue

            owner_slot = entry.get("owner_slot", "user1")
            if owner_slot not in ("user1", "user2", "shared"):
                owner_slot = "user1"

            month = entry.get("month", datetime.now(timezone.utc).strftime("%Y-%m"))

            validated.append({
                "name": entry.get("name", "Unnamed"),
                "category_id": str(category["_id"]),
                "category_name": category.get("name", "Unknown"),
                "category_type": category.get("type", "expense"),
                "amount": amount,
                "owner_slot": owner_slot,
                "month": month,
                "source": "ai",
                "needs_review": True,
            })

        if not validated:
            return {
                "ok": False,
                "error": "No valid entries after validation",
                "warnings": warnings,
            }

        # Build summary
        total = sum(e["amount"] for e in validated)
        lines = []
        for e in validated:
            lines.append(f"  • {e['name']} → {e['category_name']} ({e['category_type']}): {e['amount']:,.0f} kr. [{e['owner_slot']}]")
        summary = f"I'd like to save {len(validated)} budget entries for a total of {total:,.0f} kr.:\n" + "\n".join(lines)

        return {
            "ok": True,
            "action": "confirm",
            "data": {
                "entries": validated,
                "summary": summary,
                "total": total,
                "count": len(validated),
            },
            "warnings": warnings,
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "PROPOSE_ENTRIES_ERROR"}


@register_tool("parse_csv_data")
async def parse_csv_data(user_id: str, **kwargs) -> Dict[str, Any]:
    """Parse CSV content and return structured rows"""
    try:
        csv_content = kwargs.get("csv_content", "")
        if not csv_content.strip():
            return {"ok": False, "error": "Empty CSV content"}

        # Try to detect delimiter
        first_line = csv_content.strip().split("\n")[0]
        delimiter = ";"
        if "\t" in first_line:
            delimiter = "\t"
        elif "," in first_line and ";" not in first_line:
            delimiter = ","

        reader = csv.reader(io.StringIO(csv_content.strip()), delimiter=delimiter)
        rows = list(reader)

        if len(rows) < 2:
            return {"ok": False, "error": "CSV has fewer than 2 rows (need header + data)"}

        header = [h.strip().lower() for h in rows[0]]
        data_rows = rows[1:]

        # Try to identify columns
        date_col = None
        desc_col = None
        amount_col = None

        date_keywords = ["date", "dato", "transaction date", "booking date", "bogført"]
        desc_keywords = ["description", "text", "beskrivelse", "merchant", "tekst", "modtager"]
        amount_keywords = ["amount", "beløb", "sum", "value", "kr"]

        for i, h in enumerate(header):
            for kw in date_keywords:
                if kw in h:
                    date_col = i
                    break
            for kw in desc_keywords:
                if kw in h:
                    desc_col = i
                    break
            for kw in amount_keywords:
                if kw in h:
                    amount_col = i
                    break

        # Fallback: assume first 3 columns are date, desc, amount
        if date_col is None and len(header) >= 1:
            date_col = 0
        if desc_col is None and len(header) >= 2:
            desc_col = 1
        if amount_col is None and len(header) >= 3:
            amount_col = 2

        parsed = []
        for row in data_rows:
            if len(row) <= max(date_col or 0, desc_col or 0, amount_col or 0):
                continue  # skip incomplete rows

            date_val = row[date_col].strip() if date_col is not None else ""
            desc_val = row[desc_col].strip() if desc_col is not None else ""
            amount_str = row[amount_col].strip() if amount_col is not None else "0"

            # Parse amount: handle Danish format (1.234,56) and negative signs
            amount_str = amount_str.replace(" ", "").replace("kr.", "").replace("kr", "").strip()
            # Convert Danish format: 1.234,56 → 1234.56
            if "," in amount_str and "." in amount_str:
                amount_str = amount_str.replace(".", "").replace(",", ".")
            elif "," in amount_str:
                amount_str = amount_str.replace(",", ".")

            try:
                amount = float(amount_str)
            except ValueError:
                amount = 0.0

            if desc_val or amount != 0:
                parsed.append({
                    "date": date_val,
                    "description": desc_val,
                    "amount": amount,
                    "is_income": amount > 0,
                })

        return {
            "ok": True,
            "data": {
                "rows": parsed,
                "count": len(parsed),
                "detected_header": header,
                "delimiter": delimiter,
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "CSV_PARSE_ERROR"}


async def execute_save_budget_entries(user_id: str, entries: list) -> Dict[str, Any]:
    """
    Actually save validated budget entries to the database.
    This is called after user confirmation — NOT by the LLM directly.
    """
    try:
        saved = []
        errors = []

        for entry in entries:
            month = entry.get("month", datetime.now(timezone.utc).strftime("%Y-%m"))
            category_id_str = entry.get("category_id", "")

            # Ensure budget exists for this month (auto-create if needed)
            budget = await budgets_collection.find_one({
                "user_id": user_id,
                "month": month,
            })
            if not budget:
                now = datetime.now(timezone.utc)
                result = await budgets_collection.insert_one({
                    "user_id": user_id,
                    "month": month,
                    "created_at": now,
                    "updated_at": now,
                })
                budget = await budgets_collection.find_one({"_id": result.inserted_id})

            if not budget:
                errors.append(f"Failed to create/find budget for {month}")
                continue

            budget_id = budget["_id"]

            # Create line item
            now = datetime.now(timezone.utc)
            line_item_doc = {
                "user_id": user_id,
                "budget_id": budget_id,
                "name": entry.get("name", "Unnamed"),
                "category_id": ObjectId(category_id_str),
                "amount": entry.get("amount", 0),
                "owner_slot": entry.get("owner_slot", "user1"),
                "created_at": now,
                "updated_at": now,
            }

            result = await budget_line_items_collection.insert_one(line_item_doc)
            saved.append({
                "id": str(result.inserted_id),
                "name": entry.get("name"),
                "amount": entry.get("amount"),
                "category_name": entry.get("category_name"),
            })

        return {
            "ok": True,
            "data": {
                "saved_count": len(saved),
                "error_count": len(errors),
                "saved": saved,
                "errors": errors,
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "SAVE_ENTRIES_ERROR"}
