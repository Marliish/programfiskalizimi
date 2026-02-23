# @fiscalnext/database

Shared database schema and Prisma client for the FiscalNext platform.

## Setup

1. Copy `.env.example` to `.env` and configure your database URL
2. Generate Prisma client: `npm run db:generate`
3. Run migrations: `npm run db:migrate`
4. (Optional) Open Prisma Studio: `npm run db:studio`

## Database Schema

See `prisma/schema.prisma` for the complete schema.

### Core Entities

- **Tenant**: Multi-tenant business accounts
- **User**: Platform users with RBAC
- **Product**: Inventory items
- **Transaction**: Sales/POS transactions
- **FiscalReceipt**: Tax authority submissions

### Multi-Tenancy

All tables include `tenantId` for row-level security. Prisma middleware automatically filters queries by tenant.

## Migrations

Development:
```bash
npm run db:migrate
```

Production:
```bash
npm run db:migrate:deploy
```

## Commands

- `db:generate` - Generate Prisma Client
- `db:push` - Push schema changes (dev only)
- `db:migrate` - Create and apply migrations
- `db:migrate:deploy` - Apply migrations (production)
- `db:studio` - Open Prisma Studio GUI
- `db:seed` - Seed database with initial data
