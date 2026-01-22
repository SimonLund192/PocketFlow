# Database Schema Documentation

## Overview

This document describes the MongoDB collections, indexes, and data models for the PocketFlow Budget App backend.

## Critical Constraint

- **ONE logged-in user** identified by `User_ID` (the MongoDB document `_id`)
- Inside that single `User_ID` document/profile we have **two participant "slots"**: `user1` and `user2`
- `user2` is NOT a real auth user - there is no second login, no invitations, no memberships
- The logged-in user's `User_ID` remains the top-level owner of all data

---

## Collections

### 1. `categories` Collection

**Purpose**: Store canonical list of income/expense categories per logged-in user.

**Schema**:
```javascript
{
  _id: ObjectId,                    // Auto-generated category ID
  user_id: String,                  // The logged-in User_ID (required, indexed)
  name: String,                     // Category name (required, max 100 chars)
  type: String,                     // "income" | "expense" (required)
  icon: String | null,              // Optional icon identifier (max 50 chars)
  color: String | null,             // Optional color code (max 20 chars)
  created_at: ISODate,              // Creation timestamp (UTC)
  updated_at: ISODate               // Last update timestamp (UTC)
}
```

**Indexes**:
- `user_id` (single field index)
- `(user_id, name, type)` (unique compound index) - prevents duplicate categories per user

**Example Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "user_id": "user123",
  "name": "Rent",
  "type": "expense",
  "icon": "home",
  "color": "#FF5733",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Validation Rules**:
- `user_id` is required
- `name` must be unique per `(user_id, type)` combination
- `type` must be either "income" or "expense"

---

### 2. `budgets` Collection

**Purpose**: Store monthly budgets owned by the logged-in user.

**Schema**:
```javascript
{
  _id: ObjectId,                    // Auto-generated budget ID
  user_id: String,                  // The logged-in User_ID (required, indexed)
  month: String,                    // Budget month in "YYYY-MM" format (required)
  created_at: ISODate,              // Creation timestamp (UTC)
  updated_at: ISODate               // Last update timestamp (UTC)
}
```

**Indexes**:
- `user_id` (single field index)
- `(user_id, month)` (unique compound index) - one budget per user per month

**Example Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "user_id": "user123",
  "month": "2026-01",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

**Validation Rules**:
- `user_id` is required
- `month` must match pattern `YYYY-MM` (e.g., "2026-01")
- Only one budget allowed per `(user_id, month)` combination

---

### 3. `budget_line_items` Collection

**Purpose**: Store individual line items for budgets, referencing categories by ID.

**Schema**:
```javascript
{
  _id: ObjectId,                    // Auto-generated line item ID
  user_id: String,                  // The logged-in User_ID (required, indexed)
  budget_id: ObjectId,              // Reference to budgets collection (required, indexed)
  name: String,                     // Line item name (required, max 200 chars)
  category_id: ObjectId,            // Reference to categories collection (required, indexed)
  amount: Number,                   // Budget amount (required, >= 0)
  owner_slot: String,               // "user1" | "user2" | "shared" (required)
  created_at: ISODate,              // Creation timestamp (UTC)
  updated_at: ISODate               // Last update timestamp (UTC)
}
```

**Indexes**:
- `user_id` (single field index)
- `budget_id` (single field index)
- `category_id` (single field index)
- `(user_id, budget_id)` (compound index)
- `(user_id, category_id)` (compound index)

**Example Document**:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "user_id": "user123",
  "budget_id": ObjectId("507f1f77bcf86cd799439012"),
  "name": "Apartment Rent",
  "category_id": ObjectId("507f1f77bcf86cd799439011"),
  "amount": 1500.00,
  "owner_slot": "shared",
  "created_at": "2026-01-05T10:00:00Z",
  "updated_at": "2026-01-05T10:00:00Z"
}
```

**Validation Rules**:
- `user_id`, `budget_id`, `category_id` are required
- `category_id` must reference an existing category owned by the same `user_id`
- `budget_id` must reference an existing budget owned by the same `user_id`
- `amount` must be >= 0
- `owner_slot` must be "user1", "user2", or "shared"

**Important**: Categories are resolved at read time, NOT stored redundantly in line items.

---

## Data Model Relationships

```
User (logged-in, User_ID)
  |
  ├── categories [1:N]
  |     └── category documents (name, type, icon, color)
  |
  ├── budgets [1:N]
  |     └── budget documents (month)
  |           |
  |           └── budget_line_items [1:N]
  |                 └── line item documents
  |                       ├── references → category (by category_id)
  |                       └── owner_slot: user1 | user2 | shared
```

---

## Owner Slot Concept

The `owner_slot` field in `budget_line_items` identifies which participant "slot" owns the line item:

- **`user1`**: The primary/logged-in user's personal expense/income
- **`user2`**: The secondary participant's personal expense/income (NOT a separate auth user)
- **`shared`**: Shared expense/income between user1 and user2

This maintains the 2-slot model without requiring separate auth accounts.

---

## Migration Strategy

### From Legacy String-Based Categories

If existing data stores categories as strings in budget line items:

1. **Create categories automatically**:
   - Scan all existing line items
   - Extract unique `(user_id, category_name, type)` tuples
   - Create category documents in `categories` collection
   - Use `unique_category_per_user` index to prevent duplicates

2. **Replace string references with ObjectIds**:
   - For each line item with string category:
   - Look up corresponding category by `(user_id, name, type)`
   - Replace string with `category_id` (ObjectId)
   - Keep old fields temporarily for rollback safety

3. **Validation**:
   - Verify all line items have valid `category_id` references
   - Ensure no orphaned categories
   - Test read operations with category resolution

---

## API Data Flow

### Creating a Budget Line Item

1. Client sends: `{ budget_id, name, category_id, amount, owner_slot }`
2. Backend validates:
   - `budget_id` exists and belongs to current `user_id`
   - `category_id` exists and belongs to current `user_id`
   - `amount >= 0`
   - `owner_slot` is valid enum value
3. Backend creates line item with all IDs
4. Returns line item with populated category details

### Reading a Budget with Items

1. Client requests budget by `budget_id`
2. Backend queries:
   - Fetch budget by `(user_id, budget_id)`
   - Fetch all line items by `(user_id, budget_id)`
   - For each line item, resolve `category_id` → category document
3. Returns: Budget + array of line items with nested category objects

**Important**: Category details are resolved at read time via lookup, NOT stored redundantly.

---

## Index Performance Notes

- **Unique indexes** prevent data duplication and enforce business rules
- **Compound indexes** optimize common query patterns:
  - `(user_id, month)` for budget lookups
  - `(user_id, budget_id)` for line item queries
  - `(user_id, category_id)` for category-based reporting

- **Single field indexes** support:
  - Foreign key lookups (`budget_id`, `category_id`)
  - User-based queries (`user_id`)

---

## Security Considerations

All queries MUST filter by the logged-in `user_id`:

```python
# ✅ Correct: Always include user_id filter
category = await categories_collection.find_one({
    "_id": category_id,
    "user_id": current_user_id
})

# ❌ Wrong: Missing user_id filter (security vulnerability)
category = await categories_collection.find_one({
    "_id": category_id
})
```

This prevents users from accessing or modifying other users' data.

---

## Pydantic Models

All models are defined in `/backend/app/models.py`:

### Category Models
- `CategoryBase` - Base fields
- `CategoryCreate` - For creation requests
- `CategoryUpdate` - For update requests (all fields optional)
- `CategoryInDB` - MongoDB document with ObjectId
- `CategoryResponse` - API response with string ID

### Budget Models
- `BudgetBase` - Base fields
- `BudgetCreate` - For creation requests
- `BudgetUpdate` - For update requests
- `BudgetInDB` - MongoDB document
- `BudgetResponse` - API response

### Budget Line Item Models
- `BudgetLineItemBase` - Base fields
- `BudgetLineItemCreate` - For creation requests
- `BudgetLineItemUpdate` - For update requests
- `BudgetLineItemInDB` - MongoDB document
- `BudgetLineItemResponse` - API response
- `BudgetLineItemWithCategory` - Response with populated category
- `BudgetWithItems` - Budget with all line items and categories

### Migration Models
- `LegacyBudgetLineItem` - For backward compatibility with string-based categories

---

## Testing Requirements

Tests should verify:

1. **User isolation**: Users cannot access other users' categories/budgets/items
2. **Reference validation**: Cannot create line items with invalid `category_id` or `budget_id`
3. **Unique constraints**: Cannot create duplicate categories or budgets
4. **Migration correctness**: String-based categories are correctly converted to ObjectId references
5. **Owner slot validation**: `owner_slot` only accepts "user1", "user2", or "shared"
6. **Category resolution**: Line items correctly resolve category details at read time

---

## Future Enhancements

Potential improvements (not in current scope):

- Add `budget_line_items.notes` field for user annotations
- Add `categories.is_active` flag for soft deletion
- Add `budgets.status` field (draft, active, archived)
- Support date ranges instead of just month for budgets
- Add recurring line item templates
