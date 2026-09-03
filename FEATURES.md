# RestaurantOS Features - Complete Walkthrough

Step-by-step guide to testing and using all features.

---

## Quick Start

1. **Visit:** https://restaurantos-frontend.onrender.com
2. **Login with:**
   - Email: `owner@restaurantos.com`
   - Password: `Password123!`
3. **See Dashboard** with KPIs and charts

---

## Authentication & Authorization

### 1. Login Flow ✅
**Steps:**
1. Go to login page
2. Enter credentials:
   - Email: `owner@restaurantos.com`
   - Password: `Password123!`
3. Click "Sign In"
4. Should redirect to dashboard

**Expected Result:** Login successful, JWT token stored in localStorage, user details displayed

**What's Happening Behind:**
- Frontend POST to `/api/auth/login`
- Backend validates credentials via bcryptjs
- Returns JWT token + user object
- Frontend stores token, adds to all future requests

---

### 2. Role-Based Access Control ✅
**Test Different Roles:**

#### Owner Account
- Email: `owner@restaurantos.com`
- Access: **Full** - All features available

#### Manager Account
- Email: `manager@restaurantos.com`
- Access: Operational features, RBAC restrictions

#### Chef Account
- Email: `chef@restaurantos.com`
- Access: View orders, recipes, ingredients (limited editing)

#### Waiter Account
- Email: `waiter@restaurantos.com`
- Access: Tables, orders (limited)

#### Cashier Account
- Email: `cashier@restaurantos.com`
- Access: Payment, sales (limited)

**Test RBAC Restrictions:**
```bash
# Login as Waiter
# Try to access "Menu Management"
# Should see: "Insufficient Permissions" or greyed out menu

# As Owner, can access everything
```

---

## Dashboard & Analytics

### 3. Business Metrics ✅
**What You'll See:**
- 30-Day Revenue: ₹15,000
- 30-Day Profit: ₹15,000 (100% margin)
- Active Orders: 0 (demo data)
- Low Stock Items: 6 inventory warnings

**Charts:**
- Sales Overview (14-day line chart)
- Revenue by Category (bar chart)
- Menu Performance (pie chart)

**Real-time Updates:**
- Metrics update based on actual database data
- Charts render with Recharts library

---

## Menu Management

### 4. Menu Categories 🏷️
**Steps:**
1. Click sidebar → "Menu Categories"
2. See list: Appetizers, Main Courses, Desserts, Beverages
3. Click "Add Category"
4. Fill form:
   - Name: "Specials"
   - Description: "Today's special dishes"
5. Click "Save"
6. New category appears in list

**What You Can Do:**
- ✅ View all categories
- ✅ Add new category
- ✅ Edit category name/description
- ✅ Delete category

**Database:** `menu_categories` table

---

### 5. Menu Items 🍽️
**Steps:**
1. Click sidebar → "Menu Items"
2. See current menu items with prices
3. Click "Add Item"
4. Fill form:
   - Name: "Biryani Special"
   - Category: "Main Courses"
   - Selling Price: ₹500
   - Cost Price: ₹250
   - Description: "Fragrant basmati rice"
5. Click "Save"

**What You Can Do:**
- ✅ View menu items with cost/selling prices
- ✅ Add new menu items
- ✅ Edit pricing & availability
- ✅ Delete items
- ✅ Search items by name

**Profit Tracking:**
- Each item tracks cost_price and selling_price
- Margin calculated as: (selling - cost) / selling × 100%

---

## Table Management

### 6. Restaurant Tables 🪑
**Steps:**
1. Click sidebar → "Table Management"
2. See all restaurant tables (1-20 in demo)
3. Each table shows:
   - Table Number
   - Capacity (seating)
   - Location (section)
   - Current Status
4. Click "Add Table"
5. Fill:
   - Table Number: 21
   - Capacity: 4
   - Location: "Patio"
6. Save

**Table Statuses:**
- ✅ Available (empty, ready to seat)
- ⚠️ Occupied (customers dining)
- 🔒 Reserved (booking)
- 🔧 Maintenance (not available)

**What You Can Do:**
- ✅ View all tables with capacity
- ✅ Add new tables
- ✅ Update table status
- ✅ Delete tables
- ✅ Search by table number/location

---

## Order Management

### 7. Take Orders 📋
**Steps:**
1. Click sidebar → "Order Management"
2. See recent orders with:
   - Order Number (ORD-001, ORD-002, etc.)
   - Table Number
   - Status
   - Total Amount
   - Date/Time
3. Click "Create Order"
4. Fill:
   - Select Table: "Table 5"
   - Status: "Pending"
   - Total Amount: ₹1500
   - Notes: "No onions, extra salt"
5. Save

**Order Lifecycle:**
```
Pending → Confirmed → Preparing → Ready → Delivered → Completed
```

**What You Can Do:**
- ✅ View all orders (sorted by newest)
- ✅ Create new orders
- ✅ Update order status
- ✅ Add special instructions
- ✅ Track total amount
- ✅ Close/Complete orders

---

## Staff Management

### 8. Manage Team 👥
**Steps:**
1. Click sidebar → "Staff Management"
2. See all staff members with:
   - Name
   - Email
   - Role (Chef, Waiter, etc.)
   - Status (Active/Inactive/On-leave)
3. Click "Add Staff"
4. Fill:
   - Name: "Priya Chef"
   - Email: "priya@restaurant.com"
   - Role: "Chef"
   - Phone: "9876543210"
   - Status: "Active"
5. Save

**What You Can Do:**
- ✅ View all staff with roles
- ✅ Add new team members
- ✅ Update roles & status
- ✅ Delete staff records
- ✅ Search by name/email
- ✅ Filter by role or status

---

## Supplier & Inventory Management

### 9. Manage Suppliers 🏭
**Steps:**
1. Click sidebar → "Supplier Management"
2. See suppliers: ABC Suppliers, XYZ Foods, etc.
3. Click "Add Supplier"
4. Fill:
   - Company Name: "Fresh Farms"
   - Contact Person: "Mr. Patel"
   - Email: "contact@freshfarms.com"
   - Phone: "9876543212"
   - Address: "Farm Road, State"
5. Save

**What You Can Do:**
- ✅ View supplier contact info
- ✅ Add new suppliers
- ✅ Edit supplier details
- ✅ Track payment terms
- ✅ Delete suppliers
- ✅ Search suppliers

---

### 10. Manage Ingredients 🥬
**Steps:**
1. Click sidebar → "Ingredient Management"
2. See ingredients: Flour, Salt, Oil, Tomatoes, etc.
3. Each shows:
   - Ingredient name
   - Unit (kg, liters, pieces)
   - Reorder level
4. Click "Add Ingredient"
5. Fill:
   - Name: "Paneer"
   - Unit: "kg"
   - Reorder Level: 50
6. Save

**What You Can Do:**
- ✅ View all ingredients & units
- ✅ Add new ingredients
- ✅ Set reorder thresholds
- ✅ Track stock levels
- ✅ Delete ingredients

---

## AI-Powered Features

### 11. AI Invoice Processing 🤖📄

**The Complete Invoice Workflow:**

#### Step 1: Upload Invoice
1. Click sidebar → "AI Invoice Processing"
2. Click "Choose Files" or drag-drop invoice
3. Supported formats: PDF, JPG, PNG, WEBP
4. File gets uploaded to backend

#### Step 2: AI Extraction
**What Happens Automatically:**
- Tesseract.js extracts text from image
- Text parsed to structured JSON:
  ```json
  {
    "supplier_name": "ABC Suppliers",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-09-01",
    "total_amount": 5000,
    "line_items": [
      {
        "description": "Tomatoes (1kg)",
        "quantity": 10,
        "unit_price": 50,
        "line_total": 500
      }
    ],
    "confidence": 0.95
  }
  ```
- Image uploaded to Cloudinary (CDN)
- Data stored in PostgreSQL

#### Step 3: View Processed Invoice
1. Invoice appears in list below
2. Click "View" (eye icon)
3. See:
   - Extracted supplier name
   - Invoice number & date
   - Total amount
   - Confidence score (%)
   - Line-by-line items
   - Original image preview

#### Step 4: Export Expense Register
1. Click "Export Expense Register (Excel)"
2. Downloads `expense-register.xlsx` with:
   - **Sheet 1: Summary**
     - Invoice #, Date, Supplier
     - Total Amount, Status
     - Grand Total
   - **Sheet 2: Line Items**
     - Description, Quantity
     - Unit Price, Line Total

#### Step 5: Delete Invoice
1. Click trash icon next to invoice
2. Confirm deletion
3. Removed from database & Cloudinary

**Example Invoice Upload:**
```
File: invoice.pdf
↓
Tesseract extracts: "ABC Suppliers, INV-2024-001, Total: ₹5000"
↓
Uploaded to Cloudinary: res.cloudinary.com/vyehgmyp/image/upload/...
↓
Stored in DB:
  - supplier_invoices: Main record
  - invoice_line_items: 5 line items
↓
Available for: View, Edit, Export
```

---

### 12. AI Insights Dashboard 🧠💡

**5 AI Features (with Rule-Based Fallback):**

#### Feature 1: Predict Stock Shortages
1. Click sidebar → "AI Insights"
2. See "Predict Shortages" card
3. Click "Analyze"
4. Returns:
   ```
   Tomatoes: Running out in 3 days
   Flour: Running out in 7 days
   ```
5. Use this to reorder before running out

**Behind the Scenes:**
- Calculates daily usage rate
- Divides current stock by usage
- Shows "days until out"
- Recommends "Order immediately"

#### Feature 2: Reorder Recommendations
1. Same page, "Reorder Recommendations" card
2. Click "Get Recommendations"
3. Returns:
   ```
   Flour: Current 100kg, Reorder 500kg from Supplier A
   Oil: Current 50L, Reorder 300L from Supplier B
   ```

**How It Works:**
- Looks at 30-day usage
- Recommends qty to last 30 days
- Identifies best supplier

#### Feature 3: Suggest Menu Pricing
1. Select a menu item from dropdown
2. Click "Suggest Price"
3. Returns:
   ```
   Pasta Carbonara
   Current Price: ₹350
   Suggested Price: ₹420
   Reasoning: Based on ingredient costs...
   ```

**Pricing Logic:**
- Analyzes ingredient costs
- Considers market demand
- Calculates optimal margin

#### Feature 4: Estimate Prep Time
1. Select order from dropdown
2. Click "Estimate Time"
3. Returns:
   ```
   Order ORD-001
   Estimated Prep: 25 minutes
   Items: Carbonara (20m) + Salad (5m)
   ```

#### Feature 5: Analyze Waste
1. Click "Waste Analysis"
2. Returns:
   ```
   Tomatoes: 8.5% waste → Review storage
   Bread: 2% waste → Good management
   Oil: 0.5% waste → Excellent
   ```

---

## Search & Filtering

### 13. Advanced Search 🔍
**Available on All Module Pages:**

**Example - Search Menu Items:**
1. Go to "Menu Items"
2. In search box, type: "Pasta"
3. Filters to show: Pasta Carbonara, Pasta Alfredo
4. Click on item to view details

**Search Features:**
- ✅ Real-time search (as you type)
- ✅ Case-insensitive
- ✅ Searches multiple fields:
  - Menu items: name, description, category
  - Staff: name, email, role
  - Suppliers: company, contact, location

---

## Activity Logging & Audit Trail

### 14. Track Changes 📝
**What's Logged:**
- Every CREATE, READ, UPDATE, DELETE action
- Who made the change (user name)
- When (timestamp)
- What changed (JSON diff)
- Table affected

**View Logs:**
```bash
GET /api/activity-logs
Response shows all recent activities
```

**Example Entry:**
```
User: owner@restaurantos.com
Action: CREATE
Table: menu_items
Record: "Pasta Carbonara" created
Timestamp: 2024-09-03 14:30:00
```

---

## Data Export

### 15. Excel Export 📊
**Available on Invoice Page:**
1. Click "Export Expense Register (Excel)"
2. Downloads file with:
   - Expense summary by supplier
   - Line-by-line invoice items
   - Grand totals
   - Professional formatting

**File Contents:**
- Column headers in bold
- Currency formatted (₹)
- Grand total row highlighted

---

## Pagination & Performance

### 16. Handle Large Datasets 📄
**All List Pages Support:**
- Page navigation (Previous/Next)
- Limit options (10, 20, 50 items per page)
- Total count displayed
- Fast loading with database pagination

**Example:**
```
Showing 1-10 of 45 Menu Items
[Previous] [1] [2] [3] [4] [5] [Next]
```

---

## Testing Checklist

### Authentication ✅
- [ ] Login with owner account
- [ ] Login with different roles
- [ ] See JWT token in localStorage
- [ ] Try accessing protected route while logged out
- [ ] Should redirect to login

### RBAC ✅
- [ ] Login as Chef, see limited menu options
- [ ] Login as Owner, see all options
- [ ] Try action beyond role permissions
- [ ] Should get "Insufficient Permissions"

### CRUD Operations ✅
- [ ] Add new menu item
- [ ] Edit menu item price
- [ ] Delete menu item
- [ ] Verify database updated

### Invoices ✅
- [ ] Upload sample invoice (PDF or image)
- [ ] See extracted data
- [ ] Verify Cloudinary image displayed
- [ ] Export Excel file
- [ ] Delete invoice

### Search & Filter ✅
- [ ] Search for menu item by name
- [ ] Search staff by email
- [ ] Filter orders by status
- [ ] Pagination works (multiple pages)

### AI Features ✅
- [ ] Run "Predict Shortages"
- [ ] Run "Reorder Recommendations"
- [ ] Suggest menu pricing
- [ ] Estimate prep time
- [ ] Analyze waste

### Performance ✅
- [ ] Dashboard loads in < 2 seconds
- [ ] Invoice upload responds immediately
- [ ] Export Excel doesn't freeze UI
- [ ] 100+ records paginate smoothly

---

## Troubleshooting

### Login Not Working
**Issue:** "Route not found" or 404 error
**Solution:**
1. Check backend is running: https://restaurantos-backend-wg6g.onrender.com/api/health
2. Verify credentials: owner@restaurantos.com / Password123!
3. Check browser console for network errors

### Invoice Upload Failing
**Issue:** Upload button not responding
**Solution:**
1. File must be PDF/JPG/PNG (< 15MB)
2. Backend must be accessible
3. Cloudinary credentials must be set

### Permission Denied
**Issue:** "Insufficient Permissions"
**Solution:**
1. Check which role you're logged in as
2. Switch to Owner for full access
3. Check backend RBAC configuration

### Slow Dashboard
**Issue:** Charts not loading quickly
**Solution:**
1. Check database connection to Neon
2. Verify pagination query is optimized
3. Check browser developer tools for network time

---

## Performance Metrics (Live Deployment)

| Operation | Expected Time |
|-----------|---------------|
| Login | < 1 second |
| Dashboard Load | 1-2 seconds |
| Invoice Upload | 2-5 seconds |
| Invoice Export | 3-8 seconds |
| Menu Search | < 500ms |
| Add New Item | < 1 second |
| AI Predictions | 2-5 seconds |

---

## Demo Data

**Pre-loaded in Database:**

**Users:**
- 5 demo accounts (all password: Password123!)
- 1 admin/owner account

**Menu:**
- 3 categories (Appetizers, Main, Desserts)
- 20 menu items with prices
- 3 recipes with ingredients

**Suppliers:**
- 3 suppliers
- 12 sample ingredients

**Orders:**
- 0 current orders (demo restaurant closed today!)
- Customers can create new orders

**Tables:**
- 20 tables total
- Capacity: 2-8 persons per table

**Invoices:**
- Sample invoices available for testing upload
- Download test invoice: `/assets/sample-invoice.pdf`

---

## Next Steps

1. **Explore all features** using demo accounts
2. **Test RBAC** by switching roles
3. **Upload invoices** to test AI extraction
4. **Export Excel** to verify data format
5. **Check database** to understand schema
6. **Review code** on GitHub for implementation details
