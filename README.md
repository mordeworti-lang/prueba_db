# MegaStore Global API

A professional inventory and sales management system built with **Node.js + Express**, using a **hybrid persistence architecture** combining PostgreSQL and MongoDB.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 5.x |
| Relational DB | PostgreSQL 16 |
| Document DB | MongoDB 6+ |
| Authentication | JWT (Access + Refresh tokens) |
| Password hashing | bcrypt |
| Environment | dotenv |

**Author:** Jhon Stiven Zuluaga

---

## Architecture & Data Model Justification

### Why Hybrid Persistence?

The MegaStore dataset contains two fundamentally different types of data:

### PostgreSQL — Relational Data (Source of Truth)

Used for data requiring **strict referential integrity**, **ACID transactions**, and **precise aggregations**:

| Table | 3NF Justification |
|---|---|
| `users` | Atomic columns: email, password, role — no transitive deps |
| `client` | 2NF: phone/address depend only on client.id, not on user |
| `supplier` | 3NF: removes transitive dep `supplier_name → supplier_email` found in flat CSV |
| `product` | 2NF: all attributes depend on product.id alone |
| `sale` | FK to client + product ensures referential integrity |
| `discounts` | 3NF: removes transitive dep `discount_name → coverage_pct` |
| `refresh_tokens` | Security-critical, ACID required |

#### Normalization Process Applied

**1NF — Atomic values:** The flat CSV had `customer_name`, `customer_email`, `supplier_name`, `supplier_email`, `product_name`, `price` all in one row. Each value now lives in its own atomic column in a dedicated table.

**2NF — No partial dependencies:** The `client` table contains only client profile data. Auth identity lives in `users`. The `product` table contains only product data, never supplier contact info.

**3NF — No transitive dependencies:** In the original CSV, `supplier_name → supplier_email` was a transitive dependency through the transaction row. Now `supplier` is its own table. Similarly `product_sku → unit_price` is fully in `product`, not repeated in every `sale` row.

### MongoDB — Document Data (Read Optimization)

**client_histories collection:**
- A client's full purchase history is *always read together* — embedding avoids costly multi-table JOINs
- **Why embedded (not referenced)?** We never query individual purchases in isolation — the use case is always "show me everything this client bought." Embedding gives O(1) retrieval with a single `findOne({ clientEmail })`.
- Unique index on `clientEmail` enables O(log n) lookups.
- Schema validation enforced on `clientEmail`, `clientName`, `purchases` (required fields).

**audit_logs collection:**
- Every DELETE operation on `sale` writes a full snapshot here.
- **Why MongoDB for audit logs?** Audit entries have flexible schema (different entities may have different fields), append-only writes are fast, and they're queried infrequently for compliance — not for transactions.
- Schema validation enforced: `action`, `entity`, `entityId`, `deletedAt`, `snapshot` are all required.

---

## Project Structure

```
megastore-api/
├── src/
│   ├── config/         # DB connections (postgres.js, mongodb.js) and env validation
│   ├── controllers/    # HTTP request handlers (thin layer)
│   ├── services/       # Business logic (validation, orchestration)
│   ├── repositories/   # Database query layer (SQL + Mongo)
│   ├── middleware/      # Auth (JWT), role guard, global error handler
│   ├── exceptions/      # AppError, NotFoundError, ValidationError, UnauthorizedError
│   ├── dtos/           # Data Transfer Objects (input parsing)
│   ├── utils/          # JWT helpers (sign/verify)
│   ├── routes/         # Express routers
│   ├── app.js          # Express setup, middleware, route mounting
│   └── server.js       # Bootstrap: connect DBs, start listening
├── scripts/
│   └── run-migration.js  # CLI migration runner
├── docs/
│   ├── ER_Diagram.png                # Entity-Relationship Diagram
│   ├── schema.sql                    # PostgreSQL DDL + views + triggers
│   ├── mongodb_schema_validation.js  # MongoDB collection validators
│   └── sample_data.csv              # Sample CSV used for testing
├── data/
│   └── simulacro_megastore_data_.csv  # Source data for migration
├── .env.example
└── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- MongoDB 6+

### 1. Clone and install

```bash
git clone <repository-url>
cd megastore-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/db_megastore_exam
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=megastore_db
JWT_SECRET=your_long_random_secret_min_32_chars
JWT_REFRESH_SECRET=another_long_random_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SIMULACRO_CSV_PATH=./data/simulacro_megastore_data_.csv
```

### 3. Create PostgreSQL database and run schema

```bash
psql -U your_user -c "CREATE DATABASE db_megastore_exam;"
psql -U your_user -d db_megastore_exam -f docs/schema.sql
```

### 4. Apply MongoDB schema validation (recommended)

```bash
mongosh db_megastore_exam docs/mongodb_schema_validation.js
```

### 5. Start the server

```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## Bulk Migration Guide

### Via API endpoint (recommended)

```bash
# Normal idempotent run — safe to re-run multiple times
curl -X POST http://localhost:3000/api/simulacro/migrate \
  -H "Content-Type: application/json" \
  -d '{"clearBefore": false}'

# Clear all data first, then re-import
curl -X POST http://localhost:3000/api/simulacro/migrate \
  -H "Content-Type: application/json" \
  -d '{"clearBefore": true}'
```

**Response:**
```json
{
  "ok": true,
  "message": "Migration completed successfully",
  "summary": {
    "clients": 120,
    "products": 45,
    "sales": 500,
    "csvPath": "/app/data/simulacro_megastore_data_.csv"
  }
}
```

### Via CLI script

```bash
node scripts/run-migration.js           # idempotent run
node scripts/run-migration.js --clear   # clear and reimport
```

**Idempotency strategy:**
- PostgreSQL: `ON CONFLICT (email) DO UPDATE` for users, `ON CONFLICT (sku) DO UPDATE` for products, `ON CONFLICT (transaction_id) DO NOTHING` for sales.
- MongoDB: `updateOne` with `upsert: true` + `$setOnInsert` prevents duplicate client history documents.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Body |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | `{ name, email, password, role? }` |
| POST | `/api/auth/login` | Login, returns JWT | `{ email, password }` |
| POST | `/api/auth/refresh` | Refresh access token | `{ refreshToken }` |
| POST | `/api/auth/logout` | Logout | `{ refreshToken }` |
| GET  | `/api/auth/me` | Get current user | — |

**Login response:**
```json
{
  "ok": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": 1, "email": "admin@store.com", "role": "admin" }
}
```

### Shopping Cart

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET    | `/api/cart` | Get user's cart with totals | ✅ |
| POST   | `/api/cart/items` | Add item to cart | ✅ |
| DELETE | `/api/cart/items/:productId` | Remove item from cart | ✅ |
| PUT    | `/api/cart/items/:productId` | Update item quantity | ✅ |
| DELETE | `/api/cart` | Clear entire cart | ✅ |
| POST   | `/api/cart/checkout` | Convert cart items to sales | ✅ |

**POST /api/cart/items body:**
```json
{ "productId": 1, "name": "USB-C Hub", "sku": "ELEC-001", "quantity": 2, "unitPrice": 29.99 }
```

**PUT /api/cart/items/:productId body:**
```json
{ "quantity": 5 }
```

**POST /api/cart/checkout body:**
```json
{ "clientId": 1 }
```

### Sales (Complete CRUD)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET    | `/api/sales` | List all sales (`?clientId=&productId=`) | ✅ |
| GET    | `/api/sales/mine` | Own sales (client) or all (admin) | ✅ |
| GET    | `/api/sales/:id` | Get sale by ID | ✅ |
| POST   | `/api/sales` | Create new sale | ✅ |
| PUT    | `/api/sales/:id` | Update sale fields | Admin |
| DELETE | `/api/sales/:id` | Delete sale + write audit log | Admin |

**POST /api/sales body:**
```json
{ "clientId": 1, "productId": 3, "quantity": 2, "unitPrice": 49.99 }
```

**PUT /api/sales/:id body:**
```json
{ "quantity": 5, "unitPrice": 44.99, "saleDate": "2025-06-01T10:00:00Z" }
```

### Products (Complete CRUD)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET    | `/api/products` | List products (`?category=&supplierId=`) | ✅ |
| GET    | `/api/products/:id` | Get product by ID | ✅ |
| POST   | `/api/products` | Create product | Admin |
| PUT    | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

**POST /api/products body:**
```json
{ "supplierId": 2, "sku": "ELEC-001", "name": "USB-C Hub", "category": "Electronics", "unitPrice": 29.99, "stock": 100 }
```

### Clients

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/clients/search?q=Juan` | Search clients by name/email | ✅ |
| GET | `/api/clients/history/:email` | Get full purchase history | ✅ |

### Reports (Business Intelligence)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/suppliers` | Top suppliers by items sold + inventory value |
| GET | `/api/reports/clients/:email` | Full purchase history for a client (MongoDB) |
| GET | `/api/reports/top-products?category=Electronics` | Top products by category ordered by revenue |
| GET | `/api/reports/audit-logs?entity=sale&limit=20` | Audit log of deleted records (MongoDB) |

### Migration

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/simulacro/migrate` | Bulk load CSV into PostgreSQL + MongoDB |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard: counts and revenue summary |

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not found |
| 409 | Conflict (duplicate unique value) |
| 500 | Internal server error |

---

## Ubuntu Installation (PostgreSQL + MongoDB)

### PostgreSQL 16

```bash
sudo apt update && sudo apt install -y curl ca-certificates
sudo install -d /usr/share/postgresql-common/pgdg
curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update && sudo apt install -y postgresql-16
sudo systemctl start postgresql && sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE USER megastore WITH PASSWORD 'megastore123';"
sudo -u postgres psql -c "CREATE DATABASE db_megastore_exam OWNER megastore;"
```

### MongoDB 6

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc \
  | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

---

## Database Features (Plus Points)

- **Triggers:** `trg_product_updated_at` and `trg_client_updated_at` automatically set `updated_at = NOW()` on every UPDATE.
- **Stored Procedure:** `get_supplier_stats(supplier_id)` returns aggregated stats for a given supplier.
- **Views:** `v_supplier_analysis`, `v_top_products_by_category`, `v_client_summary` pre-compute BI queries.
- **MongoDB Schema Validation:** enforced on both `client_histories` and `audit_logs` collections.
- **JWT Auth:** Access token (15 min) + Refresh token (7 days) stored in PostgreSQL for revocation.
- **Rate Limiting:** 300 req/15 min globally; 10 req/15 min on login endpoint.
