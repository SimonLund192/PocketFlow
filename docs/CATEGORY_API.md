# Category CRUD API Documentation

## Overview

This document describes the Category CRUD API endpoints. Categories are used to classify budget line items as either income or expense types.

## Architecture

```
Client Request
     ↓
API Route (/api/categories)
     ↓
Category Service (business logic)
     ↓
MongoDB (categories collection)
```

### Key Components

- **Route**: `/backend/app/routes/categories.py` - HTTP endpoints
- **Service**: `/backend/app/services/category_service.py` - Business logic
- **Models**: `/backend/app/models.py` - Pydantic validation models
- **Database**: MongoDB `categories` collection

---

## Authentication

All category endpoints require authentication via JWT Bearer token.

**Header**:
```
Authorization: Bearer <your_jwt_token>
```

The logged-in user's `User_ID` is extracted from the token and used to filter all operations.

---

## Endpoints

### 1. Create Category

**POST** `/api/categories/`

Create a new category for the logged-in user.

**Request Body**:
```json
{
  "name": "Groceries",
  "type": "expense",
  "icon": "shopping-cart",
  "color": "#FF5733"
}
```

**Fields**:
- `name` (string, required): Category name, 1-100 characters
- `type` (string, required): Either "income" or "expense"
- `icon` (string, optional): Icon identifier, max 50 characters
- `color` (string, optional): Color code, max 20 characters

**Response** (201 Created):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "name": "Groceries",
  "type": "expense",
  "icon": "shopping-cart",
  "color": "#FF5733",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Validation**:
- ✅ Category name must be 1-100 characters
- ✅ Type must be "income" or "expense"
- ✅ Combination of (user_id, name, type) must be unique
- ✅ Icon max 50 characters
- ✅ Color max 20 characters

**Errors**:
- `400 Bad Request`: Category with same (name, type) already exists
- `422 Unprocessable Entity`: Validation error (invalid data)
- `401 Unauthorized`: Missing or invalid authentication token

**Example**:
```bash
curl -X POST "http://localhost:8000/api/categories/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Groceries",
    "type": "expense",
    "icon": "shopping-cart",
    "color": "#FF5733"
  }'
```

---

### 2. Get All Categories

**GET** `/api/categories/`

Get all categories for the logged-in user, sorted by name.

**Query Parameters**:
- `type` (string, optional): Filter by category type ("income" or "expense")

**Response** (200 OK):
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "user_id": "user123",
    "name": "Groceries",
    "type": "expense",
    "icon": "shopping-cart",
    "color": "#FF5733",
    "created_at": "2026-01-22T10:00:00Z",
    "updated_at": "2026-01-22T10:00:00Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "user_id": "user123",
    "name": "Salary",
    "type": "income",
    "icon": "dollar",
    "color": "#00FF00",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
]
```

**User Isolation**:
- ✅ Only returns categories belonging to the logged-in user
- ✅ Cannot see other users' categories

**Examples**:
```bash
# Get all categories
curl -X GET "http://localhost:8000/api/categories/" \
  -H "Authorization: Bearer <token>"

# Get only expense categories
curl -X GET "http://localhost:8000/api/categories/?type=expense" \
  -H "Authorization: Bearer <token>"

# Get only income categories
curl -X GET "http://localhost:8000/api/categories/?type=income" \
  -H "Authorization: Bearer <token>"
```

---

### 3. Get Category by ID

**GET** `/api/categories/{category_id}`

Get a single category by its ID.

**Path Parameters**:
- `category_id` (string, required): The category ID

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "name": "Groceries",
  "type": "expense",
  "icon": "shopping-cart",
  "color": "#FF5733",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Category not found or doesn't belong to user
- `401 Unauthorized`: Missing or invalid authentication token

**Security**:
- ✅ Only returns category if it belongs to the logged-in user
- ✅ Returns 404 if category belongs to different user

**Example**:
```bash
curl -X GET "http://localhost:8000/api/categories/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Update Category

**PUT** `/api/categories/{category_id}`

Update a category. All fields are optional - only provided fields will be updated.

**Path Parameters**:
- `category_id` (string, required): The category ID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "type": "income",
  "icon": "new-icon",
  "color": "#0099FF"
}
```

**Response** (200 OK):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "name": "Updated Name",
  "type": "income",
  "icon": "new-icon",
  "color": "#0099FF",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T11:30:00Z"
}
```

**Validation**:
- ✅ If updating name or type, checks for duplicate (user_id, name, type)
- ✅ Cannot update to create a duplicate category
- ✅ `updated_at` timestamp is automatically updated

**Errors**:
- `404 Not Found`: Category not found or doesn't belong to user
- `400 Bad Request`: Update would create duplicate category
- `422 Unprocessable Entity`: Validation error
- `401 Unauthorized`: Missing or invalid authentication token

**Examples**:
```bash
# Update only name
curl -X PUT "http://localhost:8000/api/categories/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Update multiple fields
curl -X PUT "http://localhost:8000/api/categories/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "icon": "new-icon",
    "color": "#0099FF"
  }'
```

---

### 5. Delete Category

**DELETE** `/api/categories/{category_id}`

Delete a category. Categories in use by budget line items cannot be deleted.

**Path Parameters**:
- `category_id` (string, required): The category ID

**Response** (204 No Content):
No response body.

**Validation**:
- ✅ Checks if category is used in any budget line items
- ✅ Cannot delete if category is in use
- ✅ Only deletes if category belongs to logged-in user

**Errors**:
- `404 Not Found`: Category not found or doesn't belong to user
- `400 Bad Request`: Category is in use by budget line items
- `401 Unauthorized`: Missing or invalid authentication token

**Example**:
```bash
curl -X DELETE "http://localhost:8000/api/categories/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>"
```

**Error Response** (400 Bad Request) if in use:
```json
{
  "detail": "Cannot delete category: it is used in 3 budget line item(s)"
}
```

---

## Data Model

### Category Document (MongoDB)

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  user_id: "user123",
  name: "Groceries",
  type: "expense",
  icon: "shopping-cart",
  color: "#FF5733",
  created_at: ISODate("2026-01-22T10:00:00Z"),
  updated_at: ISODate("2026-01-22T10:00:00Z")
}
```

### Indexes

```javascript
// Single field index
db.categories.createIndex({ user_id: 1 })

// Unique compound index
db.categories.createIndex(
  { user_id: 1, name: 1, type: 1 },
  { unique: true, name: "unique_category_per_user" }
)
```

---

## Business Rules

### 1. Uniqueness
- A user cannot have two categories with the same (name, type)
- Same name is allowed if types are different
- Example: "Bonus" as income AND "Bonus" as expense is valid

### 2. User Isolation
- All operations filter by logged-in `user_id`
- Users cannot access other users' categories
- Attempts to access other users' categories return 404

### 3. Deletion Protection
- Categories in use by budget line items cannot be deleted
- Must delete or reassign all line items first
- Provides count of usage in error message

### 4. Type Safety
- Category type must be "income" or "expense"
- This is enforced at Pydantic validation level
- Invalid types are rejected with 422 error

---

## Usage Examples

### Create Income and Expense Categories

```python
import httpx

async def create_categories(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    base_url = "http://localhost:8000"
    
    # Create income categories
    income_categories = [
        {"name": "Salary", "type": "income", "icon": "dollar", "color": "#00FF00"},
        {"name": "Freelance", "type": "income", "icon": "laptop", "color": "#00CC00"},
    ]
    
    # Create expense categories
    expense_categories = [
        {"name": "Rent", "type": "expense", "icon": "home", "color": "#FF0000"},
        {"name": "Groceries", "type": "expense", "icon": "cart", "color": "#FF3300"},
        {"name": "Utilities", "type": "expense", "icon": "bolt", "color": "#FF6600"},
    ]
    
    async with httpx.AsyncClient() as client:
        for category in income_categories + expense_categories:
            response = await client.post(
                f"{base_url}/api/categories/",
                json=category,
                headers=headers
            )
            print(f"Created: {response.json()['name']}")
```

### Get All Categories and Filter by Type

```python
async def get_expense_categories(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # Get only expense categories
        response = await client.get(
            "http://localhost:8000/api/categories/?type=expense",
            headers=headers
        )
        
        expenses = response.json()
        print(f"Found {len(expenses)} expense categories:")
        for cat in expenses:
            print(f"  - {cat['name']} ({cat['icon']})")
```

### Update Category

```python
async def update_category_color(token: str, category_id: str, new_color: str):
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"http://localhost:8000/api/categories/{category_id}",
            json={"color": new_color},
            headers=headers
        )
        
        updated = response.json()
        print(f"Updated {updated['name']} color to {updated['color']}")
```

### Safe Delete with Usage Check

```python
async def safe_delete_category(token: str, category_id: str):
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"http://localhost:8000/api/categories/{category_id}",
                headers=headers
            )
            
            if response.status_code == 204:
                print("Category deleted successfully")
            elif response.status_code == 404:
                print("Category not found")
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                error = e.response.json()
                print(f"Cannot delete: {error['detail']}")
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Duplicate category, category in use |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Category doesn't exist or wrong user |
| 422 | Validation Error | Invalid request data |

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
# Run all category tests
pytest backend/tests/test_category_service.py -v
pytest backend/tests/test_category_api.py -v

# Run specific test
pytest backend/tests/test_category_service.py::TestCategoryService::test_create_category_success -v

# Run with coverage
pytest backend/tests/test_category_service.py --cov=app.services.category_service
```

### Test Coverage

- ✅ Create category (success, duplicate, validation)
- ✅ Get all categories (with/without filtering)
- ✅ Get single category (success, not found)
- ✅ Update category (success, duplicate, partial update)
- ✅ Delete category (success, in use, not found)
- ✅ User isolation (cannot access other users' data)

---

## Performance Considerations

### Indexes Usage

All queries leverage indexes for optimal performance:

```python
# Uses index on user_id
GET /api/categories/ → find({ user_id })

# Uses index on user_id + type
GET /api/categories/?type=expense → find({ user_id, type })

# Uses index on _id + user_id
GET /api/categories/{id} → findOne({ _id, user_id })
```

### Query Optimization

- Categories are sorted by name in memory (small dataset)
- All queries filter by `user_id` first (indexed)
- Duplicate checks use unique index (fast)
- Usage count for deletion uses indexed category_id

---

## Security

### Authentication Required
All endpoints require valid JWT token in Authorization header.

### User Isolation
- All queries automatically filter by logged-in `user_id`
- Users cannot access or modify other users' categories
- Attempting to access another user's category returns 404

### Input Validation
- All inputs validated by Pydantic models
- SQL injection not applicable (MongoDB)
- No direct ObjectId manipulation from user input

### Authorization Flow
```
Request → JWT Validation → User_ID Extraction → Service Layer → Database Filter by user_id
```

---

## Future Enhancements

Potential improvements (not yet implemented):

- [ ] Soft delete with `is_active` flag
- [ ] Category usage statistics
- [ ] Bulk category operations
- [ ] Category import/export
- [ ] Category templates/presets
- [ ] Category grouping/subcategories
- [ ] Category ordering/priority

---

## Related Documentation

- [DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) - Complete schema documentation
- [MONGODB_QUERIES.md](../docs/MONGODB_QUERIES.md) - Query examples
- [ARCHITECTURE_DIAGRAM.md](../docs/ARCHITECTURE_DIAGRAM.md) - Visual architecture

---

**Status**: ✅ Fully implemented and tested
