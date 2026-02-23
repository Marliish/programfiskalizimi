# 🚀 Quick Start Guide - Backend API

**For developers joining the project**

## ⚡ Start Development in 5 Minutes

### 1. Prerequisites Check
```bash
node --version   # Should be 18+
pnpm --version   # Should be installed
psql --version   # PostgreSQL 15+
```

### 2. Install Dependencies
```bash
cd /path/to/fiscalnext-monorepo
pnpm install
```

### 3. Setup Database
```bash
# Create database
createdb fiscalnext_dev

# Copy environment file
cd apps/api
cp .env.example .env

# Edit .env with your database URL
nano .env
# DATABASE_URL="postgresql://user:password@localhost:5432/fiscalnext_dev"
```

### 4. Run Migrations
```bash
cd packages/database
pnpm prisma migrate dev --name init
```

### 5. Start Server
```bash
cd apps/api
pnpm dev
```

Server runs at `http://localhost:5000`

---

## 📖 Common Commands

```bash
# Start development server
pnpm dev

# Generate Prisma Client (after schema changes)
cd packages/database && pnpm prisma generate

# Create new migration
cd packages/database && pnpm prisma migrate dev --name your_migration_name

# Open Prisma Studio (database GUI)
cd packages/database && pnpm prisma studio

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 🧪 Test the API

### Register a new user
```bash
curl -X POST http://localhost:5000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "businessName": "My Test Shop",
    "firstName": "John",
    "lastName": "Doe",
    "country": "AL"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from response.

### Get current user (authenticated)
```bash
curl http://localhost:5000/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create a product
```bash
curl -X POST http://localhost:5000/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 0.5L",
    "barcode": "123456789",
    "sellingPrice": 1.50,
    "costPrice": 0.80,
    "taxRate": 20,
    "unit": "pieces"
  }'
```

---

## 🗂️ Project Structure

```
apps/api/src/
├── middleware/    # Auth, validation
├── routes/        # HTTP endpoints
├── services/      # Business logic
└── server.ts      # Fastify app

packages/database/
├── prisma/
│   └── schema.prisma
└── src/
    └── index.ts   # Prisma client
```

---

## 🐛 Common Issues

**Database connection error**
```bash
# Check if PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
cat apps/api/.env
```

**Prisma Client not found**
```bash
cd packages/database
pnpm prisma generate
```

**Port 5000 in use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

---

## 📚 Further Reading

- Full API docs: `README.md`
- Architecture: `../../docs/ARCHITECTURE_BLUEPRINT.md`
- Day 1 report: `DAY_1_REPORT.md`

---

**Need help?** Ask David (Backend Lead)
