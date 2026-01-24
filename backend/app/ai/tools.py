from typing import List, Dict, Any, Callable
from functools import wraps
from datetime import datetime
from bson import ObjectId
from app.database import transactions_collection, budgets_collection, categories_collection
from app.models import TransactionCreate
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
    
    # Tool definitions matching the schemas
    definitions.append({
        "type": "function",
        "function": {
            "name": "create_transaction",
            "description": "Create a new transaction (expense or income) for the user.",
            "parameters": CreateTransactionArgs.model_json_schema()
        }
    })
    
    definitions.append({
        "type": "function",
        "function": {
            "name": "list_transactions",
            "description": "List existing transactions with optional filtering by date and category.",
            "parameters": ListTransactionsArgs.model_json_schema()
        }
    })
    
    definitions.append({
        "type": "function",
        "function": {
            "name": "delete_transaction",
            "description": "Delete a specific transaction by ID.",
            "parameters": DeleteTransactionArgs.model_json_schema()
        }
    })

    definitions.append({
        "type": "function",
        "function": {
            "name": "get_dashboard_stats",
            "description": "Get current dashboard statistics including total balance, income, expenses.",
            "parameters": GetDashboardStatsArgs.model_json_schema()
        }
    })

    return definitions

# --- Tool Implementations ---

@register_tool("create_transaction")
async def create_transaction(user_id: str, **kwargs) -> Dict[str, Any]:
    try:
        # Validate args
        args = CreateTransactionArgs(**kwargs)
        
        # Determine strict category logic (simplified for now)
        # In a real app we might fetch the Category ID if needed
        
        new_transaction_data = {
            "amount": args.amount,
            "description": args.description,
            "category": args.category,
            "type": args.type,
            "date": datetime.strptime(args.date, "%Y-%m-%d"),
            "user_id": user_id # Enforce user scope
        }
        
        result = await transactions_collection.insert_one(new_transaction_data)
        
        return {
            "ok": True,
            "data": {
                "transaction_id": str(result.inserted_id),
                "message": f"Transaction created successfully: {args.description} - {args.amount}"
            }
        }
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "CREATE_ERROR"}

@register_tool("list_transactions")
async def list_transactions(user_id: str, **kwargs) -> Dict[str, Any]:
    try:
        args = ListTransactionsArgs(**kwargs)
        
        query: Dict[str, Any] = {"user_id": user_id}
        
        if args.start_date or args.end_date:
            date_query = {}
            if args.start_date:
                date_query["$gte"] = datetime.strptime(args.start_date, "%Y-%m-%d")
            if args.end_date:
                date_query["$lte"] = datetime.strptime(args.end_date, "%Y-%m-%d")
            query["date"] = date_query
            
        if args.category:
            query["category"] = args.category # Exact match for simplicity
            
        cursor = transactions_collection.find(query).sort("date", -1).limit(args.limit)
        
        transactions = []
        async for txn in cursor:
            txn["_id"] = str(txn["_id"])
            if "date" in txn and isinstance(txn["date"], datetime):
                txn["date"] = txn["date"].strftime("%Y-%m-%d")
            transactions.append(txn)
            
        return {"ok": True, "data": transactions}
        
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "LIST_ERROR"}

@register_tool("delete_transaction")
async def delete_transaction(user_id: str, **kwargs) -> Dict[str, Any]:
    try:
        args = DeleteTransactionArgs(**kwargs)
        
        if not ObjectId.is_valid(args.transaction_id):
             return {"ok": False, "error": "Invalid transaction ID format", "code": "INVALID_ID"}

        # Enforce user ownership deletion
        result = await transactions_collection.delete_one({
            "_id": ObjectId(args.transaction_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 1:
            return {"ok": True, "data": {"message": "Transaction deleted", "id": args.transaction_id}}
        else:
            return {"ok": False, "error": "Transaction not found or access denied", "code": "NOT_FOUND"}
            
    except Exception as e:
        return {"ok": False, "error": str(e), "code": "DELETE_ERROR"}

@register_tool("get_dashboard_stats")
async def get_dashboard_stats(user_id: str, **kwargs) -> Dict[str, Any]:
    # Reuse or re-implement dashboard logic without importing valid Request dependency
    # For now, simplistic aggregation to be safe
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        
        stats = {}
        async for doc in transactions_collection.aggregate(pipeline):
            stats[doc["_id"]] = doc["total"]
            
        # Basic calculation (simplified compared to full dashboard)
        income = stats.get("income", 0)
        expense = stats.get("expense", 0)
        balance = income - expense
        
        return {
            "ok": True, 
            "data": {
                "income": income,
                "expense": expense,
                "balance": balance,
                "savings_rate": (income - expense) / income if income > 0 else 0
            }
        }
    except Exception as e:
         return {"ok": False, "error": str(e), "code": "STATS_ERROR"}

