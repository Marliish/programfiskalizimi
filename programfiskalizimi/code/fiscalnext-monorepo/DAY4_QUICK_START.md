# 🚀 Day 4 Quick Start Guide

## What's New in Day 4?

1. **Fiscal Receipts** - Complete fiscal compliance system
2. **Inventory Management** - Stock tracking with alerts
3. **User Management** - Role-based access control

---

## Start the Application

### Terminal 1: Backend API
```bash
cd apps/api
pnpm run dev
```
**Running on:** http://localhost:5000

### Terminal 2: Frontend
```bash
cd apps/web-admin
pnpm run dev
```
**Running on:** http://localhost:3000

---

## Access the New Features

### 1. Fiscal Receipts
**URL:** http://localhost:3000/fiscal-receipts

**What you can do:**
- View all fiscal receipts
- See IIC hash and QR codes
- Verify receipts with tax authority
- Export to CSV
- Print receipts

**How to test:**
1. Create a transaction in POS
2. Navigate to Fiscal Receipts
3. See the generated receipt with IIC hash
4. Click "View Details" to see full data
5. Click "Verify" to verify with tax authority

---

### 2. Inventory Management
**URL:** http://localhost:3000/inventory

**What you can do:**
- View stock levels for all products
- Adjust stock (add/remove inventory)
- See movement history (audit trail)
- Get low stock alerts

**How to test:**
1. Navigate to Inventory page
2. Click "Stock Levels" to see current stock
3. Click "Adjust Stock" on any product
4. Select type (In/Out/Adjustment) and quantity
5. Check "Movements" tab to see the history
6. Check "Alerts" tab for low stock warnings

---

### 3. User Management
**URL:** http://localhost:3000/users

**What you can do:**
- Create new users (invite team members)
- Assign roles (owner, manager, cashier, accountant)
- Edit user profiles
- Deactivate users
- View permission matrix

**How to test:**
1. Navigate to Users page
2. Click "Add User"
3. Fill in email, password, name
4. Select roles (can assign multiple)
5. Click "Create User"
6. Toggle "Show Permissions" to see what each role can do
7. Edit or deactivate users as needed

---

## Run Tests

### Backend Test
```bash
./test-day4-backend.sh
```
Tests all 13 new endpoints.

### Integration Test
```bash
./test-day4-integration.sh
```
Full end-to-end test of all features.

---

## API Endpoints

### Fiscal Receipts
- `POST /v1/fiscal/receipts` - Generate receipt
- `GET /v1/fiscal/receipts` - List receipts
- `GET /v1/fiscal/receipts/:id` - Get details
- `POST /v1/fiscal/receipts/:id/verify` - Verify receipt

### Inventory
- `GET /v1/inventory` - Stock levels
- `POST /v1/inventory/adjust` - Adjust stock
- `GET /v1/inventory/movements` - Movement history
- `GET /v1/inventory/alerts` - Low stock alerts

### Users
- `GET /v1/users` - List users
- `POST /v1/users` - Create user
- `PUT /v1/users/:id` - Update user
- `DELETE /v1/users/:id` - Deactivate user
- `PUT /v1/users/:id/roles` - Assign roles

---

## Database Changes

New migration applied: `20260223172811_add_fiscal_inventory_enhancements`

**New fields in FiscalReceipt:**
- `iic` - Internal Invoice Code (SHA-256 hash)
- `qrCodeUrl` - QR code for scanning
- `verificationStatus` - Verification status
- `expiresAt` - 90-day retention

**New model: StockMovement**
- Tracks all stock changes
- Complete audit trail (who, what, when, why)

---

## Role Permissions

### Owner
- Full system access
- Can manage users, settings, fiscal, inventory, POS

### Manager
- Manage operations and view reports
- Can manage inventory, fiscal (view), POS, products

### Cashier
- Process transactions at POS
- Can view products and customers

### Accountant
- View financial reports and fiscal data
- Can view reports, fiscal, transactions

---

## Troubleshooting

### Port already in use
```bash
# Kill existing processes
pkill -f "tsx watch"
```

### Database out of sync
```bash
cd packages/database
npx prisma migrate dev
npx prisma generate
```

### Frontend not loading
```bash
cd apps/web-admin
rm -rf .next
pnpm run dev
```

---

## Next Steps

1. Test each feature thoroughly
2. Create sample data (products, users, transactions)
3. Try all three new pages
4. Run integration tests
5. Review the completion report

---

**Questions?** Check `DAY4_COMPLETION_REPORT.md` for detailed documentation.

**Status:** ✅ Day 4 is 100% complete and ready for use!
