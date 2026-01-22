# Budget CRUD API Documentation

## Overview

This document describes the Budget CRUD API endpoints. Budgets represent monthly budget periods and serve as containers for budget line items.

## Architecture

```
Client Request
     ↓
API Route (/api/budgets)
     ↓
Budget Service (business logic)
     ↓
MongoDB (budgets collection)
```

### Key Components

- **Route**: `/backend/app/routes/budgets.py` - HTTP endpoints
- **Service**: `/backend/app/services/budget_service.py` - Business logic
- **Models**: `/backend/app/models.py` - Pydantic validation models
- **Database**: MongoDB `budgets` collection

---

## Authentication

All budget endpoints require authentication via JWT Bearer token.

**Header**:
```
Authorization: Bearer <your_jwt_token>
```

The logged-in user's `User_ID` is extracted from the token and used to filter all operations.

---

## Endpoints

### 1. Create Budget

**POST** `/api/budgets/`

Create a new budget for the logged-in user.

**Request Body**:
```json
{
  "month": "2026-01"
}
```

**Fields**:
- `month` (string, required): Budget month in YYYY-MM format

**Response** (201 Created):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "user_id": "user123",
  "month": "2026-01",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Validation**:
- ✅ Month must match pattern YYYY-MM (e.g., "2026-01")
- ✅ User can only have one budget per month
- ✅ Month must be valid (01-12)

**Errors**:
- `400 Bad Request`: Budget for that month already exists
- `422 Unprocessable Entity`: Invalid month format
- `401 Unauthorized`: Missing or invalid authentication token

**Example**:
```bash
curl -X POST "http://localhost:8000/api/budgets/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"month": "2026-01"}'
```

---

### 2. Get All Budgets

**GET** `/api/budgets/`

Get all budgets for the logged-in user, sorted by month (newest first).

**Response** (200 OK):
```json
[
  {
    "id": "507f1f77bcf86cd799439013",
    "user_id": "user123",
    "month": "2026-02",
    "created_at": "2026-02-01T00:00:00Z",
    "updated_at": "2026-02-01T00:00:00Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "user_id": "user123",
    "month": "2026-01",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

**User Isolation**:
- ✅ Only returns budgets belonging to the logged-in user
- ✅ Cannot see other users' budgets

**Example**:
```bash
curl -X GET "http://localhost:8000/api/budgets/" \
  -H "Authorization: Bearer <token>"
```

---

### 3. Get Budget by ID

**GET** `/api/budgets/{budget_id}`

Get a single budget by its ID.

**Path Parameters**:
- `budget_id` (string, required): The budget ID

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "user_id": "user123",
  "month": "2026-01",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Budget not found or doesn't belong to user
- `401 Unauthorized`: Missing or invalid authentication token

**Security**:
- ✅ Only returns budget if it belongs to the logged-in user
- ✅ Returns 404 if budget belongs to different user

**Example**:
```bash
curl -X GET "http://localhost:8000/api/budgets/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Get Budget by Month

**GET** `/api/budgets/by-month/{month}`

Get a budget by month string.

**Path Parameters**:
- `month` (string, required): Month in YYYY-MM format (e.g., "2026-01")

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "user_id": "user123",
  "month": "2026-01",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Budget not found for that month
- `401 Unauthorized`: Missing or invalid authentication token

**Example**:
```bash
curl -X GET "http://localhost:8000/api/budgets/by-month/2026-01" \
  -H "Authorization: Bearer <token>"
```

---

### 5. Update Budget

**PUT** `/api/budgets/{budget_id}`

Update a budget's month.

**Path Parameters**:
- `budget_id` (string, required): The budget ID

**Request Body**:
```json
{
  "month": "2026-02"
}
```

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439012",
  "user_id": "user123",
  "month": "2026-02",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-22T10:30:00Z"
}
```

**Validation**:
- ✅ Cannot update to a month that already has a budget
- ✅ `updated_at` timestamp is automatically updated

**Errors**:
- `404 Not Found`: Budget not found or doesn't belong to user
- `400 Bad Request`: Update would create duplicate month
- `422 Unprocessable Entity`: Invalid month format
- `401 Unauthorized`: Missing or invalid authentication token

**Example**:
```bash
curl -X PUT "http://localhost:8000/api/budgets/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"month": "2026-02"}'
```

---

### 6. Delete Budget

**DELETE** `/api/budgets/{budget_id}`

Delete a budget and all its line items (cascading delete).

**Path Parameters**:
- `budget_id` (string, required): The budget ID

**Response** (204 No Content):
No response body.

**Cascading Delete**:
- ✅ Deletes the budget
- ✅ Automatically deletes all associated budget line items
- ✅ This is a permanent operation

**Errors**:
- `404 Not Found`: Budget not found or doesn't belong to user
- `401 Unauthorized`: Missing or invalid authentication token

**Example**:
```bash
curl -X DELETE "http://localhost:8000/api/budgets/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>"
```

---

## Data Model

### Budget Document (MongoDB)

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  user_id: "user123",
  month: "2026-01",
  created_at: ISODate("2026-01-01T00:00:00Z"),
  updated_at: ISODate("2026-01-01T00:00:00Z")
}
```

### Indexes

```javascript
// Single field index
db.budgets.createIndex({ user_id: 1 })

// Unique compound index
db.budgets.createIndex(
  { user_id: 1, month: 1 },
  { unique: true, name: "unique_budget_per_user_month" }
)
```

---

## Business Rules

### 1. One Budget Per Month
- A user can only have one budget per month
- Enforced by unique index: (user_id, month)
- Example: Cannot create two "2026-01" budgets for same user

### 2. User Isolation
- All operations filter by logged-in `user_id`
- Users cannot access other users' budgets
- Attempts to access other users' budgets return 404

### 3. Cascading Delete
- Deleting a budget deletes all its line items
- This is automatic and permanent
- No orphaned line items are left behind

### 4. Month Format Validation
- Month must be in YYYY-MM format
- Month number must be 01-12
- Validated by Pydantic regex pattern

---

## Usage Examples

### Create Budget for Multiple Months

```python
import httpx

async def create_year_budgets(token: str, year: int):
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        for month in range(1, 13):
            month_str = f"{year}-{month:02d}"
            response = await client.post(
                f"{base_url}/api/budgets/",
                json={"month": month_str},
                headers=headers
            )
            print(f"Created budget for {month_str}")
```

### Get Current Month Budget

```python
from datetime import datetime

async def get_current_budget(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    current_month = datetime.now().strftime("%Y-%m")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:8000/api/budgets/by-month/{current_month}",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            print(f"No budget found for {current_month}")
            return None
```

### Update Budget Month

```python
async def move_budget_to_next_month(token: str, budget_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # Get current budget
        response = await client.get(
            f"http://localhost:8000/api/budgets/{budget_id}",
            headers=headers
        )
        budget = response.json()
        
        # Calculate next month
        year, month = budget["month"].split("-")
        next_month = f"{year}-{int(month)+1:02d}"
        
        # Update budget
        response = await client.put(
            f"http://localhost:8000/api/budgets/{budget_id}",
            json={"month": next_month},
            headers=headers
        )
        return response.json()
```

### Safe Delete with Confirmation

```python
async def delete_budget_with_confirmation(token: str, budget_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # Get budget details
        response = await client.get(
            f"http://localhost:8000/api/budgets/{budget_id}",
            headers=headers
        )
        budget = response.json()
        
        # Confirm deletion
        print(f"About to delete budget for {budget['month']}")
        print("This will also delete all associated line items")
        confirm = input("Continue? (yes/no): ")
        
        if confirm.lower() == "yes":
            response = await client.delete(
                f"http://localhost:8000/api/budgets/{budget_id}",
                headers=headers
            )
            if response.status_code == 204:
                print("Budget deleted successfully")
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Duplicate month |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Budget doesn't exist or wrong user |
| 422 | Validation Error | Invalid month format |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Testing

### Run Tests

```bash
# Run all budget tests
pytest backend/tests/test_budget_service.py -v
pytest backend/tests/test_budget_api.py -v

# Run specific test
pytest backend/tests/test_budget_service.py::TestBudgetService::test_create_budget_success -v

# Run with coverage
pytest backend/tests/test_budget_service.py --cov=app.services.budget_service
```

### Test Coverage

- ✅ Create budget (success, duplicate, validation)
- ✅ Get all budgets (empty, sorted, user isolation)
- ✅ Get single budget (by ID, by month, not found)
- ✅ Update budget (success, duplicate, partial update)
- ✅ Delete budget (success, cascading, not found)
- ✅ User isolation (cannot access other users' data)

---

## Performance Considerations

### Indexes Usage

All queries leverage indexes for optimal performance:

```python
# Uses index on user_id
GET /api/budgets/ → find({ user_id })

# Uses index on _id + user_id
GET /api/budgets/{id} → findOne({ _id, user_id })

# Uses unique index on user_id + month
GET /api/budgets/by-month/{month} → findOne({ user_id, month })
```

### Query Optimization

- Budgets sorted by month (indexed field)
- All queries filter by `user_id` first (indexed)
- Duplicate checks use unique index (fast)
- Cascading delete uses indexed budget_id

---

## Security

### Authentication Required
All endpoints require valid JWT token in Authorization header.

### User Isolation
- All queries automatically filter by logged-in `user_id`
- Users cannot access or modify other users' budgets
- Attempting to access another user's budget returns 404

### Cascading Delete Security
- Deleting a budget only deletes its own line items
- Cannot delete line items from other users' budgets
- All cascade operations respect user_id filtering

### Authorization Flow
```
Request → JWT Validation → User_ID Extraction → Service Layer → Database Filter by user_id
```

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema documentation
- [MONGODB_QUERIES.md](./MONGODB_QUERIES.md) - Query examples
- [CATEGORY_API.md](./CATEGORY_API.md) - Category endpoints

---

**Status**: ✅ Fully implemented and tested
