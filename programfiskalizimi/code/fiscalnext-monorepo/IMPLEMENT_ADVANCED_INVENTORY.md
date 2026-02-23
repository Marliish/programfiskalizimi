# 🚀 IMPLEMENT ADVANCED INVENTORY - Quick Guide

## Step 1: Register API Routes (5 minutes)

Find your main API routes file (usually `apps/api/src/index.ts` or `apps/api/src/plugins/routes.ts`)

Add these imports at the top:
```typescript
import suppliersRoute from './routes/suppliers';
import purchaseOrdersRoute from './routes/purchase-orders';
import batchesRoute from './routes/batches';
import recipesRoute from './routes/recipes';
import assemblyOrdersRoute from './routes/assembly-orders';
```

Then register the routes:
```typescript
// Advanced Inventory Routes (Day 13)
await fastify.register(suppliersRoute, { prefix: '/api/suppliers' });
await fastify.register(purchaseOrdersRoute, { prefix: '/api/purchase-orders' });
await fastify.register(batchesRoute, { prefix: '/api/batches' });
await fastify.register(recipesRoute, { prefix: '/api/recipes' });
await fastify.register(assemblyOrdersRoute, { prefix: '/api/assembly-orders' });
```

## Step 2: Run Database Migration (2 minutes)

```bash
cd packages/database

# Create and run migration
npx prisma migrate dev --name add_advanced_inventory

# Generate Prisma Client
npx prisma generate
```

If migration fails due to existing data, you may need to:
```bash
# Reset database (⚠️ WARNING: Deletes all data!)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push
```

## Step 3: Test API Endpoints (5 minutes)

Start the API server:
```bash
cd apps/api
npm run dev
```

Test with curl or Postman:

### Test Suppliers
```bash
# Create a supplier
curl -X POST http://localhost:3001/api/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Acme Corp",
    "code": "ACME001",
    "email": "sales@acme.com",
    "phone": "+1234567890"
  }'

# List suppliers
curl http://localhost:3001/api/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Purchase Orders
```bash
# Create a PO
curl -X POST http://localhost:3001/api/purchase-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "supplierId": "SUPPLIER_ID_HERE",
    "expectedDate": "2026-03-01",
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "quantityOrdered": 100,
        "unitCost": 5.50
      }
    ]
  }'
```

### Test Recipes
```bash
# Create a recipe
curl -X POST http://localhost:3001/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "name": "Chocolate Cake",
    "yieldQuantity": 1,
    "yieldUnit": "pieces",
    "prepTime": 60,
    "ingredients": [
      {
        "ingredientId": "INGREDIENT_ID_1",
        "quantity": 2,
        "unit": "cups"
      },
      {
        "ingredientId": "INGREDIENT_ID_2",
        "quantity": 0.5,
        "unit": "kg"
      }
    ]
  }'
```

## Step 4: Build Frontend (Mela's Work)

### Navigation Menu
Add to sidebar (e.g., `apps/web-admin/components/Sidebar.tsx`):
```typescript
const inventoryMenuItems = [
  { label: 'Suppliers', href: '/suppliers', icon: TruckIcon },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCartIcon },
  { label: 'Batches', href: '/batches', icon: ArchiveIcon },
  { label: 'Recipes', href: '/recipes', icon: BeakerIcon },
  { label: 'Assembly', href: '/assembly-orders', icon: CogIcon },
];
```

### Example: Suppliers List Page
Create `apps/web-admin/app/suppliers/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const response = await fetch('/api/suppliers');
    const data = await response.json();
    setSuppliers(data.data);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Link href="/suppliers/new">
          <Button>Add Supplier</Button>
        </Link>
      </div>

      <Table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.code}</td>
              <td>{supplier.name}</td>
              <td>{supplier.email}</td>
              <td>{supplier.phone}</td>
              <td>
                <span className={supplier.isActive ? 'text-green-600' : 'text-gray-400'}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <Link href={`/suppliers/${supplier.id}`}>
                  <Button variant="ghost">View</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
```

## Step 5: Testing Checklist

- [ ] API routes respond correctly
- [ ] Database models work with Prisma
- [ ] Can create suppliers
- [ ] Can create purchase orders
- [ ] Can receive inventory (updates stock)
- [ ] Can create recipes with cost calculation
- [ ] Can run assembly orders
- [ ] Stock movements are tracked
- [ ] Batch tracking works

## Need Help?

1. Check `DAY13_ADVANCED_INVENTORY_COMPLETE.md` for full documentation
2. Review API route files for endpoint details
3. Check Prisma schema for model relationships
4. Test endpoints with Postman/Insomnia

---

**Time to Complete:** ~30-60 minutes (backend setup)  
**Frontend:** 4-8 hours (estimated for all pages)  
**Team:** Tafa (Backend ✅) + Mela (Frontend 🚧)
