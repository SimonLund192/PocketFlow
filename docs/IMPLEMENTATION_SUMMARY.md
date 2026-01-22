# Categories, Budgets, and Budget Line Items - Implementation Summary

## What Was Implemented

This document summarizes the MongoDB collections, indexes, and Pydantic models created for the redesigned Categories, Budgets, and Budget Line Items system.

---

## ✅ MongoDB Collections Defined

### 1. **categories** collection
- **Purpose**: Canonical list of income/expense categories per logged-in user
- **Key fields**: `user_id`, `name`, `type` (income/expense), `icon`, `color`
- **Defined in**: `backend/app/database.py`

### 2. **budgets** collection
- **Purpose**: Monthly budgets owned by logged-in user
- **Key fields**: `user_id`, `month` (YYYY-MM format)
- **Defined in**: `backend/app/database.py`

### 3. **budget_line_items** collection
- **Purpose**: Individual line items referencing categories by ObjectId
- **Key fields**: `user_id`, `budget_id`, `name`, `category_id`, `amount`, `owner_slot`
- **Defined in**: `backend/app/database.py`

---

## ✅ Database Indexes Created

### Categories Indexes
```python
# Single field index
await categories_collection.create_index("user_id")

# Unique compound index (prevents duplicates)
await categories_collection.create_index(
    [("user_id", 1), ("name", 1), ("type", 1)],
    unique=True,
    name="unique_category_per_user"
)
```

### Budgets Indexes
```python
# Single field index
await budgets_collection.create_index("user_id")

# Unique compound index (one budget per user per month)
await budgets_collection.create_index(
    [("user_id", 1), ("month", 1)],
    unique=True,
    name="unique_budget_per_user_month"
)
```

### Budget Line Items Indexes
```python
# Single field indexes
await budget_line_items_collection.create_index("user_id")
await budget_line_items_collection.create_index("budget_id")
await budget_line_items_collection.create_index("category_id")

# Compound indexes for common queries
await budget_line_items_collection.create_index(
    [("user_id", 1), ("budget_id", 1)],
    name="user_budget_items"
)
await budget_line_items_collection.create_index(
    [("user_id", 1), ("category_id", 1)],
    name="user_category_items"
)
```

**Index creation**: Automated on application startup via `create_indexes()` function.

---

## ✅ Pydantic Models Defined

All models defined in: `backend/app/models.py`

### Category Models
| Model | Purpose |
|-------|---------|
| `CategoryBase` | Base fields for categories |
| `CategoryCreate` | API request for creating category |
| `CategoryUpdate` | API request for updating category (all optional) |
| `CategoryInDB` | MongoDB document with ObjectId types |
| `CategoryResponse` | API response with string IDs |

### Budget Models
| Model | Purpose |
|-------|---------|
| `BudgetBase` | Base fields for budgets |
| `BudgetCreate` | API request for creating budget |
| `BudgetUpdate` | API request for updating budget (all optional) |
| `BudgetInDB` | MongoDB document with ObjectId types |
| `BudgetResponse` | API response with string IDs |

### Budget Line Item Models
| Model | Purpose |
|-------|---------|
| `BudgetLineItemBase` | Base fields for line items |
| `BudgetLineItemCreate` | API request for creating line item |
| `BudgetLineItemUpdate` | API request for updating line item (all optional) |
| `BudgetLineItemInDB` | MongoDB document with ObjectId types |
| `BudgetLineItemResponse` | API response with string IDs |
| `BudgetLineItemWithCategory` | Response with populated category details |
| `BudgetWithItems` | Budget with all line items and categories |

### Migration Models
| Model | Purpose |
|-------|---------|
| `LegacyBudgetLineItem` | For backward compatibility with string-based categories |

---

## ✅ Key Design Decisions

### 1. **Owner Slot Model Preserved**
- Line items use `owner_slot: "user1" | "user2" | "shared"`
- Matches existing 2-slot model (one logged-in user with two participant slots)
- **No changes** to user authentication or user document structure

### 2. **Category References by ObjectId**
- Line items store `category_id` (ObjectId), NOT category name
- Categories resolved at read time (via lookup/population)
- Prevents drift, duplicates, and inconsistent reporting

### 3. **Unique Constraints**
- `(user_id, name, type)` unique for categories
- `(user_id, month)` unique for budgets
- Enforced at database level via indexes

### 4. **User Isolation**
- Every collection has `user_id` field
- All queries MUST filter by logged-in `user_id`
- Prevents cross-user data access

### 5. **Separate Collections (not embedded)**
- Categories, budgets, and line items in separate collections
- Easier to query, index, and maintain
- Better performance for reporting/aggregation

---

## ✅ Validation Rules Enforced

### Category Validation
- `name`: 1-100 characters, required
- `type`: Must be "income" or "expense"
- `icon`: Max 50 characters, optional
- `color`: Max 20 characters, optional
- Unique per `(user_id, name, type)`

### Budget Validation
- `month`: Must match regex `^\d{4}-(0[1-9]|1[0-2])$` (YYYY-MM)
- Unique per `(user_id, month)`

### Budget Line Item Validation
- `name`: 1-200 characters, required
- `category_id`: Must be valid ObjectId referencing existing category
- `budget_id`: Must be valid ObjectId referencing existing budget
- `amount`: Must be >= 0
- `owner_slot`: Must be "user1", "user2", or "shared"
- `category_id` and `budget_id` must belong to same `user_id`

---

## ✅ Automatic Startup Tasks

**File**: `backend/app/main.py`

Added FastAPI lifespan handler:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup: Create database indexes
    await create_indexes()
    yield
    # Shutdown: cleanup
```

Indexes are created automatically when the backend starts.

---

## 📋 What's NOT Implemented Yet

The following are explicitly out of scope (per contract):

- ❌ **API routes** (CRUD endpoints for categories/budgets/line items)
- ❌ **Business logic** (services, repositories, validation)
- ❌ **Migration scripts** (converting string categories to ObjectIds)
- ❌ **Tests** (unit tests, integration tests)
- ❌ **Frontend integration** (API client, UI components)

---

## 📚 Documentation Created

| File | Purpose |
|------|---------|
| `docs/DATABASE_SCHEMA.md` | Complete schema documentation with examples |
| `docs/IMPLEMENTATION_SUMMARY.md` | This file - what was implemented |

---

## 🔄 Migration Path (Future Work)

When implementing migration from legacy string-based categories:

1. Scan existing line items for string-based `category` field
2. Extract unique `(user_id, category_name, type)` tuples
3. Create category documents (dedupe via unique index)
4. Update line items to use `category_id` instead of string
5. Validate all references are correct
6. Optionally keep old fields for rollback safety

---

## 🧪 Testing Checklist (Future Work)

When implementing tests, verify:

- [ ] User isolation: Users cannot access other users' data
- [ ] Category uniqueness: Cannot create duplicate categories
- [ ] Budget uniqueness: Cannot create duplicate budgets for same month
- [ ] Reference validation: Invalid `category_id`/`budget_id` rejected
- [ ] Owner slot validation: Only "user1", "user2", "shared" accepted
- [ ] Category resolution: Line items correctly resolve categories
- [ ] Migration correctness: String categories converted to ObjectIds
- [ ] Index creation: All indexes created on startup

---

## 🚀 Next Steps

To complete the implementation:

1. **Create API routes** for CRUD operations
2. **Implement business logic** (validation, error handling)
3. **Write migration scripts** for legacy data
4. **Add comprehensive tests**
5. **Update frontend** to use new API structure

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `backend/app/models.py` | Added all category/budget/line item models |
| `backend/app/database.py` | Added collections and `create_indexes()` function |
| `backend/app/main.py` | Added lifespan handler for index creation |
| `docs/DATABASE_SCHEMA.md` | Created comprehensive schema documentation |
| `docs/IMPLEMENTATION_SUMMARY.md` | Created this summary |

---

## ✅ Contract Compliance

This implementation strictly follows the contract:

- ✅ Kept user setup EXACTLY as is (one logged-in User_ID, two participant slots)
- ✅ Did not create new auth models or accountId/householdId concepts
- ✅ User_ID remains top-level owner of all data
- ✅ Fixed categories, budgets, and line items ONLY
- ✅ Categories stored in separate collection (canonical, deduplicated)
- ✅ Line items reference categories by ObjectId, not string
- ✅ All data models owned by single logged-in User_ID
- ✅ Owner slot model preserved (user1, user2, shared)
- ✅ Indexes enforce uniqueness and optimize queries
- ✅ Pydantic models validate all data
- ✅ No routes or business logic implemented (per contract)

**Status**: ✅ **COMPLETE** - All MongoDB collections, indexes, and Pydantic models defined.
