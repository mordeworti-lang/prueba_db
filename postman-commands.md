# 📮 MEGASTORE API - COMANDOS COMPLETOS DE POSTMAN

## 📋 ÍNDICE DE COMANDOS

### 🔐 **AUTENTICACIÓN**
- 1.1 Registrar Usuario
- 1.2 Login de Usuario
- 1.3 Refresh Token
- 1.4 Logout
- 1.5 Obtener Perfil

### 🛒 **CARRITO DE COMPRAS**
- 2.1 Ver Carrito
- 2.2 Agregar Item al Carrito
- 2.3 Actualizar Cantidad de Item
- 2.4 Eliminar Item del Carrito
- 2.5 Vaciar Carrito
- 2.6 Checkout del Carrito

### 💰 **VENTAS**
- 3.1 Obtener Todas las Ventas
- 3.2 Obtener Venta por ID
- 3.3 Crear Nueva Venta
- 3.4 Actualizar Venta (Admin)
- 3.5 Eliminar Venta (Admin)
- 3.6 Estadísticas de Ventas

### 📦 **PRODUCTOS**
- 4.1 Obtener Todos los Productos
- 4.2 Obtener Producto por ID
- 4.3 Crear Producto (Admin)
- 4.4 Actualizar Producto (Admin)
- 4.5 Eliminar Producto (Admin)

### 🏪 **PROVEEDORES**
- 5.1 Obtener Todos los Proveedores
- 5.2 Obtener Proveedor por ID
- 5.3 Crear Proveedor (Admin)
- 5.4 Actualizar Proveedor (Admin)
- 5.5 Eliminar Proveedor (Admin)

### 📊 **REPORTS Y BI**
- 6.1 Reporte de Suppliers
- 6.2 Top Products
- 6.3 Client History
- 6.4 Audit Logs
- 6.5 Sales Analytics
- 6.6 Category Performance

### 🗄️ **MIGRACIÓN Y ADMIN**
- 7.1 Migrar Datos CSV
- 7.2 Health Check
- 7.3 Limpiar Base de Datos

---

## 🔐 **1. AUTENTICACIÓN**

### 1.1 Registrar Usuario
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "password": "Password123!",
  "role": "client"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "client"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 Login de Usuario
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "juan.perez@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "juan.perez@example.com",
    "role": "client"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.3 Refresh Token
```http
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "ok": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.4 Logout
```http
POST http://localhost:3000/api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Logout successful"
}
```

### 1.5 Obtener Perfil
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "juan.perez@example.com",
    "role": "client",
    "name": "Juan Pérez",
    "phone": "555-1234",
    "address": "Calle Principal 123"
  }
}
```

---

## 🛒 **2. CARRITO DE COMPRAS**

### 2.1 Ver Carrito
```http
GET http://localhost:3000/api/cart
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "cart": {
    "userId": 1,
    "items": [
      {
        "productId": 1,
        "name": "Laptop Gaming",
        "sku": "LP-001",
        "quantity": 2,
        "unitPrice": 999.99,
        "addedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totals": {
      "subtotal": 1999.98,
      "itemCount": 2,
      "itemCountDistinct": 1,
      "currency": "USD"
    }
  }
}
```

### 2.2 Agregar Item al Carrito
```http
POST http://localhost:3000/api/cart/items
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "productId": 1,
  "name": "Laptop Gaming",
  "sku": "LP-001",
  "quantity": 2,
  "unitPrice": 999.99
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Item added to cart",
  "cart": {
    "userId": 1,
    "items": [...],
    "totals": {
      "subtotal": 1999.98,
      "itemCount": 2,
      "itemCountDistinct": 1,
      "currency": "USD"
    }
  }
}
```

### 2.3 Actualizar Cantidad de Item
```http
PUT http://localhost:3000/api/cart/items/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "quantity": 3
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Cart item updated",
  "cart": {
    "userId": 1,
    "items": [...],
    "totals": {
      "subtotal": 2999.97,
      "itemCount": 3,
      "itemCountDistinct": 1,
      "currency": "USD"
    }
  }
}
```

### 2.4 Eliminar Item del Carrito
```http
DELETE http://localhost:3000/api/cart/items/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "message": "Item removed from cart",
  "cart": {
    "userId": 1,
    "items": [],
    "totals": {
      "subtotal": 0,
      "itemCount": 0,
      "itemCountDistinct": 0,
      "currency": "USD"
    }
  }
}
```

### 2.5 Vaciar Carrito
```http
DELETE http://localhost:3000/api/cart
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "message": "Cart cleared",
  "cart": {
    "userId": 1,
    "items": [],
    "totals": {
      "subtotal": 0,
      "itemCount": 0,
      "itemCountDistinct": 0,
      "currency": "USD"
    }
  }
}
```

### 2.6 Checkout del Carrito
```http
POST http://localhost:3000/api/cart/checkout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "clientId": 1
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Checkout successful",
  "sales": [
    {
      "id": 123,
      "client_id": 1,
      "product_id": 1,
      "quantity": 2,
      "unit_price": 999.99,
      "total_amount": 1999.98,
      "sale_date": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalAmount": 1999.98,
  "itemCount": 2
}
```

---

## 💰 **3. VENTAS**

### 3.1 Obtener Todas las Ventas
```http
GET http://localhost:3000/api/sales
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `client_id`: Filtrar por cliente (opcional)
- `product_id`: Filtrar por producto (opcional)
- `limit`: Límite de resultados (default: 50)
- `offset`: Offset para paginación (default: 0)

**Response:**
```json
{
  "ok": true,
  "sales": [
    {
      "id": 123,
      "transaction_id": "TXN-2024-001",
      "sale_date": "2024-01-15T10:30:00.000Z",
      "client_name": "Juan Pérez",
      "client_email": "juan.perez@example.com",
      "product_name": "Laptop Gaming",
      "sku": "LP-001",
      "quantity": 2,
      "unit_price": 999.99,
      "total_amount": 1999.98
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 3.2 Obtener Venta por ID
```http
GET http://localhost:3000/api/sales/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "sale": {
    "id": 123,
    "transaction_id": "TXN-2024-001",
    "sale_date": "2024-01-15T10:30:00.000Z",
    "client_name": "Juan Pérez",
    "client_email": "juan.perez@example.com",
    "product_name": "Laptop Gaming",
    "sku": "LP-001",
    "supplier_name": "TechCorp",
    "quantity": 2,
    "unit_price": 999.99,
    "total_amount": 1999.98
  }
}
```

### 3.3 Crear Nueva Venta
```http
POST http://localhost:3000/api/sales
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "client_id": 1,
  "product_id": 1,
  "quantity": 2,
  "unit_price": 999.99
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Sale created successfully",
  "sale": {
    "id": 124,
    "client_id": 1,
    "product_id": 1,
    "quantity": 2,
    "unit_price": 999.99,
    "total_amount": 1999.98,
    "sale_date": "2024-01-15T10:35:00.000Z"
  }
}
```

### 3.4 Actualizar Venta (Admin)
```http
PUT http://localhost:3000/api/sales/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "quantity": 3,
  "unit_price": 899.99
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Sale updated successfully",
  "sale": {
    "id": 123,
    "client_id": 1,
    "product_id": 1,
    "quantity": 3,
    "unit_price": 899.99,
    "total_amount": 2699.97,
    "updated_at": "2024-01-15T10:40:00.000Z"
  }
}
```

### 3.5 Eliminar Venta (Admin)
```http
DELETE http://localhost:3000/api/sales/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "message": "Sale deleted successfully",
  "sale": {
    "id": 123,
    "client_id": 1,
    "product_id": 1,
    "quantity": 2,
    "unit_price": 999.99,
    "total_amount": 1999.98
  }
}
```

### 3.6 Estadísticas de Ventas
```http
GET http://localhost:3000/api/sales/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD)

**Response:**
```json
{
  "ok": true,
  "stats": {
    "total_sales": 150,
    "total_revenue": 250000.50,
    "avg_sale_amount": 1666.67,
    "unique_clients": 45
  }
}
```

---

## 📦 **4. PRODUCTOS**

### 4.1 Obtener Todos los Productos
```http
GET http://localhost:3000/api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `category`: Filtrar por categoría (opcional)
- `supplier_id`: Filtrar por proveedor (opcional)
- `limit`: Límite de resultados (default: 50)
- `offset`: Offset para paginación (default: 0)

**Response:**
```json
{
  "ok": true,
  "products": [
    {
      "id": 1,
      "name": "Laptop Gaming",
      "sku": "LP-001",
      "category": "Electronics",
      "unit_price": 999.99,
      "stock": 25,
      "supplier_name": "TechCorp",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 4.2 Obtener Producto por ID
```http
GET http://localhost:3000/api/products/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "product": {
    "id": 1,
    "name": "Laptop Gaming",
    "sku": "LP-001",
    "category": "Electronics",
    "unit_price": 999.99,
    "stock": 25,
    "supplier_id": 1,
    "supplier_name": "TechCorp",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4.3 Crear Producto (Admin)
```http
POST http://localhost:3000/api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "supplier_id": 1,
  "sku": "LP-002",
  "name": "Laptop Office",
  "category": "Electronics",
  "unit_price": 799.99,
  "stock": 50
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Product created successfully",
  "product": {
    "id": 2,
    "supplier_id": 1,
    "sku": "LP-002",
    "name": "Laptop Office",
    "category": "Electronics",
    "unit_price": 799.99,
    "stock": 50,
    "created_at": "2024-01-15T10:45:00.000Z"
  }
}
```

### 4.4 Actualizar Producto (Admin)
```http
PUT http://localhost:3000/api/products/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Laptop Gaming Pro",
  "unit_price": 1099.99,
  "stock": 30
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Product updated successfully",
  "product": {
    "id": 1,
    "name": "Laptop Gaming Pro",
    "sku": "LP-001",
    "category": "Electronics",
    "unit_price": 1099.99,
    "stock": 30,
    "updated_at": "2024-01-15T10:50:00.000Z"
  }
}
```

### 4.5 Eliminar Producto (Admin)
```http
DELETE http://localhost:3000/api/products/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "message": "Product deleted successfully",
  "product": {
    "id": 1,
    "name": "Laptop Gaming Pro",
    "sku": "LP-001",
    "unit_price": 1099.99,
    "stock": 30
  }
}
```

---

## 🏪 **5. PROVEEDORES**

### 5.1 Obtener Todos los Proveedores
```http
GET http://localhost:3000/api/suppliers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "suppliers": [
    {
      "id": 1,
      "name": "TechCorp",
      "email": "sales@techcorp.com",
      "phone": "555-0101",
      "address": "123 Tech Street, Silicon Valley, CA",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5.2 Obtener Proveedor por ID
```http
GET http://localhost:3000/api/suppliers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "supplier": {
    "id": 1,
    "name": "TechCorp",
    "email": "sales@techcorp.com",
    "phone": "555-0101",
    "address": "123 Tech Street, Silicon Valley, CA",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5.3 Crear Proveedor (Admin)
```http
POST http://localhost:3000/api/suppliers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Global Supplies Co",
  "email": "contact@globalsupplies.com",
  "phone": "555-0202",
  "address": "456 Supply Ave, New York, NY"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Supplier created successfully",
  "supplier": {
    "id": 2,
    "name": "Global Supplies Co",
    "email": "contact@globalsupplies.com",
    "phone": "555-0202",
    "address": "456 Supply Ave, New York, NY",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

### 5.4 Actualizar Proveedor (Admin)
```http
PUT http://localhost:3000/api/suppliers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "TechCorp International",
  "phone": "555-0102"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Supplier updated successfully",
  "supplier": {
    "id": 1,
    "name": "TechCorp International",
    "email": "sales@techcorp.com",
    "phone": "555-0102",
    "address": "123 Tech Street, Silicon Valley, CA",
    "updated_at": "2024-01-15T11:05:00.000Z"
  }
}
```

### 5.5 Eliminar Proveedor (Admin)
```http
DELETE http://localhost:3000/api/suppliers/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "message": "Supplier deleted successfully",
  "supplier": {
    "id": 1,
    "name": "TechCorp International",
    "email": "sales@techcorp.com",
    "phone": "555-0102"
  }
}
```

---

## 📊 **6. REPORTS Y BI**

### 6.1 Reporte de Suppliers
```http
GET http://localhost:3000/api/reports/suppliers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "suppliers": [
    {
      "supplier_id": 1,
      "supplier_name": "TechCorp",
      "supplier_email": "sales@techcorp.com",
      "product_count": 15,
      "total_items_sold": 250,
      "total_revenue": 250000.00,
      "avg_unit_price": 1000.00,
      "inventory_value": 15000.00
    }
  ]
}
```

### 6.2 Top Products
```http
GET http://localhost:3000/api/reports/top-products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `limit`: Límite de resultados (default: 10)
- `category`: Filtrar por categoría (opcional)

**Response:**
```json
{
  "ok": true,
  "products": [
    {
      "product_id": 1,
      "product_name": "Laptop Gaming",
      "category": "Electronics",
      "sku": "LP-001",
      "total_quantity_sold": 100,
      "total_revenue": 99999.00,
      "number_of_sales": 50,
      "avg_sale_price": 999.99,
      "supplier_name": "TechCorp"
    }
  ]
}
```

### 6.3 Client History
```http
GET http://localhost:3000/api/reports/client-history
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `email`: Email del cliente (requerido)

**Response:**
```json
{
  "ok": true,
  "clientHistory": {
    "clientEmail": "juan.perez@example.com",
    "clientName": "Juan Pérez",
    "purchases": [
      {
        "productId": 1,
        "productName": "Laptop Gaming",
        "quantity": 2,
        "unitPrice": 999.99,
        "totalAmount": 1999.98,
        "purchaseDate": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalPurchases": 1,
    "totalSpent": 1999.98,
    "averagePurchase": 1999.98,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6.4 Audit Logs
```http
GET http://localhost:3000/api/reports/audit-logs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `entity`: Filtrar por entidad (sale, product, etc.)
- `limit`: Límite de resultados (default: 50)
- `offset`: Offset para paginación (default: 0)

**Response:**
```json
{
  "ok": true,
  "logs": [
    {
      "_id": "65a5b8f9c4a7d8e9f0a1b2c3",
      "action": "DELETE",
      "entity": "sale",
      "entityId": 123,
      "deletedAt": "2024-01-15T11:10:00.000Z",
      "deletedBy": "admin@megastore.com",
      "snapshot": {
        "id": 123,
        "client_id": 1,
        "product_id": 1,
        "quantity": 2,
        "total_amount": 1999.98
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 6.5 Sales Analytics
```http
GET http://localhost:3000/api/reports/sales-analytics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD)

**Response:**
```json
{
  "ok": true,
  "analytics": [
    {
      "sale_date": "2024-01-15T00:00:00.000Z",
      "daily_sales": 25,
      "daily_revenue": 25000.00,
      "avg_sale_amount": 1000.00,
      "unique_clients": 15
    }
  ]
}
```

### 6.6 Category Performance
```http
GET http://localhost:3000/api/reports/category-performance
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "ok": true,
  "categories": [
    {
      "category": "Electronics",
      "product_count": 25,
      "supplier_count": 5,
      "total_quantity_sold": 500,
      "total_revenue": 500000.00,
      "avg_unit_price": 1000.00,
      "number_of_sales": 300
    }
  ]
}
```

---

## 🗄️ **7. MIGRACIÓN Y ADMIN**

### 7.1 Migrar Datos CSV
```http
POST http://localhost:3000/api/simulacro/migrate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "clearBefore": false
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Migration completed successfully",
  "summary": {
    "clients": 50,
    "suppliers": 10,
    "products": 100,
    "sales": 500,
    "errors": []
  },
  "csvPath": "./data/simulacro_megastore_data_.csv"
}
```

### 7.2 Health Check
```http
GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "service": "MegaStore Global API",
  "version": "2.0.0",
  "environment": "development",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### 7.3 Limpiar Base de Datos (Admin)
```http
DELETE http://localhost:3000/api/admin/clear-database
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "confirm": "CLEAR_ALL_DATA"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Database cleared successfully",
  "cleared_tables": [
    "sales",
    "products", 
    "clients",
    "suppliers",
    "users",
    "refresh_tokens"
  ]
}
```

---

## 🎯 **NOTAS IMPORTANTES PARA POSTMAN**

### **🔑 Autenticación**
1. **Registrar usuario** primero para obtener tokens
2. **Copiar accessToken** del response
3. **Ir a Authorization tab** → Type: Bearer Token
4. **Pegar el token** en el campo Token
5. **Los tokens expiran en 15 minutos**, usa refresh token

### **📝 Variables de Entorno**
```javascript
// En Postman, crea estas variables:
{{baseUrl}} = http://localhost:3000
{{accessToken}} = (se actualiza después de login)
{{refreshToken}} = (se actualiza después de login)
```

### **🔄 Flujo de Trabajo Típico**
1. **Login** → Obtener tokens
2. **Ver productos** → Ver disponibles
3. **Agregar al carrito** → Comprar
4. **Checkout** → Finalizar compra
5. **Ver historial** → Compras realizadas

### **🛡️ Errores Comunes**
- **401 Unauthorized**: Token expirado o inválido
- **403 Forbidden**: No tienes permisos (admin required)
- **404 Not Found**: Recurso no existe
- **400 Bad Request**: Datos inválidos
- **429 Too Many Requests**: Rate limit excedido

### **📊 Tips para Testing**
- **Usa datos reales** en los requests
- **Verifica stock** antes de comprar
- **Prueba rate limiting** con múltiples requests
- **Testea errores** con datos inválidos
- **Usa diferentes roles** (admin vs client)

---

## 🏆 **COLLECTION DE POSTMAN**

### **📥 Importar Collection**
1. **Descarga** la colección JSON (si la tienes)
2. **Abre Postman** → Import → Upload Files
3. **Selecciona** el archivo JSON
4. **Configura variables** de entorno
5. **Empieza a probar!**

### **🔧 Configuración Rápida**
```javascript
// Variables de entorno en Postman:
baseUrl: http://localhost:3000
accessToken: (vacío inicialmente)
refreshToken: (vacío inicialmente)
userEmail: tu@email.com
userPassword: tu_contraseña
```

**¡LISTO PARA PROBAR TODA LA API!** 🚀📮
