# 🎯 MVP SCOPE DEFINITION
## Fiscalization Platform - Minimum Viable Product

**Version:** 1.0  
**Defined by:** Sara (Product Manager)  
**Date:** 2026-02-23  
**Target Launch:** Week 13 (Beta)

---

## 🚀 WHAT IS MVP?

**MVP (Minimum Viable Product)** is the smallest set of features that:
1. ✅ Solves the core problem (fiscalization compliance)
2. ✅ Provides value to early adopters
3. ✅ Can be launched quickly (13 weeks)
4. ✅ Differentiates us from competitors
5. ✅ Generates initial revenue

**What MVP is NOT:**
- ❌ A feature-complete product
- ❌ The final version
- ❌ Missing critical compliance features
- ❌ Unusable or buggy

---

## 🎯 MVP CORE VALUE PROPOSITION

> **"A modern, mobile-first fiscalization platform for Albanian & Kosovar businesses that makes tax compliance effortless while providing powerful POS and inventory management."**

### Key Differentiators (Must Have in MVP)
1. ✅ **Mobile-First** - iOS + Android apps (competitors are web-only or Android-only)
2. ✅ **Beautiful UX** - Modern, intuitive design (competitors have outdated UI)
3. ✅ **True Offline Mode** - Works without internet (competitors charge extra or don't support)
4. ✅ **Dual Country Support** - Albania + Kosovo fiscalization (unique)
5. ✅ **Built-in CRM** - Customer loyalty from day one (competitors don't have this)

---

## ✅ MVP FEATURE LIST (13-Week Scope)

### 🔐 1. AUTHENTICATION & USER MANAGEMENT (Sprint 1)
**Why:** Can't use the platform without accounts
- [x] Business registration
- [x] Email verification
- [x] Login/logout
- [x] Password reset
- [x] User roles (Owner, Manager, Cashier)
- [x] User management (add/edit/deactivate)
- [x] User profile
- [ ] 2FA (NICE TO HAVE - can defer to post-MVP)

**Status:** ✅ In Sprint 1

---

### 📦 2. PRODUCT CATALOG (Sprint 2)
**Why:** Need products to sell
- [x] Add/edit/delete products
- [x] Product categories
- [x] Product name, price, SKU
- [x] Barcode support
- [x] Product images (1 per product)
- [x] Tax rate assignment
- [x] Product status (active/inactive)
- [ ] Product variants (DEFER - can add manually as separate products for MVP)
- [ ] Multiple images (DEFER - 1 is enough for MVP)

**Status:** ✅ In Sprint 2

---

### 💰 3. POINT OF SALE (Sprint 3)
**Why:** The main use case - selling products
- [x] Product search & selection
- [x] Barcode scanning (USB scanner + mobile camera)
- [x] Cart management (add/remove items, adjust quantity)
- [x] Apply discounts (percentage or fixed amount)
- [x] Payment methods:
  - Cash
  - Card
  - Split payment (cash + card)
- [x] Calculate change
- [x] Complete sale
- [x] Void/cancel transaction
- [x] Generate receipt
- [x] Print receipt (thermal printer)
- [x] Email receipt
- [ ] SMS receipt (DEFER - email is enough for MVP)
- [ ] Coupon codes (DEFER to Phase 2)
- [ ] Customer assignment (DEFER - can add post-sale manually)
- [x] Returns & refunds (basic)

**Status:** ✅ In Sprint 3

---

### 🧾 4. FISCALIZATION (Sprint 4)
**Why:** Legal requirement - can't launch without this
- [x] Albania Tax Authority API integration
- [x] Kosovo Tax Authority API integration
- [x] Generate fiscal receipt
- [x] Submit receipt to tax authority (real-time)
- [x] Generate NSLF (fiscal number)
- [x] QR code with fiscal data
- [x] Handle API errors gracefully
- [x] Retry failed submissions
- [x] Offline queue (submit when back online)
- [x] Daily Z-report
- [x] Fiscal receipt archive (90 days minimum)
- [ ] E-invoice generation (DEFER - most small businesses don't need this for MVP)
- [ ] Accompanying invoice (DEFER - only for goods transport)

**Status:** ✅ In Sprint 4

---

### 📊 5. BASIC REPORTING (Sprint 5)
**Why:** Users need to see how business is doing
- [x] Daily sales report
- [x] Sales by period (date range selector)
- [x] Sales by product
- [x] Sales by payment method
- [x] Revenue summary
- [x] Tax breakdown (VAT collected)
- [x] Export to Excel
- [x] Export to PDF
- [ ] Sales by employee (DEFER - add in Phase 2)
- [ ] Sales by hour (DEFER - nice to have)
- [ ] Advanced analytics/charts (DEFER - basic tables are enough for MVP)

**Status:** ✅ In Sprint 5

---

### 📦 6. BASIC INVENTORY (Sprint 2)
**Why:** Track what's in stock
- [x] Real-time stock tracking
- [x] Automatic stock reduction on sale
- [x] Manual stock adjustments (add/remove)
- [x] Low stock alerts (visual indicator)
- [x] Current stock levels report
- [ ] Purchase orders (DEFER - can add stock manually for MVP)
- [ ] Suppliers (DEFER - not critical for MVP)
- [ ] Batch/lot tracking (DEFER - too complex for MVP)
- [ ] Stock transfers between locations (DEFER - single location for MVP)

**Status:** ✅ In Sprint 2

---

### 🏢 7. SINGLE LOCATION (Sprint 1)
**Why:** Multi-location adds complexity - start simple
- [x] Create one location during setup
- [x] Location details (name, address)
- [ ] Multiple locations (DEFER to Phase 2)
- [ ] Stock transfers (DEFER to Phase 2)

**Status:** ✅ In Sprint 1

---

### 👥 8. BASIC CRM (Sprint 5)
**Why:** Differentiator - competitors don't have this
- [x] Customer database (add/edit customers)
- [x] Customer phone, email, name
- [x] Customer purchase history
- [x] Loyalty points system (earn & redeem)
- [x] Points balance tracking
- [x] Assign customer to sale
- [ ] Customer portal (DEFER to Phase 2)
- [ ] Birthday tracking (DEFER - nice to have)
- [ ] Customer segments (DEFER - not critical for MVP)
- [ ] SMS/email campaigns (DEFER to Phase 2)

**Status:** ✅ In Sprint 5

---

### 📱 9. MOBILE APP (Sprints 2-6)
**Why:** Major differentiator - competitors are web-only or Android-only
- [x] iOS app (React Native)
- [x] Android app (React Native)
- [x] Full POS functionality
- [x] Barcode scanning (camera)
- [x] Receipt printing (Bluetooth printer)
- [x] **Offline mode** (local SQLite database)
- [x] Auto-sync when back online
- [x] Manager dashboard
- [x] Basic inventory management
- [x] Push notifications (low stock alerts)
- [ ] Biometric login (DEFER - nice to have)
- [ ] Dark mode (DEFER - nice to have)

**Status:** ✅ Parallel development (Sprints 2-6)

---

### 🎨 10. ADMIN DASHBOARD (Sprint 1, 5)
**Why:** Manage business from web
- [x] Dashboard home (sales overview)
- [x] Navigation (sidebar menu)
- [x] Business settings
- [x] User management (if owner/manager)
- [x] Basic stats widgets
- [ ] Customizable dashboard widgets (DEFER - fixed layout is fine for MVP)
- [ ] Dark mode (DEFER - nice to have)

**Status:** ✅ In Sprint 1 (skeleton) + Sprint 5 (stats)

---

## ❌ EXPLICITLY OUT OF SCOPE (Post-MVP)

These features are **NOT** in MVP - they'll come in Phase 2 (Months 4-6):

### Deferred to Phase 2:
- [ ] Multi-location support
- [ ] Stock transfers between locations
- [ ] Advanced inventory (purchase orders, suppliers)
- [ ] Employee performance tracking
- [ ] Advanced analytics & BI
- [ ] Restaurant module (table management, KDS)
- [ ] Customer portal (self-service)
- [ ] Marketing campaigns (SMS/email bulk send)
- [ ] E-commerce integration (WooCommerce, Shopify)
- [ ] Accounting integration (QuickBooks)
- [ ] WhatsApp Business API
- [ ] Advanced promotions (coupon codes, BOGO)
- [ ] Two-factor authentication (2FA)
- [ ] Batch/lot tracking
- [ ] E-invoice generation
- [ ] Accompanying invoice
- [ ] Customer segments
- [ ] API access for third parties
- [ ] Multi-currency support
- [ ] Advanced permissions (custom roles)

### Deferred to Phase 3 (Months 7-9+):
- [ ] AI-powered features (sales forecasting, demand prediction)
- [ ] Multi-language support (beyond Albanian/English)
- [ ] White-label solution
- [ ] Franchise management
- [ ] Advanced integrations (payment gateways, delivery platforms)

---

## 📊 MVP FEATURE BREAKDOWN BY SPRINT

| Sprint | Focus | Key Features | Duration |
|--------|-------|--------------|----------|
| **Sprint 1** | Auth & Setup | Registration, login, roles, dashboard skeleton, business settings | 3 weeks |
| **Sprint 2** | Products & Inventory | Product catalog, categories, basic inventory tracking | 2 weeks |
| **Sprint 3** | POS Core | Full POS flow, cart, payment, receipts, returns | 2 weeks |
| **Sprint 4** | Fiscalization | Albania + Kosovo tax authority integration, offline queue | 2 weeks |
| **Sprint 5** | Reports & CRM | Basic reports, customer database, loyalty points | 2 weeks |
| **Sprint 6** | Polish & Launch | Bug fixes, performance, testing, beta launch prep | 2 weeks |

**Total:** 13 weeks (3 months)

---

## 🎯 MVP SUCCESS METRICS

### Launch Criteria (Must achieve before Beta launch)
1. ✅ All Sprint 1-6 features complete and tested
2. ✅ Albania fiscal certification approved
3. ✅ Kosovo fiscal certification approved
4. ✅ Mobile apps (iOS + Android) published to App Store / Play Store
5. ✅ Zero critical bugs (P0/P1)
6. ✅ Performance: Page load < 3s, API response < 200ms
7. ✅ Security audit passed
8. ✅ 10+ beta testers using the platform
9. ✅ Positive feedback from beta testers (NPS ≥40)
10. ✅ Documentation complete (user guide, video tutorials)

### Post-Launch Metrics (First 3 months)
- **Acquisition:** 50+ paying businesses
- **Activation:** ≥80% complete onboarding wizard
- **Retention:** ≥60% use the platform weekly
- **Revenue:** €5,000+ MRR (Monthly Recurring Revenue)
- **Satisfaction:** NPS ≥50

---

## 🚫 SCOPE CREEP PREVENTION

### How to Say "No" to Feature Requests During MVP

**Decision Framework:**
1. **Is it critical for compliance?** → If yes, consider adding
2. **Is it a differentiator?** → If yes and high impact, consider adding
3. **Does it block sales?** → If yes, consider adding
4. **Can we defer to Phase 2?** → If yes, defer it
5. **Will it delay launch?** → If yes, defer it

**Response Template:**
> "Great idea! That's definitely valuable. For MVP, we're focusing on [core problem]. Let's add this to the Phase 2 backlog and revisit after launch."

### Feature Request Log
All deferred requests go to: `product/PHASE_2_BACKLOG.md`

---

## 📅 MVP TIMELINE

**Week 1:** Foundation setup (infrastructure, tools, team onboarding)  
**Weeks 2-4:** Sprint 1 (Auth & Setup)  
**Weeks 5-6:** Sprint 2 (Products & Inventory)  
**Weeks 7-8:** Sprint 3 (POS Core)  
**Weeks 9-10:** Sprint 4 (Fiscalization)  
**Weeks 11-12:** Sprint 5 (Reports & CRM)  
**Week 13:** Sprint 6 (Polish & Beta Launch)

**Beta Launch Target:** End of Week 13 (Early June 2026)

---

## 🎉 WHAT USERS CAN DO WITH MVP

### Day 1 (Business Owner)
1. Register my business
2. Add products to catalog
3. Configure my fiscal printer
4. Train my cashier
5. Start selling!

### Day 30 (After One Month)
1. View sales reports (daily, weekly, monthly)
2. Check inventory levels
3. Add customers to CRM
4. Award loyalty points
5. Manage employees (add cashier, manager)
6. Export data for accountant
7. Use mobile app for on-the-go management

### Day 90 (After Three Months)
1. All above +
2. Have historical data (3 months of sales)
3. Identify best-selling products
4. Track loyal customers
5. Make data-driven decisions
6. Scale to Phase 2 features if needed

---

## 💰 MVP PRICING (Initial)

**Freemium Model:**
- **Free Tier:** 1 location, 100 transactions/month, 1 user
- **Starter:** €29/month - 1 location, unlimited transactions, 3 users
- **Professional:** €79/month - 3 locations, unlimited transactions, 10 users, priority support
- **Enterprise:** €199/month - Unlimited locations, unlimited users, dedicated support

*(Pricing can be adjusted post-launch based on market feedback)*

---

## ✅ APPROVAL & SIGN-OFF

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | Sara | ✅ Approved | 2026-02-23 |
| CTO | Alex | ⏳ Pending | - |
| CEO | Turi | ⏳ Pending | - |

**Status:** 📋 DRAFT - Awaiting approval  
**Next Step:** Review with CTO and CEO, finalize scope

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-23  
**Next Review:** After Sprint 1 (Week 4)
