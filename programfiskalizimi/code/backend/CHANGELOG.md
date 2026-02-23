# Changelog - FiscalNext Backend API

All notable changes to the backend API will be documented here.

## [Unreleased]

### Planned Features
- Input validation with Zod schemas
- API documentation (Swagger/OpenAPI)
- Refresh token implementation
- Unit & integration tests
- Background job queue
- Email notifications
- Audit logging
- Albania fiscal API integration (production)
- Kosovo fiscal API integration (production)

---

## [0.1.0] - 2026-02-23 (Day 1)

### Added - Initial Release

#### Core Infrastructure
- Fastify server setup with TypeScript
- ES Modules support
- Monorepo structure with pnpm
- Environment configuration
- Logging with Pino (Fastify built-in)

#### Security
- JWT authentication with @fastify/jwt
- CORS configuration
- Helmet security headers
- Rate limiting (100 req/min)
- Password hashing with bcrypt (12 rounds)

#### Database
- PostgreSQL with Prisma ORM
- Complete database schema (14 models):
  - Multi-tenancy (Tenant)
  - User management with RBAC
  - Product & inventory
  - Point of Sale transactions
  - Fiscal compliance
  - Customers & locations
- Type-safe database operations
- Migration system ready

#### Services
- **AuthService**
  - User registration
  - User login
  - JWT token generation
  - Role & permission management
  - 30-day trial setup
  
- **POSService**
  - Create transactions (sales)
  - List transactions with pagination
  - Get transaction details
  - Void transactions
  - Automatic inventory updates
  - Transaction number generation
  
- **ProductService**
  - CRUD operations for products
  - Search & filter products
  - Stock adjustments
  - SKU/barcode uniqueness
  - Soft delete support
  
- **FiscalService**
  - Fiscal receipt submission
  - Albania (NSLF) integration structure
  - Kosovo (FIC) integration structure
  - QR code generation
  - Retry mechanism for failed submissions

#### API Endpoints (v1)
- **Authentication** (`/v1/auth`)
  - POST `/register` - Register user & business
  - POST `/login` - User login
  - GET `/me` - Current user info
  
- **Point of Sale** (`/v1/pos`)
  - POST `/transactions` - Create sale
  - GET `/transactions` - List sales
  - GET `/transactions/:id` - Get sale
  - POST `/transactions/:id/void` - Void sale
  
- **Products** (`/v1/products`)
  - POST `/products` - Create product
  - GET `/products` - List products
  - GET `/products/:id` - Get product
  - PUT `/products/:id` - Update product
  - DELETE `/products/:id` - Delete product
  - POST `/stock/adjust` - Adjust inventory
  
- **Fiscal** (`/v1/fiscal`)
  - POST `/submit` - Submit fiscal receipt
  - GET `/receipt/:transactionId` - Get receipt
  - POST `/retry-failed` - Retry failed

#### Middleware
- Authentication decorator
- JWT verification
- Error handling

#### Documentation
- Comprehensive README
- Quick start guide
- API endpoint documentation
- Day 1 development report
- Changelog (this file)

#### Development Tools
- TypeScript configuration
- Prettier & ESLint setup
- Hot reload with tsx
- Prisma Studio for database GUI

### Technical Decisions
- **Fastify** over Express (2x performance)
- **Prisma** over TypeORM (better TypeScript)
- **ES Modules** over CommonJS (modern JS)
- **Service Layer Pattern** (clean architecture)
- **JWT** for stateless auth
- **pnpm** for monorepo management

### Known Limitations
- No input validation yet (Zod schemas planned)
- Fiscal APIs are placeholders (credentials needed)
- No tests written yet
- No API documentation UI (Swagger planned)
- No background job processing
- No email notifications

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

---

**Maintained by:** David (Backend Developer)  
**Last updated:** 2026-02-23
