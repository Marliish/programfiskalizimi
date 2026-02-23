# ⚡ Quick Start Guide - FiscalNext Storefront

Get the storefront running in 5 minutes!

## 🎯 Prerequisites

- Node.js 20+
- pnpm installed
- FiscalNext API running (port 3001)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# From monorepo root
cd /path/to/fiscalnext-monorepo
pnpm install
```

### 2. Configure Environment
```bash
# Navigate to storefront
cd apps/storefront

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

Minimum required:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Development Server
```bash
pnpm dev
```

Open **http://localhost:3002** 🎉

## 📋 Quick Test Checklist

Visit these pages to verify everything works:

- ✅ Homepage: http://localhost:3002
- ✅ Products: http://localhost:3002/products
- ✅ Cart: http://localhost:3002/cart
- ✅ Checkout: http://localhost:3002/checkout
- ✅ Account: http://localhost:3002/account

## 🔧 Common Issues

### Port Already in Use
```bash
# Change port in package.json
"dev": "next dev -p 3003"
```

### API Connection Failed
- Check API is running on port 3001
- Verify `NEXT_PUBLIC_API_URL` in .env.local
- Check CORS settings in API

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm dev
```

## 🎨 Feature Tour

### 1. Browse Products
```
localhost:3002/products
```
- View product catalog
- Filter by category
- Search products
- Sort by price/name

### 2. Add to Cart
- Click "Add to Cart" on any product
- View cart badge update in header
- Navigate to cart page

### 3. Checkout
```
localhost:3002/cart → Proceed to Checkout
```
Test checkout flow:
- Enter shipping info
- Select payment method
- Review order
- Place order

### 4. Customer Portal
```
localhost:3002/account
```
(Requires authentication)
- View dashboard
- Browse order history
- Manage addresses
- Update profile

### 5. Order Tracking
```
localhost:3002/account/orders/[id]
```
- View order timeline
- Track shipment
- See order details

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript check
```

## 📦 Key Files to Explore

### Components
- `src/components/ui/Button.tsx` - Reusable button
- `src/components/ui/Card.tsx` - Card component
- `src/components/layout/Header.tsx` - Navigation
- `src/components/products/ProductCard.tsx` - Product display

### Pages
- `src/app/page.tsx` - Homepage
- `src/app/products/page.tsx` - Product catalog
- `src/app/cart/page.tsx` - Shopping cart
- `src/app/checkout/page.tsx` - Checkout flow
- `src/app/account/page.tsx` - Customer dashboard

### Logic
- `src/lib/api.ts` - API client
- `src/store/cartStore.ts` - Cart state
- `src/lib/utils.ts` - Helper functions
- `src/types/index.ts` - TypeScript types

## 🎓 Learning Path

### Beginner
1. Explore the homepage (`src/app/page.tsx`)
2. Check out the design system (`src/components/ui/`)
3. Understand the cart store (`src/store/cartStore.ts`)

### Intermediate
1. Study the API client (`src/lib/api.ts`)
2. Dive into the checkout flow (`src/app/checkout/page.tsx`)
3. Learn the product catalog (`src/app/products/page.tsx`)

### Advanced
1. Payment integration details
2. State management patterns
3. Next.js 15 App Router features
4. Performance optimization

## 🐛 Debugging Tips

### Enable Debug Mode
```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG=true
```

### Check API Calls
Open browser DevTools → Network tab → Filter "Fetch/XHR"

### View React Components
Install React DevTools browser extension

### Check Cart State
```javascript
// In browser console
console.log(localStorage.getItem('cart-storage'))
```

## 📚 Additional Resources

- **Full Documentation**: `README.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Team Report**: `TEAM_COMPLETION_REPORT.md`
- **API Documentation**: Ask backend team
- **Design System**: Check `src/components/ui/`

## 🆘 Need Help?

### Common Questions
**Q: Can't see products?**  
A: Make sure the API is running and has seeded products

**Q: Cart not persisting?**  
A: Check browser localStorage is enabled

**Q: Checkout fails?**  
A: Verify payment gateway configuration

**Q: Styles broken?**  
A: Run `pnpm dev` again to rebuild

### Get Support
- Check existing issues in repo
- Ask in team chat
- Review documentation
- Contact: dev@fiscalnext.com

## 🎉 You're Ready!

Start building amazing e-commerce features! 🚀

---

**Made with ❤️ by Boli, Edison & Gesa**
