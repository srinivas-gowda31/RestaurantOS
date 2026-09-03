# RestaurantOS Database Schema

Complete database structure and relationships.

---

## Connection Details

**Provider:** Neon PostgreSQL (Serverless)
```
Host: ep-summer-field-b3ydxh82-pooler.c-4.ap-southeast-1.aws.neon.tech
Port: 5432
Database: neondb
SSL: Enabled
Connection Pool: 20 connections
```

---

## Entity Relationship Diagram

```
┌──────────────┐
│    users     │◄──────────┐
└──────────────┘           │
       │                   │
       ├─ orders           │
       ├─ invoices         │
       └─ activity_logs    │
                           │
       ┌──────────────────┘
       │
┌──────▼──────────┐
│    orders       │
└─────────────────┘
       │
       ├─ table_id ─────────┐
       │                    │
       │            ┌───────▼────────┐
       │            │    tables      │
       │            └────────────────┘
       │
       │
┌──────▼────────────┐
│ supplier_invoices │
└───────────────────┘
       │
       ├─ supplier_id ──────┐
       │                    │
       │            ┌───────▼──────────┐
       │            │   suppliers      │
       │            └──────────────────┘
       │
       └─ invoice_line_items
                    │
                    ├─ menu_item_id ──┐
                    │                 │
                    │        ┌────────▼───────┐
                    │        │   menu_items   │
                    │        └────────────────┘
                    │                 │
                    │                 ├─ category_id ──┐
                    │                 │                │
                    │                 │    ┌───────────▼──────────┐
                    │                 │    │ menu_categories      │
                    │                 │    └──────────────────────┘
                    │                 │
                    │                 └─ recipe_id ──┐
                    │                                │
                    │                    ┌───────────▼────────┐
                    │                    │   recipes          │
                    │                    └────────────────────┘
                    │                           │
                    │                           └─ ingredient_id ──┐
                    │                                              │
                    └──────────────────────────────────────────┐  │
                                                               │  │
                                                    ┌──────────▼──▼─────────┐
                                                    │   ingredients        │
                                                    └──────────────────────┘
```

---

## Core Tables

### users
User accounts and authentication.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL 
    CHECK (role IN ('owner', 'manager', 'chef', 'waiter', 'cashier', 'store_manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique identifier (UUID)
- `name`: User's full name
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `role`: User role for RBAC
- `is_active`: Account status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (email)

**Sample Data:**
```
owner@restaurantos.com - Owner - Ava Owner
manager@restaurantos.com - Manager - Manager User
chef@restaurantos.com - Chef - Chef User
waiter@restaurantos.com - Waiter - Waiter User
cashier@restaurantos.com - Cashier - Cashier User
```

---

### restaurants
Restaurant details (single-tenant for now).

```sql
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### tables
Restaurant seating tables.

```sql
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  location VARCHAR(100),
  status VARCHAR(50) DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Table identifier
- `table_number`: Table number (1-based)
- `capacity`: Seating capacity
- `location`: Section/area in restaurant
- `status`: Current table status

---

### menu_categories
Menu item groupings.

```sql
CREATE TABLE menu_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Categories:**
- Appetizers
- Main Courses
- Desserts
- Beverages
- Specials

---

### menu_items
Items served in the restaurant.

```sql
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  recipe_id INTEGER REFERENCES recipes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
```

**Columns:**
- `id`: Menu item ID
- `category_id`: Reference to menu_categories
- `name`: Item name
- `description`: Item description
- `cost_price`: Ingredient cost
- `selling_price`: Menu price
- `is_available`: Whether available to order
- `recipe_id`: Associated recipe

---

### recipes
Food preparation recipes.

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preparation_time INTEGER,
  serves_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Recipe ID
- `name`: Recipe name
- `description`: Instructions
- `preparation_time`: Minutes to prepare
- `serves_count`: Number of servings

---

### ingredients
Raw ingredients/supplies.

```sql
CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  unit VARCHAR(50) NOT NULL (kg, liters, pieces, boxes, etc.),
  reorder_level INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Ingredient ID
- `name`: Ingredient name
- `unit`: Measurement unit
- `reorder_level`: Minimum stock threshold

---

### recipe_ingredients
Mapping ingredients to recipes.

```sql
CREATE TABLE recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
```

---

### suppliers
Supplier master data.

```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  payment_terms VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Supplier ID
- `name`: Supplier company name
- `contact_person`: Primary contact
- `email`: Contact email
- `phone`: Contact phone
- `address`: Business address
- `payment_terms`: Credit/payment terms

---

### supplier_invoices
Uploaded and processed invoices (AI-extracted).

```sql
CREATE TABLE supplier_invoices (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  file_name VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000),
  cloudinary_url VARCHAR(1000),
  cloudinary_id VARCHAR(500),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  total_amount DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'reviewed')),
  raw_extraction JSONB,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX idx_invoices_status ON supplier_invoices(status);
CREATE INDEX idx_invoices_date ON supplier_invoices(invoice_date);
```

**Columns:**
- `id`: Invoice ID
- `supplier_id`: Reference to suppliers (can be NULL if unmatched)
- `file_name`: Original uploaded filename
- `file_path`: Server storage path
- `cloudinary_url`: CDN URL for image
- `cloudinary_id`: Cloudinary asset ID
- `invoice_number`: Extracted invoice number
- `invoice_date`: Extracted invoice date
- `total_amount`: Extracted total amount
- `status`: Processing status
- `raw_extraction`: JSON of extracted data (Tesseract/AI output)
- `processed_by`: User who processed it

---

### invoice_line_items
Line items extracted from invoices.

```sql
CREATE TABLE invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  description VARCHAR(500),
  quantity DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  line_total DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_line_items(invoice_id);
```

**Columns:**
- `id`: Line item ID
- `invoice_id`: Reference to supplier_invoices
- `description`: Item description
- `quantity`: Quantity ordered
- `unit_price`: Price per unit
- `line_total`: Total for line (quantity × unit_price)

---

### orders
Customer orders.

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL UNIQUE,
  table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled')),
  total_amount DECIMAL(12, 2),
  notes TEXT,
  ordered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

**Columns:**
- `id`: Order ID
- `order_number`: Unique order number (e.g., ORD-001)
- `table_id`: Assigned table
- `status`: Order status
- `total_amount`: Order total
- `notes`: Special instructions
- `ordered_by`: User who took order

---

### staff
Employee information.

```sql
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL
    CHECK (role IN ('owner', 'manager', 'chef', 'waiter', 'cashier', 'store_manager')),
  status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'on-leave')),
  hire_date DATE,
  salary DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_status ON staff(status);
```

**Columns:**
- `id`: Staff member ID
- `name`: Full name
- `email`: Work email
- `phone`: Work phone
- `role`: Job role
- `status`: Employment status
- `hire_date`: Start date
- `salary`: Monthly salary

---

### expense_categories
Categories for expense tracking.

```sql
CREATE TABLE expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Categories:**
- Food & Beverages
- Utilities
- Rent
- Maintenance
- Salaries
- Marketing

---

### expenses
Individual expense records.

```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  receipt_url VARCHAR(1000),
  expense_date DATE NOT NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
```

---

### activity_logs
Audit trail of all mutations.

```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL (CREATE, READ, UPDATE, DELETE),
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_table ON activity_logs(table_name);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at DESC);
```

**Columns:**
- `id`: Log entry ID
- `user_id`: User who performed action
- `action`: CRUD action
- `table_name`: Table affected
- `record_id`: Record identifier
- `changes`: JSON of what changed
- `ip_address`: User's IP address
- `created_at`: Timestamp

---

## Sample Queries

### Get Recent Invoices with Supplier Info
```sql
SELECT 
  si.id,
  si.invoice_number,
  si.invoice_date,
  si.total_amount,
  s.name as supplier_name,
  si.status
FROM supplier_invoices si
LEFT JOIN suppliers s ON s.id = si.supplier_id
ORDER BY si.created_at DESC
LIMIT 10;
```

### Invoice Total by Supplier (Last 30 Days)
```sql
SELECT 
  s.name as supplier,
  COUNT(si.id) as invoice_count,
  SUM(si.total_amount) as total_amount
FROM supplier_invoices si
LEFT JOIN suppliers s ON s.id = si.supplier_id
WHERE si.invoice_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.id, s.name
ORDER BY total_amount DESC;
```

### Get Staff by Role
```sql
SELECT name, email, role, status
FROM staff
WHERE role = 'chef' AND status = 'active'
ORDER BY name;
```

### Menu Items by Category with Profit Margin
```sql
SELECT 
  mc.name as category,
  mi.name as item,
  mi.cost_price,
  mi.selling_price,
  ROUND((mi.selling_price - mi.cost_price) / mi.selling_price * 100, 2) as margin_percent
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mi.is_available = true
ORDER BY mc.name, mi.name;
```

### Recent Orders with Table & Staff Info
```sql
SELECT 
  o.order_number,
  t.table_number,
  o.status,
  o.total_amount,
  u.name as ordered_by,
  o.created_at
FROM orders o
LEFT JOIN tables t ON t.id = o.table_id
LEFT JOIN users u ON u.id = o.ordered_by
ORDER BY o.created_at DESC
LIMIT 20;
```

---

## Database Maintenance

### Backup
```bash
pg_dump -h ep-summer-field-b3ydxh82-pooler.c-4.ap-southeast-1.aws.neon.tech \
  -U neondb_owner -d neondb > backup.sql
```

### Restore
```bash
psql -h localhost -U postgres -d restaurantos < backup.sql
```

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Performance Notes

- **Connection Pool:** 20 connections (suitable for small-to-medium traffic)
- **Indexes:** Created on foreign keys and frequently filtered columns
- **Query Optimization:** JSONB field for flexible invoice extraction data
- **Activity Logs:** May grow large; consider archiving old logs periodically

---

## Security

- All user passwords hashed with bcryptjs
- Role-based access enforced at application level
- Activity logs track all mutations for audit trail
- Foreign key constraints prevent orphaned records
- Cloudinary handles invoice images (not stored locally)
