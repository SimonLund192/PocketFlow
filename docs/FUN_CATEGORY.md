# Fun Category Type

## Overview
The "Fun" category type has been added to PocketFlow to track shared entertainment and leisure spending between users.

## Implementation Details

### Backend Changes
- **File**: `backend/app/models.py`
- Added `"fun"` to the `Literal` type definitions for:
  - `TransactionBase.type`
  - `CategoryBase.type`
  - `CategoryUpdate.type`

### Frontend Changes

#### Type Definitions
- **File**: `frontend/lib/categories-api.ts`
  - Updated `Category`, `CategoryCreate`, and `CategoryUpdate` interfaces to include `"fun"` type

- **File**: `frontend/lib/budget-line-items-api.ts`
  - Updated `BudgetLineItemWithCategory` interface to include `"fun"` in category type

#### Budget Page
- **File**: `frontend/app/budget/page.tsx`
  - Added `TabType = "fun"` to tab types
  - Added `funCategories` state to store fun category options
  - Added `sharedFunItems` state to track fun spending items
  - Updated `loadCategories()` to filter and set fun categories
  - Updated `loadBudgetData()` to load and filter fun items from backend
  - Added Fun tab UI with:
    - Item name input
    - Category dropdown (populated from fun categories)
    - Amount input
    - Add/remove item buttons
    - Manual "Save Fun Items" button
  - Updated totals calculation to include fun spending in remaining amount

## Usage

### Creating Fun Categories
1. Log in to the app
2. Navigate to the Database page
3. Create categories with type "fun"
4. Suggested categories:
   - 🎬 Entertainment
   - 🍽️ Dining Out
   - ✈️ Travel
   - 🎨 Hobbies
   - 🎮 Gaming
   - 🎉 Events

### Using the Fun Tab
1. Navigate to Budget page
2. Click on the "Fun" tab
3. Click "Add Fun Item" to create a new item
4. Enter:
   - Item name (e.g., "Movie Night", "Restaurant Dinner")
   - Select a fun category from the dropdown
   - Enter the amount
5. Items auto-save after 800ms of inactivity
6. Click "Save Fun Items" to manually save all items
7. Fun spending is tracked as "shared" (owner_slot: shared)

## Database Schema
Fun items are stored as `budget_line_items` with:
- `owner_slot`: "shared"
- `category_id`: References a category with `type: "fun"`
- `budget_id`: Links to the monthly budget
- `name`: Item description
- `amount`: Spending amount

## Budget Calculation
The remaining budget is calculated as:
```
remaining = totalIncome 
          - sharedExpensesTotal 
          - personalExpensesTotal 
          - sharedSavingsTotal 
          - sharedFunTotal
```

## Notes
- Fun spending is always shared between users (owner_slot: "shared")
- If you need per-user fun spending, consider adding user1/user2 fun items in the future
- The tab follows the same pattern as other budget tabs (auto-save + manual save button)
