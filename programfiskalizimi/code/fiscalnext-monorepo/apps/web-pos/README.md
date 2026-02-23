# FiscalNext POS (Point of Sale)

Modern, touch-optimized point of sale interface for retail and hospitality.

## 🚀 Features (Day 1)

### ✅ Completed
- Next.js 14 project setup with App Router
- TypeScript configuration
- Tailwind CSS with POS-optimized styles
- Full POS interface layout
- Product grid with search
- Shopping cart with quantity management
- Real-time totals calculation
- Touch-friendly UI (large buttons, cards)
- Responsive design

### 📁 Project Structure

```
web-pos/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home (redirects to /pos)
│   ├── globals.css         # Global styles (POS-optimized)
│   └── pos/
│       └── page.tsx        # Main POS interface
├── components/
│   └── ui/
│       ├── Button.tsx      # Touch-optimized button
│       └── index.ts
├── lib/
│   └── utils.ts            # Utility functions
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React useState (will add Zustand for complex state)
- **Icons:** React Icons
- **Notifications:** React Hot Toast

## 🎨 Design Features

### Touch-Optimized
- Large buttons (min 48x48px touch targets)
- Larger text (18-20px for readability)
- Active scale animation on button press
- Clear visual feedback

### Layout
```
┌──────────────────┬──────────────┐
│                  │              │
│  Products Grid   │  Cart        │
│  (Left Side)     │  (Right)     │
│                  │              │
│  [Search Bar]    │  [Items]     │
│  [Product Cards] │  [Total]     │
│                  │  [Pay Btn]   │
│                  │              │
└──────────────────┴──────────────┘
```

## 🎯 Key Features

### Product Management
- ✅ Product grid display
- ✅ Search by name or SKU
- ✅ Quick add to cart
- ✅ Category badges
- ⏳ Barcode scanning (future)
- ⏳ Product images (future)

### Cart Management
- ✅ Add/remove items
- ✅ Quantity adjustment (+/-)
- ✅ Real-time totals
- ✅ Clear cart
- ✅ Tax calculation (20% VAT)
- ⏳ Apply discounts (future)
- ⏳ Customer selection (future)

### Payment (TODO)
- ⏳ Cash payment
- ⏳ Card payment
- ⏳ Split payment
- ⏳ Print receipt
- ⏳ Email receipt

## 🚀 Getting Started

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run development server
pnpm --filter @fiscalnext/web-pos dev

# Build for production
pnpm --filter @fiscalnext/web-pos build
```

The app runs on http://localhost:3001

## 📝 TODO (Next Steps)

### Week 1-2 Priorities:
1. ✅ Basic POS layout
2. ✅ Product grid
3. ✅ Shopping cart
4. ⏳ Payment flow (cash/card)
5. ⏳ Receipt generation
6. ⏳ Connect to backend API
7. ⏳ Offline mode support

### Features to Build:
- [ ] Payment modal
- [ ] Receipt preview/print
- [ ] Customer selection
- [ ] Discount application
- [ ] Multiple payment methods
- [ ] Barcode scanner integration
- [ ] Keyboard shortcuts
- [ ] Touch gestures

### Week 7-8 (Restaurant Module):
- [ ] Table layout
- [ ] Order management
- [ ] Kitchen display
- [ ] Split bills

## 🎨 Color Scheme

- Primary: Blue (#3B82F6)
- Success: Green (#10B981) - for "Pay" button
- Danger: Red (#EF4444) - for delete actions
- Background: White (clean, bright for POS)

## 📐 Responsive Breakpoints

- **Tablet:** 768px+ (primary target)
- **Desktop:** 1024px+ (works well)
- **Mobile:** 640px+ (limited, prefer tablet)

## 🔌 Integration Points

- Backend API: `http://localhost:5000/v1`
- Endpoints needed:
  - `GET /products` - Product list
  - `POST /sales` - Create sale
  - `POST /receipts` - Generate receipt
  - `GET /customers` - Customer list

## 📊 Performance Goals

- Initial load: < 2 seconds
- Add to cart: < 100ms
- Search: < 200ms
- Checkout: < 3 seconds (including API)

---

**Built by:** Elena (Frontend Developer)  
**Date:** 2026-02-23 (Day 1)  
**Status:** ✅ Core UI complete, ready for API integration
