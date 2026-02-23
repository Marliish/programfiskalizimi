# 🏗️ COMPLETE ARCHITECTURE BLUEPRINT
## Fiscalization Platform - Technical Architecture

**Last Updated:** 2026-02-23
**Status:** FINAL - Ready for Implementation

---

## 📋 **TABLE OF CONTENTS**

1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack Decisions](#technology-stack-decisions)
3. [System Components](#system-components)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Security Architecture](#security-architecture)
7. [Infrastructure & Deployment](#infrastructure--deployment)
8. [Performance & Scalability](#performance--scalability)
9. [Monitoring & Observability](#monitoring--observability)
10. [Development Workflow](#development-workflow)

---

## 🎨 **HIGH-LEVEL ARCHITECTURE**

### **System Architecture Diagram**

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                                │
│            (CDN, DDoS Protection, SSL, DNS)                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      LOAD BALANCER                                │
│              (NGINX or Cloud Load Balancer)                       │
│         - SSL Termination                                         │
│         - Health Checks                                           │
│         - Request Distribution                                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│   WEB APPS     │  │   WEB APPS     │  │   WEB APPS     │
│   Instance 1   │  │   Instance 2   │  │   Instance 3   │
│   (Next.js)    │  │   (Next.js)    │  │   (Next.js)    │
│                │  │                │  │                │
│ - Admin Panel  │  │ - Admin Panel  │  │ - Admin Panel  │
│ - POS          │  │ - POS          │  │ - POS          │
│ - Customer     │  │ - Customer     │  │ - Customer     │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                            │ HTTP/REST + WebSocket
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                        API GATEWAY                                │
│                 (Node.js + Fastify)                               │
│                                                                   │
│  - Authentication & Authorization (JWT)                           │
│  - Rate Limiting (Redis)                                          │
│  - Request Validation                                             │
│  - API Versioning (/v1, /v2)                                     │
│  - Request Logging                                                │
│  - Circuit Breaker                                                │
└───────────────────────────┬──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │                   │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│  AUTH SERVICE  │  │  POS SERVICE │  │ FISCAL SERVICE │
│  (Node.js)     │  │  (Node.js)   │  │  (Node.js)     │
│                │  │              │  │                │
│ - Login        │  │ - Cart       │  │ - Albania API  │
│ - Register     │  │ - Checkout   │  │ - Kosovo API   │
│ - JWT          │  │ - Payments   │  │ - E-Invoice    │
│ - RBAC         │  │ - Receipts   │  │ - QR Codes     │
└───────┬────────┘  └──────┬───────┘  └───────┬────────┘
        │                  │                   │
        │                  │                   │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│ INVENTORY      │  │  REPORTING   │  │ NOTIFICATION   │
│ SERVICE        │  │  SERVICE     │  │ SERVICE        │
│ (Node.js)      │  │  (Node.js)   │  │ (Node.js)      │
│                │  │              │  │                │
│ - Products     │  │ - Analytics  │  │ - Email        │
│ - Stock        │  │ - Sales      │  │ - SMS          │
│ - Suppliers    │  │ - Exports    │  │ - Push         │
│ - Transfers    │  │ - Charts     │  │ - WhatsApp     │
└───────┬────────┘  └──────┬───────┘  └───────┬────────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
┌───────▼────────┐  ┌──────▼───────┐  ┌──────▼───────┐
│  POSTGRESQL    │  │    REDIS     │  │   RABBITMQ   │
│  (Primary DB)  │  │   (Cache)    │  │ (Message Q)  │
│                │  │              │  │              │
│ - Transactions │  │ - Sessions   │  │ - Fiscal Q   │
│ - Products     │  │ - Cache      │  │ - Email Q    │
│ - Users        │  │ - Rate Limit │  │ - Reports Q  │
│ - Inventory    │  │ - Pub/Sub    │  │ - Jobs       │
└────────────────┘  └──────────────┘  └──────────────┘
        │
        │
┌───────▼────────┐
│  S3 / SPACES   │
│ (File Storage) │
│                │
│ - Receipts     │
│ - Product Imgs │
│ - Backups      │
│ - Exports      │
└────────────────┘
```

---

## 🛠️ **TECHNOLOGY STACK DECISIONS**

### **Why These Technologies?**

#### **Frontend: Next.js 14+ (React)**
✅ **Server-Side Rendering (SSR)** - Fast initial load, SEO-friendly
✅ **File-based Routing** - Easy to organize
✅ **API Routes** - Backend for Frontend (BFF) pattern
✅ **Image Optimization** - Built-in
✅ **TypeScript** - Type safety
✅ **Large Ecosystem** - Many libraries, easy to hire developers

**Alternatives Considered:**
- ❌ Vue/Nuxt - Smaller talent pool in Albania/Kosovo
- ❌ Angular - Too heavy, slower development
- ❌ Svelte/SvelteKit - Too new, risky for production

#### **Backend: Node.js + Fastify**
✅ **JavaScript Everywhere** - Same language as frontend
✅ **Fastify = Fastest** - 2x faster than Express, benchmarks prove it
✅ **Async by Default** - Perfect for I/O-heavy apps (DB, APIs)
✅ **Great TypeScript Support** - Type-safe
✅ **Schema Validation** - Built-in (vs Express needs middleware)
✅ **Large Plugin Ecosystem** - Auth, CORS, etc.

**Alternatives Considered:**
- ❌ Go - Faster, but harder to hire, longer development time
- ❌ Python/FastAPI - Slower than Node.js, less JavaScript synergy
- ❌ PHP/Laravel - Old school, slower, not modern

#### **Database: PostgreSQL 15+**
✅ **ACID Compliance** - Critical for financial transactions
✅ **Transactions & Locks** - Prevent double-spending
✅ **JSON Support** - Flexible data when needed
✅ **Full-Text Search** - Built-in
✅ **Mature & Stable** - 30+ years of development
✅ **Excellent Performance** - With proper indexes
✅ **Row-Level Security** - Multi-tenancy support

**Alternatives Considered:**
- ❌ MySQL - Less advanced features, weaker JSON support
- ❌ MongoDB - No ACID, dangerous for financial data
- ❌ SQLite - Not scalable for multi-user

#### **Cache: Redis 7+**
✅ **Blazing Fast** - In-memory, microsecond latency
✅ **Versatile** - Cache, sessions, pub/sub, queues
✅ **Data Structures** - Strings, hashes, sets, sorted sets
✅ **Persistence** - Can save to disk
✅ **Clustering** - Scale horizontally

#### **Message Queue: RabbitMQ**
✅ **Reliable** - Guaranteed message delivery
✅ **Flexible Routing** - Topic exchanges, dead letter queues
✅ **Management UI** - Easy monitoring
✅ **Battle-Tested** - Used by thousands of companies

**Alternatives Considered:**
- ❌ Kafka - Overkill for our scale, complex setup
- ❌ Redis Pub/Sub - Less reliable, no persistence

#### **Mobile: React Native + Expo**
✅ **One Codebase** - iOS + Android
✅ **React Knowledge** - Same as web
✅ **Expo** - Easy build & deploy
✅ **Large Community** - Many packages
✅ **Hot Reload** - Fast development

**Alternatives Considered:**
- ❌ Flutter - Different language (Dart), separate team needed
- ❌ Native (Swift/Kotlin) - 2x development time, 2x cost

#### **ORM: Prisma**
✅ **Type-Safe** - Auto-generated TypeScript types
✅ **Migrations** - Easy database schema changes
✅ **Query Builder** - Intuitive API
✅ **Performance** - Optimized queries
✅ **Multi-Database** - Can switch DB if needed

**Alternatives Considered:**
- ❌ TypeORM - Less type-safe, more boilerplate
- ❌ Sequelize - Outdated, slow
- ❌ Knex.js - Too low-level, more code

---

## 🧩 **SYSTEM COMPONENTS**

### **1. API Gateway**

**Purpose:** Single entry point for all API requests

**Responsibilities:**
- Authenticate requests (JWT validation)
- Rate limiting (per user, per IP)
- Request routing to correct service
- API versioning
- Request/response logging
- CORS handling
- Circuit breaker (if service down, fail gracefully)

**Tech Stack:**
- Fastify
- fastify-jwt (authentication)
- fastify-rate-limit (rate limiting)
- fastify-cors (CORS)

**Endpoints:**
```
/v1/auth/*           → Auth Service
/v1/pos/*            → POS Service
/v1/fiscal/*         → Fiscal Service
/v1/inventory/*      → Inventory Service
/v1/reports/*        → Reporting Service
/v1/notifications/*  → Notification Service
```

---

### **2. Auth Service**

**Purpose:** Handle all authentication and authorization

**Features:**
- User registration
- Email verification
- Login (JWT tokens)
- Refresh tokens
- Password reset
- Two-factor authentication (2FA)
- Role-based access control (RBAC)
- Multi-tenant user management

**Database Tables:**
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `password_resets`
- `email_verifications`

**API Endpoints:**
```
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/logout
POST   /v1/auth/refresh
POST   /v1/auth/forgot-password
POST   /v1/auth/reset-password
POST   /v1/auth/verify-email
GET    /v1/auth/me
PUT    /v1/auth/profile
```

---

### **3. POS Service**

**Purpose:** Handle point-of-sale transactions

**Features:**
- Shopping cart management
- Transaction processing
- Payment handling
- Receipt generation
- Returns & refunds
- Split payments
- Discounts & promotions

**Database Tables:**
- `transactions`
- `transaction_items`
- `payments`
- `receipts`
- `returns`
- `carts` (temporary, or in Redis)

**API Endpoints:**
```
POST   /v1/pos/cart
PUT    /v1/pos/cart/:id
DELETE /v1/pos/cart/:id
POST   /v1/pos/checkout
GET    /v1/pos/transactions
GET    /v1/pos/transactions/:id
POST   /v1/pos/returns
POST   /v1/pos/void/:id
```

---

### **4. Fiscal Service**

**Purpose:** Integration with tax authorities

**Features:**
- Albania Tax Authority API integration
- Kosovo Tax Authority API integration
- Fiscal receipt submission
- E-invoice generation
- QR code generation
- Retry logic (if API down)
- Offline queue (submit when back online)

**External APIs:**
- Albania NUIS API
- Kosovo Tax Administration API

**Database Tables:**
- `fiscal_receipts`
- `fiscal_queue` (failed submissions)
- `fiscal_logs`

**API Endpoints:**
```
POST   /v1/fiscal/submit
GET    /v1/fiscal/status/:id
GET    /v1/fiscal/receipts
POST   /v1/fiscal/retry/:id
POST   /v1/fiscal/e-invoice
```

**Workflow:**
```
1. Transaction completed in POS
2. POS calls Fiscal Service
3. Fiscal Service formats data for tax authority
4. Submit to Albania/Kosovo API
5. Receive fiscal number (NSLF)
6. Generate QR code
7. Return to POS
8. POS prints receipt with fiscal data

If fails:
- Save to fiscal_queue
- Retry every 5 minutes (BullMQ job)
- Alert admin if fails > 10 times
```

---

### **5. Inventory Service**

**Purpose:** Manage products and stock

**Features:**
- Product CRUD
- Categories
- Variants (size, color, etc.)
- Stock tracking
- Stock adjustments
- Purchase orders
- Suppliers
- Stock transfers (multi-location)
- Batch/lot tracking
- Low stock alerts

**Database Tables:**
- `products`
- `categories`
- `product_variants`
- `stock`
- `stock_movements`
- `purchase_orders`
- `suppliers`
- `stock_transfers`

**API Endpoints:**
```
GET    /v1/products
POST   /v1/products
GET    /v1/products/:id
PUT    /v1/products/:id
DELETE /v1/products/:id
POST   /v1/products/:id/variants
GET    /v1/stock
POST   /v1/stock/adjust
GET    /v1/stock/movements
POST   /v1/purchase-orders
GET    /v1/suppliers
```

---

### **6. Reporting Service**

**Purpose:** Generate reports and analytics

**Features:**
- Sales reports
- Product performance
- Tax reports
- Employee performance
- Export to Excel/PDF
- Real-time dashboard data
- Scheduled reports (email)

**Data Sources:**
- PostgreSQL (transactional data)
- Redis (real-time aggregations)
- ClickHouse (optional, for time-series analytics)

**API Endpoints:**
```
GET    /v1/reports/sales
GET    /v1/reports/products
GET    /v1/reports/tax
GET    /v1/reports/employees
GET    /v1/reports/dashboard
POST   /v1/reports/export
POST   /v1/reports/schedule
```

---

### **7. Notification Service**

**Purpose:** Send notifications to users

**Features:**
- Email (transactional & marketing)
- SMS
- Push notifications (mobile)
- WhatsApp Business (optional)
- In-app notifications

**External Services:**
- SendGrid/Mailgun (email)
- Twilio (SMS)
- Firebase Cloud Messaging (push)
- WhatsApp Business API (optional)

**API Endpoints:**
```
POST   /v1/notifications/email
POST   /v1/notifications/sms
POST   /v1/notifications/push
GET    /v1/notifications
PUT    /v1/notifications/:id/read
```

---

## 🗄️ **DATABASE SCHEMA**

### **Core Tables**

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

#### **tenants** (businesses)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_type VARCHAR(50), -- retail, restaurant, etc.
  nipt VARCHAR(20), -- Tax ID
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(2), -- AL, XK
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  subscription_plan VARCHAR(50), -- basic, professional, enterprise
  subscription_status VARCHAR(50), -- active, suspended, cancelled
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
```

#### **roles**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(50) NOT NULL, -- owner, manager, cashier, accountant
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_roles_tenant_name ON roles(tenant_id, name);
```

#### **permissions**
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- pos.create, inventory.edit, etc.
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **user_roles**
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
```

#### **role_permissions**
```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

#### **products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  category_id UUID REFERENCES categories(id),
  cost_price DECIMAL(10, 2),
  selling_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 20.00, -- VAT %
  unit VARCHAR(20), -- pieces, kg, liters
  track_inventory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
```

#### **categories**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

#### **stock**
```sql
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  quantity DECIMAL(10, 2) DEFAULT 0,
  low_stock_threshold DECIMAL(10, 2) DEFAULT 10,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_stock_product_location ON stock(product_id, location_id);
CREATE INDEX idx_stock_tenant ON stock(tenant_id);
```

#### **stock_movements**
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  type VARCHAR(50), -- in, out, adjustment, transfer, sale, return
  quantity DECIMAL(10, 2) NOT NULL,
  reference_id UUID, -- transaction_id, purchase_order_id, etc.
  reference_type VARCHAR(50),
  notes TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);
```

#### **transactions**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID REFERENCES locations(id),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50), -- completed, voided, refunded
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id), -- cashier
  fiscal_receipt_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  voided_at TIMESTAMP,
  voided_by UUID REFERENCES users(id)
);

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
```

#### **transaction_items**
```sql
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
```

#### **payments**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  payment_method VARCHAR(50), -- cash, card, mobile, bank_transfer
  amount DECIMAL(10, 2) NOT NULL,
  reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_transaction ON payments(transaction_id);
```

#### **fiscal_receipts**
```sql
CREATE TABLE fiscal_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  country VARCHAR(2), -- AL, XK
  fiscal_number VARCHAR(100), -- NSLF from tax authority
  qr_code TEXT,
  submission_status VARCHAR(50), -- pending, submitted, failed
  submitted_at TIMESTAMP,
  response_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fiscal_receipts_tenant ON fiscal_receipts(tenant_id);
CREATE INDEX idx_fiscal_receipts_transaction ON fiscal_receipts(transaction_id);
CREATE INDEX idx_fiscal_receipts_status ON fiscal_receipts(submission_status);
```

#### **locations**
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- store, warehouse
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_tenant ON locations(tenant_id);
```

#### **customers**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  birthday DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
```

---

## 🔒 **SECURITY ARCHITECTURE**

### **Authentication Flow**

```
1. User submits email + password
   ↓
2. API validates credentials
   ↓
3. Generate JWT access token (15 min expiry)
   ↓
4. Generate refresh token (30 days, stored in DB)
   ↓
5. Return both tokens
   ↓
6. Frontend stores:
   - Access token: Memory (not localStorage!)
   - Refresh token: HttpOnly cookie
   ↓
7. Every API request: Send access token in header
   ↓
8. When access token expires:
   - Frontend calls /refresh with refresh token
   - Get new access token
```

### **JWT Payload**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "roles": ["cashier"],
  "permissions": ["pos.create", "pos.read"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

### **Authorization (RBAC)**

```typescript
// Middleware: Check permission
async function requirePermission(permission: string) {
  return async (request, reply) => {
    const user = request.user; // from JWT
    const hasPermission = user.permissions.includes(permission);
    
    if (!hasPermission) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
}

// Usage
fastify.get('/v1/reports/sales', {
  preHandler: requirePermission('reports.read')
}, async (request, reply) => {
  // Handler code
});
```

### **Multi-Tenancy (Row-Level Security)**

```typescript
// Prisma middleware: Auto-filter by tenant
prisma.$use(async (params, next) => {
  const tenantId = getCurrentTenantId(); // from JWT
  
  if (params.model && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      tenantId
    };
  }
  
  return next(params);
});
```

### **Rate Limiting**

```typescript
// Global rate limit: 100 requests per minute
fastify.register(require('fastify-rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
  redis: redisClient // shared across instances
});

// Endpoint-specific: Login attempts
fastify.post('/v1/auth/login', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '5 minutes'
    }
  }
}, async (request, reply) => {
  // Handler
});
```

### **Data Encryption**

- **At Rest:** PostgreSQL encryption (LUKS/dm-crypt)
- **In Transit:** TLS 1.3 (HTTPS everywhere)
- **Passwords:** bcrypt (cost factor 12)
- **Sensitive Data:** AES-256-GCM (e.g., payment tokens)

### **Input Validation**

```typescript
// Using Zod schema
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  selling_price: z.number().positive(),
  cost_price: z.number().optional(),
  category_id: z.string().uuid().optional()
});

fastify.post('/v1/products', async (request, reply) => {
  const validated = createProductSchema.parse(request.body);
  // Create product
});
```

---

## ☁️ **INFRASTRUCTURE & DEPLOYMENT**

### **Development Environment**

```
Local Machine:
- Docker Compose (PostgreSQL, Redis, RabbitMQ)
- Next.js dev server (port 3000)
- Fastify API (port 5000)
- Hot reload enabled
```

### **Staging Environment**

```
Server: DigitalOcean Droplet (4GB RAM, 2 vCPU)
- Docker Compose
- PostgreSQL
- Redis
- RabbitMQ
- Next.js (production build)
- Fastify API
- NGINX reverse proxy
- SSL (Let's Encrypt)
- Domain: staging.fiscalnext.com
```

### **Production Environment (Phase 1 - Small Scale)**

```
Cloud Provider: DigitalOcean or AWS

Components:
1. Load Balancer
   - 1x Load Balancer (managed)
   - SSL termination
   - Health checks

2. Application Servers
   - 2x Droplets (8GB RAM, 4 vCPU each)
   - Docker containers:
     - 3x Next.js instances
     - 3x Fastify API instances
   - Auto-scaling ready

3. Database
   - 1x Managed PostgreSQL (4GB RAM, 2 vCPU)
   - Daily automated backups
   - Point-in-time recovery enabled
   - Read replicas (when needed)

4. Cache & Queue
   - 1x Managed Redis (2GB RAM)
   - 1x Droplet for RabbitMQ (2GB RAM)

5. File Storage
   - DigitalOcean Spaces (S3-compatible)
   - CDN enabled (Cloudflare)

6. Monitoring
   - Prometheus + Grafana (on separate droplet)
   - Sentry (cloud)

Total Monthly Cost: €300-500
```

### **Production Environment (Phase 2 - Scaled)**

```
When you have 100+ customers:

Cloud Provider: AWS or DigitalOcean Kubernetes

Components:
1. Kubernetes Cluster (3 nodes, 8GB each)
2. Managed PostgreSQL (scaled up)
3. Managed Redis (scaled up)
4. ElastiCache or Redis Cluster
5. RDS or Managed DB with replicas
6. S3/Spaces for storage
7. CloudFront/Cloudflare CDN

Auto-scaling:
- Scale API pods based on CPU (50-80% threshold)
- Scale database connections
- Read replicas for heavy read operations

Total Monthly Cost: €800-1,500
```

### **CI/CD Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: docker build -t fiscalnext-api .
      
      - name: Push to registry
        run: docker push fiscalnext-api
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: kubectl apply -f k8s/
      
      - name: Verify deployment
        run: kubectl rollout status deployment/api
```

---

## ⚡ **PERFORMANCE & SCALABILITY**

### **Performance Targets**

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| API Response Time | < 200ms | Redis caching, optimized queries, indexes |
| Page Load Time | < 3s | SSR, code splitting, image optimization, CDN |
| Transaction Processing | < 2s | Async fiscal submission, optimized DB |
| Concurrent Users | 1000+ | Horizontal scaling, load balancing |
| Database Queries | < 50ms | Proper indexes, query optimization |
| Uptime | 99.9% | Redundancy, health checks, auto-recovery |

### **Caching Strategy**

```typescript
// Redis caching layers

// 1. Session cache (15 min)
redis.set(`session:${userId}`, sessionData, 'EX', 900);

// 2. Product catalog (1 hour, invalidate on update)
redis.set(`products:${tenantId}`, products, 'EX', 3600);

// 3. Dashboard stats (5 min)
redis.set(`dashboard:${tenantId}:${date}`, stats, 'EX', 300);

// 4. Rate limiting (1 min window)
redis.incr(`rate:${userId}:${endpoint}`);
redis.expire(`rate:${userId}:${endpoint}`, 60);
```

### **Database Optimization**

```sql
-- Critical indexes
CREATE INDEX idx_transactions_tenant_created ON transactions(tenant_id, created_at DESC);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_active);
CREATE INDEX idx_stock_movements_product_created ON stock_movements(product_id, created_at DESC);

-- Partial indexes (smaller, faster)
CREATE INDEX idx_active_products ON products(tenant_id) WHERE is_active = true;
CREATE INDEX idx_pending_fiscal ON fiscal_receipts(tenant_id) WHERE submission_status = 'pending';

-- Full-text search
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name));
```

### **Query Optimization Example**

```typescript
// ❌ Bad: N+1 query problem
const transactions = await prisma.transaction.findMany();
for (const tx of transactions) {
  tx.items = await prisma.transactionItem.findMany({
    where: { transactionId: tx.id }
  });
}

// ✅ Good: Single query with include
const transactions = await prisma.transaction.findMany({
  include: {
    items: true,
    customer: true,
    user: {
      select: { firstName: true, lastName: true }
    }
  }
});
```

### **Horizontal Scaling**

```
Load Balancer
    ↓
[API-1] [API-2] [API-3] ... (scale to N instances)
    ↓
PostgreSQL (with read replicas)
Redis (cluster mode)
```

---

## 📊 **MONITORING & OBSERVABILITY**

### **Metrics to Track (Prometheus)**

```
# Application metrics
http_requests_total{method, endpoint, status}
http_request_duration_seconds{method, endpoint}
active_users_total
transactions_total
fiscal_submissions_total{status}

# System metrics
cpu_usage_percent
memory_usage_bytes
disk_usage_percent
network_throughput_bytes

# Database metrics
db_connections_active
db_query_duration_seconds
db_pool_size
```

### **Alerting Rules**

```yaml
# Prometheus alerts
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: SlowApiResponse
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        for: 5m
        annotations:
          summary: "API response time > 1s"
      
      - alert: DatabaseDown
        expr: up{job="postgresql"} == 0
        for: 1m
        annotations:
          summary: "PostgreSQL is down!"
```

### **Logging Strategy**

```typescript
// Structured logging with Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

// Usage
logger.info({ 
  userId, 
  tenantId, 
  action: 'transaction_created',
  transactionId,
  amount 
}, 'Transaction created');

// Error logging
logger.error({ 
  err,
  userId,
  endpoint: '/v1/fiscal/submit',
  fiscalReceiptId 
}, 'Fiscal submission failed');
```

### **Error Tracking (Sentry)**

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of requests
});

// Capture errors
try {
  await submitFiscalReceipt(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: 'fiscal' },
    extra: { receiptId, tenantId }
  });
  throw error;
}
```

---

## 🔄 **DEVELOPMENT WORKFLOW**

### **Git Branching Strategy**

```
main          ← Production-ready code
  ↑
develop       ← Integration branch
  ↑
feature/xyz   ← Feature branches
bugfix/abc    ← Bug fix branches
hotfix/urgent ← Emergency fixes
```

### **Pull Request Process**

```
1. Create feature branch: git checkout -b feature/pos-discount
2. Develop feature + write tests
3. Commit with conventional commits:
   - feat: Add discount functionality to POS
   - fix: Resolve calculation rounding error
   - docs: Update API documentation
4. Push and create PR
5. Automated checks:
   - ✅ Tests pass
   - ✅ Linting passes
   - ✅ TypeScript compiles
   - ✅ Build succeeds
6. Code review (1-2 approvals)
7. Merge to develop
8. Auto-deploy to staging
9. QA testing on staging
10. Merge to main → Auto-deploy to production
```

### **Testing Strategy**

```
1. Unit Tests (Jest)
   - Test individual functions
   - 80%+ code coverage target

2. Integration Tests (Supertest)
   - Test API endpoints
   - Test database operations

3. E2E Tests (Playwright)
   - Test complete user flows
   - Critical paths (login, sale, receipt)

4. Load Tests (k6)
   - Simulate 100-1000 concurrent users
   - Identify bottlenecks

5. Manual QA
   - Test on real devices
   - Test edge cases
   - UX testing
```

### **Code Quality**

```json
// .eslintrc.json
{
  "extends": ["next", "prettier"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error"
  }
}

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

---

## 📦 **PROJECT STRUCTURE**

```
fiscalnext/
├── apps/
│   ├── web-admin/                 # Next.js Admin Dashboard
│   │   ├── src/
│   │   │   ├── app/               # App router (Next.js 13+)
│   │   │   ├── components/        # React components
│   │   │   ├── lib/               # Utilities
│   │   │   └── styles/            # Global styles
│   │   ├── public/                # Static assets
│   │   └── package.json
│   │
│   ├── web-pos/                   # Next.js POS Interface
│   │   └── (similar structure)
│   │
│   ├── api/                       # Node.js Backend
│   │   ├── src/
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── auth/
│   │   │   │   ├── pos/
│   │   │   │   ├── fiscal/
│   │   │   │   ├── inventory/
│   │   │   │   └── reporting/
│   │   │   ├── routes/            # API routes
│   │   │   ├── middleware/        # Auth, RBAC, etc.
│   │   │   ├── utils/             # Helpers
│   │   │   └── server.ts          # Fastify server
│   │   └── package.json
│   │
│   └── mobile/                    # React Native
│       ├── src/
│       ├── android/
│       ├── ios/
│       └── package.json
│
├── packages/
│   ├── database/                  # Prisma schema
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   ├── ui/                        # Shared UI components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── types/                     # TypeScript types
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── utils/                     # Shared utilities
│       ├── src/
│       │   ├── date.ts
│       │   ├── currency.ts
│       │   └── ...
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── docker-compose.yml
│   ├── kubernetes/
│   │   ├── api-deployment.yaml
│   │   ├── web-deployment.yaml
│   │   └── ...
│   └── terraform/                 # Infrastructure as code
│
├── docs/
│   ├── API.md                     # API documentation
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
├── turbo.json                     # Turborepo config
├── package.json
└── README.md
```

---

## ✅ **SUMMARY: WHY THIS ARCHITECTURE?**

### **Strengths:**
✅ **Scalable** - Microservices can scale independently
✅ **Fast** - Caching, optimized queries, CDN
✅ **Reliable** - Redundancy, health checks, monitoring
✅ **Secure** - Multi-layer security, RBAC, encryption
✅ **Maintainable** - Clean code, TypeScript, monorepo
✅ **Modern** - Latest technologies (Next.js 14, Fastify, Prisma)
✅ **Cost-Effective** - Start small (€300/mo), scale as needed

### **Trade-offs:**
⚠️ **Complexity** - More moving parts than monolith (but manageable)
⚠️ **DevOps Required** - Need DevOps skills (but worth it)
⚠️ **Initial Setup Time** - Takes 1-2 weeks (but pays off)

---

## 🚀 **NEXT STEPS**

1. ✅ Review this architecture with CTO
2. ✅ Make any final adjustments
3. ✅ Create GitHub repos
4. ✅ Setup monorepo (Turborepo)
5. ✅ Initialize Prisma schema
6. ✅ Setup Docker Compose for local dev
7. ✅ Start Sprint 1 (Week 2)

**Ready to build? Let's go! 🔥**
