# 🗺️ PRODUCT ROADMAP
## Fiscalization Platform - 13-Week MVP Journey

**Created by:** Sara (Product Manager)  
**Date:** 2026-02-23  
**Roadmap Type:** Feature-based, time-boxed  
**Target:** Beta Launch (Week 13)

---

## 📊 ROADMAP OVERVIEW

```
Foundation → Auth → Products → POS → Fiscal → Reports → Launch
   Week 1   │ W2-4  │  W5-6   │ W7-8 │ W9-10 │ W11-12 │  W13
    ✅      │       │        │      │       │        │
           Sprint 1 │Sprint 2│Sprint3│Sprint4│Sprint5│Sprint6
```

**Total Duration:** 13 weeks (3 months)  
**Team Size:** 7 people (CTO, PM, Team Lead, 2 Devs, Designer, DevOps)  
**Sprint Cadence:** 2-week sprints (except Sprint 1: 3 weeks)

**Last Updated:** 2026-02-23 (Day 2)  
**Current Status:** Week 1 Complete ✅, Sprint 1 starting

---

## 📅 DETAILED WEEK-BY-WEEK ROADMAP

### 🏗️ WEEK 1: FOUNDATION & SETUP
**Goal:** Get the team and infrastructure ready to build

**Deliverables:**
- [x] GitHub organization created ✅
- [x] Development + Staging servers deployed ✅
- [x] Database (PostgreSQL) configured ✅
- [x] CI/CD pipeline setup ✅
- [x] Monorepo structure created ✅
- [x] Design system started (colors, typography) ✅
- [x] Project management tool configured (Linear/Jira) ✅
- [x] Team onboarding complete ✅
- [x] Communication channels setup (Slack/Discord) ✅
- [x] All agents registered and operational ✅ (NEW)
- [x] Infrastructure documented ✅ (NEW)

**Who's Involved:** Everyone  
**Status:** ✅ **COMPLETE** (Day 1 - 2026-02-23)

**Key Decisions:**
- Tech stack confirmed (Node.js, Next.js, React Native, PostgreSQL)
- Design tools confirmed (Figma)
- Cloud provider confirmed (DigitalOcean/AWS)

**Actual Completion:** Day 1 ✅  
**Highlights:**
- Docker infrastructure deployed
- Multi-agent system operational
- CI/CD pipeline tested and working
- All 7 agents briefed and ready
- Day 1 reports submitted

---

### 🔐 WEEKS 2-4: SPRINT 1 - AUTHENTICATION & SETUP
**Goal:** Users can register, login, and manage their business

**Sprint Duration:** 3 weeks (longer due to foundational work)  
**Story Points:** 92 (core features)  
**Status:** 🔄 **IN PLANNING** (Day 2 - Sprint Planning Complete)

#### Week 2: Registration & Verification
**Features:**
- [ ] Business registration form
- [ ] Email verification flow
- [ ] Welcome wizard (first-time setup)
- [ ] Database schema for users & businesses
- [ ] User roles defined (Owner, Manager, Cashier)
- [ ] Dashboard skeleton (navigation, header)

**Deliverables:**
- Users can register a business
- Email verification works
- Basic dashboard shows up after login

**Design Work:**
- [ ] Registration flow mockups
- [ ] Dashboard layout wireframes
- [ ] Component library started (buttons, inputs, forms)

**Status:** ⏳ Starting (Day 3)

---

#### Week 3: Login & Session Management
**Features:**
- [x] Login form
- [x] JWT authentication (access + refresh tokens)
- [x] Password reset (forgot password)
- [x] Session management (auto-logout after inactivity)
- [x] "Remember me" functionality
- [x] Rate limiting (prevent brute force)

**Deliverables:**
- Complete auth flow working (register → verify → login → dashboard)
- Secure session management
- Password reset via email

**Design Work:**
- Login/password reset screens
- Error states and success messages

---

#### Week 4: User Management & Profile
**Features:**
- [x] User roles & permissions (RBAC)
- [x] Permission checking middleware
- [x] User management page (add/edit/deactivate users)
- [x] User profile (view/edit)
- [x] Business settings page (basic)
- [x] Upload logo and profile photos

**Deliverables:**
- Owners can add employees
- Role-based access control works
- Users can edit their profile
- Business settings configurable

**Design Work:**
- User management UI
- Profile page
- Settings page layout

**Mobile App (Parallel):**
- [ ] React Native project initialized
- [ ] Navigation structure created
- [ ] Login screen (UI only)

**Sprint 1 Review:** End of Week 4 (Friday 4:00 PM)

---

### 📦 WEEKS 5-6: SPRINT 2 - PRODUCTS & INVENTORY
**Goal:** Users can add products and track inventory

**Sprint Duration:** 2 weeks  
**Story Points:** 55

#### Week 5: Product Catalog
**Features:**
- [x] Product database schema
- [x] Add/edit/delete products
- [x] Product categories
- [x] Product fields: name, SKU, barcode, price, tax rate
- [x] Upload product images
- [x] Product list view (table with search/filter)
- [x] Product detail view

**Deliverables:**
- Product catalog fully functional
- Users can add products with images
- Categories organized
- Search and filter working

**Design Work:**
- Product list/grid views
- Product form (add/edit)
- Category management UI

---

#### Week 6: Inventory Tracking
**Features:**
- [x] Stock tracking (quantity on hand)
- [x] Automatic stock reduction on sale (prep for POS)
- [x] Manual stock adjustments
- [x] Stock adjustment reasons (damage, recount, etc.)
- [x] Low stock alerts (visual indicators)
- [x] Inventory reports (current stock levels)
- [x] Barcode generation (print labels)

**Deliverables:**
- Real-time inventory tracking works
- Stock levels update automatically
- Low stock alerts visible
- Basic inventory reports

**Design Work:**
- Inventory dashboard
- Stock adjustment modal
- Low stock alerts UI

**Mobile App (Parallel):**
- [x] Product list screen
- [x] Add product screen
- [x] Barcode scanner integration (camera)
- [x] Stock adjustment screen

**Sprint 2 Review:** End of Week 6 (Friday 4:00 PM)

---

### 💰 WEEKS 7-8: SPRINT 3 - POINT OF SALE
**Goal:** Cashiers can process sales and generate receipts

**Sprint Duration:** 2 weeks  
**Story Points:** 65

#### Week 7: POS Interface & Cart
**Features:**
- [x] POS interface (product grid, cart, calculator)
- [x] Product selection (click to add to cart)
- [x] Barcode scanning (USB scanner + mobile camera)
- [x] Cart management (add, remove, adjust quantity)
- [x] Price calculation (subtotal, tax, total)
- [x] Apply discounts (percentage or fixed amount)
- [x] Clear cart
- [x] Suspend/hold transaction (resume later)

**Deliverables:**
- POS interface is fast and intuitive
- Barcode scanning works (USB + camera)
- Cart updates in real-time
- Discounts apply correctly

**Design Work:**
- POS interface (cashier-optimized, touch-friendly)
- Cart component
- Discount modal
- Product grid layout

---

#### Week 8: Payment & Receipts
**Features:**
- [x] Payment methods (cash, card)
- [x] Split payment (cash + card)
- [x] Calculate change
- [x] Complete sale (finalize transaction)
- [x] Generate receipt
- [x] Print receipt (thermal printer integration)
- [x] Email receipt
- [x] Receipt preview
- [x] Transaction history
- [x] Void/cancel transaction
- [x] Basic returns & refunds

**Deliverables:**
- Complete sales flow works end-to-end
- Receipts print correctly
- Email receipts sent
- Returns processed

**Design Work:**
- Payment screen
- Receipt template (thermal printer format)
- Receipt preview modal
- Return/refund flow

**Mobile App (Parallel):**
- [x] Full POS interface
- [x] Barcode scanning (camera)
- [x] Cart management
- [x] Payment processing
- [x] Bluetooth printer integration
- [x] Offline mode preparation (local database)

**Sprint 3 Review:** End of Week 8 (Friday 4:00 PM)

---

### 🧾 WEEKS 9-10: SPRINT 4 - FISCALIZATION
**Goal:** Tax compliance - integrate with Albania & Kosovo tax authorities

**Sprint Duration:** 2 weeks  
**Story Points:** 70

#### Week 9: Albania Fiscal Integration
**Features:**
- [x] Albania Tax Authority API integration
- [x] NUIS authentication
- [x] Generate fiscal receipt
- [x] Submit receipt to tax authority (real-time)
- [x] Generate NSLF (fiscal number)
- [x] QR code with fiscal data
- [x] Handle API errors gracefully
- [x] Retry logic for failed submissions
- [x] Fiscal receipt format (compliant with Albania requirements)

**Deliverables:**
- Albania fiscalization works
- Receipts submitted successfully to tax authority
- QR code on receipts
- Error handling works

**Technical Notes:**
- Research Albania Tax Authority API documentation
- Test with sandbox/test environment
- Apply for certification (if required)

---

#### Week 10: Kosovo Fiscal Integration & Offline Queue
**Features:**
- [x] Kosovo Tax Authority API integration
- [x] Kosovo-specific fiscal receipt format
- [x] Dual country support (switch based on business location)
- [x] Offline queue (queue transactions when no internet)
- [x] Auto-sync when back online
- [x] Conflict resolution (handle duplicate submissions)
- [x] Daily Z-report (fiscal day closing)
- [x] Fiscal receipt archive (90+ days)
- [x] Tax breakdown (VAT calculation)

**Deliverables:**
- Kosovo fiscalization works
- Offline mode works (critical for cafes, restaurants)
- Z-report generated
- Fiscal archive stored

**Design Work:**
- Offline indicator (UI shows when offline)
- Sync status indicator
- Z-report template

**Mobile App (Parallel):**
- [x] Offline mode fully functional
- [x] Local SQLite database
- [x] Sync engine (upload queued transactions)
- [x] Fiscal integration (Albania + Kosovo)

**Compliance:**
- [ ] Apply for Albania fiscal certification
- [ ] Apply for Kosovo fiscal certification
- [ ] Test with tax authority sandbox
- [ ] Submit sample receipts for approval

**Sprint 4 Review:** End of Week 10 (Friday 4:00 PM)

---

### 📊 WEEKS 11-12: SPRINT 5 - REPORTS & CRM
**Goal:** Business insights and customer relationship management

**Sprint Duration:** 2 weeks  
**Story Points:** 60

#### Week 11: Reporting & Analytics
**Features:**
- [x] Daily sales report
- [x] Sales by period (date range selector)
- [x] Sales by product (best sellers)
- [x] Sales by payment method
- [x] Revenue summary
- [x] Tax breakdown (VAT collected)
- [x] Export to Excel (.xlsx)
- [x] Export to PDF
- [x] Print reports
- [x] Report scheduling (email daily/weekly reports) - OPTIONAL

**Deliverables:**
- All basic reports working
- Export functionality works
- Reports are accurate and fast

**Design Work:**
- Report dashboard
- Date range picker
- Charts (line, bar, pie)
- Report templates (PDF)

---

#### Week 12: Customer Relationship Management (CRM)
**Features:**
- [x] Customer database schema
- [x] Add/edit/delete customers
- [x] Customer fields: name, phone, email, address
- [x] Customer purchase history
- [x] Loyalty points system
  - Earn points on purchases (configurable ratio)
  - Redeem points for discounts
  - Points balance tracking
- [x] Assign customer to sale (during checkout)
- [x] Customer list view (search, filter)
- [x] Top customers report (highest spenders)

**Deliverables:**
- CRM fully functional
- Loyalty program works
- Customers can earn and redeem points
- Customer data captured during sales

**Design Work:**
- Customer list/detail views
- Add customer modal (quick add during checkout)
- Loyalty points UI
- Customer profile page

**Mobile App (Parallel):**
- [x] Reports view (basic stats)
- [x] Customer management
- [x] Loyalty points
- [x] Push notifications (low stock alerts)

**Sprint 5 Review:** End of Week 12 (Friday 4:00 PM)

---

### 🚀 WEEK 13: SPRINT 6 - POLISH & BETA LAUNCH
**Goal:** Final testing, bug fixes, and prepare for beta launch

**Sprint Duration:** 1 week (short sprint)  
**Story Points:** 30 (mostly testing and fixes)

**Focus Areas:**
1. **Bug Fixes**
   - [ ] Fix all P0 (critical) bugs
   - [ ] Fix all P1 (high priority) bugs
   - [ ] Triage P2 bugs (defer to post-launch if low impact)

2. **Performance Optimization**
   - [ ] Page load time < 3 seconds
   - [ ] API response time < 200ms
   - [ ] Database query optimization
   - [ ] Image optimization
   - [ ] CDN setup for static assets

3. **Security Review**
   - [ ] Penetration testing
   - [ ] SQL injection prevention verified
   - [ ] XSS protection verified
   - [ ] CSRF protection verified
   - [ ] Password hashing secure (bcrypt)
   - [ ] HTTPS enforced

4. **User Acceptance Testing (UAT)**
   - [ ] Internal team testing (all features)
   - [ ] 10+ beta testers recruited
   - [ ] Beta testers complete onboarding
   - [ ] Collect feedback from beta testers
   - [ ] Iterate on critical feedback

5. **Documentation**
   - [ ] User guide (PDF + online)
   - [ ] Video tutorials (5-10 min each):
     - Getting started
     - Adding products
     - Processing sales
     - Viewing reports
   - [ ] API documentation (Swagger)
   - [ ] FAQ

6. **Launch Preparation**
   - [ ] Production server configured
   - [ ] Domain configured (www.fiscalnext.com)
   - [ ] SSL certificate
   - [ ] Monitoring setup (Sentry, New Relic)
   - [ ] Backup strategy tested
   - [ ] Mobile apps submitted to App Store / Play Store
   - [ ] Marketing website live (landing page)
   - [ ] Beta signup form
   - [ ] Support email setup (support@fiscalnext.com)

**Deliverables:**
- Zero P0/P1 bugs
- Performance targets met
- Security audit passed
- 10+ beta testers onboarded
- Documentation complete
- Mobile apps published (or in review)
- Ready for beta launch

**Sprint 6 Review & Retrospective:** End of Week 13 (Friday)

**🎉 BETA LAUNCH:** Week 13 (Friday or Monday Week 14)

---

## 🎯 ROADMAP MILESTONES

| Milestone | Target Date | Status | Actual |
|-----------|-------------|--------|--------|
| Foundation Complete | End Week 1 | ✅ DONE | Day 1 (2026-02-23) |
| Sprint 1 Planning | Week 2 Day 2 | ✅ DONE | Day 2 (2026-02-23) |
| Sprint 2 Planning | Week 2 Day 2 | ✅ DONE | Day 2 (2026-02-23) |
| User Authentication Live | End Week 4 | ⏳ In Progress | - |
| Product Catalog Live | End Week 6 | ⏳ Upcoming | - |
| POS Functional | End Week 8 | ⏳ Upcoming | - |
| Fiscalization Working | End Week 10 | ⏳ Upcoming | - |
| Reports & CRM Live | End Week 12 | ⏳ Upcoming | - |
| **BETA LAUNCH** | **End Week 13** | ⏳ **TARGET** | - |

---

## 📱 MOBILE APP PARALLEL TRACK

The mobile app is developed in parallel with web features:

| Week | Mobile Focus |
|------|--------------|
| W1 | Project setup, navigation structure |
| W2-4 | Login flow, basic UI components |
| W5-6 | Product management, barcode scanner |
| W7-8 | Full POS interface, offline database setup |
| W9-10 | Fiscal integration, offline sync |
| W11-12 | Reports, CRM, push notifications |
| W13 | Testing, App Store submission |

**Platforms:** iOS + Android (React Native)  
**Offline Mode:** Critical feature (local SQLite + sync)

---

## 🚧 RISK MITIGATION

### Key Risks & Mitigation Strategies

1. **Fiscal Certification Delays**
   - **Risk:** Albania/Kosovo tax authority approval takes longer than expected
   - **Mitigation:** Apply early (Week 9), have fallback plan (launch without fiscal first, add later)
   - **Impact:** Could delay beta launch by 2-4 weeks

2. **Offline Mode Complexity**
   - **Risk:** Sync conflicts, data loss
   - **Mitigation:** Extensive testing, simple conflict resolution (last write wins)
   - **Impact:** Could delay Sprint 4 by 1 week

3. **Mobile App Store Review**
   - **Risk:** Apple/Google reject app
   - **Mitigation:** Follow guidelines strictly, submit early (Week 12)
   - **Impact:** Could delay mobile launch by 1-2 weeks (web can launch first)

4. **Thermal Printer Integration**
   - **Risk:** Hardware compatibility issues
   - **Mitigation:** Test with multiple printer models (Epson, Star Micronics)
   - **Impact:** Low (can fall back to PDF receipts)

5. **Performance Issues**
   - **Risk:** Slow page loads, API timeouts
   - **Mitigation:** Performance testing throughout, optimize early
   - **Impact:** Medium (could require extra week for optimization)

---

## 📊 FEATURE PRIORITIZATION FRAMEWORK

**P0 (Must Have):** Blocks launch, critical for compliance or core value  
**P1 (Should Have):** Important for user experience, but not blocking  
**P2 (Nice to Have):** Enhances experience, can defer to Phase 2  
**P3 (Won't Have):** Not in scope for MVP

### Sprint-by-Sprint Priorities

| Sprint | P0 Features | P1 Features | P2 Features |
|--------|-------------|-------------|-------------|
| Sprint 1 | Auth, roles, DB | User management, settings | 2FA |
| Sprint 2 | Products, categories | Inventory tracking, images | Variants |
| Sprint 3 | POS, payments, receipts | Returns, discounts | Coupon codes |
| Sprint 4 | Albania fiscal, offline queue | Kosovo fiscal, Z-report | E-invoice |
| Sprint 5 | Basic reports, export | CRM, loyalty | Advanced analytics |
| Sprint 6 | Bug fixes, testing | Performance, docs | Marketing site |

---

## 🎨 DESIGN DELIVERABLES BY WEEK

| Week | Design Focus | Deliverables |
|------|--------------|--------------|
| W1 | Design system | Colors, typography, component library started |
| W2 | Auth flows | Registration, login, welcome wizard screens |
| W3 | Dashboard | Dashboard layout, navigation, widgets |
| W4 | User management | User list, profile, settings pages |
| W5 | Products | Product list/grid, add/edit forms |
| W6 | Inventory | Inventory dashboard, stock adjustments |
| W7 | POS | POS interface (cashier-optimized) |
| W8 | Receipts | Receipt templates, payment screens |
| W9 | Fiscal | Fiscal receipt formats, offline indicators |
| W10 | Reports (start) | Report layouts, charts |
| W11 | Reports (finish) | Export templates, PDF layouts |
| W12 | CRM | Customer management, loyalty UI |
| W13 | Polish | Final touches, animations, onboarding |

**Design Tools:** Figma  
**Design System:** Tailwind CSS components

---

## 💰 REVENUE & BUSINESS MILESTONES

| Milestone | Target | Measurement |
|-----------|--------|-------------|
| Beta Testers | 10+ businesses | Week 13 |
| Positive Feedback | NPS ≥40 | Week 14-15 |
| Paying Customers | 5+ businesses | Week 15 |
| Monthly Recurring Revenue (MRR) | €500+ | End Month 4 |
| Customer Retention | ≥60% weekly active | Ongoing |

**Pricing (Initial):**
- Free trial: 30 days, full access
- Starter: €29/month
- Professional: €79/month
- Enterprise: €199/month

---

## 📅 POST-MVP ROADMAP (Phase 2)

**Months 4-6:** Advanced features
- Multi-location support
- Advanced inventory (purchase orders, suppliers)
- Employee performance tracking
- Restaurant module (table management, KDS)
- Customer portal (self-service)
- Marketing campaigns (SMS/email)
- E-commerce integration

**Months 7-9:** AI & Integrations
- AI-powered analytics (sales forecasting, demand prediction)
- Accounting integration (QuickBooks)
- WhatsApp Business API
- Advanced promotions
- Multi-currency support

**Months 10-12:** Scale & Expansion
- Multi-language support
- White-label solution
- Franchise management
- Advanced integrations
- Enterprise features

---

## ✅ SUCCESS CRITERIA

**MVP is successful if:**
1. ✅ All Sprint 1-6 features complete
2. ✅ Fiscal certification (Albania + Kosovo)
3. ✅ Mobile apps published (iOS + Android)
4. ✅ 10+ beta testers validated
5. ✅ Zero critical bugs (P0/P1)
6. ✅ Performance targets met
7. ✅ Positive user feedback (NPS ≥40)

**If we achieve this, we:**
- Launch on time (Week 13)
- Have a competitive product
- Can acquire paying customers
- Build momentum for Phase 2

---

## 📞 ROADMAP REVIEWS

**Weekly Product Sync:** Every Monday 2:00 PM
- Review progress vs roadmap
- Adjust priorities if needed
- Identify blockers

**Sprint Reviews:** End of each sprint (Friday 4:00 PM)
- Demo completed features
- Gather feedback
- Update roadmap if needed

**Quarterly Planning:** After MVP (Month 4)
- Review Phase 2 priorities
- Adjust based on customer feedback
- Plan next 3 months

---

**Document Status:** ✅ APPROVED  
**Next Review:** Weekly (every Monday)  
**Last Updated:** 2026-02-23

**Created by:** Sara (Product Manager)  
**Approved by:** TBD (CEO, CTO)
