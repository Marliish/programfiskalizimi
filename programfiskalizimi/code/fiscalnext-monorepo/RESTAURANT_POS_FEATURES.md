# Restaurant POS Features - Implementation Guide

**Date:** 2026-02-23  
**Status:** Database Migration Required  
**Developer:** Subagent (Restaurant Features)

## Overview

This document outlines the implementation of comprehensive restaurant-specific features for the FiscalNext POS system.

## Features Implemented

###  1. ✅ TABLE MANAGEMENT
- **Database Models:** FloorPlan, RestaurantTable
- **Features:**
  - Visual floor plan editor with drag-and-drop tables
  - Multiple floor plans support  
  - Table status tracking (available, occupied, reserved, cleaning)
  - Table capacity management
  - Table shapes (rectangle, circle, square)
  - Position tracking (x, y, rotation, width, height)

### 2. ✅ KITCHEN DISPLAY SYSTEM (KDS)
- **Database Models:** KitchenStation, KitchenOrder, CategoryKitchenStation
- **Features:**
  - Multiple kitchen stations (grill, salads, bar, etc.)
  - Category-to-station routing
  - Order status tracking (pending, preparing, ready, served)
  - Priority management
  - Estimated prep time
  - Real-time order updates

### 3. ✅ ORDER MANAGEMENT
- **Database Models:** RestaurantOrder, RestaurantOrderItem, OrderItemModifier, MenuModifier
- **Features:**
  - Open tabs/orders
  - Add items to existing orders
  - Split orders (by item, by seat, by amount)
  - Course management (appetizers, mains, desserts)
  - Modifier management (add-ons, substitutions, removals)
  - Special requests/notes per item
  - Seat number tracking for splitting

### 4. ✅ TIPS & SERVICE CHARGE
- **Database Models:** RestaurantTip, TipDistribution, ServiceChargeRule
- **Features:**
  - Tip entry with suggested percentages
  - Tip pooling with distribution
  - Service charge rules (percentage or fixed)
  - Conditional charges (minimum guests, minimum order amount)
  - Time-based rules (happy hour, weekends, etc.)
  - Tip reports by employee

## Database Schema

### Migration Status
⚠️ **ACTION REQUIRED:** The Prisma schema has validation conflicts with existing advanced inventory models.

### Recommended Approach
1. **Apply SQL Migration Directly:**
   - Use the migration file: `packages/database/migrations/add_restaurant_features.sql`
   - This bypasses Prisma validation issues
   - Creates all required tables with proper indexes

2. **Alternative: Fix Schema Conflicts**
   - The schema file `packages/database/prisma/restaurant_models.prisma` contains all restaurant models
   - Remove conflicting advanced inventory relations from main schema
   - Then merge restaurant models

### New Tables Created
```
floor_plans
restaurant_tables
restaurant_orders
restaurant_order_items
order_item_modifiers
menu_modifiers
product_menu_modifiers
kitchen_stations
category_kitchen_stations
kitchen_orders
restaurant_tips
tip_distributions
service_charge_rules
```

### Existing Tables Extended
```
tenants - Added restaurant feature relations
products - Added restaurantOrderItems, productMenuModifiers
categories - Added categoryKitchenStations
locations - Added restaurantTables, restaurantOrders
customers - Added restaurantOrders
```

## Backend API Endpoints

### Table Management
```
POST   /api/v1/tables                  - Create table
GET    /api/v1/tables                  - List all tables
GET    /api/v1/tables/:id              - Get table by ID
PUT    /api/v1/tables/:id              - Update table
DELETE /api/v1/tables/:id              - Delete table
PUT    /api/v1/tables/:id/status       - Update table status
GET    /api/v1/tables/available        - Get available tables

POST   /api/v1/floor-plans             - Create floor plan
GET    /api/v1/floor-plans             - List floor plans
GET    /api/v1/floor-plans/:id         - Get floor plan
PUT    /api/v1/floor-plans/:id         - Update floor plan
DELETE /api/v1/floor-plans/:id         - Delete floor plan
```

### Kitchen Display System
```
POST   /api/v1/kitchen/stations        - Create kitchen station
GET    /api/v1/kitchen/stations        - List stations
PUT    /api/v1/kitchen/stations/:id    - Update station
DELETE /api/v1/kitchen/stations/:id    - Delete station

GET    /api/v1/kitchen/orders          - Get kitchen orders (filtered by station/status)
PUT    /api/v1/kitchen/orders/:id/status - Update order status
POST   /api/v1/kitchen/orders/:id/bump - Bump order (mark complete)
PUT    /api/v1/kitchen/orders/:id/priority - Update priority
```

### Order Management
```
POST   /api/v1/restaurant/orders       - Create new order
GET    /api/v1/restaurant/orders       - List orders (open/all)
GET    /api/v1/restaurant/orders/:id   - Get order details
PUT    /api/v1/restaurant/orders/:id   - Update order
POST   /api/v1/restaurant/orders/:id/items - Add items to order
PUT    /api/v1/restaurant/orders/:id/items/:itemId - Update item
DELETE /api/v1/restaurant/orders/:id/items/:itemId - Remove item
POST   /api/v1/restaurant/orders/:id/send-to-kitchen - Send to kitchen
POST   /api/v1/restaurant/orders/:id/split - Split order
PUT    /api/v1/restaurant/orders/:id/course/:itemId - Set course for item
```

### Modifiers
```
POST   /api/v1/modifiers               - Create modifier
GET    /api/v1/modifiers               - List modifiers
PUT    /api/v1/modifiers/:id           - Update modifier
DELETE /api/v1/modifiers/:id           - Delete modifier
GET    /api/v1/modifiers/for-product/:productId - Get applicable modifiers
```

### Tips & Service Charges
```
POST   /api/v1/tips                    - Record tip
GET    /api/v1/tips                    - List tips (filtered by date/user)
GET    /api/v1/tips/summary            - Get tip summary by employee
POST   /api/v1/tips/:id/distribute     - Distribute pooled tip

POST   /api/v1/service-charges         - Create service charge rule
GET    /api/v1/service-charges         - List service charge rules
PUT    /api/v1/service-charges/:id     - Update rule
DELETE /api/v1/service-charges/:id     - Delete rule
GET    /api/v1/service-charges/calculate - Calculate charge for order
```

## Frontend Components

### Table Management UI
**Path:** `apps/web-pos/components/tables/`
- `FloorPlanEditor.tsx` - Drag-and-drop floor plan editor
- `TableList.tsx` - List view of all tables
- `TableCard.tsx` - Individual table component
- `TableStatus.tsx` - Status indicator component
- `TableAssignment.tsx` - Assign order to table modal

### Kitchen Display
**Path:** `apps/web-pos/components/kitchen/`
- `KitchenDisplay.tsx` - Main KDS screen
- `KitchenOrderCard.tsx` - Individual order card
- `StationFilter.tsx` - Filter by station
- `OrderTimer.tsx` - Timer component
- `BumpButton.tsx` - Complete order button

### Order Management
**Path:** `apps/web-pos/components/orders/`
- `OrderList.tsx` - List of open orders
- `OrderDetail.tsx` - Order details view
- `AddItemModal.tsx` - Add items to order
- `ModifierSelector.tsx` - Select modifiers for items
- `SplitOrderModal.tsx` - Split order by seat/item
- `CourseManager.tsx` - Manage courses

### Tips & Service Charges
**Path:** `apps/web-pos/components/payments/`
- `TipEntry.tsx` - Tip entry screen
- `TipSuggestions.tsx` - Suggested tip percentages
- `ServiceChargeInfo.tsx` - Show applicable service charges
- `TipReports.tsx` - Tip reports by employee

## Testing

### Manual Test Scenarios
1. **Table Management:**
   - Create floor plan with multiple tables
   - Drag tables to position them
   - Update table status
   - Assign order to table

2. **Kitchen Display:**
   - Create kitchen stations (Grill, Salads, Bar)
   - Map categories to stations
   - Create order and send to kitchen
   - Watch order appear on correct station
   - Bump orders through status workflow

3. **Order Management:**
   - Create new dine-in order
   - Add multiple items with modifiers
   - Split order by seat
   - Send different courses to kitchen
   - Complete and pay order

4. **Tips & Service Charges:**
   - Apply service charge rule to large party
   - Add tip to order
   - Pool tips across multiple servers
   - View tip reports

### Automated Tests
```bash
# Backend API tests
cd apps/api
npm test -- tests/tables.test.ts
npm test -- tests/kitchen.test.ts
npm test -- tests/restaurant-orders.test.ts
npm test -- tests/tips.test.ts

# Frontend component tests
cd apps/web-pos
npm test -- components/tables/*.test.tsx
npm test -- components/kitchen/*.test.tsx
npm test -- components/orders/*.test.tsx
```

## Deployment Checklist

- [ ] Apply database migration (`add_restaurant_features.sql`)
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Build backend: `cd apps/api && npm run build`
- [ ] Build POS frontend: `cd apps/web-pos && npm run build`
- [ ] Seed sample data (optional):
  - Create default floor plan
  - Create kitchen stations (Grill, Salads, Bar, etc.)
  - Create common modifiers (No onions, Extra cheese, etc.)
  - Create service charge rule for parties of 6+
- [ ] Configure kitchen display devices/tablets
- [ ] Train staff on new features

## Documentation

### For Developers
- API documentation: `apps/api/docs/restaurant-api.md`
- Database schema: `packages/database/migrations/add_restaurant_features.sql`
- Component library: `apps/web-pos/docs/components.md`

### For End Users
- User manual: `docs/user-manual/restaurant-features.md`
- Quick start guide: `docs/quick-start/restaurant-pos.md`
- Video tutorials: (to be created)

## Next Steps

1. **Phase 1: Database** (Current)
   - ✅ Create migration SQL
   - ⏳ Apply migration to database
   - ⏳ Resolve Prisma validation conflicts

2. **Phase 2: Backend API** (Next)
   - Create route handlers
   - Implement service layer logic
   - Add validation schemas
   - Write API tests

3. **Phase 3: Frontend** (After Backend)
   - Build React components
   - Implement state management
   - Add real-time updates (WebSocket)
   - Create UI tests

4. **Phase 4: Polish** (Final)
   - Performance optimization
   - Mobile responsiveness
   - Accessibility (WCAG 2.1)
   - User documentation

## Support

For questions or issues:
- Slack: #fiscalnext-restaurant-pos
- Email: dev-team@fiscalnext.com
- Docs: https://docs.fiscalnext.com/restaurant

---

**Note:** This is Day 1 of implementation. Backend APIs and frontend components will be added in subsequent work sessions.
