# GitHub Organization & Repository Setup

**Created by:** Alex (CTO)  
**Date:** 2026-02-23

## 🎯 Overview

This document outlines the steps to create the GitHub organization and repository structure for FiscalNext.

---

## 📋 Prerequisites

1. GitHub account with organization creation permissions
2. GitHub CLI installed (`gh` command)
3. Git configured locally

```bash
# Check GitHub CLI is installed
gh --version

# Login to GitHub
gh auth login

# Configure git
git config --global user.email "alex@fiscalnext.com"
git config --global user.name "Alex - CTO"
```

---

## 🏢 Step 1: Create GitHub Organization

```bash
# Create organization via GitHub CLI
gh org create fiscalnext
```

Or manually via GitHub.com:
1. Go to https://github.com/settings/organizations
2. Click "New organization"
3. Choose "Create a free organization"
4. Organization name: `fiscalnext`
5. Contact email: `admin@fiscalnext.com`
6. Organization type: Business

---

## 📦 Step 2: Create Repositories

We'll use a **monorepo** approach with three main applications and shared packages.

### Repository Structure

```
fiscalnext/
├── backend/              # Fastify API (all microservices)
├── frontend-admin/       # Next.js Admin Dashboard
├── frontend-pos/         # Next.js POS Interface
└── packages/            # Shared packages (database, types, ui, utils)
```

### Create Main Monorepo

```bash
# Navigate to project directory
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext

# Initialize git repository
git init

# Create main repository on GitHub
gh repo create fiscalnext/fiscalnext --public --description "FiscalNext - Modern Fiscalization Platform for Albania & Kosovo" --source=.

# Add README
echo "# FiscalNext Platform" > README.md
echo "Modern fiscalization platform for businesses in Albania and Kosovo" >> README.md

# Initial commit
git add .
git commit -m "feat: initial project structure"
git branch -M main
git push -u origin main
```

---

## 🔐 Step 3: Repository Settings

### Branch Protection Rules

```bash
# Protect main branch
gh api repos/fiscalnext/fiscalnext/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

Or via GitHub.com:
1. Go to `Settings > Branches`
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

### Repository Secrets

Add the following secrets via `Settings > Secrets and variables > Actions`:

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Sentry (error tracking)
SENTRY_DSN=...

# Email
SENDGRID_API_KEY=...
```

---

## 👥 Step 4: Team & Access Control

### Create Teams

```bash
# Create teams
gh api orgs/fiscalnext/teams --method POST --field name="Developers" --field privacy="closed"
gh api orgs/fiscalnext/teams --method POST --field name="DevOps" --field privacy="closed"
gh api orgs/fiscalnext/teams --method POST --field name="QA" --field privacy="closed"
```

### Team Permissions

| Team | Role | Access |
|------|------|--------|
| Developers | Write | Can push, create PRs |
| DevOps | Admin | Full access |
| QA | Read | Can view, comment |

---

## 📋 Step 5: GitHub Actions Workflows

Create CI/CD workflows in `.github/workflows/`

### Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run test
      - run: npm run build
```

---

## 🏷️ Step 6: Repository Labels

Create standardized labels for issues and PRs:

```bash
# Feature labels
gh label create "feature" --color "0052CC" --description "New feature"
gh label create "enhancement" --color "84B6EB" --description "Improvement to existing feature"

# Bug labels
gh label create "bug" --color "D93F0B" --description "Something isn't working"
gh label create "critical" --color "B60205" --description "Critical bug"

# Status labels
gh label create "in-progress" --color "FEF2C0" --description "Work in progress"
gh label create "ready-for-review" --color "0E8A16" --description "Ready for code review"
gh label create "blocked" --color "D93F0B" --description "Blocked by dependency"

# Type labels
gh label create "backend" --color "1D76DB" --description "Backend related"
gh label create "frontend" --color "5319E7" --description "Frontend related"
gh label create "database" --color "C5DEF5" --description "Database schema/migrations"
gh label create "documentation" --color "0075CA" --description "Documentation"
```

---

## 📝 Step 7: Issue Templates

Create issue templates in `.github/ISSUE_TEMPLATE/`

### Bug Report Template

```markdown
---
name: Bug Report
about: Report a bug
labels: bug
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
```

### Feature Request Template

```markdown
---
name: Feature Request
about: Suggest a new feature
labels: feature
---

**Problem Statement**
Describe the problem this feature would solve.

**Proposed Solution**
Describe your proposed solution.

**Alternatives**
Any alternative solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Organization created: https://github.com/fiscalnext
- [ ] Main repository created: https://github.com/fiscalnext/fiscalnext
- [ ] Main branch protected
- [ ] Teams created and members added
- [ ] Repository secrets configured
- [ ] GitHub Actions enabled
- [ ] Issue templates created
- [ ] Labels created

---

## 🚀 Next Steps

1. ✅ Complete GitHub setup (this document)
2. Initialize monorepo with Turborepo
3. Setup Prisma database package
4. Create backend service structure
5. Create frontend app structure
6. Setup Docker Compose for local development
7. Begin Sprint 1 development

---

## 📞 Support

**Questions?** Contact Alex (CTO)

**Resources:**
- GitHub CLI Docs: https://cli.github.com/manual/
- GitHub Actions: https://docs.github.com/en/actions
- Monorepo Guide: See `docs/MONOREPO_STRUCTURE.md`
