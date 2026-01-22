# MongoDB Query Examples

This document provides example MongoDB queries for the Categories, Budgets, and Budget Line Items collections.

## Setup

```python
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Get collections
from app.database import categories_collection, budgets_collection, budget_line_items_collection

# Logged-in user ID
user_id = "user123"
```

---

## Categories Collection

### Create a Category
```python
category_doc = {
    "user_id": user_id,
    "name": "Rent",
    "type": "expense",
    "icon": "home",
    "color": "#FF5733",
    "created_at": datetime.now(timezone.utc),
    "updated_at": datetime.now(timezone.utc)
}
result = await categories_collection.insert_one(category_doc)
category_id = result.inserted_id
```

### Get All Categories for User
```python
cursor = categories_collection.find({"user_id": user_id})
categories = await cursor.to_list(length=None)
```

### Get Categories by Type
```python
# Only expense categories
cursor = categories_collection.find({
    "user_id": user_id,
    "type": "expense"
})
expense_categories = await cursor.to_list(length=None)
```

### Get Single Category
```python
category = await categories_collection.find_one({
    "_id": ObjectId(category_id),
    "user_id": user_id  # Security: always filter by user_id
})
```

### Update Category
```python
result = await categories_collection.update_one(
    {
        "_id": ObjectId(category_id),
        "user_id": user_id
    },
    {
        "$set": {
            "name": "Housing Rent",
            "color": "#0099FF",
            "updated_at": datetime.now(timezone.utc)
        }
    }
)
```

### Delete Category
```python
# Check if category is used in line items first
line_item_count = await budget_line_items_collection.count_documents({
    "user_id": user_id,
    "category_id": ObjectId(category_id)
})

if line_item_count == 0:
    result = await categories_collection.delete_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
else:
    raise ValueError(f"Cannot delete category: used in {line_item_count} line items")
```

### Check for Duplicate Category
```python
existing = await categories_collection.find_one({
    "user_id": user_id,
    "name": "Rent",
    "type": "expense"
})
if existing:
    raise ValueError("Category already exists")
```

---

## Budgets Collection

### Create a Budget
```python
budget_doc = {
    "user_id": user_id,
    "month": "2026-01",
    "created_at": datetime.now(timezone.utc),
    "updated_at": datetime.now(timezone.utc)
}
result = await budgets_collection.insert_one(budget_doc)
budget_id = result.inserted_id
```

### Get All Budgets for User
```python
cursor = budgets_collection.find({"user_id": user_id}).sort("month", -1)
budgets = await cursor.to_list(length=None)
```

### Get Budget by Month
```python
budget = await budgets_collection.find_one({
    "user_id": user_id,
    "month": "2026-01"
})
```

### Update Budget
```python
result = await budgets_collection.update_one(
    {
        "_id": ObjectId(budget_id),
        "user_id": user_id
    },
    {
        "$set": {
            "month": "2026-02",
            "updated_at": datetime.now(timezone.utc)
        }
    }
)
```

### Delete Budget (with cascading line items)
```python
# Delete all line items first
await budget_line_items_collection.delete_many({
    "user_id": user_id,
    "budget_id": ObjectId(budget_id)
})

# Then delete budget
result = await budgets_collection.delete_one({
    "_id": ObjectId(budget_id),
    "user_id": user_id
})
```

---

## Budget Line Items Collection

### Create a Budget Line Item
```python
line_item_doc = {
    "user_id": user_id,
    "budget_id": ObjectId(budget_id),
    "name": "Apartment Rent",
    "category_id": ObjectId(category_id),
    "amount": 1500.00,
    "owner_slot": "shared",
    "created_at": datetime.now(timezone.utc),
    "updated_at": datetime.now(timezone.utc)
}
result = await budget_line_items_collection.insert_one(line_item_doc)
line_item_id = result.inserted_id
```

### Get All Line Items for a Budget
```python
cursor = budget_line_items_collection.find({
    "user_id": user_id,
    "budget_id": ObjectId(budget_id)
})
line_items = await cursor.to_list(length=None)
```

### Get Line Items by Owner Slot
```python
cursor = budget_line_items_collection.find({
    "user_id": user_id,
    "budget_id": ObjectId(budget_id),
    "owner_slot": "user1"
})
user1_items = await cursor.to_list(length=None)
```

### Get Line Items by Category
```python
cursor = budget_line_items_collection.find({
    "user_id": user_id,
    "category_id": ObjectId(category_id)
})
category_items = await cursor.to_list(length=None)
```

### Update Line Item
```python
result = await budget_line_items_collection.update_one(
    {
        "_id": ObjectId(line_item_id),
        "user_id": user_id
    },
    {
        "$set": {
            "amount": 1600.00,
            "name": "Apartment Rent (Updated)",
            "updated_at": datetime.now(timezone.utc)
        }
    }
)
```

### Delete Line Item
```python
result = await budget_line_items_collection.delete_one({
    "_id": ObjectId(line_item_id),
    "user_id": user_id
})
```

---

## Advanced Queries

### Get Budget with Resolved Categories (Aggregation)
```python
pipeline = [
    # Match budget for this user and month
    {
        "$match": {
            "user_id": user_id,
            "month": "2026-01"
        }
    },
    # Lookup line items
    {
        "$lookup": {
            "from": "budget_line_items",
            "let": {"budget_id": "$_id"},
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {"$eq": ["$budget_id", "$$budget_id"]},
                                {"$eq": ["$user_id", user_id]}
                            ]
                        }
                    }
                },
                # Lookup category for each line item
                {
                    "$lookup": {
                        "from": "categories",
                        "localField": "category_id",
                        "foreignField": "_id",
                        "as": "category"
                    }
                },
                # Unwind category array
                {
                    "$unwind": {
                        "path": "$category",
                        "preserveNullAndEmptyArrays": True
                    }
                }
            ],
            "as": "line_items"
        }
    }
]

cursor = budgets_collection.aggregate(pipeline)
result = await cursor.to_list(length=1)
budget_with_items = result[0] if result else None
```

### Get Total Budget Amount by Owner Slot
```python
pipeline = [
    {
        "$match": {
            "user_id": user_id,
            "budget_id": ObjectId(budget_id)
        }
    },
    {
        "$group": {
            "_id": "$owner_slot",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }
    }
]

cursor = budget_line_items_collection.aggregate(pipeline)
totals = await cursor.to_list(length=None)
# Result: [{"_id": "user1", "total": 1000, "count": 3}, ...]
```

### Get Total Budget Amount by Category
```python
pipeline = [
    {
        "$match": {
            "user_id": user_id,
            "budget_id": ObjectId(budget_id)
        }
    },
    {
        "$lookup": {
            "from": "categories",
            "localField": "category_id",
            "foreignField": "_id",
            "as": "category"
        }
    },
    {
        "$unwind": "$category"
    },
    {
        "$group": {
            "_id": "$category_id",
            "category_name": {"$first": "$category.name"},
            "category_type": {"$first": "$category.type"},
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }
    },
    {
        "$sort": {"total": -1}
    }
]

cursor = budget_line_items_collection.aggregate(pipeline)
category_totals = await cursor.to_list(length=None)
```

### Get All Categories with Usage Count
```python
pipeline = [
    {
        "$match": {"user_id": user_id}
    },
    {
        "$lookup": {
            "from": "budget_line_items",
            "localField": "_id",
            "foreignField": "category_id",
            "as": "line_items"
        }
    },
    {
        "$addFields": {
            "usage_count": {"$size": "$line_items"}
        }
    },
    {
        "$project": {
            "line_items": 0  # Exclude line items from result
        }
    },
    {
        "$sort": {"usage_count": -1}
    }
]

cursor = categories_collection.aggregate(pipeline)
categories_with_usage = await cursor.to_list(length=None)
```

---

## Migration Queries

### Find All Legacy Line Items (String Categories)
```python
# Assuming legacy items stored category as string in "category" field
legacy_items = await budget_line_items_collection.find({
    "user_id": user_id,
    "category": {"$type": "string"},  # Old format
    "category_id": {"$exists": False}  # No new format yet
}).to_list(length=None)
```

### Migrate Single Line Item
```python
# Find or create category
category = await categories_collection.find_one({
    "user_id": user_id,
    "name": legacy_item["category"],
    "type": "expense"  # Determine type from context
})

if not category:
    # Create category
    category_doc = {
        "user_id": user_id,
        "name": legacy_item["category"],
        "type": "expense",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    result = await categories_collection.insert_one(category_doc)
    category_id = result.inserted_id
else:
    category_id = category["_id"]

# Update line item
await budget_line_items_collection.update_one(
    {"_id": legacy_item["_id"]},
    {
        "$set": {
            "category_id": category_id,
            "updated_at": datetime.now(timezone.utc)
        },
        "$unset": {"category": ""}  # Remove old string field
    }
)
```

---

## Validation Queries

### Validate Category Belongs to User
```python
async def validate_category_ownership(user_id: str, category_id: str) -> bool:
    category = await categories_collection.find_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    return category is not None
```

### Validate Budget Belongs to User
```python
async def validate_budget_ownership(user_id: str, budget_id: str) -> bool:
    budget = await budgets_collection.find_one({
        "_id": ObjectId(budget_id),
        "user_id": user_id
    })
    return budget is not None
```

### Check for Orphaned Line Items
```python
# Find line items with invalid category references
pipeline = [
    {"$match": {"user_id": user_id}},
    {
        "$lookup": {
            "from": "categories",
            "localField": "category_id",
            "foreignField": "_id",
            "as": "category"
        }
    },
    {
        "$match": {"category": {"$eq": []}}  # No matching category
    }
]

cursor = budget_line_items_collection.aggregate(pipeline)
orphaned_items = await cursor.to_list(length=None)
```

---

## Performance Tips

1. **Always filter by `user_id` first** - Uses index efficiently
2. **Use aggregation pipelines** for complex joins - More efficient than multiple queries
3. **Limit result sets** - Use `.limit()` for large collections
4. **Project only needed fields** - Reduces network transfer
5. **Use indexes** - All queries benefit from `user_id` index

Example optimized query:
```python
# ✅ Good: Filter + project + limit
cursor = categories_collection.find(
    {"user_id": user_id, "type": "expense"},
    {"_id": 1, "name": 1, "icon": 1, "color": 1}  # Only needed fields
).limit(100)

# ❌ Bad: No filter, all fields, no limit
cursor = categories_collection.find()
```

---

## Security Notes

**CRITICAL**: Always include `user_id` filter in queries to prevent unauthorized access:

```python
# ✅ SECURE: Filter by user_id
await categories_collection.find_one({
    "_id": ObjectId(category_id),
    "user_id": current_user_id  # From auth context
})

# ❌ INSECURE: Missing user_id filter
await categories_collection.find_one({
    "_id": ObjectId(category_id)
})
```

This prevents:
- Users accessing other users' categories
- Users modifying other users' budgets
- Data leakage between user accounts
