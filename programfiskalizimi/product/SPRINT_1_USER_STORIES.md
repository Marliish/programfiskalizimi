# 📋 SPRINT 1 USER STORIES
## Authentication & Basic Setup

**Sprint Duration:** Weeks 2-4 (3 weeks)  
**Focus:** User authentication, basic infrastructure, initial dashboard  
**Team Velocity Target:** 45 story points  
**Created by:** Sara (Product Manager)  
**Date:** 2026-02-23

---

## 🎯 SPRINT GOALS

1. ✅ Complete user registration and authentication flow
2. ✅ Implement role-based access control (Owner, Manager, Cashier)
3. ✅ Build basic admin dashboard skeleton
4. ✅ Setup database schema for users and businesses
5. ✅ Establish development and deployment pipeline

---

## 📊 STORY BREAKDOWN

### EPIC 1: User Registration & Onboarding

#### Story 1.1: Business Registration
**As a** prospective business owner  
**I want to** create an account for my business  
**So that** I can start using the fiscalization platform

**Acceptance Criteria:**
- [ ] Registration form with fields:
  - Business name (required, 3-100 chars)
  - NIPT/Tax ID (required, validated format)
  - Business email (required, valid email)
  - Business phone (required, valid format)
  - Password (required, min 8 chars, 1 uppercase, 1 number)
  - Confirm password (must match)
  - Country (dropdown: Albania, Kosovo)
- [ ] Client-side validation with clear error messages
- [ ] Server-side validation (duplicate email check)
- [ ] Password strength indicator
- [ ] Terms of service checkbox (required)
- [ ] Privacy policy checkbox (required)
- [ ] Success message: "Account created! Check your email to verify."
- [ ] Auto-login after verification
- [ ] Create default owner user with business

**Technical Notes:**
- Hash password with bcrypt (cost factor 10)
- Generate UUID for business ID
- Send verification email asynchronously
- Log registration event

**Priority:** P0 (Critical)  
**Story Points:** 8  
**Assigned to:** Backend + Frontend  
**Dependencies:** None

---

#### Story 1.2: Email Verification
**As a** new user  
**I want to** verify my email address  
**So that** my account can be activated

**Acceptance Criteria:**
- [ ] Verification email sent immediately after registration
- [ ] Email contains:
  - Welcome message
  - Business name
  - Verification link (expires in 24 hours)
  - Branding (logo, colors)
- [ ] Click verification link → account activated
- [ ] Show success page: "Email verified! Redirecting to dashboard..."
- [ ] Auto-redirect to dashboard after 3 seconds
- [ ] If link expired, show "Link expired" with "Resend verification" button
- [ ] Resend verification email (max 3 times per hour)
- [ ] Prevent login until email verified

**Technical Notes:**
- Use JWT token for verification (24h expiry)
- Store token in database with expiry timestamp
- Use email service (SendGrid or similar)
- Template engine for email HTML

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend  
**Dependencies:** Story 1.1

---

#### Story 1.3: Welcome Wizard (First-Time Setup)
**As a** new user who just verified their email  
**I want to** be guided through initial setup  
**So that** I can start using the platform quickly

**Acceptance Criteria:**
- [ ] Show welcome wizard on first login
- [ ] Step 1: Welcome message (skip button)
- [ ] Step 2: Business details
  - Business type (dropdown: Retail, Restaurant, Service, Other)
  - Address
  - City
  - Timezone (auto-detect, allow change)
  - Currency (auto-detect based on country)
- [ ] Step 3: Create first location
  - Location name (e.g., "Main Store")
  - Location address
  - Phone number
- [ ] Step 4: Add first employee (optional, can skip)
  - Name, email, role (Manager or Cashier)
  - Send invitation email
- [ ] Step 5: "You're all set!" with next steps
  - "Add your first product"
  - "Explore the dashboard"
  - "Watch tutorial video"
- [ ] Progress indicator (1/5, 2/5, etc.)
- [ ] Allow skip wizard (add "Skip for now" button)
- [ ] Save progress if user leaves (resume where left off)
- [ ] Mark wizard as completed (don't show again)

**Priority:** P1 (High)  
**Story Points:** 8  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 1.2

---

### EPIC 2: User Login & Session Management

#### Story 2.1: User Login
**As a** registered user  
**I want to** login with my email and password  
**So that** I can access the platform

**Acceptance Criteria:**
- [ ] Login form with:
  - Email field (validated)
  - Password field (masked)
  - "Remember me" checkbox
  - "Forgot password?" link
- [ ] Submit login credentials
- [ ] If valid, return JWT access token (15 min expiry) + refresh token (7 days)
- [ ] Store tokens securely (httpOnly cookies or localStorage)
- [ ] Redirect to dashboard
- [ ] If invalid, show error: "Invalid email or password"
- [ ] If email not verified, show: "Please verify your email first" with "Resend verification" link
- [ ] Rate limiting: Max 5 attempts per 15 minutes per IP
- [ ] After 5 failed attempts, show CAPTCHA
- [ ] Lock account after 10 failed attempts (unlock after 1 hour or manual unlock)

**Technical Notes:**
- Use bcrypt to compare password hashes
- JWT payload: userId, businessId, role, locationId
- Log login events (IP, device, timestamp)

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 1.1

---

#### Story 2.2: Password Reset (Forgot Password)
**As a** user who forgot their password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot password?" link on login page
- [ ] Password reset form with email field
- [ ] Submit email → receive reset email (if email exists)
- [ ] Always show: "If email exists, you'll receive reset instructions" (security)
- [ ] Email contains:
  - Reset password link (expires in 1 hour)
  - Security note (ignore if you didn't request this)
- [ ] Click link → "Create new password" page
- [ ] New password form:
  - New password (min 8 chars, 1 uppercase, 1 number)
  - Confirm password
  - Password strength indicator
- [ ] Submit → password updated
- [ ] Show success: "Password updated! You can now login."
- [ ] Redirect to login page
- [ ] Invalidate all existing sessions (force re-login)
- [ ] Log password reset event

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 2.1

---

#### Story 2.3: Session Management & Auto-Logout
**As a** user  
**I want** my session to be secure  
**So that** my account is protected from unauthorized access

**Acceptance Criteria:**
- [ ] Access token expires after 15 minutes
- [ ] Refresh token expires after 7 days (if "Remember me" checked) or 24 hours (if not)
- [ ] Auto-refresh access token using refresh token before expiry
- [ ] If refresh token expired, redirect to login
- [ ] Logout button in header
- [ ] Click logout → clear tokens, redirect to login
- [ ] Show "Session expired, please login again" if token invalid
- [ ] Auto-logout after 30 minutes of inactivity (no "Remember me")
- [ ] Show warning 2 minutes before auto-logout: "You'll be logged out in 2 minutes. Click to stay logged in."
- [ ] Track user activity (mouse move, clicks, typing)
- [ ] Allow concurrent sessions (but track them)

**Technical Notes:**
- Use sliding window for activity tracking
- Store refresh tokens in database (revokable)
- Include device fingerprint in token

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 2.1

---

### EPIC 3: User Roles & Permissions

#### Story 3.1: Define User Roles
**As a** business owner  
**I want** different user roles with specific permissions  
**So that** I can control who can do what

**Acceptance Criteria:**
- [ ] Define 3 core roles:
  - **Owner:** Full access (everything)
  - **Manager:** Operations access (POS, inventory, reports, employees) - no billing or settings
  - **Cashier:** POS only (limited access)
- [ ] Store roles in database (role table or enum)
- [ ] Assign role to user on creation
- [ ] Default role for business creator: Owner
- [ ] Role determines accessible routes/features
- [ ] Permission matrix documented:

| Feature | Owner | Manager | Cashier |
|---------|-------|---------|---------|
| Dashboard | ✅ | ✅ | ❌ |
| POS | ✅ | ✅ | ✅ |
| Products (view) | ✅ | ✅ | ✅ |
| Products (edit) | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Employees | ✅ | ✅ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ |

**Priority:** P0 (Critical)  
**Story Points:** 3  
**Assigned to:** Backend  
**Dependencies:** None

---

#### Story 3.2: Implement Permission Checking
**As a** system  
**I want to** check user permissions before allowing actions  
**So that** unauthorized actions are prevented

**Acceptance Criteria:**
- [ ] Middleware to check permissions on API routes
- [ ] Return 403 Forbidden if user lacks permission
- [ ] Frontend route guards (redirect if no permission)
- [ ] Hide UI elements user can't access
- [ ] Permission check function: `hasPermission(userId, 'manage_products')`
- [ ] Permissions list:
  - `view_dashboard`
  - `manage_products`
  - `manage_inventory`
  - `view_reports`
  - `manage_employees`
  - `manage_settings`
  - `manage_billing`
  - `process_sales`
- [ ] Log unauthorized access attempts

**Technical Notes:**
- Use decorator pattern or HOC for permission checks
- Cache user permissions in JWT payload

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 3.1

---

#### Story 3.3: User Management (Add/Edit/Deactivate Users)
**As an** owner or manager  
**I want to** manage users in my business  
**So that** I can control team access

**Acceptance Criteria:**
- [ ] Users list page showing all users:
  - Name, email, role, status (active/inactive)
  - Last login timestamp
  - Search by name or email
  - Filter by role or status
- [ ] "Add User" button → form:
  - Name, email, phone
  - Role (dropdown)
  - Location assignment (multi-select)
  - Send invitation email checkbox (checked by default)
- [ ] Submit → user created, invitation sent
- [ ] Edit user:
  - Update name, phone, role
  - Cannot change email (security)
  - Cannot demote yourself if you're the only owner
- [ ] Deactivate user (soft delete):
  - User can't login
  - Data preserved
  - Can reactivate later
- [ ] Delete user (hard delete):
  - Confirmation dialog (irreversible)
  - Only if no transactions associated
  - Cannot delete yourself
  - Cannot delete if only owner
- [ ] Invite user by email:
  - Email contains invitation link
  - Link expires in 7 days
  - User clicks → set password → account active

**Priority:** P1 (High)  
**Story Points:** 8  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 3.2

---

### EPIC 4: User Profile & Settings

#### Story 4.1: View & Edit User Profile
**As a** user  
**I want to** view and update my profile  
**So that** my information is current

**Acceptance Criteria:**
- [ ] Profile page accessible from user menu (top-right avatar)
- [ ] Display current user info:
  - Profile photo
  - Full name
  - Email (read-only)
  - Phone
  - Role (read-only)
  - Location(s) assigned (read-only)
  - Last login
  - Account created date
- [ ] Edit profile:
  - Change name
  - Change phone
  - Upload profile photo (max 2MB, jpg/png)
  - Crop photo before upload
- [ ] Save changes → success message
- [ ] Change password section:
  - Current password
  - New password
  - Confirm new password
  - Password strength indicator
- [ ] Submit password change → re-verify current password
- [ ] Success → logout all sessions, force re-login

**Priority:** P2 (Medium)  
**Story Points:** 5  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 2.1

---

#### Story 4.2: Two-Factor Authentication (2FA) - Optional
**As a** user  
**I want to** enable two-factor authentication  
**So that** my account is more secure

**Acceptance Criteria:**
- [ ] 2FA settings in user profile
- [ ] Enable 2FA:
  - Choose method: SMS or Authenticator App
  - If SMS: Enter phone number, receive code, verify
  - If App: Show QR code, scan with Google Authenticator, verify code
  - Save recovery codes (10 codes, one-time use)
- [ ] Login with 2FA:
  - Enter email + password
  - Prompt for 2FA code
  - Enter code → access granted
  - "Don't ask again on this device" checkbox (30 days)
- [ ] Disable 2FA:
  - Require password confirmation
  - Invalidate recovery codes
- [ ] Lost device recovery:
  - Enter recovery code → disable 2FA
  - Generate new recovery codes

**Priority:** P3 (Nice to have)  
**Story Points:** 8  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 4.1  
**Note:** Can be moved to Sprint 2 if time constrained

---

### EPIC 5: Basic Admin Dashboard

#### Story 5.1: Dashboard Skeleton & Navigation
**As a** user  
**I want** a clean, navigable dashboard  
**So that** I can access different parts of the system

**Acceptance Criteria:**
- [ ] Sidebar navigation with menu items:
  - Dashboard (home icon)
  - POS (disabled for now, coming soon)
  - Products (disabled)
  - Inventory (disabled)
  - Reports (disabled)
  - Employees (active if owner/manager)
  - Settings (active if owner)
- [ ] Top header with:
  - Logo (left)
  - Business name
  - Location selector (if multi-location)
  - Notifications icon (bell)
  - User menu (avatar dropdown):
    - Profile
    - Settings
    - Logout
- [ ] Responsive sidebar (collapsible on mobile)
- [ ] Active menu item highlighted
- [ ] Tooltips on hover
- [ ] Dark mode toggle (optional, nice to have)

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Frontend  
**Dependencies:** Story 2.1

---

#### Story 5.2: Dashboard Home (Stats Overview)
**As a** user  
**I want to** see an overview of my business  
**So that** I can quickly understand performance

**Acceptance Criteria:**
- [ ] Dashboard home page with placeholders/mock data:
  - **Today's Sales:** €0.00 (placeholder)
  - **Transactions Today:** 0 (placeholder)
  - **Products in Stock:** 0 (placeholder)
  - **Low Stock Alerts:** 0 (placeholder)
- [ ] Welcome message: "Welcome back, [Name]!"
- [ ] Quick actions section:
  - "Add Product" button (disabled, coming soon)
  - "New Sale" button (disabled, coming soon)
  - "View Reports" button (disabled, coming soon)
- [ ] Recent activity (empty state):
  - "No recent activity yet. Start by adding products!"
- [ ] Chart placeholder (line graph, showing "No data yet")
- [ ] Responsive layout (grid on desktop, stack on mobile)

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Frontend  
**Dependencies:** Story 5.1

---

#### Story 5.3: Business Settings Page (Basic)
**As an** owner  
**I want to** configure my business settings  
**So that** the system reflects my business information

**Acceptance Criteria:**
- [ ] Settings page with tabs:
  - **General**
  - **Locations** (coming soon)
  - **Tax & Fiscal** (coming soon)
  - **Billing** (coming soon)
- [ ] General tab fields:
  - Business name (editable)
  - NIPT/Tax ID (read-only after registration)
  - Business type (dropdown: Retail, Restaurant, Service, Other)
  - Address
  - City
  - Country (read-only)
  - Phone
  - Email
  - Website (optional)
  - Logo upload (max 2MB, jpg/png)
- [ ] Save changes button
- [ ] Success/error messages
- [ ] Preview logo before upload
- [ ] Timezone setting
- [ ] Currency setting (auto-set based on country, read-only for now)
- [ ] Date format preference (DD/MM/YYYY or MM/DD/YYYY)

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 5.1

---

### EPIC 6: Database Schema & API Foundation

#### Story 6.1: Database Schema Design
**As a** developer  
**I want** a well-designed database schema  
**So that** data is stored efficiently and securely

**Acceptance Criteria:**
- [ ] Design schema for Sprint 1 entities:
  - **businesses** table (id, name, nipt, email, country, created_at, etc.)
  - **users** table (id, business_id, name, email, password_hash, role, status, created_at, etc.)
  - **locations** table (id, business_id, name, address, city, created_at, etc.)
  - **user_locations** junction table (user_id, location_id)
  - **email_verifications** table (id, user_id, token, expires_at, verified_at)
  - **password_resets** table (id, user_id, token, expires_at, used_at)
  - **refresh_tokens** table (id, user_id, token, device_info, expires_at, revoked_at)
  - **activity_logs** table (id, user_id, action, ip_address, device, timestamp)
- [ ] Use Prisma schema (TypeScript ORM)
- [ ] Define relationships (foreign keys)
- [ ] Add indexes for performance (email, business_id, etc.)
- [ ] Add constraints (unique, not null)
- [ ] Create migration scripts
- [ ] Seed database with test data

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend  
**Dependencies:** None

---

#### Story 6.2: Core API Endpoints
**As a** frontend developer  
**I want** RESTful API endpoints for authentication  
**So that** I can build the UI

**Acceptance Criteria:**
- [ ] Implement API endpoints:
  - `POST /api/auth/register` - Register business
  - `POST /api/auth/verify-email` - Verify email token
  - `POST /api/auth/resend-verification` - Resend verification
  - `POST /api/auth/login` - Login user
  - `POST /api/auth/logout` - Logout user
  - `POST /api/auth/refresh` - Refresh access token
  - `POST /api/auth/forgot-password` - Request password reset
  - `POST /api/auth/reset-password` - Reset password
  - `GET /api/users/me` - Get current user
  - `PATCH /api/users/me` - Update current user
  - `GET /api/users` - List users (owner/manager only)
  - `POST /api/users` - Create user (owner/manager only)
  - `PATCH /api/users/:id` - Update user (owner/manager only)
  - `DELETE /api/users/:id` - Delete user (owner only)
  - `GET /api/business` - Get business details
  - `PATCH /api/business` - Update business details (owner only)
- [ ] Request/response validation (Zod or Joi)
- [ ] Error handling middleware
- [ ] API documentation (Swagger)
- [ ] Rate limiting (express-rate-limit)

**Priority:** P0 (Critical)  
**Story Points:** 13  
**Assigned to:** Backend  
**Dependencies:** Story 6.1

---

### EPIC 7: Testing & Quality Assurance

#### Story 7.1: Unit Tests for Authentication
**As a** developer  
**I want** comprehensive unit tests  
**So that** authentication logic is reliable

**Acceptance Criteria:**
- [ ] Test coverage ≥80% for auth module
- [ ] Tests for:
  - Registration (valid/invalid inputs)
  - Login (success/failure cases)
  - Password hashing
  - JWT token generation/verification
  - Email verification
  - Password reset
  - Session management
  - Permission checking
- [ ] Use Jest for testing
- [ ] Mock external dependencies (email service, database)
- [ ] Run tests in CI/CD pipeline

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Backend  
**Dependencies:** Story 6.2

---

#### Story 7.2: End-to-End Tests
**As a** QA engineer  
**I want** E2E tests for critical user flows  
**So that** the system works end-to-end

**Acceptance Criteria:**
- [ ] E2E tests for:
  - Complete registration flow
  - Email verification flow
  - Login flow
  - Password reset flow
  - User management flow
- [ ] Use Playwright or Cypress
- [ ] Run tests in CI/CD
- [ ] Generate test reports

**Priority:** P2 (Medium)  
**Story Points:** 5  
**Assigned to:** Frontend  
**Dependencies:** Story 6.2

---

## 📈 SPRINT METRICS

### Velocity Calculation
- **Total Story Points:** 110
- **Estimated Team Capacity:** 45 points/sprint (conservative)
- **Recommendation:** Move P3 stories (2FA) to Sprint 2 if needed
- **Core Stories (P0 + P1):** 92 points

### Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests written and passing
- [ ] API documented
- [ ] UI matches design mockups
- [ ] Responsive on mobile/tablet/desktop
- [ ] No critical bugs
- [ ] Deployed to staging
- [ ] Product Manager approval

---

## 🎯 SUCCESS CRITERIA

Sprint 1 is successful if:
1. ✅ Users can register, verify email, and login
2. ✅ Role-based access control works (Owner/Manager/Cashier)
3. ✅ Users can manage their profile and other users
4. ✅ Dashboard skeleton is functional and navigable
5. ✅ Business settings can be configured
6. ✅ All API endpoints are documented and tested
7. ✅ Deployed to staging environment

---

## 📅 SPRINT SCHEDULE

**Week 2:**
- Day 1-2: Setup (database, API foundation)
- Day 3-5: Registration & verification

**Week 3:**
- Day 1-3: Login & session management
- Day 4-5: User roles & permissions

**Week 4:**
- Day 1-2: User management & profile
- Day 3-4: Dashboard & settings
- Day 5: Testing, bug fixes, review

**Sprint Review:** End of Week 4, Friday 4:00 PM  
**Sprint Retrospective:** Friday 5:00 PM

---

**Document Status:** ✅ READY FOR DEVELOPMENT  
**Next Step:** Sprint Planning Meeting  
**Created:** 2026-02-23 by Sara (Product Manager)
