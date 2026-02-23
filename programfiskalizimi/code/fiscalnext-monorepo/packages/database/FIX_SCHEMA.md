# How to Fix Prisma Schema Validation Errors

## Problem
The schema has 23 validation errors due to missing opposite relation fields in models.

## Solution

### Option 1: Quick Fix (Recommended)
Restore to a working schema state and rebuild:

```bash
cd packages/database

# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.broken

# Restore from git (if available)
git checkout prisma/schema.prisma

# OR use the .backup file if it's clean
# cp prisma/schema.prisma.backup prisma/schema.prisma

# Test generation
npm run db:generate
```

### Option 2: Manual Fix
Add the missing relations to these models:

#### 1. Tenant Model (add to relations section)
```prisma
model Tenant {
  // ... existing fields ...
  
  // Relations
  // ... existing relations ...
  
  // Advanced Inventory (Day 13)
  suppliers          Supplier[]
  purchaseOrders     PurchaseOrder[]
  purchaseReceipts   PurchaseReceipt[]
  batches            Batch[]
  batchMovements     BatchMovement[]
  recipes            Recipe[]
  assemblyOrders     AssemblyOrder[]
  workOrders         WorkOrder[]
  qualityChecks      QualityCheck[]
}
```

#### 2. Product Model (add to relations section)
```prisma
model Product {
  // ... existing fields ...
  
  // Relations
  // ... existing relations ...
  
  // E-commerce
  productVariants      ProductVariant[]
  productImages        ProductImage[]
  reviews              ProductReview[]
  cartItems            CartItem[]
  wishlistItems        WishlistItem[]
  onlineOrderItems     OnlineOrderItem[]
  
  // Advanced Inventory
  supplierProducts     SupplierProduct[]
  purchaseOrderItems   PurchaseOrderItem[]
  purchaseReceiptItems PurchaseReceiptItem[]
  batches              Batch[]
  batchMovements       BatchMovement[]
  recipeIngredients    RecipeIngredient[] @relation("RecipeIngredients")
  recipes              Recipe[]
  assemblyOrders       AssemblyOrder[] @relation("AssemblyProduct")
  assemblyComponents   AssemblyComponent[] @relation("AssemblyComponents")
}
```

#### 3. Location Model (add to relations section)
```prisma
model Location {
  // ... existing fields ...
  
  // Relations
  // ... existing relations ...
  
  // Advanced Inventory
  purchaseOrders   PurchaseOrder[]
  purchaseReceipts PurchaseReceipt[]
  batches          Batch[]
  assemblyOrders   AssemblyOrder[]
}
```

#### 4. Customer Model (add to relations section)
```prisma
model Customer {
  // ... existing fields ...
  
  // Relations
  // ... existing relations ...
  
  // E-commerce
  carts               Cart[]
  wishlist            Wishlist?
  onlineOrders        OnlineOrder[]
  reviews             ProductReview[]
  shippingAddresses   ShippingAddress[]
  savedPaymentMethods SavedPaymentMethod[]
}
```

#### 5. Employee Model (if exists, add):
```prisma
model Employee {
  // ... existing fields ...
  
  // Relations
  // ... existing relations ...
  
  onboardingChecklists OnboardingChecklist[]
}
```

### Option 3: Start Fresh with E-Commerce Only
Create a new clean schema with just core + e-commerce models:

```bash
cd packages/database

# Backup everything
cp prisma/schema.prisma prisma/schema.prisma.full

# Create minimal schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Include only:
// - Core models (Tenant, User, Product, Category, Customer)
// - E-commerce models (Cart, Orders, Payments, etc.)
// - Skip advanced inventory temporarily

EOF

# Then manually add models from schema.prisma.full
# Start with Tenant, User, Product, Category, Customer
# Then add all E-commerce models
# Test after each addition:
npm run db:generate
```

## Verification Steps

After fixing:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. If successful, create migration
npm run db:migrate

# 3. Check database
npm run db:studio
```

## Common Errors

### "Field X is already defined"
- You have duplicate field names in the same model
- Search for the field name and remove duplicates

### "Type X is not defined"
- The model you're referencing doesn't exist
- Check spelling and ensure model is defined before it's used

### "Missing opposite relation"
- Add the reverse relation in the related model
- Example: If Order has `customer Customer[]`, then Customer needs `orders Order[]`

## Best Practices

1. **One relation at a time** - Add and test incrementally
2. **Use @relation names** - For clarity on complex relations
3. **Follow Prisma naming** - camelCase for fields, PascalCase for models
4. **Test migrations** - Always test on dev DB first

## Need Help?

Check the Prisma docs:
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Troubleshooting](https://www.prisma.io/docs/guides/general-guides/troubleshooting)
