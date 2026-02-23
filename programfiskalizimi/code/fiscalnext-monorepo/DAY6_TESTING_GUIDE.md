# DAY 6 - TESTING GUIDE

Quick manual testing checklist for all Day 6 features.

---

## 🚀 SETUP

### 1. Start Backend API:
```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/api
pnpm run dev
```

Expected output:
```
🚀 FiscalNext API Server Started!
📍 URL: http://localhost:5000
✅ Ready to accept requests!
```

### 2. Start Frontend:
```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/web-admin
pnpm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
✓ Ready in 2.3s
```

### 3. Login:
Navigate to http://localhost:3000/login and login with your credentials.

---

## 📋 TESTING CHECKLIST

### 1. 👥 EMPLOYEES PAGE (`/employees`)

**URL:** http://localhost:3000/employees

#### Test Add Employee:
- [ ] Click "Add Employee" button
- [ ] Fill in all fields:
  - First Name: "John"
  - Last Name: "Doe"
  - Email: "john@example.com"
  - Phone: "+355 69 123 4567"
  - Position: "Cashier"
  - Department: "Sales"
  - Hourly Rate: "5.50"
  - Start Date: Select today
- [ ] Click "Create"
- [ ] Verify toast: "Employee created successfully"
- [ ] Verify employee appears in list

#### Test Search:
- [ ] Type "John" in search box
- [ ] Click "Search"
- [ ] Verify filtered results

#### Test Edit:
- [ ] Click edit icon (pencil) on an employee
- [ ] Change hourly rate to "6.00"
- [ ] Click "Update"
- [ ] Verify toast: "Employee updated successfully"
- [ ] Verify updated rate in table

#### Test View Details:
- [ ] Click eye icon on an employee
- [ ] Verify modal opens with:
  - Employee name and position
  - Total hours this month
  - Number of shifts
  - Performance stats (if available)

#### Test Delete:
- [ ] Click trash icon on an employee
- [ ] Click "OK" on confirmation dialog
- [ ] Verify toast: "Employee deleted successfully"
- [ ] Verify employee removed from list

#### Test Stats:
- [ ] Verify "Total Employees" count
- [ ] Verify "Total Hours (This Month)"
- [ ] Verify "Avg. Hourly Rate"

**Status:** ⬜ Pass / ⬜ Fail

---

### 2. 🏆 LOYALTY PROGRAM PAGE (`/loyalty`)

**URL:** http://localhost:3000/loyalty

#### Test Add Reward (Discount):
- [ ] Click "Add Reward" button
- [ ] Fill in:
  - Name: "10% Off Voucher"
  - Description: "Get 10% off your next purchase"
  - Type: "Discount"
  - Discount Value: "10"
  - Points Cost: "200"
  - Check "Active"
- [ ] Click "Create"
- [ ] Verify toast: "Reward created successfully"
- [ ] Verify reward appears in table

#### Test Add Reward (Voucher):
- [ ] Click "Add Reward"
- [ ] Fill in:
  - Name: "€5 Voucher"
  - Type: "Voucher"
  - Value: "5.00"
  - Points Cost: "500"
- [ ] Click "Create"
- [ ] Verify reward created

#### Test Edit Reward:
- [ ] Click edit icon on a reward
- [ ] Change points cost to "250"
- [ ] Click "Update"
- [ ] Verify toast: "Reward updated successfully"

#### Test Delete Reward:
- [ ] Click trash icon on a reward
- [ ] Confirm deletion
- [ ] Verify reward removed

#### Test Customer Tiers:
- [ ] Click "Customer Tiers" tab
- [ ] Verify three tier cards displayed:
  - Bronze (0-499 points)
  - Silver (500-1,499 points)
  - Gold (1,500+ points)
- [ ] Verify benefits listed for each tier

#### Test Stats:
- [ ] Switch back to "Rewards Catalog" tab
- [ ] Verify stats cards:
  - Total Rewards
  - Active Rewards
  - Total Redeemed
  - Avg. Points Cost

**Status:** ⬜ Pass / ⬜ Fail

---

### 3. 🎫 PROMOTIONS PAGE (`/promotions`)

**URL:** http://localhost:3000/promotions

#### Test Generate Code:
- [ ] Click "Generate Code" button
- [ ] Verify modal opens with random code
- [ ] Click "Copy to Clipboard"
- [ ] Verify toast: "Code copied to clipboard!"
- [ ] Close modal

#### Test Add Promotion (Percentage):
- [ ] Click "Add Promotion" button
- [ ] Fill in:
  - Name: "Spring Sale"
  - Description: "20% off all products"
  - Type: "Percentage Discount"
  - Discount Value: "20"
  - Promo Code: "SPRING20"
  - Start Date: Today
  - End Date: +30 days from today
  - Min Purchase: "10.00"
  - Max Uses: "1000"
  - Check "Active"
- [ ] Click "Create"
- [ ] Verify toast: "Promotion created successfully"
- [ ] Verify promotion in table with green "Active" badge

#### Test Add Promotion (Fixed):
- [ ] Click "Add Promotion"
- [ ] Fill in:
  - Name: "€5 Off"
  - Type: "Fixed Amount Off"
  - Discount Value: "5.00"
  - Code: "SAVE5"
  - Start/End dates
- [ ] Click "Create"
- [ ] Verify created

#### Test Status Indicators:
- [ ] Create promotion with start date in future → Verify "Scheduled" badge (yellow)
- [ ] Create promotion with end date in past → Verify "Expired" badge (red)
- [ ] Active promotion → Verify "Active" badge (green)

#### Test Edit:
- [ ] Click edit icon on promotion
- [ ] Change discount value
- [ ] Click "Update"
- [ ] Verify updated

#### Test Delete:
- [ ] Click trash icon
- [ ] Confirm deletion
- [ ] Verify removed

#### Test Stats:
- [ ] Verify "Total Promotions"
- [ ] Verify "Active Now" (only active in date range)
- [ ] Verify "Total Uses"
- [ ] Verify "With Codes"

**Status:** ⬜ Pass / ⬜ Fail

---

### 4. 🔔 NOTIFICATIONS PAGE (`/notifications`)

**URL:** http://localhost:3000/notifications

#### Test Inbox - View All:
- [ ] Verify notifications displayed
- [ ] Verify unread count in header: "Inbox (X)"
- [ ] Verify unread notifications have blue background

#### Test Filtering:
- [ ] Click "All" button → Verify all notifications shown
- [ ] Click "Unread" button → Verify only unread shown
- [ ] Click "Read" button → Verify only read shown

#### Test Mark as Read:
- [ ] Click check icon on an unread notification
- [ ] Verify toast: "Marked as read"
- [ ] Verify notification background changes to white
- [ ] Verify unread count decreases

#### Test Mark All as Read:
- [ ] Click "Mark All Read" button (top right)
- [ ] Verify toast: "All notifications marked as read"
- [ ] Verify all notifications now have white background
- [ ] Verify unread count = 0

#### Test Delete:
- [ ] Click X icon on a notification
- [ ] Verify notification removed
- [ ] Verify total count decreases

#### Test Preferences:
- [ ] Click "Preferences" tab
- [ ] Toggle "Email Notifications" off
- [ ] Verify toast: "Preferences updated"
- [ ] Toggle "SMS Notifications" on
- [ ] Verify updated
- [ ] Test all notification type toggles:
  - Low Stock Alerts
  - Order Alerts
  - Promotion Alerts
  - System Alerts

#### Test Templates:
- [ ] Click "Templates" tab
- [ ] Verify templates table displayed
- [ ] Verify template details:
  - Name
  - Type (EMAIL/SMS/PUSH)
  - Subject/Body
  - Usage count

#### Test Stats:
- [ ] Verify "Total" notifications count
- [ ] Verify "Unread" count
- [ ] Verify "Read" count
- [ ] Verify "Templates" count

**Status:** ⬜ Pass / ⬜ Fail

---

### 5. 📊 AUDIT LOGS PAGE (`/audit-logs`)

**URL:** http://localhost:3000/audit-logs

#### Test View All Logs:
- [ ] Verify audit logs table displayed
- [ ] Verify columns:
  - Timestamp
  - User
  - Action
  - Resource
  - Changes
  - IP Address

#### Test Filters:
- [ ] Enter user ID in "User ID" field
- [ ] Click "Apply Filters"
- [ ] Verify filtered results

- [ ] Select "create" in "Action" dropdown
- [ ] Click "Apply Filters"
- [ ] Verify only create actions shown

- [ ] Select "product" in "Resource Type" dropdown
- [ ] Click "Apply Filters"
- [ ] Verify only product resources shown

- [ ] Select start date and end date
- [ ] Click "Apply Filters"
- [ ] Verify logs within date range

- [ ] Click "Clear Filters"
- [ ] Verify all logs shown again

#### Test Export:
- [ ] Click "Export CSV" button
- [ ] Verify toast: "Export started! File: audit-logs-YYYY-MM-DD.csv"
- [ ] (Mock URL opens in new tab)

- [ ] Click "Export JSON" button
- [ ] Verify similar behavior

#### Test Stats:
- [ ] Verify "Total Actions" count
- [ ] Verify "Top Users" shows user with most actions
- [ ] Verify "Creates" count
- [ ] Verify "Deletes" count

#### Test Action Badges:
- [ ] Verify "CREATE" actions have green badge
- [ ] Verify "UPDATE" actions have blue badge
- [ ] Verify "DELETE" actions have red badge
- [ ] Verify "LOGIN" actions have purple badge

#### Test Change Display:
- [ ] Find a row with before/after changes
- [ ] Verify "Before" section in red background
- [ ] Verify "After" section in green background

**Status:** ⬜ Pass / ⬜ Fail

---

## 🎨 VISUAL CHECKS

### Responsive Design:
- [ ] Resize browser to mobile width (375px)
- [ ] Verify all pages work on mobile
- [ ] Verify tables scroll horizontally on mobile
- [ ] Verify modals fit on screen
- [ ] Verify buttons are touchable

### Navigation:
- [ ] Click "Employees" in sidebar → Navigates to /employees
- [ ] Click "Loyalty Program" → Navigates to /loyalty
- [ ] Click "Promotions" → Navigates to /promotions
- [ ] Click "Notifications" → Navigates to /notifications
- [ ] Click "Audit Logs" → Navigates to /audit-logs
- [ ] Verify active page highlighted in sidebar

### Loading States:
- [ ] Refresh employees page → Verify "Loading employees..." message
- [ ] Refresh other pages → Verify loading states

### Empty States:
- [ ] If no data, verify friendly "No items found" messages
- [ ] Verify appropriate icons displayed (bell, file, etc.)

### Toast Notifications:
- [ ] Verify success toasts are green
- [ ] Verify error toasts are red
- [ ] Verify toasts auto-dismiss after 3-5 seconds

---

## 🐛 BUG REPORTING

If you find issues, document:

1. **Page:** Which page?
2. **Action:** What did you do?
3. **Expected:** What should happen?
4. **Actual:** What actually happened?
5. **Browser:** Chrome/Firefox/Safari?
6. **Console Errors:** Check browser console (F12)

---

## ✅ SIGN-OFF

**Tester Name:** ______________________

**Date:** ______________________

**Overall Status:** ⬜ Pass / ⬜ Fail

**Notes:**
```
[Add any additional comments here]
```

---

**Testing completed for FiscalNext Day 6 Features**
