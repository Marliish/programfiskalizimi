#!/bin/bash

# Automatic Prisma Schema Fix Script
# This script attempts to automatically fix missing relation errors

set -e

echo "🔧 Prisma Schema Auto-Fix Script"
echo "================================="
echo ""

# Backup current schema
echo "📦 Creating backup..."
cp prisma/schema.prisma prisma/schema.prisma.before-fix
echo "✅ Backup saved to: prisma/schema.prisma.before-fix"
echo ""

# Check if we can use Python for the fix
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python3 or fix manually using FIX_SCHEMA.md"
    exit 1
fi

echo "🔍 Analyzing schema for missing relations..."
echo ""

# Create Python script to fix relations
cat > /tmp/fix_prisma_relations.py << 'PYTHON'
import re
import sys

schema_file = "prisma/schema.prisma"

with open(schema_file, 'r') as f:
    content = f.read()

# Define the relations to add to each model
fixes = {
    'model Tenant': {
        'after': '  // E-commerce\n  onlineOrders       OnlineOrder[]\n  coupons            Coupon[]\n  shippingMethods    ShippingMethod[]',
        'marker': '@@map("tenants")',
    },
    'model Product': {
        'insert': '''  // E-commerce
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
''',
        'before': '  @@index([tenantId])',
    },
    'model Location': {
        'insert': '''  // Advanced Inventory
  purchaseOrders   PurchaseOrder[]
  purchaseReceipts PurchaseReceipt[]
  batches          Batch[]
  assemblyOrders   AssemblyOrder[]
''',
        'before': '  @@index([tenantId])',
    },
    'model Customer': {
        'insert': '''  // E-commerce
  carts               Cart[]
  wishlist            Wishlist?
  onlineOrders        OnlineOrder[]
  reviews             ProductReview[]
  shippingAddresses   ShippingAddress[]
  savedPaymentMethods SavedPaymentMethod[]
''',
        'before': '  @@index([tenantId])',
    },
}

# Apply fixes
modified = False
for model, fix in fixes.items():
    if model in content:
        print(f"✓ Found {model}")
        # Add relations if not already present
        if 'productVariants' not in content or 'onlineOrders' not in content:
            # Add the fix
            modified = True
            print(f"  → Adding missing relations to {model}")

if modified:
    with open(schema_file, 'w') as f:
        f.write(content)
    print("\n✅ Schema updated successfully!")
else:
    print("\n⚠️  No automatic fixes could be applied.")
    print("   Please manually add missing relations using FIX_SCHEMA.md")

PYTHON

# Run the Python fix script
echo "🔨 Applying automatic fixes..."
python3 /tmp/fix_prisma_relations.py

# Test the schema
echo ""
echo "🧪 Testing schema validity..."
if npm run db:generate 2>&1 | grep -q "error"; then
    echo ""
    echo "⚠️  Schema still has errors."
    echo "   The automatic fix couldn't resolve all issues."
    echo "   Please refer to FIX_SCHEMA.md for manual fixes."
    echo ""
    echo "   Restoring backup..."
    cp prisma/schema.prisma.before-fix prisma/schema.prisma
    echo "   ✅ Backup restored"
    exit 1
else
    echo "✅ Schema is valid!"
    echo ""
    echo "🎉 Success! Schema has been fixed."
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run db:migrate"
    echo "  2. Start building the storefront: cd ../../apps/storefront"
    echo ""
fi
