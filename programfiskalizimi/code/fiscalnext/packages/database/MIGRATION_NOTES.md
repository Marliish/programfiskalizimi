# Database Migration Notes

**Date:** 2026-02-23  
**CTO:** Alex

## Initial Migration

Due to a Prisma v5.22 issue with `gen_random_uuid()` and database access permissions, the initial migration was performed manually via SQL script.

### What Was Done

1. Created manual migration SQL script: `prisma/manual-migration.sql`
2. Executed the script directly against PostgreSQL
3. All 14 core tables created successfully
4. Prisma Client generated and working

### Tables Created

✅ tenants  
✅ users  
✅ roles  
✅ permissions  
✅ user_roles  
✅ role_permissions  
✅ categories  
✅ products  
✅ stock  
✅ stock_movements  
✅ locations  
✅ customers  
✅ transactions  
✅ transaction_items  
✅ payments  
✅ fiscal_receipts

### Future Migrations

For subsequent schema changes, you can use:

```bash
# Create a migration
npx prisma migrate dev --name <migration_name>

# Or push schema changes directly (dev only)
npx prisma db push
```

If you encounter similar access issues, you can always create manual migration SQL files and execute them directly.

### Prisma Client

The Prisma Client has been generated and is available at:
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

### Verification

```sql
-- Check all tables
\dt

-- Check table structure
\d tenants
\d users
-- etc.
```

### Known Issues

- Prisma v5.22 had issues with `dbgenerated("gen_random_uuid()")`
- Switched to manual SQL migration as workaround
- All functionality working correctly
- Future updates to Prisma may resolve this
