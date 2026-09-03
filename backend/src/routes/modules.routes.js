const express = require('express');
const { buildCrudRouter } = require('../utils/crudFactory');

const router = express.Router();

const ALL = ['owner', 'manager', 'chef', 'waiter', 'cashier', 'store_manager'];
const MGMT = ['owner', 'manager'];
const OPS = ['owner', 'manager', 'chef', 'waiter'];

// ---------------- Restaurant Operations ----------------
router.use('/tables', buildCrudRouter({
  table: 'restaurant_tables',
  columns: ['name', 'capacity', 'status', 'location'],
  searchable: ['name', 'location'],
  orderBy: 'name ASC',
  permissions: { read: ALL, create: MGMT, update: OPS.concat(['cashier']), delete: MGMT },
}));

router.use('/menu-categories', buildCrudRouter({
  table: 'menu_categories',
  columns: ['name', 'description'],
  searchable: ['name'],
  orderBy: 'name ASC',
  permissions: { read: ALL, create: MGMT, update: MGMT, delete: MGMT },
}));

router.use('/menu-items', buildCrudRouter({
  table: 'menu_items',
  columns: ['category_id', 'name', 'description', 'price', 'cost_price', 'prep_time_minutes', 'is_available', 'image_url'],
  searchable: ['name', 'description'],
  orderBy: 'created_at DESC',
  joins: 'LEFT JOIN menu_categories mc ON mc.id = menu_items.category_id',
  selectExtra: 'mc.name as category_name',
  permissions: { read: ALL, create: MGMT.concat(['chef']), update: MGMT.concat(['chef']), delete: MGMT },
}));

router.use('/recipes', buildCrudRouter({
  table: 'recipes',
  columns: ['menu_item_id', 'name', 'instructions', 'serves'],
  searchable: ['name'],
  orderBy: 'created_at DESC',
  permissions: { read: ALL, create: MGMT.concat(['chef']), update: MGMT.concat(['chef']), delete: MGMT.concat(['chef']) },
}));

router.use('/recipe-ingredients', buildCrudRouter({
  table: 'recipe_ingredients',
  columns: ['recipe_id', 'ingredient_id', 'quantity', 'unit'],
  orderBy: 'id ASC',
  permissions: { read: ALL, create: MGMT.concat(['chef']), update: MGMT.concat(['chef']), delete: MGMT.concat(['chef']) },
}));

router.use('/ingredients', buildCrudRouter({
  table: 'ingredients',
  columns: ['name', 'unit', 'current_stock', 'reorder_level', 'cost_per_unit', 'supplier_id'],
  searchable: ['name'],
  orderBy: 'name ASC',
  joins: 'LEFT JOIN suppliers s ON s.id = ingredients.supplier_id',
  selectExtra: 's.name as supplier_name',
  permissions: { read: ALL, create: MGMT.concat(['chef', 'store_manager']), update: MGMT.concat(['chef', 'store_manager']), delete: MGMT },
}));

router.use('/suppliers', buildCrudRouter({
  table: 'suppliers',
  columns: ['name', 'contact_person', 'phone', 'email', 'address', 'rating'],
  searchable: ['name', 'contact_person', 'email'],
  orderBy: 'name ASC',
  permissions: { read: ALL, create: MGMT.concat(['store_manager']), update: MGMT.concat(['store_manager']), delete: MGMT },
}));

router.use('/staff', buildCrudRouter({
  table: 'staff',
  columns: ['user_id', 'full_name', 'role', 'phone', 'salary', 'shift', 'hired_at', 'is_active'],
  searchable: ['full_name', 'role'],
  orderBy: 'full_name ASC',
  permissions: { read: MGMT, create: MGMT, update: MGMT, delete: MGMT },
}));

router.use('/orders', buildCrudRouter({
  table: 'orders',
  columns: ['table_id', 'waiter_id', 'status', 'order_type', 'total_amount'],
  orderBy: 'created_at DESC',
  joins: 'LEFT JOIN restaurant_tables rt ON rt.id = orders.table_id',
  selectExtra: 'rt.name as table_name',
  permissions: { read: ALL, create: OPS.concat(['cashier']), update: OPS.concat(['cashier']), delete: MGMT },
}));

router.use('/order-items', buildCrudRouter({
  table: 'order_items',
  columns: ['order_id', 'menu_item_id', 'quantity', 'unit_price', 'notes', 'status'],
  orderBy: 'id ASC',
  permissions: { read: ALL, create: OPS.concat(['cashier']), update: OPS.concat(['cashier']), delete: MGMT.concat(['waiter']) },
}));

// ---------------- Inventory Management ----------------
router.use('/product-categories', buildCrudRouter({
  table: 'product_categories',
  columns: ['name', 'description'],
  searchable: ['name'],
  orderBy: 'name ASC',
  permissions: { read: ALL, create: MGMT.concat(['store_manager']), update: MGMT.concat(['store_manager']), delete: MGMT },
}));

router.use('/products', buildCrudRouter({
  table: 'products',
  columns: ['category_id', 'name', 'sku', 'unit', 'unit_price', 'reorder_level'],
  searchable: ['name', 'sku'],
  orderBy: 'name ASC',
  joins: 'LEFT JOIN product_categories pc ON pc.id = products.category_id',
  selectExtra: 'pc.name as category_name',
  permissions: { read: ALL, create: MGMT.concat(['store_manager']), update: MGMT.concat(['store_manager']), delete: MGMT },
}));

router.use('/warehouses', buildCrudRouter({
  table: 'warehouses',
  columns: ['name', 'location', 'manager_id'],
  searchable: ['name', 'location'],
  orderBy: 'name ASC',
  permissions: { read: ALL, create: MGMT, update: MGMT, delete: MGMT },
}));

router.use('/stock-movements', buildCrudRouter({
  table: 'stock_movements',
  columns: ['product_id', 'warehouse_id', 'movement_type', 'quantity', 'reference', 'moved_by'],
  orderBy: 'created_at DESC',
  joins: 'LEFT JOIN products p ON p.id = stock_movements.product_id LEFT JOIN warehouses w ON w.id = stock_movements.warehouse_id',
  selectExtra: 'p.name as product_name, w.name as warehouse_name',
  permissions: { read: ALL, create: MGMT.concat(['store_manager']), update: MGMT.concat(['store_manager']), delete: MGMT },
}));

router.use('/purchase-orders', buildCrudRouter({
  table: 'purchase_orders',
  columns: ['supplier_id', 'status', 'total_amount', 'expected_date'],
  orderBy: 'created_at DESC',
  joins: 'LEFT JOIN suppliers s ON s.id = purchase_orders.supplier_id',
  selectExtra: 's.name as supplier_name',
  permissions: { read: ALL, create: MGMT.concat(['store_manager']), update: MGMT.concat(['store_manager']), delete: MGMT },
}));

router.use('/purchase-order-items', buildCrudRouter({
  table: 'purchase_order_items',
  columns: ['purchase_order_id', 'product_id', 'quantity', 'unit_price'],
  orderBy: 'id ASC',
  permissions: { read: ALL, create: MGMT.concat(['store_manager']), update: MGMT.concat(['store_manager']), delete: MGMT },
}));

// ---------------- Expense Management ----------------
router.use('/expense-categories', buildCrudRouter({
  table: 'expense_categories',
  columns: ['name'],
  searchable: ['name'],
  orderBy: 'name ASC',
  permissions: { read: ALL, create: MGMT, update: MGMT, delete: MGMT },
}));

router.use('/expenses', buildCrudRouter({
  table: 'expenses',
  columns: ['category_id', 'supplier_id', 'description', 'amount', 'expense_date', 'payment_method'],
  searchable: ['description'],
  orderBy: 'expense_date DESC',
  joins: 'LEFT JOIN expense_categories ec ON ec.id = expenses.category_id LEFT JOIN suppliers s ON s.id = expenses.supplier_id',
  selectExtra: 'ec.name as category_name, s.name as supplier_name',
  permissions: { read: MGMT.concat(['cashier']), create: MGMT.concat(['cashier']), update: MGMT, delete: MGMT },
}));

// ---------------- Notifications / Audit (bonus) ----------------
router.use('/notifications', buildCrudRouter({
  table: 'notifications',
  columns: ['user_id', 'title', 'message', 'is_read'],
  orderBy: 'created_at DESC',
  permissions: { read: ALL, create: MGMT, update: ALL, delete: MGMT },
}));

router.use('/activity-logs', buildCrudRouter({
  table: 'activity_logs',
  columns: ['user_id', 'action', 'entity', 'entity_id', 'metadata'],
  orderBy: 'created_at DESC',
  permissions: { read: MGMT, create: ALL, update: MGMT, delete: MGMT },
}));

module.exports = router;
