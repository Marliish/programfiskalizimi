# 🏗️ FiscalNext Infrastructure

**Maintained by:** Max (DevOps Engineer)  
**Last Updated:** 2026-02-23

---

## 📁 Directory Structure

```
infrastructure/
├── docker/                          # Docker configurations
│   ├── docker-compose.dev.yml      # Development environment
│   ├── docker-compose.staging.yml  # Staging environment
│   ├── docker-compose.yml          # Original/base config
│   ├── Dockerfile.api              # API container
│   ├── Dockerfile.web              # Web apps container
│   ├── nginx/                      # Nginx configuration
│   │   └── nginx.conf              # Reverse proxy config
│   └── prometheus/                 # Monitoring configs
├── kubernetes/                      # K8s configs (future)
├── scripts/                         # Automation scripts
│   ├── setup-server.sh             # Server initialization
│   ├── backup-db.sh                # Database backup
│   └── health-check.sh             # Health monitoring
├── DEPLOYMENT_GUIDE.md             # Complete deployment guide
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Local Development

```bash
# Start all services
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# View logs
docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f

# Access services
# - API: http://localhost:5000
# - Web Admin: http://localhost:3000
# - Web POS: http://localhost:3001
# - pgAdmin: http://localhost:5050
# - RabbitMQ UI: http://localhost:15672

# Stop services
docker compose -f infrastructure/docker/docker-compose.dev.yml down
```

### Staging Deployment

```bash
# SSH to staging server
ssh deploy@staging.fiscalnext.com

# Navigate to app directory
cd /opt/fiscalnext

# Pull latest changes
git pull origin develop

# Deploy
docker compose -f infrastructure/docker/docker-compose.staging.yml up -d

# Check status
docker compose -f infrastructure/docker/docker-compose.staging.yml ps
```

---

## 🐳 Docker Compose Files

### `docker-compose.dev.yml`
**Purpose:** Local development  
**Features:**
- Hot-reload for backend and frontend
- Volume mounts for live code changes
- pgAdmin for database management
- Debug-level logging
- No SSL/HTTPS

**Services:**
- PostgreSQL
- Redis
- RabbitMQ
- API (Fastify)
- Web Admin (Next.js)
- Web POS (Next.js)
- pgAdmin

### `docker-compose.staging.yml`
**Purpose:** Staging/QA environment  
**Features:**
- Production Docker images
- Nginx reverse proxy with SSL
- Monitoring (Prometheus + Grafana)
- Resource limits
- Automated backups

**Services:**
- All dev services +
- Nginx (reverse proxy)
- Prometheus
- Grafana

---

## 🔧 Scripts

### `setup-server.sh`
Automates initial server setup.

**Usage:**
```bash
sudo bash infrastructure/scripts/setup-server.sh [domain] [email]
```

**What it does:**
- Updates system packages
- Creates deploy user
- Configures firewall
- Installs Docker
- Sets up directories
- Installs Certbot
- Configures security tools

### `backup-db.sh`
Backs up PostgreSQL database.

**Usage:**
```bash
./infrastructure/scripts/backup-db.sh
```

**Features:**
- Compressed SQL dumps
- 30-day retention
- Automated via cron

### `health-check.sh`
Monitors service health.

**Usage:**
```bash
./infrastructure/scripts/health-check.sh [staging|production]
```

**Checks:**
- Container status
- HTTP endpoints
- Database connections
- Resource usage

---

## 📊 Monitoring

### Access Dashboards

**Staging:**
- Grafana: https://monitoring.staging.fiscalnext.com
- Prometheus: https://prometheus.staging.fiscalnext.com
- RabbitMQ: https://rabbitmq.staging.fiscalnext.com

**Production:**
- Grafana: https://monitoring.fiscalnext.com
- Prometheus: https://prometheus.fiscalnext.com

### Metrics Collected

- **System:** CPU, RAM, Disk, Network
- **Docker:** Container stats, logs
- **PostgreSQL:** Connections, queries, size
- **Redis:** Memory, keys, hit rate
- **API:** Response times, error rates
- **Nginx:** Request rates, bandwidth

---

## 🔐 Security

### Implemented Measures

✅ **Docker Security:**
- Non-root containers
- Resource limits
- Read-only filesystems where possible
- Network isolation

✅ **Application Security:**
- Environment-based secrets
- Rate limiting
- CORS configuration
- Security headers (Helmet.js)

✅ **Infrastructure Security:**
- UFW firewall
- Fail2ban
- SSL/TLS encryption
- Automated security updates

✅ **Database Security:**
- Strong passwords
- Connection pooling
- Encrypted connections (prod)

---

## 🔄 CI/CD Pipelines

### GitLab CI/CD
File: `.gitlab-ci.yml`

**Stages:**
1. **Build** - Docker images
2. **Test** - Unit, integration, E2E
3. **Security** - SAST, dependency scan
4. **Deploy** - Staging/production
5. **Monitor** - Health checks

### GitHub Actions
File: `.github/workflows/ci-cd.yml`

**Workflow:**
- Triggered on push to main/develop
- Automated testing
- Security scanning
- Docker image building
- Deployment to environments

---

## 🌍 Environments

| Environment | URL | Branch | Auto-Deploy |
|-------------|-----|--------|-------------|
| Development | localhost | feature/* | No |
| Staging | staging.fiscalnext.com | develop | Manual |
| Production | fiscalnext.com | main | Manual |

### Environment Variables

See `.env.example` for all available variables.

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Authentication secret
- `CORS_ORIGIN` - Allowed origins

---

## 💾 Backups

### Automated Backups

**Database:**
- Schedule: Daily at 2 AM
- Retention: 30 days
- Location: `/opt/fiscalnext/backups`
- Format: Compressed SQL (gzip)

**Files/Uploads:**
- Should be stored in S3/object storage
- Not in Docker volumes

### Manual Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U admin fiscalnext_staging | \
  gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup volumes
docker run --rm \
  -v fiscalnext_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_volume.tar.gz /data
```

### Restore

```bash
# Restore database
gunzip < backup_20260223_020000.sql.gz | \
  docker compose exec -T postgres psql -U admin fiscalnext_staging
```

---

## 🔍 Troubleshooting

### Common Commands

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api

# Restart service
docker compose restart api

# Rebuild service
docker compose up -d --build api

# Shell into container
docker compose exec api sh

# Database console
docker compose exec postgres psql -U admin fiscalnext_dev

# Redis console
docker compose exec redis redis-cli

# Check resource usage
docker stats

# Prune unused resources
docker system prune -a --volumes
```

### Health Checks

```bash
# API health
curl http://localhost:5000/health

# Database connection test
docker compose exec api npm run db:test

# Redis ping
docker compose exec redis redis-cli ping
```

### Log Locations

- **Container logs:** `docker compose logs`
- **Nginx logs:** `infrastructure/docker/nginx/logs/`
- **Application logs:** `logs/` directory
- **System logs:** `/var/log/`

---

## 📝 Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check disk space
- Review backup status

**Weekly:**
- Review security updates
- Check monitoring alerts
- Performance analysis

**Monthly:**
- Update dependencies
- Security audit
- Backup testing

### Update Procedure

```bash
# 1. Pull latest code
git pull origin develop

# 2. Review changes
git log --oneline -10

# 3. Backup database
./infrastructure/scripts/backup-db.sh

# 4. Pull new images
docker compose pull

# 5. Restart with new images
docker compose up -d

# 6. Run migrations
docker compose exec api npm run migrate:latest

# 7. Health check
./infrastructure/scripts/health-check.sh staging
```

---

## 🆘 Emergency Procedures

### Rollback Deployment

```bash
# 1. Find previous commit
git log --oneline

# 2. Checkout previous version
git checkout [commit-hash]

# 3. Rebuild
docker compose up -d --build

# 4. Rollback migrations if needed
docker compose exec api npm run migrate:rollback
```

### Service Down

```bash
# 1. Check logs
docker compose logs [service]

# 2. Restart service
docker compose restart [service]

# 3. If still down, rebuild
docker compose up -d --build [service]
```

### Database Recovery

```bash
# 1. Stop application
docker compose stop api web-admin web-pos

# 2. Restore from backup
gunzip < backup.sql.gz | \
  docker compose exec -T postgres psql -U admin fiscalnext_staging

# 3. Start application
docker compose start api web-admin web-pos
```

---

## 📞 Support Contacts

- **DevOps Lead:** Max
- **Emergency:** [Contact Details]
- **Documentation:** `/infrastructure/DEPLOYMENT_GUIDE.md`

---

## 📚 Additional Resources

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Prometheus Docs](https://prometheus.io/docs/)

---

**Created:** 2026-02-23  
**Version:** 1.0
