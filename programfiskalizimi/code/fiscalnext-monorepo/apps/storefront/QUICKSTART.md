# Storefront Quick Start Guide

## Current Status
✅ Project structure created
✅ Dependencies configured  
✅ Database schema designed
⚠️ Prisma schema has validation errors (blocking)
❌ Not yet runnable

## Get Started

### 1. Fix Database Schema FIRST
```bash
cd ../../packages/database
# Follow instructions in FIX_SCHEMA.md
npm run db:generate
npm run db:migrate
```

### 2. Install Dependencies
```bash
cd ../../apps/storefront
npm install
```

### 3. Configure Environment
```bash
# Copy example env
cp .env.example .env

# Edit .env and add:
# - DATABASE_URL
# - Stripe keys (get from https://dashboard.stripe.com/test/apikeys)
# - PayPal keys (get from https://developer.paypal.com/)
```

### 4. Start Development
```bash
npm run dev
# Opens at http://localhost:3002
```

## First Features to Build

### Step 1: Homepage
Create `app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">Welcome to FiscalNext Shop</h1>
      <p className="mt-4 text-gray-600">E-commerce platform coming soon...</p>
    </main>
  );
}
```

### Step 2: Product List
Create `app/products/page.tsx`:
```tsx
import { prisma } from '@/lib/prisma';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { productImages: true },
    take: 20,
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
```

### Step 3: Shopping Cart
Create `store/cartStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),
      removeItem: (productId, variantId) => set((state) => ({
        items: state.items.filter(i => 
          i.productId !== productId || i.variantId !== variantId
        )
      })),
      updateQuantity: (productId, quantity, variantId) => set((state) => ({
        items: state.items.map(i =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity }
            : i
        )
      })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart-storage' }
  )
);
```

## Project Structure

```
apps/storefront/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── products/           # Product pages
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── account/            # Customer portal
│   └── api/                # API routes
├── components/             # React components
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   └── ui/
├── lib/                    # Utilities
│   ├── api/
│   ├── stripe.ts
│   ├── paypal.ts
│   └── prisma.ts
├── store/                  # Zustand stores
├── types/                  # TypeScript types
└── public/                 # Static assets
```

## Key Dependencies

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Prisma** - Database ORM
- **Stripe** - Payment processing
- **PayPal** - Alternative payment
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Zod** - Schema validation

## Common Tasks

### Add a new API route
```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}
```

### Create a component
```tsx
// components/product/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    sellingPrice: number;
    imageUrl?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={300}
            height={300}
            className="rounded"
          />
        )}
        <h3 className="mt-2 font-semibold">{product.name}</h3>
        <p className="text-lg font-bold">${product.sellingPrice}</p>
      </div>
    </Link>
  );
}
```

### Query database
```typescript
import { prisma } from '@/lib/prisma';

// Get products with images
const products = await prisma.product.findMany({
  where: { isActive: true },
  include: {
    productImages: true,
    productVariants: true,
  },
});

// Create order
const order = await prisma.onlineOrder.create({
  data: {
    tenantId: 'xxx',
    customerId: 'xxx',
    orderNumber: 'ORD-' + Date.now(),
    status: 'pending',
    subtotal: 100.00,
    taxAmount: 20.00,
    shippingAmount: 5.00,
    total: 125.00,
    shippingAddressId: 'xxx',
    items: {
      create: [
        {
          productId: 'xxx',
          productName: 'Product 1',
          quantity: 2,
          unitPrice: 50.00,
          taxRate: 20.00,
          subtotal: 100.00,
          total: 120.00,
        },
      ],
    },
  },
});
```

## Payment Integration

### Stripe
```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Client-side
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

### PayPal
```tsx
// components/checkout/PayPalButton.tsx
import { PayPalButtons } from '@paypal/react-paypal-js';

export function PayPalButton({ amount }: { amount: number }) {
  return (
    <PayPalButtons
      createOrder={async () => {
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          body: JSON.stringify({ amount }),
        });
        const order = await res.json();
        return order.id;
      }}
      onApprove={async (data) => {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          body: JSON.stringify({ orderId: data.orderID }),
        });
        const details = await res.json();
        alert('Payment successful!');
      }}
    />
  );
}
```

## Testing

```bash
# Run type check
npm run type-check

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Troubleshooting

### Database connection error
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run migrations: `cd packages/database && npm run db:migrate`

### Build errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Payment testing
- Use Stripe test cards: `4242 4242 4242 4242`
- Use PayPal sandbox accounts

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Stripe Docs](https://stripe.com/docs)
- [PayPal Docs](https://developer.paypal.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Need Help?

1. Check `ECOMMERCE_PROGRESS.md` for overall status
2. Check `packages/database/FIX_SCHEMA.md` for schema issues
3. Review existing apps in monorepo for patterns
4. Ask main agent for guidance

---

**Remember:** Fix the Prisma schema first before anything else!
