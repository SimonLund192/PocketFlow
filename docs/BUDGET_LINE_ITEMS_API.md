## Budget Line Items API Documentation

## Overview

Budget Line Items represent individual budget entries within a monthly budget. Each line item has a name, amount, category reference (ObjectId), and owner slot (user1/user2/shared).

## Architecture

```
Client Request
     ↓
API Route (/api/budget-line-items)
     ↓
BudgetLineItemService (business logic + validation)
     ↓
MongoDB (budget_line_items collection)
```

### Key Components

- **Route**: `/backend/app/routes/budget_line_items.py` - HTTP endpoints
- **Service**: `/backend/app/services/budget_line_item_service.py` - Business logic
- **Models**: `/backend/app/models.py` - Pydantic validation models
- **Database**: MongoDB `budget_line_items` collection

---

## Authentication

All endpoints require authentication via JWT Bearer token.

**Header**:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Create Budget Line Item

**POST** `/api/budget-line-items/`

Create a new budget line item.

**Request Body**:
```json
{
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Apartment Rent",
  "category_id": "507f1f77bcf86cd799439013",
  "amount": 1500.0,
  "owner_slot": "user1"
}
```

**Fields**:
- `budget_id` (string, required): Budget ID this item belongs to
- `name` (string, required): Line item name (1-200 chars)
- `category_id` (string, required): Category ObjectId reference
- `amount` (number, required): Budget amount (>= 0)
- `owner_slot` (string, required): "user1", "user2", or "shared"

**Response** (201 Created):
```json
{
  "id": "507f1f77bcf86cd799439014",
  "user_id": "user123",
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Apartment Rent",
  "category_id": "507f1f77bcf86cd799439013",
  "amount": 1500.0,
  "owner_slot": "user1",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Validation**:
- ✅ Budget must exist and belong to user
- ✅ Category must exist and belong to user
- ✅ Category must be active (is_active=true)
- ✅ Amount must be >= 0
- ✅ Name length: 1-200 characters

**Errors**:
- `400 Bad Request`: Budget not found, category not found, inactive category
- `422 Unprocessable Entity`: Invalid data format, negative amount
- `401 Unauthorized`: Missing or invalid token

**Example**:
```bash
curl -X POST "http://localhost:8000/api/budget-line-items/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "budget_id": "507f1f77bcf86cd799439012",
    "name": "Rent",
    "category_id": "507f1f77bcf86cd799439013",
    "amount": 1500.0,
    "owner_slot": "user1"
  }'
```

---

### 2. Get All Line Items

**GET** `/api/budget-line-items/`

Get all line items for the logged-in user.

**Query Parameters**:
- `budget_id` (optional): Filter by budget ID
- `include_category` (optional, default: false): Populate category details

**Response** (200 OK):
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "user123",
    "budget_id": "507f1f77bcf86cd799439012",
    "name": "Apartment Rent",
    "category_id": "507f1f77bcf86cd799439013",
    "amount": 1500.0,
    "owner_slot": "user1",
    "created_at": "2026-01-22T10:00:00Z",
    "updated_at": "2026-01-22T10:00:00Z"
  }
]
```

**With Category Populated** (`include_category=true`):
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "user123",
    "budget_id": "507f1f77bcf86cd799439012",
    "name": "Apartment Rent",
    "category_id": "507f1f77bcf86cd799439013",
    "amount": 1500.0,
    "owner_slot": "user1",
    "created_at": "2026-01-22T10:00:00Z",
    "updated_at": "2026-01-22T10:00:00Z",
    "category": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Housing",
      "type": "personal-expenses",
      "icon": "home",
      "color": "#FF5733",
      "is_active": true
    }
  }
]
```

**Sorting**: Results sorted by `created_at` descending (newest first)

**Example**:
```bash
# Get all line items
curl -X GET "http://localhost:8000/api/budget-line-items/" \
  -H "Authorization: Bearer <token>"

# Get with categories populated
curl -X GET "http://localhost:8000/api/budget-line-items/?include_category=true" \
  -H "Authorization: Bearer <token>"

# Filter by budget
curl -X GET "http://localhost:8000/api/budget-line-items/?budget_id=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>"
```

---

### 3. Get Line Item by ID

**GET** `/api/budget-line-items/{line_item_id}`

Get a single line item by ID.

**Path Parameters**:
- `line_item_id` (string, required): The line item ID

**Query Parameters**:
- `include_category` (optional, default: false): Populate category details

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439014",
  "user_id": "user123",
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Apartment Rent",
  "category_id": "507f1f77bcf86cd799439013",
  "amount": 1500.0,
  "owner_slot": "user1",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Line item not found or doesn't belong to user

**Example**:
```bash
curl -X GET "http://localhost:8000/api/budget-line-items/507f1f77bcf86cd799439014?include_category=true" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Get Line Items by Budget

**GET** `/api/budget-line-items/budget/{budget_id}`

Convenience endpoint to get all line items for a specific budget (always includes category).

**Path Parameters**:
- `budget_id` (string, required): The budget ID

**Response** (200 OK):
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "user123",
    "budget_id": "507f1f77bcf86cd799439012",
    "name": "Apartment Rent",
    "category_id": "507f1f77bcf86cd799439013",
    "amount": 1500.0,
    "owner_slot": "user1",
    "created_at": "2026-01-22T10:00:00Z",
    "updated_at": "2026-01-22T10:00:00Z",
    "category": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Housing",
      "type": "personal-expenses",
      "icon": "home",
      "color": "#FF5733",
      "is_active": true
    }
  }
]
```

**Example**:
```bash
curl -X GET "http://localhost:8000/api/budget-line-items/budget/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>"
```

---

### 5. Update Line Item

**PUT** `/api/budget-line-items/{line_item_id}`

Update a line item (all fields optional).

**Path Parameters**:
- `line_item_id` (string, required): The line item ID

**Request Body** (all fields optional):
```json
{
  "name": "Luxury Apartment Rent",
  "category_id": "507f1f77bcf86cd799439015",
  "amount": 1800.0,
  "owner_slot": "shared"
}
```

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439014",
  "user_id": "user123",
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Luxury Apartment Rent",
  "category_id": "507f1f77bcf86cd799439015",
  "amount": 1800.0,
  "owner_slot": "shared",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T12:30:00Z"
}
```

**Validation**:
- ✅ If category_id provided, category must exist and belong to user
- ✅ If category_id provided, category must be active
- ✅ `updated_at` timestamp automatically updated

**Errors**:
- `404 Not Found`: Line item not found
- `400 Bad Request`: Invalid category
- `422 Unprocessable Entity`: Invalid data format

**Example**:
```bash
curl -X PUT "http://localhost:8000/api/budget-line-items/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1800.0}'
```

---

### 6. Delete Line Item

**DELETE** `/api/budget-line-items/{line_item_id}`

Delete a line item.

**Path Parameters**:
- `line_item_id` (string, required): The line item ID

**Response** (204 No Content):
No response body.

**Errors**:
- `404 Not Found`: Line item not found

**Example**:
```bash
curl -X DELETE "http://localhost:8000/api/budget-line-items/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer <token>"
```

---

## Data Model

### Budget Line Item Document (MongoDB)

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  user_id: "user123",
  budget_id: ObjectId("507f1f77bcf86cd799439012"),
  name: "Apartment Rent",
  category_id: ObjectId("507f1f77bcf86cd799439013"),
  amount: 1500.0,
  owner_slot: "user1",  // "user1" | "user2" | "shared"
  created_at: ISODate("2026-01-22T10:00:00Z"),
  updated_at: ISODate("2026-01-22T10:00:00Z")
}
```

### Indexes

```javascript
// User isolation
db.budget_line_items.createIndex({ user_id: 1 })

// Budget filtering
db.budget_line_items.createIndex({ budget_id: 1 })

// Category lookups
db.budget_line_items.createIndex({ category_id: 1 })

// Compound index for user + budget queries
db.budget_line_items.createIndex({ user_id: 1, budget_id: 1 })
```

---

## Business Rules

### 1. Category Validation
- Category must exist in `categories` collection
- Category must belong to the same user
- Category must be active (`is_active: true`)
- Cannot use inactive categories for new items or updates

### 2. Budget Validation
- Budget must exist in `budgets` collection
- Budget must belong to the same user
- Validated on creation (not on update - budget_id is immutable)

### 3. User Isolation
- All operations filter by logged-in `user_id`
- Users cannot access other users' line items
- Users cannot reference other users' budgets or categories

### 4. Owner Slots
- Three valid values: "user1", "user2", "shared"
- Matches the 2-participant model (User_ID has two slots)
- "shared" represents joint expenses/budgets

---

## Migration from String Categories

### Legacy Format
Old line items stored category as a string:
```javascript
{
  _id: ObjectId("..."),
  name: "Rent",
  category: "Housing",  // ❌ String
  amount: 1500.0
}
```

### New Format
New line items store category_id as ObjectId:
```javascript
{
  _id: ObjectId("..."),
  name: "Rent",
  category_id: ObjectId("..."),  // ✅ ObjectId reference
  amount: 1500.0
}
```

### Running the Migration

#### Dry Run (Preview Changes)
```bash
cd backend
python -m app.migrations.migrate_categories_to_objectid --dry-run
```

#### Live Migration
```bash
cd backend
python -m app.migrations.migrate_categories_to_objectid
```

### Migration Process

1. **Builds Category Mapping**: Creates `{user_id: {category_name: ObjectId}}`
2. **Processes Each Line Item**: Converts string to ObjectId
3. **Handles Orphaned Items**: Reports line items with missing categories
4. **Updates Documents**: Adds `category_id`, removes `category` field

### Migration Output

```
============================================================
Starting category migration
Mode: LIVE
============================================================
Building category mapping...
Built mapping for 5 users with categories
Found 142 budget line items to process
Migrated line item 507f...: 'Housing' -> 507f1f77bcf86cd799439013
Migrated line item 507f...: 'Utilities' -> 507f1f77bcf86cd799439014
...
============================================================
Migration Summary
============================================================
Total line items:        142
Already migrated:        15
Successfully migrated:   120
Failed:                  0
Orphaned (no category):  7
============================================================
```

### Handling Orphaned Items

Orphaned items have category names that don't exist:

```python
# Option 1: Create missing category
from app.database import categories_collection

await categories_collection.insert_one({
    "user_id": "user123",
    "name": "Missing Category",
    "type": "personal-expenses",
    "icon": "question",
    "color": "#888888",
    "is_active": True
})

# Then re-run migration
```

```python
# Option 2: Delete orphaned items
from app.database import budget_line_items_collection

await budget_line_items_collection.delete_many({
    "category": {"$exists": True}  # Items that still have string category
})
```

---

## Validation Examples

### Valid Line Item
```json
{
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Rent",
  "category_id": "507f1f77bcf86cd799439013",
  "amount": 1500.0,
  "owner_slot": "user1"
}
```
✅ All required fields present  
✅ Amount >= 0  
✅ Valid owner_slot value

### Invalid Examples

**Negative Amount**:
```json
{
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Rent",
  "category_id": "507f1f77bcf86cd799439013",
  "amount": -100.0,  // ❌ Must be >= 0
  "owner_slot": "user1"
}
```
Error: `422 Unprocessable Entity`

**Invalid Owner Slot**:
```json
{
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "Rent",
  "category_id": "507f1f77bcf86cd799439013",
  "amount": 1500.0,
  "owner_slot": "user3"  // ❌ Must be user1/user2/shared
}
```
Error: `422 Unprocessable Entity`

**Empty Name**:
```json
{
  "budget_id": "507f1f77bcf86cd799439012",
  "name": "",  // ❌ Must be 1-200 chars
  "category_id": "507f1f77bcf86cd799439013",
  "amount": 1500.0,
  "owner_slot": "user1"
}
```
Error: `422 Unprocessable Entity`

---

## Usage Examples

### Create Complete Budget with Line Items

```python
import httpx

async def create_monthly_budget(token: str, month: str):
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # 1. Create budget
        budget_response = await client.post(
            f"{base_url}/api/budgets/",
            json={"month": month},
            headers=headers
        )
        budget = budget_response.json()
        budget_id = budget["id"]
        
        # 2. Get active categories
        categories_response = await client.get(
            f"{base_url}/api/categories/",
            headers=headers
        )
        categories = categories_response.json()
        
        # Find housing category
        housing_cat = next(c for c in categories if c["name"] == "Housing")
        
        # 3. Create line items
        line_items = [
            {
                "budget_id": budget_id,
                "name": "Rent",
                "category_id": housing_cat["id"],
                "amount": 1500.0,
                "owner_slot": "user1"
            },
            {
                "budget_id": budget_id,
                "name": "Utilities",
                "category_id": housing_cat["id"],
                "amount": 200.0,
                "owner_slot": "shared"
            }
        ]
        
        for item in line_items:
            await client.post(
                f"{base_url}/api/budget-line-items/",
                json=item,
                headers=headers
            )
        
        print(f"Created budget for {month} with {len(line_items)} line items")
```

### Get Budget Summary

```python
async def get_budget_summary(token: str, budget_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Get line items with categories
        response = await client.get(
            f"{base_url}/api/budget-line-items/budget/{budget_id}",
            headers=headers
        )
        line_items = response.json()
        
        # Calculate totals by owner_slot
        totals = {"user1": 0, "user2": 0, "shared": 0}
        for item in line_items:
            totals[item["owner_slot"]] += item["amount"]
        
        return {
            "total_items": len(line_items),
            "total_amount": sum(totals.values()),
            "user1_total": totals["user1"],
            "user2_total": totals["user2"],
            "shared_total": totals["shared"]
        }
```

### Bulk Update Amounts

```python
async def increase_all_amounts(token: str, budget_id: str, percentage: float):
    """Increase all line item amounts by percentage"""
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Get all items for budget
        response = await client.get(
            f"{base_url}/api/budget-line-items/?budget_id={budget_id}",
            headers=headers
        )
        line_items = response.json()
        
        # Update each item
        for item in line_items:
            new_amount = item["amount"] * (1 + percentage / 100)
            await client.put(
                f"{base_url}/api/budget-line-items/{item['id']}",
                json={"amount": new_amount},
                headers=headers
            )
        
        print(f"Updated {len(line_items)} items (+{percentage}%)")
```

---

## Testing

### Run Tests

```bash
# Run service tests
pytest backend/tests/test_budget_line_item_service.py -v

# Run API tests
pytest backend/tests/test_budget_line_item_api.py -v

# Run all line item tests
pytest backend/tests/test_budget_line_item*.py -v

# With coverage
pytest backend/tests/test_budget_line_item_service.py --cov=app.services.budget_line_item_service
```

### Test Coverage

**Service Layer (30+ tests)**:
- ✅ Create with budget/category validation
- ✅ Get all (empty, multiple, filtered)
- ✅ Get by ID (found, not found)
- ✅ Update (name, amount, category)
- ✅ Delete (success, not found)
- ✅ User isolation
- ✅ Category population
- ✅ Inactive category rejection

**API Layer (25+ tests)**:
- ✅ All CRUD endpoints
- ✅ Authentication
- ✅ Validation errors
- ✅ Query parameters
- ✅ User isolation
- ✅ Category filtering

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid budget/category, inactive category |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Line item doesn't exist or wrong user |
| 422 | Validation Error | Invalid data format, negative amount |

### Error Response Format

```json
{
  "detail": "Category not found or access denied"
}
```

---

## Performance Considerations

### Indexes Usage

All queries leverage indexes:

```python
# Uses user_id index
GET /api/budget-line-items/ → find({ user_id })

# Uses compound index
GET /api/budget-line-items/?budget_id=X → find({ user_id, budget_id })

# Uses _id index
GET /api/budget-line-items/{id} → findOne({ _id, user_id })
```

### Category Population

- Without `include_category`: Single query (fast)
- With `include_category`: N+1 queries (one per item)
- Consider caching categories for heavy usage

### Optimization Tips

```python
# ✅ Good: Fetch all categories once, build map
categories = await get_all_categories(user_id)
category_map = {c["id"]: c for c in categories}

line_items = await get_line_items(user_id, budget_id)
for item in line_items:
    item["category"] = category_map[item["category_id"]]

# ❌ Avoid: Fetching category for each item
for item in line_items:
    item["category"] = await get_category(item["category_id"])
```

---

## Security

### Authentication Required
All endpoints require valid JWT token in Authorization header.

### User Isolation
- All queries filter by logged-in `user_id`
- Users cannot access other users' line items, budgets, or categories
- Attempts to use other users' resources return 404 or 400

### Validation
- Budget ownership validated on creation
- Category ownership validated on creation and update
- Category must be active (prevents using archived categories)
- All amounts must be non-negative

---

## Related Documentation

- [BUDGET_API.md](./BUDGET_API.md) - Budget endpoints
- [CATEGORY_API.md](./CATEGORY_API.md) - Category endpoints
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema
- [MONGODB_QUERIES.md](./MONGODB_QUERIES.md) - Query examples

---

**Status**: ✅ Fully implemented and tested (55+ tests)
