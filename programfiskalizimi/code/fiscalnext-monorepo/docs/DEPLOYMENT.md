# FiscalNext Deployment Guide

## Overview

This guide covers deploying FiscalNext to production using Docker, Kubernetes, or traditional VPS hosting.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [VPS Deployment](#vps-deployment)
6. [Database Setup](#database-setup)
7. [SSL Certificates](#ssl-certificates)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 14+
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- Minimum server specs:
  - 2 CPU cores
  - 4GB RAM
  - 50GB SSD storage
  - 100GB for production with growth

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# App
NODE_ENV=production
APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@db:5432/fiscalnext_production
DATABASE_POOL_SIZE=20

# API
API_PORT=5000
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRATION=24h

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@your-domain.com

# Fiscal Integration
FISCAL_API_URL=https://fiscal-api.gov.al
FISCAL_API_KEY=your-fiscal-api-key
FISCAL_CERT_PATH=/certs/fiscal.p12
FISCAL_CERT_PASSWORD=your-cert-password

# Security
ENCRYPTION_KEY=<generate-32-byte-hex-key>
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
S3_BUCKET=your-backup-bucket
S3_ACCESS_KEY=your-s3-key
S3_SECRET_KEY=your-s3-secret
```

### Generating Secrets

```bash
# JWT Secret (64 characters)
openssl rand -base64 48

# Encryption Key (32 bytes hex)
openssl rand -hex 32
```

## Docker Deployment

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_DB: fiscalnext_production
      POSTGRES_USER: fiscalnext
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fiscalnext"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Backend
  api:
    build:
      context: .
      dockerfile: ./apps/api/Dockerfile
    restart: always
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://fiscalnext:${DB_PASSWORD}@db:5432/fiscalnext_production
      NODE_ENV: production
    env_file:
      - .env.production
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Admin Web App
  web-admin:
    build:
      context: .
      dockerfile: ./apps/web-admin/Dockerfile
    restart: always
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://api:5000
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # POS Web App
  web-pos:
    build:
      context: .
      dockerfile: ./apps/web-pos/Dockerfile
    restart: always
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://api:5000
    ports:
      - "3001:3001"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - api
      - web-admin
      - web-pos
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl
      - ./infrastructure/nginx/logs:/var/log/nginx
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis (optional - for caching)
  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Dockerfiles

**Backend Dockerfile** (`apps/api/Dockerfile`):

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @fiscalnext/api build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/
EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]
```

**Frontend Dockerfile** (`apps/web-admin/Dockerfile`):

```dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-admin/package.json ./apps/web-admin/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY apps/web-admin ./apps/web-admin
RUN pnpm --filter @fiscalnext/web-admin build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/web-admin/.next ./apps/web-admin/.next
COPY --from=build /app/apps/web-admin/public ./apps/web-admin/public
COPY apps/web-admin/package.json ./apps/web-admin/
EXPOSE 3000
CMD ["pnpm", "--filter", "@fiscalnext/web-admin", "start"]
```

### Deployment Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Update and restart specific service
docker-compose up -d --build api

# Database migrations
docker-compose exec api pnpm prisma migrate deploy
```

## SSL Certificates

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### Manual SSL Configuration

Place certificates in `infrastructure/nginx/ssl/`:
- `fullchain.pem`
- `privkey.pem`

## Nginx Configuration

```nginx
# infrastructure/nginx/nginx.conf
upstream api_backend {
    server api:5000;
}

upstream admin_backend {
    server web-admin:3000;
}

upstream pos_backend {
    server web-pos:3001;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Admin app
    location / {
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API server
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

## Database Setup

### Initial Setup

```bash
# Create database user
sudo -u postgres createuser --interactive
# Name: fiscalnext
# Superuser: no
# Create databases: yes
# Create roles: no

# Set password
sudo -u postgres psql
ALTER USER fiscalnext WITH PASSWORD 'your-secure-password';

# Create database
sudo -u postgres createdb -O fiscalnext fiscalnext_production

# Run migrations
docker-compose exec api pnpm prisma migrate deploy
```

### Performance Tuning

```sql
-- PostgreSQL configuration (postgresql.conf)
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# infrastructure/scripts/backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE="fiscalnext_production"
RETENTION_DAYS=30

# Create backup
docker-compose exec -T db pg_dump -U fiscalnext $DATABASE | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" "s3://your-bucket/backups/"

# Delete old backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: db_$TIMESTAMP.sql.gz"
```

### Cron Job

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/infrastructure/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Restore from Backup

```bash
# Restore database
gunzip -c /backups/db_20240223_020000.sql.gz | docker-compose exec -T db psql -U fiscalnext fiscalnext_production
```

## Monitoring & Health Checks

### Health Check Endpoints

- API: `https://api.your-domain.com/health`
- Admin: `https://your-domain.com/api/health`
- POS: `https://pos.your-domain.com/api/health`

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

### Application Monitoring

Configure Sentry in `.env.production`:

```bash
SENTRY_DSN=your-sentry-dsn
```

## Zero-Downtime Deployment

```bash
#!/bin/bash
# infrastructure/scripts/deploy.sh

# Pull latest code
git pull origin main

# Build new images
docker-compose build

# Run database migrations
docker-compose exec api pnpm prisma migrate deploy

# Rolling update (one service at a time)
docker-compose up -d --no-deps --build api
sleep 10
docker-compose up -d --no-deps --build web-admin
sleep 10
docker-compose up -d --no-deps --build web-pos

# Verify health
curl -f https://api.your-domain.com/health || exit 1
curl -f https://your-domain.com/api/health || exit 1

echo "Deployment successful!"
```

## Troubleshooting

### Checking Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Common Issues

**Database connection failed**
```bash
# Check database status
docker-compose ps db

# Restart database
docker-compose restart db
```

**Out of memory**
```bash
# Check memory usage
docker stats

# Increase container memory limit in docker-compose.yml
```

**Port already in use**
```bash
# Find process using port
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

## Security Checklist

- [ ] All environment variables set
- [ ] Strong passwords generated
- [ ] SSL certificates installed
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Database access restricted
- [ ] Regular backups enabled
- [ ] Monitoring configured
- [ ] Log rotation enabled
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Performance Optimization

- Enable Nginx caching for static assets
- Configure CDN (Cloudflare recommended)
- Enable Redis caching
- Database connection pooling
- Compress API responses
- Optimize database indexes

## Support

For deployment issues:
- Email: support@fiscalnext.com
- Documentation: https://docs.fiscalnext.com/deployment
- GitHub Issues: https://github.com/org/fiscalnext/issues
