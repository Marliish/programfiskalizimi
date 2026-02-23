# 🚀 RESTAURANT POS - QUICK START GUIDE

This guide will help you get the restaurant POS features up and running in 5 minutes!

---

## 📦 Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (or npm)

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# From monorepo root
pnpm install
```

### 2. Setup Database

```bash
# Navigate to database package
cd packages/database

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 3. Start API Server

```bash
# Navigate to API
cd ../../apps/api

# Copy env file
cp .env.example .env

# Edit .env with your database connection
# DATABASE_URL="postgresql://user:password@localhost:5432/fiscalnext"

# Start server
npm run dev
```

**API will be available at:** `http://localhost:5000`

### 4. Start POS Frontend

```bash
# Navigate to POS app (in a new terminal)
cd apps/web-pos

# Copy env file
cp .env.example .env

# Edit .env
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start frontend
npm run dev
```

**Frontend will be available at:** `http://localhost:3001`

---

## 🎯 Access the Features

Once both servers are running:

### 1. Table Management
👉 http://localhost:3001/tables

**What you can do:**
- View floor plans
- Drag & drop tables
- Change table status
- View active orders per table

### 2. Kitchen Display System
👉 http://localhost:3001/kitchen

**What you can do:**
- View orders by station
- Start cooking orders
- Mark orders ready
- Bump completed orders
- Auto-refresh every 5 seconds

### 3. Order Management
👉 http://localhost:3001/orders

**What you can do:**
- Create new orders
- Add items with modifiers
- Set courses & seat numbers
- Split payments
- Send to kitchen

### 4. Tips Dashboard
👉 http://localhost:3001/tips

**What you can do:**
- View tip statistics
- Distribute pooled tips
- Configure service charges
- Generate reports

---

## 🧪 Test the Flow

### Complete Restaurant Workflow:

1. **Create a Floor Plan & Tables**
   ```bash
   curl -X POST http://localhost:5000/v1/floor-plans \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "name": "Main Dining Room",
       "layout": {"width": 1200, "height": 800}
     }'
   ```

2. **Add a Table**
   ```bash
   curl -X POST http://localhost:5000/v1/tables \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "tableNumber": "1",
       "capacity": 4,
       "positionX": 100,
       "positionY": 100
     }'
   ```

3. **Create Kitchen Station**
   ```bash
   curl -X POST http://localhost:5000/v1/kitchen/stations \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "name": "Main Kitchen",
       "stationType": "main"
     }'
   ```

4. **Create an Order**
   ```bash
   curl -X POST http://localhost:5000/v1/orders \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "tableId": "TABLE_ID",
       "guestCount": 2,
       "items": [
         {
           "productId": "PRODUCT_ID",
           "quantity": 2,
           "course": "main"
         }
       ]
     }'
   ```

5. **Send to Kitchen**
   ```bash
   curl -X POST http://localhost:5000/v1/kitchen/send-order \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "orderId": "ORDER_ID"
     }'
   ```

6. **Add a Tip**
   ```bash
   curl -X POST http://localhost:5000/v1/tips \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "orderId": "ORDER_ID",
       "userId": "SERVER_ID",
       "amount": 15.00,
       "tipType": "card"
     }'
   ```

---

## 🛠️ Development

### Frontend Components

All components are in `apps/web-pos/components/`:

```
📁 tables/
  ├── TableCard.tsx          - Individual table component
  └── FloorPlanEditor.tsx    - Full floor plan editor

📁 kitchen/
  ├── KitchenOrderCard.tsx   - Kitchen order display
  └── KitchenDisplay.tsx     - Full KDS interface

📁 orders/
  ├── OrderEditor.tsx        - Order creation/editing
  └── SplitPaymentModal.tsx  - Split payment UI

📁 tips/
  ├── TipEntryModal.tsx      - Tip entry form
  └── TipReportDashboard.tsx - Tips reporting
```

### Backend Routes

All routes are in `apps/api/src/routes/`:

```
📄 tables.ts  - Table & floor plan management
📄 kitchen.ts - Kitchen display system
📄 orders.ts  - Order management
📄 tips.ts    - Tips & service charges
```

---

## 🎨 Customization

### Change Colors (Design System)

Edit the color constants in components:

```typescript
// In TableCard.tsx
const tableStatusStyles = {
  available: {
    bg: 'bg-green-50',      // ← Change this
    border: 'border-green-300',
    text: 'text-green-700',
    indicator: 'bg-green-500',
  },
  // ...
};
```

### Add New Modifiers

Modifiers are stored in the database. Add via API:

```bash
curl -X POST http://localhost:5000/v1/modifiers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Extra Cheese",
    "modifierType": "add_on",
    "priceAdjustment": 2.50
  }'
```

### Configure Service Charges

Create rules via API:

```bash
curl -X POST http://localhost:5000/v1/service-charges \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Large Party",
    "chargeType": "percentage",
    "percentage": 18,
    "minGuestCount": 6
  }'
```

---

## 📱 Mobile/Tablet Optimization

All components are **responsive** and work on:
- ✅ Desktop (primary use)
- ✅ Tablets (iPad, Android)
- ✅ Large phones (landscape mode)

Kitchen Display is optimized for:
- **Large screens** (27"+) for kitchen walls
- **Tablets** for station displays

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### "Module not found" errors
```bash
# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

### "Authorization failed"
```bash
# Make sure you're logged in
# Get token from /v1/auth/login
curl -X POST http://localhost:5000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### Kitchen Display not auto-refreshing
- Check browser console for errors
- Verify API is reachable
- Ensure `autoRefresh={true}` in component

---

## 🚢 Deployment

### Production Checklist

- [ ] Set production DATABASE_URL
- [ ] Set JWT_SECRET (secure random string)
- [ ] Enable HTTPS
- [ ] Configure CORS_ORIGIN
- [ ] Set NODE_ENV=production
- [ ] Run database migrations
- [ ] Build frontend: `npm run build`
- [ ] Start API: `npm start`
- [ ] Configure reverse proxy (nginx)

### Environment Variables

```bash
# API (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="super-secret-random-string"
NODE_ENV="production"
PORT=5000
CORS_ORIGIN="https://your-pos.com"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="https://api.your-pos.com"
```

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:5000/
- **Database Schema:** `packages/database/prisma/schema.prisma`
- **Complete Report:** `RESTAURANT_POS_FEATURES_COMPLETE.md`

---

## 💡 Tips

1. **Use Kitchen Display on Large Screens:** Best viewed on 27"+ monitors or tablets
2. **Enable Dark Mode:** System automatically supports dark mode
3. **Backup Database:** Run `pg_dump fiscalnext > backup.sql` regularly
4. **Monitor Performance:** Check `/v1/api/metrics` endpoint

---

## 🆘 Need Help?

- Check the complete feature report: `RESTAURANT_POS_FEATURES_COMPLETE.md`
- Review API routes in `apps/api/src/routes/`
- Inspect component source in `apps/web-pos/components/`

---

**Happy Coding! 🎉**

Built by: **Tafa** (Backend) + **Mela** (Frontend) + **Gesa** (Designer)
