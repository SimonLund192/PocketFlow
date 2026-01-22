# Data Model Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOGGED-IN USER (User_ID)                            │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          USER PROFILE                                │  │
│  │  • Single authenticated user with User_ID                            │  │
│  │  • Contains two participant "slots": user1 and user2                 │  │
│  │  • user2 is NOT a separate auth user (no login, no invitation)       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ owns
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   CATEGORIES     │        │     BUDGETS      │        │   (Other Data)   │
│   Collection     │        │   Collection     │        │  • Transactions  │
├──────────────────┤        ├──────────────────┤        │  • Goals         │
│ _id: ObjectId    │        │ _id: ObjectId    │        │  • etc.          │
│ user_id: String  │        │ user_id: String  │        └──────────────────┘
│ name: String     │        │ month: "YYYY-MM" │
│ type: Enum       │        │ created_at       │
│ icon: String?    │        │ updated_at       │
│ color: String?   │        └──────────────────┘
│ created_at       │                 │
│ updated_at       │                 │ has many
└──────────────────┘                 │
         │                           │
         │                           ▼
         │                  ┌──────────────────────┐
         │                  │  BUDGET LINE ITEMS   │
         │                  │     Collection       │
         │                  ├──────────────────────┤
         │                  │ _id: ObjectId        │
         │                  │ user_id: String      │
         │                  │ budget_id: ObjectId ─┤─ References budget
         │                  │ name: String         │
         └─────references──>│ category_id: OID    ─┤─ References category
                            │ amount: Number       │
                            │ owner_slot: Enum     │
                            │ created_at           │
                            │ updated_at           │
                            └──────────────────────┘


OWNER SLOT VALUES:
┌─────────────────────────────────────────────────────────────────────────────┐
│  "user1"  →  Personal expense/income of the logged-in user                 │
│  "user2"  →  Personal expense/income of the second participant (no login)  │
│  "shared" →  Shared expense/income between user1 and user2                 │
└─────────────────────────────────────────────────────────────────────────────┘


CATEGORY TYPES:
┌─────────────────────────────────────────────────────────────────────────────┐
│  "income"  →  Income categories (salary, freelance, etc.)                  │
│  "expense" →  Expense categories (rent, groceries, utilities, etc.)        │
└─────────────────────────────────────────────────────────────────────────────┘


DATABASE INDEXES:
┌─────────────────────────────────────────────────────────────────────────────┐
│ CATEGORIES:                                                                 │
│  • user_id (single field index)                                             │
│  • (user_id, name, type) UNIQUE - prevents duplicate categories            │
│                                                                             │
│ BUDGETS:                                                                    │
│  • user_id (single field index)                                             │
│  • (user_id, month) UNIQUE - one budget per user per month                 │
│                                                                             │
│ BUDGET_LINE_ITEMS:                                                          │
│  • user_id (single field index)                                             │
│  • budget_id (single field index)                                           │
│  • category_id (single field index)                                         │
│  • (user_id, budget_id) - compound index for efficient queries             │
│  • (user_id, category_id) - compound index for reporting                   │
└─────────────────────────────────────────────────────────────────────────────┘


DATA FLOW EXAMPLE:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User creates category "Rent" (type: expense)                            │
│    → categories collection: {_id: "abc123", name: "Rent", type: "expense"} │
│                                                                             │
│ 2. User creates budget for January 2026                                    │
│    → budgets collection: {_id: "def456", month: "2026-01"}                 │
│                                                                             │
│ 3. User creates line item "Apartment Rent"                                 │
│    → budget_line_items collection:                                          │
│      {                                                                      │
│        name: "Apartment Rent",                                              │
│        category_id: "abc123",  ← Reference to category                     │
│        budget_id: "def456",    ← Reference to budget                       │
│        amount: 1500,                                                        │
│        owner_slot: "shared"                                                 │
│      }                                                                      │
│                                                                             │
│ 4. User requests budget with items                                         │
│    → Backend resolves category_id → full category document                 │
│    → Returns budget + line items with nested category details              │
│      {                                                                      │
│        budget: {month: "2026-01", ...},                                     │
│        line_items: [                                                        │
│          {                                                                  │
│            name: "Apartment Rent",                                          │
│            amount: 1500,                                                    │
│            owner_slot: "shared",                                            │
│            category: {name: "Rent", type: "expense", icon: "🏠"}           │
│          }                                                                  │
│        ]                                                                    │
│      }                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘


SECURITY MODEL:
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ ALL queries must filter by logged-in user_id                            │
│                                                                             │
│ ✅ Correct:                                                                 │
│    await categories_collection.find_one({                                   │
│        "_id": category_id,                                                  │
│        "user_id": current_user_id  ← FROM AUTH CONTEXT                     │
│    })                                                                       │
│                                                                             │
│ ❌ WRONG (security vulnerability):                                          │
│    await categories_collection.find_one({                                   │
│        "_id": category_id  ← MISSING user_id filter!                       │
│    })                                                                       │
│                                                                             │
│ This prevents users from accessing other users' data.                      │
└─────────────────────────────────────────────────────────────────────────────┘


MIGRATION FROM LEGACY STRING CATEGORIES:
┌─────────────────────────────────────────────────────────────────────────────┐
│ BEFORE (legacy):                                                            │
│ budget_line_items: {                                                        │
│   name: "Apartment Rent",                                                   │
│   category: "Rent",  ← Stored as string                                    │
│   amount: 1500                                                              │
│ }                                                                           │
│                                                                             │
│ AFTER (new design):                                                         │
│ categories: {                                                               │
│   _id: "abc123",                                                            │
│   name: "Rent",                                                             │
│   type: "expense"                                                           │
│ }                                                                           │
│                                                                             │
│ budget_line_items: {                                                        │
│   name: "Apartment Rent",                                                   │
│   category_id: "abc123",  ← Reference to category by ObjectId              │
│   amount: 1500                                                              │
│ }                                                                           │
│                                                                             │
│ BENEFITS:                                                                   │
│ • No duplicate category names                                               │
│ • Consistent reporting (no "Rent" vs "rent" issues)                        │
│ • Easy to rename category once (updates everywhere)                        │
│ • Can add metadata (icon, color) without touching line items               │
│ • Foreign key integrity via validation                                      │
└─────────────────────────────────────────────────────────────────────────────┘


PYDANTIC MODEL HIERARCHY:
┌─────────────────────────────────────────────────────────────────────────────┐
│ CATEGORY MODELS:                                                            │
│   CategoryBase           → Base fields (name, type, icon, color)           │
│   CategoryCreate         → API request (extends Base)                       │
│   CategoryUpdate         → API request (all fields optional)                │
│   CategoryInDB           → MongoDB doc (Base + _id, user_id, timestamps)    │
│   CategoryResponse       → API response (string IDs)                        │
│                                                                             │
│ BUDGET MODELS:                                                              │
│   BudgetBase            → Base fields (month)                               │
│   BudgetCreate          → API request (extends Base)                        │
│   BudgetUpdate          → API request (all fields optional)                 │
│   BudgetInDB            → MongoDB doc (Base + _id, user_id, timestamps)     │
│   BudgetResponse        → API response (string IDs)                         │
│                                                                             │
│ BUDGET LINE ITEM MODELS:                                                    │
│   BudgetLineItemBase    → Base (name, category_id, amount, owner_slot)     │
│   BudgetLineItemCreate  → API request (Base + budget_id)                    │
│   BudgetLineItemUpdate  → API request (all fields optional)                 │
│   BudgetLineItemInDB    → MongoDB doc (ObjectId references)                 │
│   BudgetLineItemResponse → API response (string IDs)                        │
│   BudgetLineItemWithCategory → Response + populated category               │
│   BudgetWithItems       → Budget + array of items with categories          │
└─────────────────────────────────────────────────────────────────────────────┘
```
