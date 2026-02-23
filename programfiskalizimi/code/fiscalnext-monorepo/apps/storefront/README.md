# FiscalNext Storefront - E-Commerce Platform

> ⚠️ **Project Status:** Foundation laid, not yet runnable. See [QUICKSTART.md](./QUICKSTART.md) for setup instructions.

## Overview

Complete e-commerce platform built with Next.js 15, designed to work seamlessly with the FiscalNext POS and inventory system.

### Features (Planned)

**Shopping Experience:**
- 🛍️ Product catalog with search & filters
- 🔍 Product detail pages with image galleries
- 🛒 Shopping cart with persistence
- ❤️ Wishlist / Save for later
- ⭐ Product reviews & ratings

**Checkout & Payments:**
- 💳 Stripe integration (live mode)
- 💰 PayPal integration (live mode)
- 🎟️ Coupon codes
- 🚚 Multiple shipping methods
- 📧 Order confirmation emails

**Customer Portal:**
- 👤 Registration & login
- 📦 Order history & tracking
- 📍 Saved addresses
- 💳 Saved payment methods
- ❤️ Wishlist management

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Payments:** Stripe + PayPal
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Icons:** Lucide React
- **Validation:** Zod
- **Notifications:** React Hot Toast

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Stripe account (live keys)
- PayPal developer account (live keys)

### Setup

```bash
# 1. Fix database schema first (REQUIRED!)
cd ../../packages/database
# Follow instructions in FIX_SCHEMA.md
npm run db:generate
npm run db:migrate

# 2. Install dependencies
cd ../../apps/storefront
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start development
npm run dev
```

Visit http://localhost:3002

## Project Structure

```
apps/storefront/
├── app/                    # Next.js App Router
│   ├── (shop)/             # Shop pages group
│   │   ├── layout.tsx      # Shop layout
│   │   ├── page.tsx        # Homepage
│   │   ├── products/       # Product pages
│   │   ├── cart/           # Shopping cart
│   │   ├── checkout/       # Checkout flow
│   │   └── account/        # Customer portal
│   ├── api/                # API routes
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── webhooks/       # Payment webhooks
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── product/            # Product components
│   ├── cart/               # Cart components
│   ├── checkout/           # Checkout components
│   ├── layout/             # Layout components
│   └── ui/                 # UI primitives
├── lib/                    # Utilities
│   ├── api/                # API clients
│   ├── stripe.ts           # Stripe config
│   ├── paypal.ts           # PayPal config
│   ├── prisma.ts           # Database client
│   └── utils.ts            # Helper functions
├── store/                  # Zustand stores
│   ├── cartStore.ts        # Cart state
│   ├── authStore.ts        # Auth state
│   └── checkoutStore.ts    # Checkout state
├── types/                  # TypeScript types
│   ├── product.ts
│   ├── cart.ts
│   ├── order.ts
│   └── customer.ts
├── public/                 # Static assets
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── README.md               # This file
```

## Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fiscalnext"

# Stripe (LIVE MODE - use real keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal (LIVE MODE - use real keys)
NEXT_PUBLIC_PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."

# App Configuration
NEXT_PUBLIC_APP_URL="https://shop.yourdomain.com"
SESSION_SECRET="your-secret-key-change-this"

# Email (optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
```

## Database Schema

### E-Commerce Models

The following models have been added to the Prisma schema:

- **ProductVariant** - Product size/color/SKU variations
- **ProductImage** - Multiple images per product
- **ProductReview** - Customer reviews & ratings
- **Cart / CartItem** - Shopping cart
- **Wishlist / WishlistItem** - Saved products
- **OnlineOrder / OnlineOrderItem** - Orders & line items
- **OnlineOrderPayment** - Payment tracking
- **ShippingAddress** - Customer addresses
- **SavedPaymentMethod** - Saved payment info
- **Coupon** - Discount codes
- **ShippingMethod** - Shipping options
- **OrderStatusHistory** - Order status tracking

See full schema: `packages/database/prisma/schema.prisma`

## API Routes

### Products
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product detail
- `GET /api/products/[id]/reviews` - Get product reviews
- `POST /api/products/[id]/reviews` - Add review

### Cart
- `GET /api/cart` - Get current cart
- `POST /api/cart/items` - Add item
- `PATCH /api/cart/items/[id]` - Update quantity
- `DELETE /api/cart/items/[id]` - Remove item

### Checkout
- `POST /api/checkout/create-intent` - Create Stripe Payment Intent
- `POST /api/checkout/paypal/create-order` - Create PayPal order
- `POST /api/checkout/paypal/capture` - Capture PayPal payment
- `POST /api/checkout/complete` - Complete order

### Orders
- `GET /api/orders` - Get customer orders
- `GET /api/orders/[id]` - Get order detail
- `POST /api/orders/[id]/cancel` - Cancel order

### Webhooks
- `POST /api/webhooks/stripe` - Stripe events
- `POST /api/webhooks/paypal` - PayPal events

## Development Guidelines

### Component Organization

```tsx
// components/product/ProductCard.tsx
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="...">
      {/* Component implementation */}
    </div>
  );
}
```

### API Route Pattern

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { productImages: true },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### State Management

```typescript
// store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ 
        items: [...state.items, item] 
      })),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart-storage' }
  )
);
```

## Payment Integration

### Stripe

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Create payment intent
export async function createPaymentIntent(amount: number) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
  });
}
```

### PayPal

```typescript
// lib/paypal.ts
const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export async function createPayPalOrder(amount: number) {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: amount.toFixed(2),
        },
      }],
    }),
  });
  
  return await response.json();
}
```

## Testing

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### PayPal Sandbox
Create sandbox accounts at: https://developer.paypal.com/dashboard/accounts

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel --prod
```

### Environment Setup
- Set all environment variables in hosting platform
- Configure webhook endpoints:
  - Stripe: `https://yourdomain.com/api/webhooks/stripe`
  - PayPal: `https://yourdomain.com/api/webhooks/paypal`

## Troubleshooting

### Database Errors
See: `packages/database/FIX_SCHEMA.md`

### Build Errors
```bash
# Clear cache
rm -rf .next
npm run build
```

### Payment Errors
- Check webhook signatures
- Verify API keys are for correct environment (test vs live)
- Check webhook URL is publicly accessible

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started guide
- **[../../ECOMMERCE_PROGRESS.md](../../ECOMMERCE_PROGRESS.md)** - Project roadmap
- **[../../SUBAGENT_REPORT.md](../../SUBAGENT_REPORT.md)** - Implementation report

## Support

- Next.js: https://nextjs.org/docs
- Prisma: https://prisma.io/docs
- Stripe: https://stripe.com/docs
- PayPal: https://developer.paypal.com/docs

## License

Proprietary - FiscalNext Platform

---

**Current Status:** 🚧 Under Development
**Blocker:** Database schema validation errors (see FIX_SCHEMA.md)
**Progress:** ~15% complete
