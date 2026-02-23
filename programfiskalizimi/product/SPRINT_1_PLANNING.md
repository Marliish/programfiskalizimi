# 📋 SPRINT 1 PLANNING MEETING
## Authentication & Basic Setup

**Sprint:** Sprint 1  
**Duration:** 3 weeks (Weeks 2-4)  
**Planning Date:** 2026-02-24 (Monday 2:00 PM)  
**Prepared by:** Sara (Product Manager)  
**Date:** 2026-02-23

---

## 🎯 SPRINT GOAL

> **"Enable business owners to register, login, and manage their team with secure, role-based access control."**

### What Success Looks Like (End of Week 4)
1. ✅ Business owners can register and verify their email
2. ✅ Users can login securely with JWT authentication
3. ✅ Role-based access control (Owner, Manager, Cashier) works
4. ✅ Owners can add/edit/deactivate employees
5. ✅ Dashboard skeleton is functional and navigable
6. ✅ Business settings can be configured
7. ✅ All features deployed to staging and tested

---

## 📊 SPRINT CAPACITY

### Team Availability (3 weeks)

| Role | Person | Availability | Capacity (Story Points) |
|------|--------|--------------|-------------------------|
| Backend Developer | David | Full-time | 40 points |
| Frontend Developer | Elena | Full-time | 40 points |
| Designer | Luna | 50% (designs only) | 20 points |
| CTO | Alex | 25% (reviews, architecture) | 10 points |
| Team Lead | Marco | Full-time | 40 points |
| DevOps | Max | 50% (infrastructure setup) | 15 points |

**Total Team Capacity:** ~165 points (conservative estimate)  
**Sprint 1 Committed:** 92 points (P0 + P1 stories)  
**Buffer:** ~40% (for unknowns, bugs, reviews)

---

## 📦 SPRINT BACKLOG

### Epic Breakdown

| Epic | Stories | Points | Owner(s) |
|------|---------|--------|----------|
| **1. User Registration & Onboarding** | 3 stories | 21 pts | Backend + Frontend |
| **2. User Login & Session Management** | 3 stories | 15 pts | Backend + Frontend |
| **3. User Roles & Permissions** | 3 stories | 13 pts | Backend |
| **4. User Profile & Settings** | 2 stories | 10 pts | Frontend + Backend |
| **5. Basic Admin Dashboard** | 3 stories | 15 pts | Frontend |
| **6. Database Schema & API** | 2 stories | 18 pts | Backend |
| **7. Testing & QA** | 2 stories | 10 pts | Everyone |

**Total:** 102 points (includes P2 stories)  
**Committed (P0 + P1):** 92 points

---

## 🔢 STORY POINT ESTIMATION

### Fibonacci Scale
- **1 point:** Trivial (< 2 hours)
- **2 points:** Simple (2-4 hours)
- **3 points:** Moderate (4-8 hours, ~1 day)
- **5 points:** Complex (1-2 days)
- **8 points:** Very complex (2-3 days)
- **13 points:** Epic (3-5 days, should be split if possible)
- **21+ points:** Too large, must be split

### Estimation Includes
- Development time
- Code review
- Testing (unit + integration)
- Documentation (API docs, inline comments)
- Deployment to staging

---

## 📅 SPRINT SCHEDULE (Day-by-Day)

### WEEK 2 (Feb 24-28): Registration & Verification

#### Monday (Day 1)
- **Morning:** Sprint Planning Meeting (2 hours)
  - Review all stories
  - Estimate story points (Planning Poker)
  - Assign stories to team members
  - Confirm definition of done
- **Afternoon:** Sprint kickoff
  - Backend: Database schema design (Story 6.1)
  - Frontend: Setup Next.js project, routing
  - Designer: Registration flow wireframes
  - DevOps: Finalize dev/staging environments

#### Tuesday (Day 2)
- Backend: Implement user/business models (Prisma)
- Frontend: Registration form UI
- Designer: Finalize registration designs, start dashboard
- DevOps: Email service setup (SendGrid)

#### Wednesday (Day 3)
- Backend: Registration API endpoint, email verification
- Frontend: Email verification page
- Designer: Welcome wizard designs
- Testing: Unit tests for registration logic

#### Thursday (Day 4)
- Backend: Resend verification, edge cases
- Frontend: Welcome wizard implementation (Step 1-3)
- Code reviews (all PRs from Mon-Wed)

#### Friday (Day 5)
- Backend: Welcome wizard API (save business details, location)
- Frontend: Complete welcome wizard (Step 4-5)
- Testing: E2E test for complete registration flow
- **Daily Standup:** Review week progress
- **Demo:** Show registration flow to team (internal)

---

### WEEK 3 (Mar 3-7): Login & Session Management

#### Monday (Day 6)
- Backend: Login API, JWT generation
- Frontend: Login form
- Designer: Login page design, password reset flow

#### Tuesday (Day 7)
- Backend: Session management, refresh token logic
- Frontend: JWT storage, auto-refresh
- Testing: Unit tests for authentication

#### Wednesday (Day 8)
- Backend: Password reset (forgot password) API
- Frontend: Password reset pages
- Designer: User management designs

#### Thursday (Day 9)
- Backend: Auto-logout, session expiry
- Frontend: Session timeout warning
- Code reviews

#### Friday (Day 10)
- Testing: E2E tests for login, password reset
- Bug fixes
- **Daily Standup:** Review week progress
- **Mid-sprint Review:** Demo auth flow to PM

---

### WEEK 4 (Mar 10-14): User Management & Dashboard

#### Monday (Day 11)
- Backend: User roles & permissions (RBAC)
- Frontend: Dashboard skeleton (sidebar, header)
- Designer: Settings page designs

#### Tuesday (Day 12)
- Backend: Permission checking middleware
- Frontend: Route guards, permission-based UI hiding
- Testing: Permission tests

#### Wednesday (Day 13)
- Backend: User management API (add/edit/deactivate)
- Frontend: User management page (list, add, edit)
- Designer: Final touches on all designs

#### Thursday (Day 14)
- Backend: User profile API, business settings API
- Frontend: Profile page, business settings page
- Code reviews (all outstanding PRs)

#### Friday (Day 15)
- Testing: Full regression testing
- Bug fixes (prioritize P0/P1)
- Performance testing
- Documentation updates
- **Sprint Review Meeting (4:00 PM):**
  - Demo all features to stakeholders
  - Gather feedback
- **Sprint Retrospective (5:00 PM):**
  - What went well?
  - What didn't go well?
  - Action items for next sprint

---

## 🎯 DEFINITION OF DONE (DoD)

A story is "Done" when:
- [ ] Code is complete and meets acceptance criteria
- [ ] Code reviewed and approved (at least 1 reviewer)
- [ ] Unit tests written and passing (≥80% coverage)
- [ ] Integration tests passing (if applicable)
- [ ] API endpoints documented (Swagger)
- [ ] UI matches design mockups (Figma)
- [ ] Responsive on mobile/tablet/desktop
- [ ] No critical (P0) or high (P1) bugs
- [ ] Deployed to staging environment
- [ ] Product Manager approval (manual testing)
- [ ] Merged to `develop` branch

---

## 🚧 DEPENDENCIES & BLOCKERS

### Pre-Sprint Dependencies (Must be done before Day 1)
- [x] Development environment setup
- [x] Staging environment setup
- [x] Database (PostgreSQL) configured
- [x] Email service configured (SendGrid)
- [x] GitHub repositories created
- [x] CI/CD pipeline basic setup
- [x] Figma access for all team members

### Potential Blockers
1. **Email Delivery Issues**
   - Risk: Emails go to spam
   - Mitigation: Configure SPF, DKIM, DMARC records; use reputable email service

2. **Database Schema Changes**
   - Risk: Schema changes mid-sprint
   - Mitigation: Finalize schema Day 1, use migrations for changes

3. **Design Delays**
   - Risk: Designer can't keep up with dev pace
   - Mitigation: Designer front-loads work (Week 2), uses placeholders if needed

4. **Code Review Bottleneck**
   - Risk: PRs pile up, block progress
   - Mitigation: All devs review (not just CTO), max 24h review turnaround

---

## 📋 STORY ASSIGNMENT (Tentative)

### Backend Developer (David)
1. Story 6.1: Database Schema Design (5 pts) - Day 1-2
2. Story 1.1: Business Registration API (8 pts) - Day 2-4
3. Story 1.2: Email Verification (5 pts) - Day 3-4
4. Story 2.1: User Login API (5 pts) - Day 6-7
5. Story 2.2: Password Reset (5 pts) - Day 8-9
6. Story 2.3: Session Management (5 pts) - Day 9-10
7. Story 3.1: Define User Roles (3 pts) - Day 11
8. Story 3.2: Permission Checking (5 pts) - Day 12
9. Story 6.2: Core API Endpoints (13 pts) - Day 13-15

**Total:** ~54 points

---

### Frontend Developer (Elena)
1. Story 1.1: Registration Form UI (8 pts) - Day 2-4
2. Story 1.3: Welcome Wizard (8 pts) - Day 3-5
3. Story 2.1: Login Form (5 pts) - Day 6-7
4. Story 2.2: Password Reset UI (5 pts) - Day 8-9
5. Story 5.1: Dashboard Skeleton (5 pts) - Day 11-12
6. Story 3.3: User Management UI (8 pts) - Day 13-14
7. Story 4.1: Profile Page (5 pts) - Day 14
8. Story 5.3: Business Settings (5 pts) - Day 14-15
9. Story 5.2: Dashboard Home (5 pts) - Day 15

**Total:** ~54 points

---

### Team Lead (Marco)
- Coordinate daily standups
- Unblock team members
- Code reviews (backend + frontend)
- Help with complex stories (pair programming)
- Sprint 1 focus: Story 3.2 (permission middleware), Story 3.3 (user management backend)

**Total:** ~15 points (pair programming, not solo)

---

### Designer (Luna)
- Week 2: Registration flow, welcome wizard, login pages
- Week 3: Dashboard layout, user management, profile pages
- Week 4: Settings pages, polish and refinements

**Deliverables:**
- High-fidelity Figma mockups (all screens)
- Design system components (buttons, inputs, forms, cards)
- Icon set
- Responsive layouts (mobile, tablet, desktop)

---

### CTO (Alex)
- Architecture review (Day 1)
- Code reviews (critical paths: auth, permissions)
- Pair programming with backend dev (complex logic)
- Security review (auth flow)
- Sprint planning participation

---

### DevOps (Max)
- Finalize dev/staging environments (Day 1-2)
- Email service setup (SendGrid integration)
- CI/CD pipeline (GitHub Actions):
  - Run tests on PR
  - Auto-deploy to staging on merge to `develop`
- Monitoring setup (basic logs)

---

## 🧪 TESTING STRATEGY

### Unit Testing (Jest)
- All API endpoints
- Authentication logic (registration, login, JWT)
- Password hashing/verification
- Permission checking
- Target: ≥80% code coverage

### Integration Testing (Supertest)
- API integration tests
- Database interactions
- Email sending (mock in tests)

### End-to-End Testing (Playwright)
- Complete registration flow
- Login flow
- Password reset flow
- User management flow

### Manual Testing (QA)
- Product Manager tests all features on staging
- Check responsiveness (mobile, tablet, desktop)
- Browser compatibility (Chrome, Safari, Firefox)
- Accessibility (keyboard navigation, screen readers)

**Testing Timeline:**
- Unit tests: Written alongside code (continuous)
- Integration tests: Days 5, 10, 15
- E2E tests: Days 10, 15
- Manual testing: Day 14-15 (before sprint review)

---

## 📊 SPRINT TRACKING

### Daily Standup (10:00 AM, 15 min)
Each team member answers:
1. **What did I do yesterday?**
2. **What will I do today?**
3. **Are there any blockers?**

**Format:** Slack (async) or Zoom (sync)  
**PM attends:** Monday, Wednesday, Friday (full team sync)

### Sprint Burndown
Track daily:
- Stories completed
- Points burned down
- Remaining work

**Tools:** Linear or Jira burndown chart

### Mid-Sprint Checkpoint (End of Week 3)
- Review progress (are we on track?)
- Adjust scope if needed (move P2 stories out)
- Address any blockers

---

## ⚠️ RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Team member sick/unavailable | High | Medium | Cross-train (Marco can code), adjust scope |
| Email verification issues | High | Low | Use reliable service (SendGrid), test early |
| Database schema changes | Medium | Medium | Lock schema Day 1, use migrations |
| Code review delays | Medium | Medium | 24h max review time, all devs review |
| Design delays | Low | Low | Designer front-loads, use placeholders |
| Scope creep | Medium | High | Strict adherence to backlog, PM approves changes |

---

## 📈 SUCCESS METRICS

### Sprint Success Criteria
- [ ] All P0 stories completed (critical features)
- [ ] ≥80% of P1 stories completed (important features)
- [ ] Zero P0 bugs at sprint end
- [ ] All code merged to `develop` branch
- [ ] Deployed to staging
- [ ] PM approval after sprint review
- [ ] Team morale: Positive (not burned out)

### Velocity Tracking
- **Target velocity:** 45-50 points/week (conservative)
- **Sprint 1 target:** 92 points in 3 weeks (~30 points/week)
- **Actual velocity:** TBD (measure at sprint end)

This velocity will inform Sprint 2 planning.

---

## 📝 ACTION ITEMS BEFORE SPRINT STARTS

**By End of Day Sunday (Feb 23):**
- [x] PM: Finalize sprint backlog (this document)
- [x] PM: Send sprint planning invite (Monday 2:00 PM)
- [ ] CTO: Review architecture blueprint
- [ ] Backend: Review database schema draft
- [ ] Frontend: Review design mockups (if available)
- [ ] DevOps: Confirm all environments ready
- [ ] Designer: Share initial wireframes

**By End of Sprint Planning (Monday 2:00 PM):**
- [ ] All stories estimated (Planning Poker)
- [ ] All stories assigned to team members
- [ ] Sprint goal confirmed
- [ ] Team commits to sprint scope
- [ ] First tasks pulled into "In Progress"

---

## 📞 SPRINT CEREMONIES

| Ceremony | When | Duration | Attendees |
|----------|------|----------|-----------|
| **Sprint Planning** | Monday 2:00 PM (Day 1) | 2 hours | Entire team |
| **Daily Standup** | Every day 10:00 AM | 15 min | Entire team |
| **Mid-Sprint Sync** | Friday Week 3 (Day 10) | 30 min | PM + Team Lead |
| **Sprint Review** | Friday Week 4, 4:00 PM | 1 hour | Team + stakeholders |
| **Sprint Retro** | Friday Week 4, 5:00 PM | 45 min | Entire team |

---

## 🎉 SPRINT KICKOFF AGENDA

**Sprint Planning Meeting - Monday Feb 24, 2:00 PM**

### Agenda (2 hours)
1. **Welcome & Sprint Goal (10 min)** - PM
   - Introduce Sprint 1 goal
   - Explain why this sprint matters

2. **Roadmap Overview (10 min)** - PM
   - Show 13-week roadmap
   - Sprint 1 fits into bigger picture

3. **Story Walkthrough (30 min)** - PM
   - Walk through each user story
   - Clarify acceptance criteria
   - Answer questions

4. **Story Point Estimation (40 min)** - Team
   - Planning Poker for each story
   - Discuss complexity
   - Reach consensus

5. **Story Assignment (20 min)** - Team Lead + Team
   - Who takes what?
   - Pair programming opportunities
   - Dependencies identified

6. **Commit to Sprint (5 min)** - Team
   - Team confirms they can complete committed stories
   - If overcommitted, remove P2 stories

7. **First Tasks (5 min)** - Everyone
   - Pull first tasks into "In Progress"
   - Ready to start Day 1 afternoon!

---

## ✅ CHECKLIST: SPRINT 1 READY?

- [x] Sprint goal defined
- [x] User stories written with acceptance criteria
- [x] Stories prioritized (P0, P1, P2)
- [x] Sprint backlog finalized
- [x] Team capacity calculated
- [x] Dependencies identified
- [x] Risks assessed
- [x] Definition of Done agreed upon
- [x] Sprint ceremonies scheduled
- [x] Development environments ready
- [ ] Team briefed and ready to commit

**Status:** ✅ READY FOR SPRINT PLANNING

---

**Prepared by:** Sara (Product Manager)  
**Date:** 2026-02-23  
**Next Step:** Sprint Planning Meeting (Monday 2:00 PM)

---

## 💬 QUESTIONS FOR SPRINT PLANNING

*Bring these up during planning meeting:*
1. Are there any unknowns in the stories?
2. Do we need to spike (research) anything before coding?
3. Are there any team member conflicts/vacations during Sprint 1?
4. Should we pair program on complex stories (auth, permissions)?
5. Who will be the primary code reviewer for each area (backend/frontend)?

---

**Let's build this! 🚀**
