# RestaurantOS API Documentation

Complete reference for all REST API endpoints.

---

## Base URL
```
Production: https://restaurantos-backend-wg6g.onrender.com/api
Local Dev: http://localhost:5000/api
```

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```bash
Authorization: Bearer <jwt_token>
```

### Login & Get Token
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "owner@restaurantos.com",
  "password": "Password123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "3fae3c40-19b8-4d89-aaf5-8d30ad4d1419",
    "name": "Ava Owner",
    "email": "owner@restaurantos.com",
    "role": "owner"
  }
}
```

---

## Core Endpoints

### Authentication Routes

#### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Chef",
  "email": "chef@restaurant.com",
  "password": "SecurePass123!",
  "role": "chef"
}

Response: { token, user }
```

#### Get Current User
```bash
GET /auth/me
Authorization: Bearer <token>

Response:
{
  "id": "3fae3c40-19b8-4d89-aaf5-8d30ad4d1419",
  "name": "Ava Owner",
  "email": "owner@restaurantos.com",
  "role": "owner"
}
```

#### Logout
```bash
POST /auth/logout
Authorization: Bearer <token>

Response: { success: true }
```

---

### Invoice Management

#### Upload & Process Invoice
```bash
POST /invoices/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- invoice: <file> (PDF/JPG/PNG/WEBP)

Response:
{
  "invoice": {
    "id": 1,
    "file_name": "invoice.pdf",
    "cloudinary_url": "https://res.cloudinary.com/...",
    "cloudinary_id": "restaurantos/...",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-09-01",
    "total_amount": 5000,
    "status": "processed",
    "created_at": "2024-09-03T14:00:00Z"
  },
  "extracted": {
    "supplier_name": "ABC Suppliers",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-09-01",
    "total_amount": 5000,
    "confidence": 0.95,
    "line_items": [
      {
        "description": "Tomatoes (1kg)",
        "quantity": 10,
        "unit_price": 50,
        "line_total": 500
      }
    ]
  }
}
```

#### List Invoices
```bash
GET /invoices
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "file_name": "invoice.pdf",
      "invoice_number": "INV-2024-001",
      "invoice_date": "2024-09-01",
      "total_amount": 5000,
      "status": "processed",
      "supplier_name_matched": "ABC Suppliers"
    }
  ]
}
```

#### Get Invoice Details with Line Items
```bash
GET /invoices/:id
Authorization: Bearer <token>

Response:
{
  "invoice": { ... invoice data ... },
  "line_items": [
    {
      "id": 1,
      "invoice_id": 1,
      "description": "Tomatoes (1kg)",
      "quantity": 10,
      "unit_price": 50,
      "line_total": 500
    }
  ]
}
```

#### Delete Invoice
```bash
DELETE /invoices/:id
Authorization: Bearer <token>

Response: { success: true, message: "Invoice deleted successfully" }
```

#### Export Expense Register (Excel)
```bash
GET /invoices/export/excel
Authorization: Bearer <token>

Response: Excel file (.xlsx) with:
- Sheet 1: Expense Register (summary)
- Sheet 2: Line Items (detailed)
```

#### Invoice Gallery (Cloudinary Previews)
```bash
GET /invoices/gallery/previews
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "file_name": "invoice.pdf",
      "cloudinary_url": "https://res.cloudinary.com/...",
      "invoice_date": "2024-09-01",
      "total_amount": 5000,
      "thumbnail": "https://res.cloudinary.com/.../c_thumb,h_200,w_200/...",
      "preview": "https://res.cloudinary.com/..."
    }
  ],
  "total": 5
}
```

---

### Menu Management

#### List Menu Categories
```bash
GET /modules/menu-categories
Authorization: Bearer <token>
Query Params: ?page=1&limit=10&search=Appetizers

Response:
{
  "data": [
    {
      "id": 1,
      "name": "Appetizers",
      "description": "Small plates",
      "created_at": "2024-09-01T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

#### Create Menu Category
```bash
POST /modules/menu-categories
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Desserts",
  "description": "Sweet treats"
}

Response: { id: 2, name: "Desserts", ... }
```

#### Update Menu Category
```bash
PUT /modules/menu-categories/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Premium Desserts",
  "description": "High-end sweet treats"
}

Response: { id: 2, name: "Premium Desserts", ... }
```

#### Delete Menu Category
```bash
DELETE /modules/menu-categories/:id
Authorization: Bearer <token>

Response: { success: true }
```

---

### Table Management

#### List Tables
```bash
GET /modules/tables
Authorization: Bearer <token>
Query Params: ?page=1&limit=20&search=Table

Response:
{
  "data": [
    {
      "id": 1,
      "table_number": 1,
      "capacity": 4,
      "location": "Main Hall",
      "status": "available"
    }
  ],
  "total": 20
}
```

#### Create Table
```bash
POST /modules/tables
Content-Type: application/json
Authorization: Bearer <token>

{
  "table_number": 21,
  "capacity": 6,
  "location": "Patio"
}

Response: { id: 21, ... }
```

---

### Staff Management

#### List Staff
```bash
GET /modules/staff
Authorization: Bearer <token>
Query Params: ?page=1&limit=10&search=John

Response:
{
  "data": [
    {
      "id": 1,
      "name": "John Chef",
      "email": "john@restaurant.com",
      "role": "chef",
      "phone": "9876543210",
      "status": "active"
    }
  ],
  "total": 12
}
```

#### Add Staff Member
```bash
POST /modules/staff
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Waiter",
  "email": "jane@restaurant.com",
  "phone": "9876543211",
  "role": "waiter",
  "status": "active"
}

Response: { id: 13, ... }
```

---

### Order Management

#### List Orders
```bash
GET /modules/orders
Authorization: Bearer <token>
Query Params: ?page=1&limit=15&search=ORD&status=pending

Response:
{
  "data": [
    {
      "id": 1,
      "order_number": "ORD-001",
      "table_id": 5,
      "status": "pending",
      "total_amount": 1500,
      "created_at": "2024-09-03T14:30:00Z"
    }
  ],
  "total": 45
}
```

#### Create Order
```bash
POST /modules/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "table_id": 5,
  "status": "pending",
  "total_amount": 1500
}

Response: { id: 1, order_number: "ORD-001", ... }
```

#### Update Order Status
```bash
PUT /modules/orders/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "completed",
  "total_amount": 1500
}

Response: { id: 1, status: "completed", ... }
```

---

### Supplier Management

#### List Suppliers
```bash
GET /modules/suppliers
Authorization: Bearer <token>
Query Params: ?page=1&limit=10&search=ABC

Response:
{
  "data": [
    {
      "id": 1,
      "name": "ABC Suppliers",
      "contact_person": "Mr. Patel",
      "email": "contact@abcsuppliers.com",
      "phone": "9876543210",
      "address": "123 Supply Street"
    }
  ],
  "total": 8
}
```

#### Create Supplier
```bash
POST /modules/suppliers
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Fresh Farms",
  "contact_person": "Ms. Singh",
  "email": "contact@freshfarms.com",
  "phone": "9876543212",
  "address": "Farm Road, State"
}

Response: { id: 9, ... }
```

---

### Dashboard & Analytics

#### Get Dashboard Data
```bash
GET /dashboard
Authorization: Bearer <token>

Response:
{
  "revenue_30d": 150000,
  "profit_30d": 45000,
  "active_orders": 12,
  "low_stock_count": 6,
  "sales_data": [
    { date: "2024-09-01", revenue: 5000 },
    { date: "2024-09-02", revenue: 4800 }
  ]
}
```

---

### AI Features

#### Predict Stock Shortages
```bash
GET /ai/predict-shortages
Authorization: Bearer <token>

Response:
{
  "method": "AI",
  "predictions": [
    {
      "ingredient_name": "Tomatoes",
      "current_stock": 50,
      "predicted_days_until_out": 3,
      "recommendation": "Order immediately"
    }
  ]
}
```

#### Recommend Reorder Quantities
```bash
GET /ai/reorder-recommendations
Authorization: Bearer <token>

Response:
{
  "method": "AI",
  "recommendations": [
    {
      "ingredient_id": 1,
      "ingredient_name": "Flour",
      "current_stock": 100,
      "recommended_order_qty": 500,
      "supplier_id": 1
    }
  ]
}
```

#### Suggest Menu Pricing
```bash
POST /ai/menu-pricing
Content-Type: application/json
Authorization: Bearer <token>

{
  "menu_item_id": 5
}

Response:
{
  "method": "AI",
  "menu_item_id": 5,
  "item_name": "Pasta Carbonara",
  "current_price": 350,
  "suggested_price": 420,
  "reasoning": "Based on ingredient costs and market demand"
}
```

#### Estimate Food Prep Time
```bash
POST /ai/prep-time-estimate
Content-Type: application/json
Authorization: Bearer <token>

{
  "order_id": 1
}

Response:
{
  "method": "AI",
  "order_id": 1,
  "estimated_prep_time_minutes": 25,
  "reasoning": "Carbonara takes 20min, salad takes 5min"
}
```

#### Analyze Ingredient Waste
```bash
GET /ai/waste-analysis
Authorization: Bearer <token>

Response:
{
  "method": "AI",
  "analysis": [
    {
      "ingredient": "Tomatoes",
      "waste_percentage": 8.5,
      "recommendation": "Review storage practices"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid email format",
  "detail": "email must be a valid email address"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "detail": "Role 'waiter' cannot create menu items"
}
```

### 404 Not Found
```json
{
  "error": "Invoice not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process invoice",
  "detail": "OCR extraction failed"
}
```

---

## Rate Limiting

No rate limiting currently implemented. Production deployment should add:
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Testing with cURL

### Get Auth Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@restaurantos.com",
    "password": "Password123!"
  }'
```

### Use Token to Access Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/invoices \
  -H "Authorization: Bearer <your_token_here>"
```

### Upload Invoice
```bash
curl -X POST http://localhost:5000/api/invoices/upload \
  -H "Authorization: Bearer <your_token_here>" \
  -F "invoice=@/path/to/invoice.pdf"
```

### Export Excel
```bash
curl -X GET http://localhost:5000/api/invoices/export/excel \
  -H "Authorization: Bearer <your_token_here>" \
  -o expense-register.xlsx
```

---

## Pagination & Search

All list endpoints support:
```bash
GET /modules/tables?page=1&limit=20&search=Table%201
```

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search keyword (optional)

Response includes pagination metadata:
```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "limit": 20
}
```
