# 👥 ROLE RESPONSIBILITIES - QUICK REFERENCE
## Who Does What - Simple Breakdown

---

## 🎯 **CEO / FOUNDER**

### **Time Commitment:** 15-20 hours/week

### **Main Job:**
You set the vision, make sure team has what they need, and prepare for market launch.

### **Weekly Tasks:**
**Monday:**
- [ ] Sprint planning meeting (2 hours)
- [ ] Review team progress
- [ ] Unblock any issues

**Tuesday-Thursday:**
- [ ] Daily standup (15 min each day)
- [ ] Strategic work (partnerships, sales prep)
- [ ] Follow up on tax authority contacts

**Friday:**
- [ ] Sprint review meeting (1 hour)
- [ ] Check budget/burn rate
- [ ] Plan next week

### **Month-by-Month Focus:**

**Month 1 (Week 1-4):**
- ✅ Hire and onboard team
- ✅ Contact Albania/Kosovo tax authorities
- ✅ Setup tools (Slack, GitHub, Jira)
- ✅ Order testing hardware (tablets, printers)
- ✅ Start recruiting beta testers (10-15 businesses)

**Month 2 (Week 5-8):**
- ✅ Continue beta user recruitment
- ✅ Weekly check-ins with tax authorities
- ✅ Review product progress
- ✅ Start marketing prep (website, social media)

**Month 3 (Week 9-13):**
- ✅ Finalize beta user list
- ✅ Prepare onboarding materials
- ✅ Launch beta program
- ✅ Collect feedback
- ✅ Plan public launch

### **What You DON'T Do:**
❌ Write code (unless you're also CTO)
❌ Design UI (that's designer's job)
❌ Manage daily tasks (that's team lead's job)

### **What You DO:**
✅ Remove blockers ("We need API access" → you call tax authority)
✅ Make strategic decisions (pricing, features, market)
✅ Manage budget and cash flow
✅ Build partnerships and sales pipeline
✅ Keep team motivated

---

## 🏗️ **CTO / TECHNICAL LEAD**

### **Time Commitment:** 40 hours/week (full-time)

### **Main Job:**
You design the technical architecture, review code, and make technical decisions.

### **Daily Tasks:**
- [ ] Code reviews (2-3 hours/day)
- [ ] Answer technical questions from team
- [ ] Solve complex technical problems
- [ ] Review architecture decisions

### **Weekly Tasks:**
- [ ] Sprint planning (help estimate complexity)
- [ ] Architecture reviews
- [ ] Security audits
- [ ] Technical documentation

### **Month-by-Month Focus:**

**Month 1 (Week 1-4):**
- ✅ Finalize architecture design
- ✅ Setup infrastructure (servers, databases)
- ✅ Create development guidelines
- ✅ Review all code (auth system is critical)
- ✅ Setup CI/CD pipeline

**Month 2 (Week 5-8):**
- ✅ Review product catalog architecture
- ✅ Review POS transaction flow
- ✅ Performance optimization planning
- ✅ Security hardening

**Month 3 (Week 9-13):**
- ✅ Review fiscal integration (most critical!)
- ✅ Ensure security compliance
- ✅ Plan scalability improvements
- ✅ Beta launch readiness

### **What You Code:**
✅ Critical features (fiscal integration, auth)
✅ Complex algorithms
✅ Security-sensitive code
✅ Performance optimizations

### **What You Don't Code:**
❌ Simple CRUD endpoints (junior/mid devs do this)
❌ Basic UI components (frontend dev does this)
❌ Routine bug fixes (team handles these)

---

## 📊 **PRODUCT MANAGER**

### **Time Commitment:** 40 hours/week (full-time)

### **Main Job:**
You decide what to build, when to build it, and make sure it solves real problems.

### **Daily Tasks:**
- [ ] Answer questions about requirements
- [ ] Refine user stories
- [ ] Prioritize backlog
- [ ] Talk to users

### **Weekly Tasks:**
**Monday:**
- [ ] Sprint planning (2 hours)
- [ ] Prioritize this week's work
- [ ] Write user stories for next sprint

**Tuesday-Thursday:**
- [ ] User interviews (1-2 per day)
- [ ] Analyze feedback
- [ ] Update roadmap
- [ ] Write documentation

**Friday:**
- [ ] Sprint review
- [ ] Demo to stakeholders
- [ ] Plan next sprint

### **Month-by-Month Focus:**

**Month 1:**
- ✅ Conduct 10-15 user interviews
- ✅ Create user personas
- ✅ Write all MVP user stories
- ✅ Define acceptance criteria

**Month 2:**
- ✅ Refine product backlog
- ✅ More user research
- ✅ Plan Phase 2 features
- ✅ Create product roadmap

**Month 3:**
- ✅ Beta user onboarding plan
- ✅ Create training materials
- ✅ Collect beta feedback
- ✅ Prioritize post-MVP features

### **Deliverables You Create:**
✅ User stories (detailed requirements)
✅ Acceptance criteria (how to test)
✅ Product roadmap (what's coming when)
✅ User research reports
✅ Feature specifications

---

## 💻 **SENIOR BACKEND DEVELOPER**

### **Time Commitment:** 40 hours/week (full-time)

### **Main Job:**
You build the API, database, and all server-side logic.

### **Daily Tasks:**
- [ ] Write code (5-6 hours/day)
- [ ] Review others' code (1 hour/day)
- [ ] Test your code (1 hour/day)
- [ ] Documentation (30 min/day)

### **What You Build (In Order):**

**Week 1-2: Authentication**
```
✅ User registration API
✅ Login API
✅ JWT tokens
✅ Password reset
✅ Email verification
✅ RBAC (roles & permissions)
```

**Week 3-4: User Management**
```
✅ List users
✅ Create user
✅ Update user
✅ Deactivate user
✅ Activity logs
```

**Week 5-6: Product Catalog**
```
✅ Products CRUD
✅ Categories CRUD
✅ Product variants
✅ Search products
✅ Barcode support
✅ Image upload (S3)
```

**Week 7-8: POS Core**
```
✅ Shopping cart API
✅ Add/remove items
✅ Checkout
✅ Payment processing
✅ Receipt generation
✅ Transaction history
✅ Returns & refunds
```

**Week 9-10: Fiscal Integration** ⚠️ CRITICAL
```
✅ Albania tax authority API client
✅ Submit fiscal receipt
✅ Receive NSLF (fiscal number)
✅ Generate QR code
✅ E-invoice generation
✅ Error handling & retry logic
✅ Offline queue
✅ Kosovo integration
```

**Week 11-12: Reporting**
```
✅ Sales reports API
✅ Product performance
✅ Tax reports
✅ Dashboard stats
✅ Export to Excel/PDF
```

**Week 13: Bug Fixes**
```
✅ Fix critical bugs
✅ Performance optimization
✅ Code cleanup
✅ Documentation
```

### **Technologies You Use:**
- Node.js 20 + TypeScript
- Fastify (API framework)
- Prisma (ORM)
- PostgreSQL (database)
- Redis (caching)
- Jest (testing)

### **Your File Structure:**
```
apps/api/src/
├── routes/
│   ├── auth.ts       ← Week 1-2
│   ├── users.ts      ← Week 3-4
│   ├── products.ts   ← Week 5-6
│   ├── pos.ts        ← Week 7-8
│   ├── fiscal.ts     ← Week 9-10
│   └── reports.ts    ← Week 11-12
├── services/
├── middleware/
└── utils/
```

---

## 🎨 **SENIOR FRONTEND DEVELOPER**

### **Time Commitment:** 40 hours/week (full-time)

### **Main Job:**
You build all the web interfaces (admin dashboard, POS, customer portal).

### **Daily Tasks:**
- [ ] Write UI code (5-6 hours/day)
- [ ] Implement designs from Figma (2-3 hours/day)
- [ ] Test on different browsers/devices (1 hour/day)
- [ ] Code reviews (30 min/day)

### **What You Build (In Order):**

**Week 1-2: Authentication UI**
```
✅ Registration page
✅ Login page
✅ Forgot password flow
✅ Email verification screen
✅ Password reset page
```

**Week 3-4: Dashboard & Users**
```
✅ Dashboard layout (sidebar, header)
✅ Dashboard home (stats cards)
✅ User list page
✅ Add/edit user modal
✅ User details page
✅ Settings page
```

**Week 5-6: Product Catalog**
```
✅ Product list (table + grid views)
✅ Add product modal
✅ Edit product page
✅ Product details
✅ Category management
✅ Image upload
✅ Barcode scanner
```

**Week 7-8: POS Interface** ⭐ IMPORTANT
```
✅ POS main screen:
   - Left: Product grid
   - Right: Shopping cart
✅ Product search
✅ Category filter
✅ Add to cart
✅ Quantity adjustment
✅ Discounts
✅ Payment screen
✅ Receipt display
✅ Print receipt
✅ Transaction history
```

**Week 9-10: Fiscal UI**
```
✅ Fiscal settings
✅ Receipt with fiscal number
✅ QR code display
✅ Fiscal reports
✅ Retry failed submissions
```

**Week 11-12: Reports & Dashboard**
```
✅ Sales reports
✅ Charts and graphs
✅ Export buttons
✅ Date range picker
✅ Advanced dashboard
```

**Week 13: Polish**
```
✅ Fix UI bugs
✅ Improve animations
✅ Loading states
✅ Error messages
✅ Mobile responsive
```

### **Technologies You Use:**
- Next.js 14 + TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand (state)
- Recharts (graphs)
- React Hook Form

### **Your File Structure:**
```
apps/web-admin/src/app/
├── login/           ← Week 1
├── register/        ← Week 1
├── dashboard/       ← Week 2
├── users/           ← Week 3-4
├── products/        ← Week 5-6
├── reports/         ← Week 11-12
└── settings/        ← Week 3

apps/web-pos/src/app/
├── page.tsx         ← POS main screen (Week 7-8)
└── transactions/    ← History (Week 8)
```

---

## 🎨 **UI/UX DESIGNER**

### **Time Commitment:** 20-30 hours/week (can be part-time)

### **Main Job:**
You design how everything looks and how users interact with it.

### **Weekly Tasks:**
- [ ] Design new screens (3-4 hours/day)
- [ ] Iterate on feedback (1-2 hours/day)
- [ ] Meet with team (1 hour/day)

### **What You Design (In Order):**

**Week 1:**
```
✅ Design system (colors, fonts, spacing)
✅ Component library (buttons, inputs, etc.)
✅ Login & registration screens
```

**Week 2:**
```
✅ Dashboard layout
✅ Dashboard home screen
✅ User management screens
```

**Week 3-4:**
```
✅ Product catalog screens
✅ Add/edit product forms
✅ Category management
```

**Week 5-6:**
```
✅ POS interface (MOST IMPORTANT!)
   - Product grid
   - Shopping cart
   - Checkout flow
   - Receipt view
✅ Touch-optimized (large buttons)
✅ Tablet landscape layout
```

**Week 7-8:**
```
✅ Reports screens
✅ Charts and graphs
✅ Settings pages
```

**Week 9-10:**
```
✅ Mobile app screens (start)
✅ Iterate on feedback
```

**Week 11-13:**
```
✅ Polish all designs
✅ Fix issues from user testing
✅ Create final design specs
```

### **Tools You Use:**
- Figma (main design tool)
- FigJam (wireframes, brainstorming)
- Notion (design documentation)

### **Your Deliverables:**
✅ Design system in Figma
✅ All screen mockups (high-fidelity)
✅ Interactive prototypes
✅ Design specs for developers
✅ Icon set
✅ Illustrations (optional)

---

## ⚙️ **DEVOPS ENGINEER**

### **Time Commitment:** 20 hours/week (part-time initially)

### **Main Job:**
You setup and maintain all infrastructure (servers, databases, deployments).

### **Weekly Tasks:**
- [ ] Monitor system health (daily)
- [ ] Deploy new versions (as needed)
- [ ] Fix infrastructure issues
- [ ] Improve CI/CD pipeline

### **What You Setup (In Order):**

**Week 1:**
```
✅ Development environment
   - Docker Compose (Postgres, Redis)
✅ Staging server
   - DigitalOcean Droplet
   - Docker + Docker Compose
   - NGINX reverse proxy
   - SSL certificate
✅ CI/CD pipeline
   - GitHub Actions
   - Auto-test on PR
   - Auto-deploy to staging
```

**Week 2:**
```
✅ Monitoring
   - Prometheus (metrics)
   - Grafana (dashboards)
   - Alerts (Slack/email)
✅ Error tracking
   - Sentry setup
```

**Week 3-4:**
```
✅ Backup strategy
   - Automated daily backups
   - Test restore procedure
✅ Security hardening
   - Firewall rules
   - Fail2ban
   - SSH key-only access
```

**Week 5-8:**
```
✅ Performance monitoring
✅ Log aggregation
✅ Database optimization
✅ CDN setup (Cloudflare)
```

**Week 9-10:**
```
✅ Production environment setup
   - Load balancer
   - Multiple API instances
   - Database with backups
   - Redis cluster
✅ Deployment automation
```

**Week 11-13:**
```
✅ Production deploy
✅ Monitoring alerts
✅ Backup verification
✅ Disaster recovery plan
✅ Documentation
```

### **Tools You Use:**
- Docker & Docker Compose
- GitHub Actions
- NGINX
- Prometheus + Grafana
- Sentry
- Let's Encrypt (SSL)

---

## 👨‍💼 **ENGINEERING MANAGER / TEAM LEAD**

### **Time Commitment:** 40 hours/week (full-time)

### **Main Job:**
You manage the dev team day-to-day, assign tasks, and ensure quality.

### **Daily Tasks:**
- [ ] Lead daily standup (15 min)
- [ ] Unblock team members
- [ ] Review pull requests (2-3 hours/day)
- [ ] Code yourself (3-4 hours/day)

### **Weekly Tasks:**
**Monday:**
- [ ] Sprint planning with PM
- [ ] Break down stories into tasks
- [ ] Assign tasks to team

**Tuesday-Thursday:**
- [ ] Monitor sprint progress
- [ ] Help team with technical issues
- [ ] Code reviews
- [ ] Write code (features, bug fixes)

**Friday:**
- [ ] Sprint review
- [ ] Demo completed work
- [ ] Retrospective
- [ ] Plan next sprint

### **What You Decide:**
✅ Who works on what task
✅ When to merge PRs
✅ When to refactor code
✅ How to solve technical problems

### **What You DON'T Decide:**
❌ What features to build (PM decides)
❌ Technical architecture (CTO decides)
❌ Salaries/hiring (CEO decides)

---

## 🧪 **QA TESTER (Starts Month 3)**

### **Time Commitment:** 20-40 hours/week

### **Main Job:**
You test everything, find bugs, and ensure quality.

### **Daily Tasks:**
- [ ] Test new features (3-4 hours/day)
- [ ] Write bug reports (1-2 hours/day)
- [ ] Write test cases (1 hour/day)
- [ ] Regression testing (1-2 hours/day)

### **What You Test:**
✅ Every new feature (manual testing)
✅ All user flows (registration → sale → receipt)
✅ Edge cases (what if user does something wrong?)
✅ Different browsers (Chrome, Firefox, Safari)
✅ Different devices (desktop, tablet, mobile)
✅ Performance (is it fast?)

### **How You Test:**
1. **Manual Testing** (70% of time)
   - Click through the app
   - Try to break things
   - Test on real devices

2. **Automated Testing** (30% of time)
   - Write Playwright tests
   - Test critical flows
   - Run tests on every deploy

---

## 📱 **MOBILE DEVELOPER (Starts Month 4)**

### **Time Commitment:** 40 hours/week (full-time)

### **Main Job:**
You build the iOS and Android apps (React Native).

### **What You Build:**
✅ Mobile POS app (same as web POS)
✅ Offline mode (works without internet)
✅ Barcode scanning (camera)
✅ Bluetooth printer support
✅ Push notifications
✅ Manager dashboard

### **Technologies:**
- React Native + Expo
- TypeScript
- SQLite (offline database)
- AsyncStorage

---

## ✅ **SUMMARY: WHO REPORTS TO WHO**

```
CEO (You)
├── CTO
│   ├── Engineering Manager / Team Lead
│   │   ├── Senior Backend Developer
│   │   ├── Senior Frontend Developer
│   │   ├── Mobile Developer (Month 4)
│   │   └── Junior/Mid-Level Devs (later)
│   └── DevOps Engineer
├── Product Manager
└── Designer
```

---

## ⏰ **TYPICAL DAY FOR EACH ROLE**

### **CEO:**
```
09:00 - 10:00  Strategic work (emails, calls)
10:00 - 10:15  Daily standup
10:15 - 12:00  Meetings (partnerships, tax authority)
12:00 - 13:00  Lunch
13:00 - 15:00  Beta user recruitment, sales prep
15:00 - 17:00  Check team progress, unblock issues
```

### **CTO:**
```
09:00 - 10:00  Review overnight alerts, check systems
10:00 - 10:15  Daily standup
10:15 - 12:00  Code reviews
12:00 - 13:00  Lunch
13:00 - 15:00  Architecture work, documentation
15:00 - 17:00  Answer technical questions, solve problems
17:00 - 18:00  Planning for tomorrow
```

### **Backend Developer:**
```
09:00 - 10:00  Review overnight errors, check PRs
10:00 - 10:15  Daily standup
10:15 - 12:00  Code new features
12:00 - 13:00  Lunch
13:00 - 15:00  Code new features
15:00 - 16:00  Write tests
16:00 - 17:00  Code review others' PRs
17:00 - 18:00  Documentation, cleanup
```

### **Frontend Developer:**
```
09:00 - 10:00  Check designs, plan day
10:00 - 10:15  Daily standup
10:15 - 12:00  Implement UI from Figma
12:00 - 13:00  Lunch
13:00 - 15:00  Implement UI (continued)
15:00 - 16:00  Test on different browsers/devices
16:00 - 17:00  Code review, fix bugs
17:00 - 18:00  Polish UI, animations
```

### **Designer:**
```
09:00 - 10:00  Review feedback from team
10:00 - 10:15  Daily standup (optional)
10:15 - 12:00  Design new screens in Figma
12:00 - 13:00  Lunch
13:00 - 15:00  Iterate on designs based on feedback
15:00 - 17:00  Create design specs for developers
```

---

## 🎯 **SUCCESS METRICS BY ROLE**

### **CEO Success:**
✅ Team is happy and productive
✅ Budget under control
✅ Beta users signed up (10-15)
✅ Tax authority relationship established
✅ Clear path to revenue

### **CTO Success:**
✅ Architecture is solid and scalable
✅ No critical security issues
✅ Performance targets met (<200ms API)
✅ Team follows best practices
✅ Code quality is high

### **Product Manager Success:**
✅ All features have clear requirements
✅ User feedback is incorporated
✅ Roadmap is clear and agreed upon
✅ Team knows what to build next
✅ Users love the product

### **Backend Developer Success:**
✅ All APIs work correctly
✅ Tests pass (>80% coverage)
✅ No critical bugs in production
✅ Fiscal integration works 100%
✅ Code is clean and documented

### **Frontend Developer Success:**
✅ UI matches designs perfectly
✅ App is fast and responsive
✅ Works on all browsers
✅ No console errors
✅ Users find it easy to use

### **Designer Success:**
✅ Designs are implemented accurately
✅ Users don't get confused
✅ UI is beautiful and modern
✅ Usability tests pass
✅ Team loves the designs

---

**NOW YOU KNOW EXACTLY WHO DOES WHAT! 🎯**

**Next: Check WORK_BREAKDOWN.md for week-by-week tasks!**
