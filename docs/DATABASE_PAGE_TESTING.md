# Database Page Testing Guide

## Testing the Database Page Integration

### Current Status
✅ Backend updated to include `budget_line_items` collection  
✅ Frontend running on http://localhost:3001  
✅ Backend running on http://localhost:8000  
✅ Database page improved to better display dates

---

## Testing Steps

### 1. Login or Register
1. Open http://localhost:3001/login
2. Either:
   - **Login** with existing credentials
   - **Register** a new account (recommended for testing)

**Test Account (if exists)**:
- Email: test@example.com
- Password: your_test_password

### 2. Navigate to Database Page
1. After login, navigate to http://localhost:3001/database
2. You should see the Database page with collection tabs

### 3. Verify Collections Displayed
Expected collections:
- ✅ `transactions` - Transaction records
- ✅ `categories` - Budget categories  
- ✅ `budgets` - Monthly budgets
- ✅ `budget_line_items` - Budget line items (NEW!)
- ✅ `goals` - Financial goals
- ✅ `users` - User accounts

### 4. Test Each Collection

#### Categories Collection
1. Click on "categories" tab
2. Should display columns: `_id`, `user_id`, `name`, `type`, `icon`, `color`, `is_active`, `created_at`, `updated_at`
3. Data should be filtered to show only YOUR categories

#### Budgets Collection
1. Click on "budgets" tab
2. Should display columns: `_id`, `user_id`, `month`, `created_at`, `updated_at`
3. Data should show your budgets sorted by month

#### Budget Line Items Collection (NEW!)
1. Click on "budget_line_items" tab
2. Should display columns:
   - `_id` - Line item ID
   - `user_id` - Your user ID
   - `budget_id` - Budget reference (as string)
   - `name` - Line item name (e.g., "Rent")
   - `category_id` - Category reference (as string)
   - `amount` - Budget amount
   - `owner_slot` - "user1", "user2", or "shared"
   - `created_at` - Creation timestamp
   - `updated_at` - Update timestamp
3. Data should be filtered to YOUR line items only

### 5. Test Refresh Button
1. Click the "Refresh" button (top right)
2. Should see spinning icon
3. Data should reload

### 6. Test Record Count
1. Check the footer of the table
2. Should show: "Total records: X" and "Showing: Y of X"
3. Numbers should match the data displayed

---

## What Was Fixed

### Backend Changes
1. **Updated `backend/app/routes/database.py`**:
   - Added `budget_line_items` to user-specific collections list
   - Added ObjectId → string conversion for `budget_id` and `category_id`
   - This ensures budget line items are filtered by user and display correctly

### Frontend Changes
1. **Updated `frontend/app/database/page.tsx`**:
   - Improved date parsing for ISO date strings
   - Better JSON formatting for nested objects
   - Dates now display in locale format

---

## Expected Behavior

### User Isolation
- ✅ You should ONLY see YOUR own data
- ✅ Other users' data should be hidden
- ✅ User ID should match across all collections

### Data Display
- ✅ ObjectIds display as strings (readable)
- ✅ Dates display in locale format (e.g., "1/22/2026, 10:30:00 AM")
- ✅ Booleans display as ✓ or ✗
- ✅ Numbers display with thousand separators
- ✅ Null/undefined display as "-"

### Collections with No Data
- ✅ Should display "No data found in this collection"
- ✅ No error messages (unless there's an actual error)

---

## Creating Test Data

If collections are empty, you can create test data:

### Create Categories (via API)
```bash
# Get your token from browser localStorage
TOKEN="your_jwt_token_here"

# Create a category
curl -X POST "http://localhost:8000/api/categories/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Housing",
    "type": "personal-expenses",
    "icon": "home",
    "color": "#FF5733"
  }'
```

### Create Budget
```bash
# Create a budget for current month
curl -X POST "http://localhost:8000/api/budgets/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": "2026-01"
  }'
```

### Create Budget Line Item
```bash
# First get category_id and budget_id from database page
# Then create line item
curl -X POST "http://localhost:8000/api/budget-line-items/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budget_id": "YOUR_BUDGET_ID",
    "name": "Rent",
    "category_id": "YOUR_CATEGORY_ID",
    "amount": 1500.0,
    "owner_slot": "user1"
  }'
```

---

## Troubleshooting

### Issue: "Could not validate credentials"
- **Solution**: Make sure you're logged in. Token should be in localStorage.
- Check: Open browser DevTools → Application → Local Storage → Check for "token"

### Issue: Collections not showing
- **Solution**: 
  1. Check backend logs: `docker compose logs backend`
  2. Verify backend is running: `docker compose ps`
  3. Try refreshing the page

### Issue: Data not loading
- **Solution**:
  1. Open browser DevTools → Network tab
  2. Click refresh on database page
  3. Check for failed requests
  4. Verify token is being sent in headers

### Issue: Budget line items not appearing
- **Solution**:
  1. Create test data using the API calls above
  2. Make sure you're using YOUR user's category_id and budget_id
  3. Check backend logs for errors

### Issue: Dates showing as strings
- **Solution**: This is now fixed! Dates should auto-parse and display in locale format.

---

## Verification Checklist

- [ ] Can login successfully
- [ ] Database page loads without errors
- [ ] All collection tabs are visible
- [ ] Can switch between collections
- [ ] Data loads for each collection
- [ ] Data is filtered by user_id
- [ ] Dates display correctly
- [ ] ObjectIds display as strings
- [ ] Refresh button works
- [ ] Record count is accurate
- [ ] `budget_line_items` collection shows (if data exists)
- [ ] No console errors in browser DevTools

---

## Success Indicators

✅ **All collections visible**: 6+ collections in tabs  
✅ **User isolation working**: Only your data displays  
✅ **Budget line items integrated**: New collection appears and works  
✅ **Data formatted correctly**: Dates, IDs, and values display properly  
✅ **No errors**: Clean operation with no console/network errors

---

## Next Steps

Once database page is verified:
1. ✅ Test categories page integration
2. ✅ Test budgets page integration  
3. ✅ Build budget line items management UI
4. ✅ Add budget detail page with line items
5. ✅ Build budget planning interface

---

**Testing Date**: January 22, 2026  
**Frontend URL**: http://localhost:3001  
**Backend URL**: http://localhost:8000  
**Status**: Ready for Testing
