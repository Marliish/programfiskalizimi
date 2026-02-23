#!/bin/bash
# Product Manager Agent - Requirements & Planning
# Works autonomously, creates user stories

AGENT_NAME="Product Manager (Sara)"
WORKSPACE="/Users/admin/.openclaw/workspace/programfiskalizimi"
LOG_FILE="$WORKSPACE/reports/agents/pm_log.md"

mkdir -p "$WORKSPACE/reports/agents"
mkdir -p "$WORKSPACE/product"

echo "📊 Product Manager Agent started at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Task 1: Create Sprint 1 user stories
echo "## Task: Sprint 1 User Stories" >> "$LOG_FILE"

cat > "$WORKSPACE/product/SPRINT_1_STORIES.md" << 'EOFSTORIES'
# Sprint 1 User Stories
## Authentication & User Management

### Story 1: User Registration
**As a** business owner  
**I want to** register my business on the platform  
**So that** I can start using the POS system

**Acceptance Criteria:**
- [ ] Form with business name, NIPT, email, password
- [ ] Email validation
- [ ] Password strength check (min 8 chars)
- [ ] Success message after registration
- [ ] Email verification sent
- [ ] Redirect to dashboard after verification

**Priority:** HIGH  
**Estimated:** 2 days

---

### Story 2: User Login
**As a** user  
**I want to** login with my email and password  
**So that** I can access the system

**Acceptance Criteria:**
- [ ] Login form with email and password
- [ ] JWT token generated on success
- [ ] Token stored securely
- [ ] Redirect to dashboard
- [ ] Error message for invalid credentials
- [ ] Remember me option

**Priority:** HIGH  
**Estimated:** 1 day

---

### Story 3: User Profile
**As a** user  
**I want to** view and edit my profile  
**So that** I can keep my information up to date

**Acceptance Criteria:**
- [ ] View current profile info
- [ ] Edit name, phone, email
- [ ] Change password
- [ ] Upload avatar
- [ ] Save changes
- [ ] Success confirmation

**Priority:** MEDIUM  
**Estimated:** 1 day

---

## Sprint 1 Velocity Target

**Total Story Points:** 18  
**Duration:** 2 weeks  
**Daily Standup:** 10:00 AM  
**Sprint Review:** Friday 4:00 PM

## Created

2026-02-23 by PM Agent (Sara)
EOFSTORIES

echo "✅ Created 3 user stories for Sprint 1" >> "$LOG_FILE"
echo "   - User Registration (HIGH priority)" >> "$LOG_FILE"
echo "   - User Login (HIGH priority)" >> "$LOG_FILE"
echo "   - User Profile (MEDIUM priority)" >> "$LOG_FILE"

echo "" >> "$LOG_FILE"
echo "🎯 PM tasks completed at $(date)" >> "$LOG_FILE"
echo "Status: SPRINT 1 PLANNED" >> "$LOG_FILE"
