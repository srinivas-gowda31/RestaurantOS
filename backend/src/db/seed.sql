-- Demo seed data. Password for all seeded users is: Password123!
-- (hash generated with bcrypt, 10 rounds)

INSERT INTO users (name, email, password_hash, role) VALUES
('Ava Owner',      'owner@restaurantos.com',   '$2a$10$iCNx4Y8LCVf80VubwU.Jv.TqfdhYZEvYEa0CtCmydaosepVMo.kIK', 'owner'),
('Mark Manager',   'manager@restaurantos.com', '$2a$10$iCNx4Y8LCVf80VubwU.Jv.TqfdhYZEvYEa0CtCmydaosepVMo.kIK', 'manager'),
('Carlos Chef',    'chef@restaurantos.com',    '$2a$10$iCNx4Y8LCVf80VubwU.Jv.TqfdhYZEvYEa0CtCmydaosepVMo.kIK', 'chef'),
('Wendy Waiter',   'waiter@restaurantos.com',  '$2a$10$iCNx4Y8LCVf80VubwU.Jv.TqfdhYZEvYEa0CtCmydaosepVMo.kIK', 'waiter'),
('Cathy Cashier',  'cashier@restaurantos.com', '$2a$10$iCNx4Y8LCVf80VubwU.Jv.TqfdhYZEvYEa0CtCmydaosepVMo.kIK', 'cashier')
ON CONFLICT (email) DO NOTHING;

INSERT INTO restaurant_tables (name, capacity, status) VALUES
('T1', 2, 'available'), ('T2', 4, 'occupied'), ('T3', 4, 'available'),
('T4', 6, 'reserved'), ('T5', 2, 'cleaning')
ON CONFLICT DO NOTHING;

INSERT INTO menu_categories (name, description) VALUES
('Starters', 'Appetizers and small plates'),
('Main Course', 'Hearty main dishes'),
('Beverages', 'Drinks and refreshments'),
('Desserts', 'Sweet treats')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, contact_person, phone, email, rating) VALUES
('Fresh Farms Co.', 'Ravi Kumar', '+91-9876543210', 'sales@freshfarms.com', 4.5),
('Ocean Seafood Suppliers', 'Priya Singh', '+91-9123456780', 'orders@oceanseafood.com', 4.2),
('Spice World Traders', 'Anil Mehta', '+91-9988776655', 'contact@spiceworld.com', 4.8)
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, unit, current_stock, reorder_level, cost_per_unit) VALUES
('Tomato', 'kg', 8.5, 10, 40),
('Chicken Breast', 'kg', 3.2, 15, 220),
('Basmati Rice', 'kg', 40, 20, 90),
('Paneer', 'kg', 2.1, 8, 320),
('Olive Oil', 'l', 6, 5, 550)
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories (name) VALUES
('Utilities'), ('Rent'), ('Ingredients'), ('Salaries'), ('Maintenance')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (name, description) VALUES
('Dry Goods', 'Non-perishable items'),
('Beverages Stock', 'Bottled/canned drinks'),
('Cleaning Supplies', 'Cleaning & hygiene products')
ON CONFLICT DO NOTHING;

INSERT INTO warehouses (name, location) VALUES
('Main Store', 'Ground Floor'),
('Cold Storage', 'Basement')
ON CONFLICT DO NOTHING;
