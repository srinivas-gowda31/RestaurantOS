// Each module config drives: sidebar nav, list table columns, and the create/edit form.
// field.type: text | number | textarea | select | foreignKey | date | checkbox
// field.fk: { endpoint, labelKey } for foreignKey fields (populates a <select> from another module's API)

export const moduleGroups = [
  {
    group: 'Restaurant Operations',
    modules: [
      {
        key: 'tables', label: 'Table Management', endpoint: '/tables', icon: 'Table',
        columns: [{ key: 'name', label: 'Name' }, { key: 'capacity', label: 'Capacity' }, { key: 'status', label: 'Status', badge: true }, { key: 'location', label: 'Location' }],
        fields: [
          { key: 'name', label: 'Table Name', type: 'text', required: true },
          { key: 'capacity', label: 'Capacity', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['available', 'occupied', 'reserved', 'cleaning'] },
          { key: 'location', label: 'Location', type: 'text' },
        ],
      },
      {
        key: 'menu-categories', label: 'Menu Categories', endpoint: '/menu-categories', icon: 'Layers',
        columns: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'menu-items', label: 'Menu Management', endpoint: '/menu-items', icon: 'UtensilsCrossed',
        columns: [{ key: 'name', label: 'Name' }, { key: 'category_name', label: 'Category' }, { key: 'price', label: 'Price', money: true }, { key: 'prep_time_minutes', label: 'Prep (min)' }, { key: 'is_available', label: 'Available', bool: true }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'category_id', label: 'Category', type: 'foreignKey', fk: { endpoint: '/menu-categories', labelKey: 'name' } },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'price', label: 'Price', type: 'number', step: '0.01', required: true },
          { key: 'cost_price', label: 'Cost Price', type: 'number', step: '0.01' },
          { key: 'prep_time_minutes', label: 'Prep Time (minutes)', type: 'number' },
          { key: 'is_available', label: 'Available', type: 'checkbox' },
          { key: 'image_url', label: 'Image URL', type: 'text' },
        ],
      },
      {
        key: 'recipes', label: 'Recipe Management', endpoint: '/recipes', icon: 'BookOpen',
        columns: [{ key: 'name', label: 'Name' }, { key: 'serves', label: 'Serves' }],
        fields: [
          { key: 'name', label: 'Recipe Name', type: 'text', required: true },
          { key: 'menu_item_id', label: 'Menu Item', type: 'foreignKey', fk: { endpoint: '/menu-items', labelKey: 'name' } },
          { key: 'serves', label: 'Serves', type: 'number' },
          { key: 'instructions', label: 'Instructions', type: 'textarea' },
        ],
      },
      {
        key: 'ingredients', label: 'Ingredient Management', endpoint: '/ingredients', icon: 'Carrot',
        columns: [{ key: 'name', label: 'Name' }, { key: 'current_stock', label: 'Stock' }, { key: 'unit', label: 'Unit' }, { key: 'reorder_level', label: 'Reorder Level' }, { key: 'supplier_name', label: 'Supplier' }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'unit', label: 'Unit', type: 'select', options: ['kg', 'g', 'l', 'ml', 'unit'] },
          { key: 'current_stock', label: 'Current Stock', type: 'number', step: '0.01' },
          { key: 'reorder_level', label: 'Reorder Level', type: 'number', step: '0.01' },
          { key: 'cost_per_unit', label: 'Cost / Unit', type: 'number', step: '0.01' },
          { key: 'supplier_id', label: 'Supplier', type: 'foreignKey', fk: { endpoint: '/suppliers', labelKey: 'name' } },
        ],
      },
      {
        key: 'suppliers', label: 'Supplier Management', endpoint: '/suppliers', icon: 'Truck',
        columns: [{ key: 'name', label: 'Name' }, { key: 'contact_person', label: 'Contact' }, { key: 'phone', label: 'Phone' }, { key: 'rating', label: 'Rating' }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'contact_person', label: 'Contact Person', type: 'text' },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'email', label: 'Email', type: 'text' },
          { key: 'address', label: 'Address', type: 'textarea' },
          { key: 'rating', label: 'Rating (1-5)', type: 'number', step: '0.1' },
        ],
      },
      {
        key: 'staff', label: 'Staff Management', endpoint: '/staff', icon: 'Users', roles: ['owner', 'manager'],
        columns: [{ key: 'full_name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'shift', label: 'Shift' }, { key: 'salary', label: 'Salary', money: true }, { key: 'is_active', label: 'Active', bool: true }],
        fields: [
          { key: 'full_name', label: 'Full Name', type: 'text', required: true },
          { key: 'role', label: 'Role', type: 'select', options: ['owner', 'manager', 'chef', 'waiter', 'cashier', 'store_manager'], required: true },
          { key: 'phone', label: 'Phone', type: 'text' },
          { key: 'salary', label: 'Salary', type: 'number', step: '0.01' },
          { key: 'shift', label: 'Shift', type: 'select', options: ['morning', 'evening', 'night'] },
          { key: 'hired_at', label: 'Hired On', type: 'date' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ],
      },
      {
        key: 'orders', label: 'Order Management', endpoint: '/orders', icon: 'ClipboardList',
        columns: [{ key: 'table_name', label: 'Table' }, { key: 'order_type', label: 'Type' }, { key: 'status', label: 'Status', badge: true }, { key: 'total_amount', label: 'Total', money: true }],
        fields: [
          { key: 'table_id', label: 'Table', type: 'foreignKey', fk: { endpoint: '/tables', labelKey: 'name' } },
          { key: 'order_type', label: 'Order Type', type: 'select', options: ['dine_in', 'takeaway', 'delivery'] },
          { key: 'status', label: 'Status', type: 'select', options: ['open', 'preparing', 'served', 'paid', 'cancelled'] },
          { key: 'total_amount', label: 'Total Amount', type: 'number', step: '0.01' },
        ],
      },
    ],
  },
  {
    group: 'Inventory Management',
    modules: [
      {
        key: 'product-categories', label: 'Category Management', endpoint: '/product-categories', icon: 'Layers',
        columns: [{ key: 'name', label: 'Name' }, { key: 'description', label: 'Description' }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
      {
        key: 'products', label: 'Product Management', endpoint: '/products', icon: 'Package',
        columns: [{ key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'category_name', label: 'Category' }, { key: 'unit_price', label: 'Price', money: true }, { key: 'reorder_level', label: 'Reorder Level' }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'sku', label: 'SKU', type: 'text' },
          { key: 'category_id', label: 'Category', type: 'foreignKey', fk: { endpoint: '/product-categories', labelKey: 'name' } },
          { key: 'unit', label: 'Unit', type: 'text' },
          { key: 'unit_price', label: 'Unit Price', type: 'number', step: '0.01' },
          { key: 'reorder_level', label: 'Reorder Level', type: 'number', step: '0.01' },
        ],
      },
      {
        key: 'warehouses', label: 'Warehouse / Store', endpoint: '/warehouses', icon: 'Warehouse',
        columns: [{ key: 'name', label: 'Name' }, { key: 'location', label: 'Location' }],
        fields: [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'manager_id', label: 'Manager', type: 'foreignKey', fk: { endpoint: '/staff', labelKey: 'full_name' } },
        ],
      },
      {
        key: 'stock-movements', label: 'Stock In / Out', endpoint: '/stock-movements', icon: 'ArrowLeftRight',
        columns: [{ key: 'product_name', label: 'Product' }, { key: 'warehouse_name', label: 'Warehouse' }, { key: 'movement_type', label: 'Type', badge: true }, { key: 'quantity', label: 'Quantity' }, { key: 'reference', label: 'Reference' }],
        fields: [
          { key: 'product_id', label: 'Product', type: 'foreignKey', fk: { endpoint: '/products', labelKey: 'name' }, required: true },
          { key: 'warehouse_id', label: 'Warehouse', type: 'foreignKey', fk: { endpoint: '/warehouses', labelKey: 'name' } },
          { key: 'movement_type', label: 'Type', type: 'select', options: ['in', 'out'], required: true },
          { key: 'quantity', label: 'Quantity', type: 'number', step: '0.01', required: true },
          { key: 'reference', label: 'Reference / Reason', type: 'text' },
        ],
      },
      {
        key: 'purchase-orders', label: 'Purchase Orders', endpoint: '/purchase-orders', icon: 'FileText',
        columns: [{ key: 'supplier_name', label: 'Supplier' }, { key: 'status', label: 'Status', badge: true }, { key: 'total_amount', label: 'Total', money: true }, { key: 'expected_date', label: 'Expected' }],
        fields: [
          { key: 'supplier_id', label: 'Supplier', type: 'foreignKey', fk: { endpoint: '/suppliers', labelKey: 'name' }, required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['pending', 'ordered', 'received', 'cancelled'] },
          { key: 'total_amount', label: 'Total Amount', type: 'number', step: '0.01' },
          { key: 'expected_date', label: 'Expected Date', type: 'date' },
        ],
      },
    ],
  },
  {
    group: 'Expense Management',
    modules: [
      {
        key: 'expense-categories', label: 'Expense Categories', endpoint: '/expense-categories', icon: 'Tags',
        columns: [{ key: 'name', label: 'Name' }],
        fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
      },
      {
        key: 'expenses', label: 'Expense Records', endpoint: '/expenses', icon: 'Receipt', roles: ['owner', 'manager', 'cashier', 'store_manager'],
        columns: [{ key: 'description', label: 'Description' }, { key: 'category_name', label: 'Category' }, { key: 'amount', label: 'Amount', money: true }, { key: 'expense_date', label: 'Date' }, { key: 'payment_method', label: 'Payment' }],
        fields: [
          { key: 'description', label: 'Description', type: 'text', required: true },
          { key: 'category_id', label: 'Category', type: 'foreignKey', fk: { endpoint: '/expense-categories', labelKey: 'name' } },
          { key: 'supplier_id', label: 'Supplier', type: 'foreignKey', fk: { endpoint: '/suppliers', labelKey: 'name' } },
          { key: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
          { key: 'expense_date', label: 'Date', type: 'date' },
          { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['cash', 'card', 'bank_transfer', 'upi'] },
        ],
      },
    ],
  },
];

export function findModule(key) {
  for (const g of moduleGroups) {
    const m = g.modules.find((m) => m.key === key);
    if (m) return m;
  }
  return null;
}
