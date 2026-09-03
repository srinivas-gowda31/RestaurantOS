-- ============================================================
-- RestaurantOS Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- AUTH / RBAC ----------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('owner','manager','chef','waiter','cashier','store_manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ---------- RESTAURANT OPERATIONS ----------
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning')),
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  prep_time_minutes INT DEFAULT 15,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  current_stock NUMERIC(12,3) DEFAULT 0,
  reorder_level NUMERIC(12,3) DEFAULT 5,
  cost_per_unit NUMERIC(10,2) DEFAULT 0,
  supplier_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  instructions TEXT,
  serves INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg'
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(120),
  phone VARCHAR(30),
  email VARCHAR(160),
  address TEXT,
  rating NUMERIC(2,1) DEFAULT 5.0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE ingredients
  ADD CONSTRAINT fk_ingredient_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(30) NOT NULL,
  phone VARCHAR(30),
  salary NUMERIC(10,2) DEFAULT 0,
  shift VARCHAR(20) DEFAULT 'morning',
  hired_at DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','preparing','served','paid','cancelled')),
  order_type VARCHAR(20) DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','delivery')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','served'))
);

-- ---------- INVENTORY MANAGEMENT ----------
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(60) UNIQUE,
  unit VARCHAR(20) DEFAULT 'unit',
  unit_price NUMERIC(10,2) DEFAULT 0,
  reorder_level NUMERIC(12,3) DEFAULT 10,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL,
  location VARCHAR(200),
  manager_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in','out')),
  quantity NUMERIC(12,3) NOT NULL,
  reference VARCHAR(150),
  moved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','ordered','received','cancelled')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  expected_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ---------- EXPENSE MANAGEMENT ----------
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  description VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  payment_method VARCHAR(30) DEFAULT 'cash',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  cloudinary_url TEXT,
  cloudinary_id VARCHAR(500),
  invoice_number VARCHAR(100),
  invoice_date DATE,
  total_amount NUMERIC(12,2),
  raw_extraction JSONB,
  status VARCHAR(20) DEFAULT 'processed' CHECK (status IN ('processing','processed','failed','reviewed')),
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  description VARCHAR(255),
  quantity NUMERIC(12,3),
  unit_price NUMERIC(10,2),
  line_total NUMERIC(12,2)
);

-- ---------- AUDIT / NOTIFICATIONS (bonus) ----------
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(100),
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(current_stock);
CREATE INDEX IF NOT EXISTS idx_products_reorder ON products(reorder_level);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
