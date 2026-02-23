# FiscalNext Backend API

**Senior Backend Developer:** David  
**Tech Stack:** Node.js, Fastify, PostgreSQL, Prisma  
**Started:** 2026-02-23

## 📁 Project Structure

```
backend/
├── apps/api/                 # Main API application
│   ├── src/
│   │   ├── middleware/       # Authentication, validation
│   │   ├── routes/           # API route handlers
│   │   │   ├── auth.ts       # Authentication routes
│   │   │   ├── pos.ts        # Point of Sale routes
│   │   │   ├── products.ts   # Product management routes
│   │   │   └── fiscal.ts     # Fiscal compliance routes
│   │   ├── services/         # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── pos.service.ts
│   │   │   ├── product.service.ts
│   │   │   └── fiscal.service.ts
│   │   └── server.ts         # Fastify server setup
│   ├── .env                  # Environment variables
│   └── package.json
│
└── packages/database/        # Shared database package
    ├── prisma/
    │   └── schema.prisma     # Database schema
    ├── src/
    │   └── index.ts          # Prisma client export
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (we're using v24.4.1)
- PostgreSQL 15+
- pnpm (package manager)

### Installation

1. **Install dependencies** (from monorepo root):
   ```bash
   cd /path/to/fiscalnext-monorepo
   pnpm install
   ```

2. **Setup environment variables**:
   ```bash
   cd apps/api
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Generate Prisma Client**:
   ```bash
   cd packages/database
   pnpm prisma generate
   ```

4. **Run database migrations**:
   ```bash
   pnpm prisma migrate dev --name init
   ```

5. **Start development server**:
   ```bash
   cd apps/api
   pnpm dev
   ```

Server will start at `http://localhost:5000`

## 📝 Environment Variables

Create `.env` file in `apps/api/`:

```env
# Server
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fiscalnext_dev"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## 🔌 API Endpoints

### Authentication (`/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/auth/register` | Register new user & business | No |
| POST | `/v1/auth/login` | Login user | No |
| GET | `/v1/auth/me` | Get current user | Yes |

### Point of Sale (`/v1/pos`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/pos/transactions` | Create new sale | Yes |
| GET | `/v1/pos/transactions` | List transactions | Yes |
| GET | `/v1/pos/transactions/:id` | Get transaction details | Yes |
| POST | `/v1/pos/transactions/:id/void` | Void transaction | Yes |

### Products (`/v1/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/products` | Create product | Yes |
| GET | `/v1/products` | List products | Yes |
| GET | `/v1/products/:id` | Get product details | Yes |
| PUT | `/v1/products/:id` | Update product | Yes |
| DELETE | `/v1/products/:id` | Delete product | Yes |
| POST | `/v1/stock/adjust` | Adjust stock quantity | Yes |

### Fiscal Compliance (`/v1/fiscal`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/fiscal/submit` | Submit fiscal receipt | Yes |
| GET | `/v1/fiscal/receipt/:transactionId` | Get fiscal receipt | Yes |
| POST | `/v1/fiscal/retry-failed` | Retry failed submissions | Yes |

## 📦 Database Schema

Key models:
- **Tenant** - Business/organization
- **User** - Users with role-based access
- **Product** - Products/services
- **Stock** - Inventory tracking
- **Transaction** - Sales/purchases
- **TransactionItem** - Line items
- **Payment** - Payment records
- **FiscalReceipt** - Tax compliance receipts
- **Category** - Product categories
- **Customer** - Customer records
- **Location** - Store/warehouse locations

See `packages/database/prisma/schema.prisma` for complete schema.

## 🔐 Authentication

Uses JWT (JSON Web Tokens) for authentication.

**Login Flow:**
1. User sends credentials to `/v1/auth/login`
2. Server validates credentials
3. Server returns JWT token
4. Client includes token in `Authorization` header: `Bearer <token>`
5. Protected routes verify token before processing

**Token Payload:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "roles": ["owner"],
  "permissions": ["pos.create", "inventory.edit"]
}
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📊 Database Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Create migration
pnpm db:migrate

# Push schema without migration
pnpm db:push

# Open Prisma Studio (database GUI)
pnpm db:studio

# Seed database with test data
pnpm db:seed
```

## 🏗️ Architecture Decisions

### Why Fastify?
- **2x faster** than Express
- Built-in schema validation
- TypeScript support out of the box
- Plugin ecosystem

### Why Prisma?
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations
- Multi-database support

### Service Layer Pattern
- **Routes** handle HTTP requests/responses
- **Services** contain business logic
- **Prisma** handles database operations
- Clean separation of concerns

## 📚 Next Steps (Day 2+)

- [ ] Implement email notifications
- [ ] Add input validation (Zod schemas)
- [ ] Complete Albania fiscal API integration
- [ ] Complete Kosovo fiscal API integration
- [ ] Add unit tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement refresh tokens
- [ ] Add rate limiting per user
- [ ] Implement audit logging
- [ ] Add background job processing (for fiscal submissions)

## 🐛 Common Issues

**Issue:** Prisma Client not found
```bash
cd packages/database && pnpm prisma generate
```

**Issue:** Port 5000 already in use
```bash
# Change PORT in .env file
PORT=5001
```

**Issue:** Database connection error
```bash
# Verify PostgreSQL is running
psql -U postgres

# Check DATABASE_URL in .env
```

## 📞 Contact

**Backend Team Lead:** David  
**Questions?** Check `docs/ARCHITECTURE_BLUEPRINT.md`

---

**Last Updated:** 2026-02-23  
**Version:** 0.1.0 (MVP)
