# 🔄 Tafa Platform - CI/CD Pipeline Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-02-23  
**Pipeline:** GitHub Actions

---

## 🎯 Overview

The Tafa platform uses GitHub Actions for continuous integration and deployment. The pipeline automatically builds, tests, and deploys the application to staging and production environments.

---

## 📋 Pipeline Stages

### 1. **Continuous Integration (CI)**

Triggered on: Every push and pull request

```yaml
# .github/workflows/ci.yml

Stages:
├── Code Quality Checks
│   ├── ESLint (Frontend & Backend)
│   ├── Prettier formatting
│   └── TypeScript compilation
│
├── Unit Tests
│   ├── Backend tests (Jest)
│   ├── Frontend tests (Vitest)
│   └── Coverage report (>80%)
│
├── Integration Tests
│   ├── API tests
│   ├── Database tests
│   └── Redis tests
│
├── E2E Tests (Playwright)
│   ├── User flows
│   ├── POS scenarios
│   └── Admin panel
│
└── Security Scans
    ├── Dependency vulnerabilities
    ├── Code security (Snyk)
    └── Secret detection
```

**Duration:** ~8-12 minutes  
**Required for merge:** All checks must pass

---

### 2. **Continuous Deployment to Staging**

Triggered on: Push to `staging` branch or `develop` branch

```yaml
# .github/workflows/deploy-staging.yml

Stages:
├── Build Docker Images
│   ├── Backend image
│   ├── Frontend image
│   └── Push to registry
│
├── Database Migration
│   ├── Run migrations
│   └── Seed test data
│
├── Deploy to Staging
│   ├── Pull latest images
│   ├── Update containers
│   └── Health checks
│
└── Smoke Tests
    ├── API health check
    ├── Frontend health check
    └── Critical user flows
```

**Duration:** ~5-8 minutes  
**Environment:** https://staging.tafa.al

---

### 3. **Continuous Deployment to Production**

Triggered on: Manual approval or release tag (v*)

```yaml
# .github/workflows/deploy-production.yml

Stages:
├── Pre-Deployment
│   ├── Create backup
│   ├── Notify team
│   └── Enable maintenance mode (optional)
│
├── Build & Push
│   ├── Build production images
│   ├── Tag with version
│   └── Push to registry
│
├── Database Migration
│   ├── Backup database
│   ├── Run migrations
│   └── Verify integrity
│
├── Deploy
│   ├── Blue-green deployment
│   ├── Health checks
│   └── Gradual traffic shift
│
├── Verification
│   ├── Smoke tests
│   ├── Monitor metrics (5 min)
│   └── Check error rates
│
└── Rollback (if needed)
    ├── Restore database
    ├── Revert containers
    └── Alert team
```

**Duration:** ~10-15 minutes  
**Environment:** https://tafa.al

---

## 🔧 Pipeline Configuration

### GitHub Actions Secrets

Required secrets in GitHub repository settings:

```bash
# Server Access
SSH_PRIVATE_KEY          # SSH key for deployment server
SERVER_HOST              # staging.tafa.al
SERVER_USER              # deploy

# Docker Registry
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub token
REGISTRY_URL             # Docker registry URL

# Database
DB_PASSWORD              # Production database password
REDIS_PASSWORD           # Production Redis password

# Vault
VAULT_TOKEN              # Vault access token
VAULT_ADDR               # Vault server address

# Notifications
SLACK_WEBHOOK_URL        # Slack notification webhook
EMAIL_SMTP_PASSWORD      # Email notification password

# External Services
FISCAL_API_KEY           # Albanian tax authority API key
PAYMENT_GATEWAY_SECRET   # Payment gateway secret
```

---

## 📝 Example GitHub Actions Workflows

### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: |
          pnpm run lint
          pnpm run format:check
      
      - name: Type check
        run: pnpm run typecheck
      
      - name: Unit tests
        run: pnpm run test:coverage
      
      - name: Integration tests
        run: pnpm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: E2E tests
        run: pnpm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
      
      - name: Security scan
        run: |
          npm audit --audit-level=moderate
          pnpm run snyk:test
```

### Staging Deployment

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.tafa.al
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push images
        run: |
          docker build -t tafa/backend:staging ./backend
          docker build -t tafa/frontend:staging ./frontend
          docker push tafa/backend:staging
          docker push tafa/frontend:staging
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/tafa
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T backend npm run migrate
            
      - name: Health check
        run: |
          sleep 10
          curl -f https://staging.tafa.al/health || exit 1
          curl -f https://staging.tafa.al/api/health || exit 1
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "✅ Staging deployment successful!",
              "url": "https://staging.tafa.al"
            }
```

### Production Deployment

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://tafa.al
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create backup
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/tafa/infrastructure
            ./scripts/backup-database.sh
      
      - name: Build production images
        run: |
          docker build -t tafa/backend:${{ github.ref_name }} ./backend
          docker build -t tafa/frontend:${{ github.ref_name }} ./frontend
          docker tag tafa/backend:${{ github.ref_name }} tafa/backend:latest
          docker tag tafa/frontend:${{ github.ref_name }} tafa/frontend:latest
          docker push tafa/backend:${{ github.ref_name }}
          docker push tafa/frontend:${{ github.ref_name }}
          docker push tafa/backend:latest
          docker push tafa/frontend:latest
      
      - name: Run database migrations
        run: |
          ssh deploy@tafa.al "cd /opt/tafa && docker-compose exec -T backend npm run migrate"
      
      - name: Blue-green deployment
        run: |
          # Deploy to green environment
          ssh deploy@tafa.al "cd /opt/tafa && docker-compose -f docker-compose.prod-green.yml pull && docker-compose -f docker-compose.prod-green.yml up -d"
          
          # Health check
          sleep 15
          curl -f https://green.tafa.al/health || exit 1
          
          # Switch traffic to green
          ssh deploy@tafa.al "cd /opt/tafa && ./scripts/switch-to-green.sh"
          
          # Monitor for 5 minutes
          sleep 300
          
          # Stop blue environment
          ssh deploy@tafa.al "cd /opt/tafa && docker-compose -f docker-compose.prod-blue.yml down"
      
      - name: Verify deployment
        run: |
          ./scripts/production-smoke-tests.sh
      
      - name: Notify team
        uses: slackapi/slack-github-action@v1
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "🚀 Production deployment successful!",
              "version": "${{ github.ref_name }}",
              "url": "https://tafa.al"
            }
      
      - name: Rollback on failure
        if: failure()
        run: |
          ssh deploy@tafa.al "cd /opt/tafa && ./scripts/rollback-production.sh"
```

---

## 🧪 Testing Strategy

### Unit Tests
- **Coverage target:** >80%
- **Run on:** Every commit
- **Tools:** Jest, Vitest
- **Duration:** ~2 minutes

### Integration Tests
- **Coverage:** API endpoints, database operations
- **Run on:** Every commit
- **Tools:** Supertest, Test containers
- **Duration:** ~3 minutes

### E2E Tests
- **Coverage:** Critical user flows
- **Run on:** Every commit, full suite on deploy
- **Tools:** Playwright
- **Duration:** ~5 minutes

### Load Tests
- **Coverage:** API performance
- **Run on:** Weekly, before major releases
- **Tools:** k6, Artillery
- **Duration:** ~15 minutes

---

## 🔄 Deployment Strategies

### Staging: Direct Deployment
- Simple docker-compose restart
- Minimal downtime (~10 seconds)
- Automatic rollback on health check failure

### Production: Blue-Green Deployment
- Zero-downtime deployment
- Easy rollback (switch back to blue)
- Gradual traffic shift
- Rollback time < 30 seconds

---

## 📊 Monitoring & Alerts

### Deployment Metrics Tracked

```yaml
metrics:
  - deployment_duration_seconds
  - deployment_success_rate
  - rollback_count
  - time_to_detect_failure_seconds
  - time_to_rollback_seconds
  - pipeline_failure_rate
```

### Alerts Configured

1. **Pipeline Failure** → Slack + Email
2. **Deployment Failure** → Slack + SMS
3. **High Error Rate** → Auto-rollback + Alerts
4. **Slow Response Times** → Slack notification

---

## 🔐 Security Best Practices

- All secrets stored in GitHub Secrets
- SSH keys rotated monthly
- Docker images scanned for vulnerabilities
- Dependency updates automated (Dependabot)
- HTTPS enforced for all communications
- Database credentials stored in Vault

---

## 🛠️ Manual Deployment (Emergency)

If CI/CD is down:

```bash
# 1. SSH into server
ssh deploy@staging.tafa.al

# 2. Navigate to project
cd /opt/tafa

# 3. Pull latest code
git pull origin main

# 4. Build and deploy
docker-compose -f docker-compose.app.yml build
docker-compose -f docker-compose.app.yml up -d

# 5. Run migrations
docker-compose -f docker-compose.app.yml exec backend npm run migrate

# 6. Verify
./scripts/health-check.sh
```

---

## 📈 Pipeline Optimization

### Current Performance
- Total CI time: ~12 minutes
- Staging deployment: ~6 minutes
- Production deployment: ~15 minutes

### Improvement Goals
- Cache Docker layers (save ~2 min)
- Parallel test execution (save ~3 min)
- Incremental builds (save ~1 min)
- **Target:** <8 min CI, <5 min staging deploy

---

## 🎯 Next Steps

- [ ] Implement automated canary deployments
- [ ] Add performance regression tests
- [ ] Set up feature flag system
- [ ] Implement automated rollback on metrics
- [ ] Add deployment approval workflow

---

**Document Version:** 1.0.0  
**Pipeline Version:** GitHub Actions v4  
**Next Review:** 2026-03-23
