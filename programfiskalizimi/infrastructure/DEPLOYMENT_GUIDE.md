# 🚀 FiscalNext Deployment Guide

**Created by:** Max (DevOps Engineer)  
**Date:** 2026-02-23  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Server Requirements](#server-requirements)
3. [Initial Server Setup](#initial-server-setup)
4. [Docker Installation](#docker-installation)
5. [Application Deployment](#application-deployment)
6. [Environment Configuration](#environment-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring Setup](#monitoring-setup)
9. [Backup Configuration](#backup-configuration)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

This guide covers deploying FiscalNext to staging and production environments using Docker Compose.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)               │
│              SSL Termination & Load Balancing           │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼─────────┐
│   Web Admin    │  │   Web POS   │  │    API Server    │
│  (Next.js)     │  │  (Next.js)  │  │    (Fastify)     │
└────────────────┘  └─────────────┘  └──────────────────┘
                                              │
                    ┌─────────────────────────┼──────────┐
                    │                         │          │
            ┌───────▼────────┐    ┌──────────▼────┐  ┌──▼──────┐
            │   PostgreSQL   │    │     Redis     │  │RabbitMQ │
            │   (Database)   │    │    (Cache)    │  │ (Queue) │
            └────────────────┘    └───────────────┘  └─────────┘
```

### Deployment Environments

- **Development:** Local Docker Compose (developer machines)
- **Staging:** staging.fiscalnext.com (testing & QA)
- **Production:** fiscalnext.com (live environment)

---

## 💻 Server Requirements

### Minimum Requirements (Staging)

- **CPU:** 2 vCPUs
- **RAM:** 4 GB
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 22.04 LTS or later
- **Network:** Static IP, ports 80, 443, 22 open

### Recommended Requirements (Production)

- **CPU:** 4 vCPUs
- **RAM:** 8 GB
- **Storage:** 100 GB SSD with backup
- **OS:** Ubuntu 22.04 LTS
- **Network:** Static IP, CDN integration
- **Backup:** Daily automated backups

---

## 🔧 Initial Server Setup

### 1. Create Non-Root User

```bash
# SSH into server as root
ssh root@your-server-ip

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Setup SSH key authentication
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Test SSH login
ssh deploy@your-server-ip
```

### 2. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim ufw
```

### 3. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 4. Set Timezone

```bash
sudo timedatectl set-timezone Europe/Tirane  # Albania
# or
sudo timedatectl set-timezone Europe/Belgrade  # Kosovo
```

---

## 🐳 Docker Installation

### Install Docker Engine

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Configure Docker (Production)

```bash
# Create daemon config for production
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false
}
EOF

# Restart Docker
sudo systemctl restart docker
sudo systemctl enable docker
```

---

## 🚀 Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/fiscalnext
sudo chown -R deploy:deploy /opt/fiscalnext

# Clone repository
cd /opt/fiscalnext
git clone https://github.com/yourusername/fiscalnext.git .

# Checkout appropriate branch
git checkout develop  # for staging
# or
git checkout main     # for production
```

### 2. Setup Environment Variables

```bash
# Copy environment template
cp .env.staging /opt/fiscalnext/.env  # for staging

# Edit environment variables
nano /opt/fiscalnext/.env

# Set secure values (IMPORTANT!)
# - Database credentials
# - JWT secret
# - Redis password
# - API keys
```

### 3. Create Required Directories

```bash
# Create directories
mkdir -p /opt/fiscalnext/backups
mkdir -p /opt/fiscalnext/logs
mkdir -p /opt/fiscalnext/uploads
mkdir -p /opt/fiscalnext/infrastructure/docker/nginx/ssl

# Set permissions
chmod 750 /opt/fiscalnext/backups
chmod 755 /opt/fiscalnext/uploads
```

### 4. Deploy with Docker Compose

```bash
cd /opt/fiscalnext

# Pull images
docker compose -f infrastructure/docker/docker-compose.staging.yml pull

# Start services
docker compose -f infrastructure/docker/docker-compose.staging.yml up -d

# Check logs
docker compose -f infrastructure/docker/docker-compose.staging.yml logs -f

# Verify all containers are running
docker compose -f infrastructure/docker/docker-compose.staging.yml ps
```

### 5. Run Database Migrations

```bash
# Run migrations
docker compose -f infrastructure/docker/docker-compose.staging.yml \
  exec api npm run migrate:latest

# Seed initial data (optional)
docker compose -f infrastructure/docker/docker-compose.staging.yml \
  exec api npm run seed
```

---

## 🔐 SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Generate certificate
sudo certbot certonly --standalone -d staging.fiscalnext.com \
  -d admin.staging.fiscalnext.com \
  -d pos.staging.fiscalnext.com \
  --email admin@fiscalnext.com \
  --agree-tos

# Copy certificates to Docker volume
sudo cp /etc/letsencrypt/live/staging.fiscalnext.com/fullchain.pem \
  /opt/fiscalnext/infrastructure/docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/staging.fiscalnext.com/privkey.pem \
  /opt/fiscalnext/infrastructure/docker/nginx/ssl/

# Set permissions
sudo chmod 644 /opt/fiscalnext/infrastructure/docker/nginx/ssl/fullchain.pem
sudo chmod 600 /opt/fiscalnext/infrastructure/docker/nginx/ssl/privkey.pem

# Setup auto-renewal
sudo certbot renew --dry-run
```

### Auto-Renewal Cron Job

```bash
# Add to crontab
sudo crontab -e

# Add this line (renews daily, restarts nginx if renewed)
0 0 * * * certbot renew --quiet --deploy-hook "docker restart fiscalnext-nginx-staging"
```

---

## 📊 Monitoring Setup

### 1. Access Monitoring Dashboards

- **Grafana:** http://your-server:3000 (default: admin/admin)
- **Prometheus:** http://your-server:9090
- **RabbitMQ:** http://your-server:15672 (default: admin/admin123)
- **pgAdmin:** http://your-server:5050

### 2. Configure Grafana

```bash
# Login to Grafana
# URL: https://monitoring.staging.fiscalnext.com
# Default credentials: admin / [GRAFANA_PASSWORD from .env]

# Import pre-built dashboards:
# 1. Go to Dashboards > Import
# 2. Import ID: 1860 (Node Exporter Full)
# 3. Import ID: 3662 (PostgreSQL)
# 4. Import ID: 763 (Redis)
```

### 3. Setup Alerts

Create alert rules in Grafana for:
- High CPU usage (>80%)
- High memory usage (>90%)
- Database connection errors
- API response time > 1s
- Disk space < 10%

---

## 💾 Backup Configuration

### 1. Database Backup Script

```bash
# Create backup script
sudo tee /opt/fiscalnext/infrastructure/scripts/backup-db.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/fiscalnext/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="fiscalnext_staging"
DB_USER="admin"

# Create backup
docker compose -f /opt/fiscalnext/infrastructure/docker/docker-compose.staging.yml \
  exec -T postgres pg_dump -U $DB_USER $DB_NAME | \
  gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$TIMESTAMP.sql.gz"
EOF

# Make executable
sudo chmod +x /opt/fiscalnext/infrastructure/scripts/backup-db.sh
```

### 2. Setup Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/fiscalnext/infrastructure/scripts/backup-db.sh >> /opt/fiscalnext/logs/backup.log 2>&1
```

### 3. Restore from Backup

```bash
# List backups
ls -lh /opt/fiscalnext/backups/

# Restore specific backup
gunzip < /opt/fiscalnext/backups/db_backup_20260223_020000.sql.gz | \
  docker compose -f infrastructure/docker/docker-compose.staging.yml \
  exec -T postgres psql -U admin fiscalnext_staging
```

---

## 🔍 Troubleshooting

### Check Service Status

```bash
# All containers
docker compose -f infrastructure/docker/docker-compose.staging.yml ps

# Specific service logs
docker compose logs api
docker compose logs postgres
docker compose logs nginx

# Follow logs in real-time
docker compose logs -f api
```

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker compose logs [service-name]

# Restart service
docker compose restart [service-name]

# Rebuild if code changed
docker compose up -d --build [service-name]
```

#### 2. Database Connection Errors

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U admin -d fiscalnext_staging

# Check environment variables
docker compose exec api env | grep DATABASE
```

#### 3. Nginx 502 Bad Gateway

```bash
# Check API is running
curl http://localhost:5000/health

# Check nginx config
docker compose exec nginx nginx -t

# Restart nginx
docker compose restart nginx
```

#### 4. Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker images/containers
docker system prune -a --volumes

# Check application logs size
du -sh /opt/fiscalnext/logs/*
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Database connections
docker compose exec postgres psql -U admin -d fiscalnext_staging \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Redis info
docker compose exec redis redis-cli INFO
```

---

## 🔄 Updates & Rollbacks

### Update Application

```bash
cd /opt/fiscalnext

# Pull latest code
git pull origin develop  # or main

# Rebuild and restart
docker compose -f infrastructure/docker/docker-compose.staging.yml up -d --build

# Run migrations
docker compose exec api npm run migrate:latest
```

### Rollback to Previous Version

```bash
# Check git history
git log --oneline

# Rollback to specific commit
git checkout [commit-hash]

# Rebuild
docker compose up -d --build

# Rollback migrations if needed
docker compose exec api npm run migrate:rollback
```

---

## 📞 Support

For issues or questions:
- **DevOps Team:** Max
- **Documentation:** /opt/fiscalnext/docs/
- **Logs:** /opt/fiscalnext/logs/

---

**Last Updated:** 2026-02-23
