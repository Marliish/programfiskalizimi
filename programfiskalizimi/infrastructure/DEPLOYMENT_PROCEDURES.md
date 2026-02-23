# 📚 Tafa Platform - Deployment Procedures

**Version:** 1.0.0  
**Last Updated:** 2026-02-23  
**Environment:** Staging & Production

---

## 🎯 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Initial Infrastructure Setup](#initial-infrastructure-setup)
3. [Application Deployment](#application-deployment)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Database Migrations](#database-migrations)
6. [Rollback Procedures](#rollback-procedures)
7. [Health Checks](#health-checks)
8. [Troubleshooting](#troubleshooting)

---

## 📋 Pre-Deployment Checklist

### Before Every Deployment:

- [ ] All tests passing in CI/CD
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Team notified
- [ ] Monitoring dashboards ready
- [ ] Rollback plan prepared

---

## 🏗️ Initial Infrastructure Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Create infrastructure directory
mkdir -p /opt/tafa/infrastructure
cd /opt/tafa/infrastructure
```

### 2. Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/your-org/tafa-platform.git
cd tafa-platform/infrastructure

# Checkout appropriate branch
git checkout main  # For production
# OR
git checkout staging  # For staging
```

### 3. Configure Environment Variables

```bash
# Generate database secrets
./scripts/generate-db-secrets.sh

# Edit environment files
nano .env.db
nano .env.monitoring

# IMPORTANT: Update these values:
# - Database passwords
# - Redis passwords
# - Grafana admin password
# - Domain names
# - Email addresses
```

### 4. Start Infrastructure Services

```bash
# Start database
docker-compose -f docker-compose.db.yml --env-file .env.db up -d

# Wait for database to be healthy
docker-compose -f docker-compose.db.yml ps

# Start Vault
docker-compose -f docker-compose.vault.yml up -d
./scripts/vault-setup.sh

# Start monitoring
docker-compose -f docker-compose.monitoring.yml --env-file .env.monitoring up -d

# Verify all services
./scripts/health-check.sh
```

### 5. Configure Domain & SSL

```bash
# Update DNS records (do this in your DNS provider)
# Add A record: staging.tafa.al -> YOUR_SERVER_IP

# Wait for DNS propagation (check with: dig staging.tafa.al)

# Obtain SSL certificate
./scripts/setup-ssl.sh staging.tafa.al admin@tafa.al

# Start NGINX
docker-compose -f docker-compose.nginx.yml up -d
```

---

## 🚀 Application Deployment

### Method 1: Manual Deployment

```bash
# Pull latest code
cd /opt/tafa
git pull origin main

# Build Docker images
docker-compose -f docker-compose.app.yml build

# Run database migrations
docker-compose -f docker-compose.app.yml run --rm backend npm run migrate

# Start application
docker-compose -f docker-compose.app.yml up -d

# Verify deployment
curl https://staging.tafa.al/health
curl https://staging.tafa.al/api/health
```

### Method 2: Automated Deployment (CI/CD)

```bash
# Trigger deployment via GitHub Actions
# Push to main branch or create a release tag

# Monitor deployment
# Check GitHub Actions: https://github.com/your-org/tafa-platform/actions

# Verify deployment
./scripts/verify-deployment.sh
```

### Post-Deployment Steps

```bash
# 1. Run smoke tests
./scripts/smoke-tests.sh

# 2. Check application logs
docker-compose -f docker-compose.app.yml logs -f backend
docker-compose -f docker-compose.app.yml logs -f frontend

# 3. Monitor metrics
# Open Grafana: https://staging.tafa.al/grafana

# 4. Verify database connections
docker exec -it tafa-backend npm run db:check

# 5. Test critical user flows
# - User registration
# - Login
# - POS transaction
# - Fiscal invoice generation
```

---

## 🔐 SSL Certificate Setup

### Initial Certificate

```bash
# Obtain certificate
./scripts/setup-ssl.sh staging.tafa.al admin@tafa.al

# Certificate will be stored in:
# /etc/letsencrypt/live/staging.tafa.al/
```

### Certificate Renewal

```bash
# Certificates auto-renew every 12 hours via certbot container

# Manual renewal (if needed)
docker-compose -f docker-compose.nginx.yml run --rm certbot renew

# Reload NGINX after renewal
docker-compose -f docker-compose.nginx.yml restart nginx
```

### Verify SSL

```bash
# Check certificate expiration
docker-compose -f docker-compose.nginx.yml run --rm certbot certificates

# Test SSL configuration
curl -vI https://staging.tafa.al

# Check SSL rating (optional)
# Visit: https://www.ssllabs.com/ssltest/
```

---

## 🗄️ Database Migrations

### Before Migration

```bash
# 1. Create backup
./scripts/backup-database.sh

# 2. Test migration on local copy
docker exec -it tafa-backend npm run migrate:dry-run

# 3. Verify migration files
ls -la code/backend/prisma/migrations/
```

### Run Migration

```bash
# Production migration
docker exec -it tafa-backend npm run migrate

# OR with Prisma directly
docker exec -it tafa-backend npx prisma migrate deploy

# Verify migration
docker exec -it tafa-backend npx prisma migrate status
```

### Rollback Migration

```bash
# Restore from backup
./scripts/restore-database.sh ./backups/manual/tafa_20260223_160000.sql.gz

# OR manual rollback
docker exec -it tafa-postgres psql -U tafa_admin -d tafa_production
# Run rollback SQL manually
```

---

## ⏮️ Rollback Procedures

### Quick Rollback (Application Only)

```bash
# 1. Stop current version
docker-compose -f docker-compose.app.yml down

# 2. Checkout previous version
git checkout <previous-commit-or-tag>

# 3. Rebuild and start
docker-compose -f docker-compose.app.yml build
docker-compose -f docker-compose.app.yml up -d

# 4. Verify rollback
./scripts/health-check.sh
```

### Full Rollback (Application + Database)

```bash
# 1. Stop application
docker-compose -f docker-compose.app.yml down

# 2. Restore database from backup
./scripts/restore-database.sh ./backups/manual/tafa_TIMESTAMP.sql.gz

# 3. Rollback application code
git checkout <previous-commit-or-tag>
docker-compose -f docker-compose.app.yml build
docker-compose -f docker-compose.app.yml up -d

# 4. Verify
./scripts/health-check.sh
./scripts/smoke-tests.sh
```

### Emergency Rollback

```bash
# If something is critically broken:

# 1. Enable maintenance mode (show maintenance page to users)
docker-compose -f docker-compose.nginx.yml run --rm nginx \
    sh -c "echo 'maintenance' > /var/www/maintenance"

# 2. Stop all application containers
docker-compose -f docker-compose.app.yml down

# 3. Restore last known good state
# (See Full Rollback procedure above)

# 4. Disable maintenance mode
rm /var/www/maintenance
docker-compose -f docker-compose.nginx.yml restart nginx
```

---

## 🏥 Health Checks

### Infrastructure Health

```bash
# Check all containers
docker ps -a

# Check database
docker exec tafa-postgres pg_isready -U tafa_admin

# Check Redis
docker exec tafa-redis redis-cli -a "$REDIS_PASSWORD" ping

# Check Vault
docker exec tafa-vault vault status
```

### Application Health

```bash
# Backend health
curl https://staging.tafa.al/api/health

# Frontend health
curl https://staging.tafa.al/health

# Database connection
curl https://staging.tafa.al/api/health/db
```

### Monitoring Dashboards

```bash
# Grafana
open https://staging.tafa.al/grafana

# Prometheus
open http://localhost:9090

# Check metrics
curl http://localhost:9090/api/v1/query?query=up
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker logs tafa-backend

# Check resource usage
docker stats

# Restart container
docker-compose -f docker-compose.app.yml restart backend
```

#### 2. Database Connection Error

```bash
# Check database is running
docker ps | grep postgres

# Check connection
docker exec tafa-postgres psql -U tafa_admin -d tafa_production -c "SELECT 1;"

# Check connection from backend
docker exec tafa-backend node -e "require('./dist/db').testConnection()"
```

#### 3. SSL Certificate Issues

```bash
# Check certificate
docker-compose -f docker-compose.nginx.yml run --rm certbot certificates

# Renew certificate
docker-compose -f docker-compose.nginx.yml run --rm certbot renew --force-renewal

# Check NGINX config
docker exec tafa-nginx nginx -t
```

#### 4. High Memory Usage

```bash
# Check container resources
docker stats

# Restart problematic container
docker-compose -f docker-compose.app.yml restart <service>

# Check logs for memory leaks
docker logs tafa-backend | grep -i "memory\|heap"
```

#### 5. Slow Performance

```bash
# Check database slow queries
docker exec -it tafa-postgres psql -U tafa_admin -d tafa_production
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check Redis memory
docker exec tafa-redis redis-cli -a "$REDIS_PASSWORD" info memory

# Check system resources
top
df -h
```

---

## 📞 Emergency Contacts

**On-Call Engineer:** +355 XX XXX XXXX  
**DevOps Team:** devops@tafa.al  
**Database Admin:** dba@tafa.al

### Escalation Process

1. **Level 1** (0-15 min): On-call engineer investigates
2. **Level 2** (15-30 min): Team lead involved
3. **Level 3** (30+ min): CTO & full team engaged

---

## 📊 Deployment Metrics

Track these metrics for each deployment:

- **Deployment Duration:** < 10 minutes
- **Downtime:** < 30 seconds (zero-downtime goal)
- **Rollback Time:** < 5 minutes
- **Time to Detection:** < 2 minutes
- **Time to Resolution:** < 15 minutes

---

## ✅ Post-Deployment Checklist

After every deployment:

- [ ] All health checks passing
- [ ] Smoke tests completed
- [ ] No errors in logs (first 10 minutes)
- [ ] Monitoring dashboards showing normal metrics
- [ ] Team notified of successful deployment
- [ ] Deployment documented in changelog
- [ ] Backup created and verified

---

## 📝 Notes

- Always create a backup before deployment
- Never deploy on Friday afternoon (unless emergency)
- Test in staging before production
- Have rollback plan ready
- Monitor for at least 1 hour after deployment

---

**Document Version:** 1.0.0  
**Next Review:** 2026-03-23
