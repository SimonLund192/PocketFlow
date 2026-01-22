# Category API Quick Reference

## Endpoints

```
POST   /api/categories/              Create category
GET    /api/categories/              List all categories
GET    /api/categories/?type=expense Filter by type
GET    /api/categories/{id}          Get by ID
PUT    /api/categories/{id}          Update category
DELETE /api/categories/{id}          Delete category
```

## Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer <your_token>
```

## Create Category
```bash
POST /api/categories/
```
```json
{
  "name": "Groceries",
  "type": "expense",
  "icon": "cart",
  "color": "#FF0000"
}
```
**Returns**: 201 + category object

## Get Categories
```bash
GET /api/categories/
GET /api/categories/?type=expense
```
**Returns**: 200 + array of categories

## Get Single
```bash
GET /api/categories/{id}
```
**Returns**: 200 + category object, or 404

## Update
```bash
PUT /api/categories/{id}
```
```json
{
  "name": "Updated Name",
  "color": "#00FF00"
}
```
**Returns**: 200 + updated category, or 404

## Delete
```bash
DELETE /api/categories/{id}
```
**Returns**: 204 (success), 400 (in use), or 404 (not found)

## Field Validation
- `name`: 1-100 characters, required
- `type`: "income" or "expense", required
- `icon`: max 50 characters, optional
- `color`: max 20 characters, optional

## Business Rules
1. ✅ (user_id, name, type) must be unique
2. ✅ Cannot delete if used in budget line items
3. ✅ Users can only access their own categories
4. ✅ All timestamps in UTC

## Status Codes
- `200` OK (GET, PUT)
- `201` Created (POST)
- `204` No Content (DELETE success)
- `400` Bad Request (duplicate, in use)
- `401` Unauthorized (auth failed)
- `404` Not Found (doesn't exist or wrong user)
- `422` Validation Error (invalid data)

## Python Example
```python
import httpx

async with httpx.AsyncClient() as client:
    # Create
    response = await client.post(
        "http://localhost:8000/api/categories/",
        json={"name": "Rent", "type": "expense"},
        headers={"Authorization": f"Bearer {token}"}
    )
    category = response.json()
    
    # Get all
    response = await client.get(
        "http://localhost:8000/api/categories/",
        headers={"Authorization": f"Bearer {token}"}
    )
    categories = response.json()
    
    # Update
    response = await client.put(
        f"http://localhost:8000/api/categories/{category['id']}",
        json={"color": "#00FF00"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Delete
    response = await client.delete(
        f"http://localhost:8000/api/categories/{category['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
```

## cURL Examples
```bash
# Create
curl -X POST "http://localhost:8000/api/categories/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rent","type":"expense"}'

# Get all
curl -X GET "http://localhost:8000/api/categories/" \
  -H "Authorization: Bearer $TOKEN"

# Update
curl -X PUT "http://localhost:8000/api/categories/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"color":"#00FF00"}'

# Delete
curl -X DELETE "http://localhost:8000/api/categories/$ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling
```python
try:
    response = await client.delete(f"/api/categories/{id}")
    response.raise_for_status()
except httpx.HTTPStatusError as e:
    if e.response.status_code == 400:
        # Category in use
        print(f"Error: {e.response.json()['detail']}")
    elif e.response.status_code == 404:
        # Not found
        print("Category not found")
```

## Testing
```bash
# Run tests
pytest backend/tests/test_category_service.py -v
pytest backend/tests/test_category_api.py -v

# With coverage
pytest backend/tests/test_category_*.py --cov=app.services.category_service
```

## Files
- **Route**: `backend/app/routes/categories.py`
- **Service**: `backend/app/services/category_service.py`
- **Models**: `backend/app/models.py`
- **Tests**: `backend/tests/test_category_*.py`
- **Docs**: `docs/CATEGORY_API.md`
