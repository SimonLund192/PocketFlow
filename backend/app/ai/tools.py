from typing import List, Dict, Any, Callable
from functools import wraps
from datetime import datetime, timezone
from bson import ObjectId
from app.database import budget_line_items_collection, budgets_collection, categories_collection, goals_collection
from .schemas import CreateTransactionArgs, ListTransactionsArgs, DeleteTransactionArgs, GetDashboardStatsArgs
import json
import csv
import io

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


# =============================================================================
# WRITE TOOLS — These allow the AI to create budget entries
# =============================================================================

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
