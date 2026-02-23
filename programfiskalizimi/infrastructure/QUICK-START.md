# ⚡ FiscalNext - Quick Start Guide

**For Developers:** Get up and running in 5 minutes!

---

## 🚀 Start Development Environment

```bash
# Navigate to project
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo

# Start all services
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Wait for services to start (30 seconds)
# Check status
docker compose -f infrastructure/docker/docker-compose.dev.yml ps
```

**That's it!** 🎉

---

## 🌐 Access Your Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:5000 | - |
| **Web Admin** | http://localhost:3000 | - |
| **Web POS** | http://localhost:3001 | - |
| **pgAdmin** | http://localhost:5050 | admin@fiscalnext.com / admin123 |
| **RabbitMQ UI** | http://localhost:15672 | admin / admin123 |

---

## 📊 Database Connection

**From your IDE or database client:**

```
Host:     localhost
Port:     5432
Database: fiscalnext_dev
Username: admin
Password: admin123
```

**Connection String:**
```
postgresql://admin:admin123@localhost:5432/fiscalnext_dev?schema=public
```

---

## 🛠️ Common Commands

### View Logs
```bash
# All services
docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f

# Specific service
docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f api
```

### Restart a Service
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml restart api
```

### Stop Everything
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml down
```

### Stop and Remove Data (Fresh Start)
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml down -v
```

### Run Database Migrations
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml exec api npm run migrate:latest
```

### Access Container Shell
```bash
# API container
docker compose -f infrastructure/docker/docker-compose.dev.yml exec api sh

# Database console
docker compose -f infrastructure/docker/docker-compose.dev.yml exec postgres psql -U admin fiscalnext_dev

# Redis console
docker compose -f infrastructure/docker/docker-compose.dev.yml exec redis redis-cli
```

---

## 🧪 Running Tests

```bash
# Inside the monorepo
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run lint              # Linting
```

---

## 🔧 Troubleshooting

### Service Won't Start?
```bash
# Check what's running
docker compose ps

# Check logs for errors
docker compose logs [service-name]

# Restart the service
docker compose restart [service-name]
```

### Port Already in Use?
```bash
# Find what's using the port
lsof -i :5000  # Replace 5000 with your port

# Kill the process
kill -9 [PID]
```

### Database Connection Error?
```bash
# Make sure PostgreSQL is running
docker compose ps postgres

# Check if it's healthy
docker compose exec postgres pg_isready -U admin
```

### Need to Reset Everything?
```bash
# Nuclear option: stop and remove everything
docker compose down -v

# Start fresh
docker compose up -d
```

---

## 📝 File Locations

| What | Where |
|------|-------|
| **API Code** | `apps/api/src/` |
| **Web Admin** | `apps/web-admin/` |
| **Web POS** | `apps/web-pos/` |
| **Database Schemas** | `packages/database/` |
| **Shared Types** | `packages/types/` |
| **Environment Variables** | `.env` (copy from `.env.example`) |

---

## 🆘 Need Help?

1. Check the logs: `docker compose logs -f`
2. Read the full guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Check infrastructure docs: [README.md](./README.md)
4. Ask Max (DevOps Engineer)

---

## 🎯 Next Steps

1. ✅ Start services (you did this!)
2. 📝 Create your `.env` file (copy from `.env.example`)
3. 🗄️ Run database migrations
4. 💻 Start coding!
5. 🧪 Write tests
6. 🚀 Push to develop branch
7. ⚙️ CI/CD will handle the rest!

---

**Quick Commands Cheat Sheet:**

```bash
# Start
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Stop
docker compose -f infrastructure/docker/docker-compose.dev.yml down

# Logs
docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f api

# Restart
docker compose -f infrastructure/docker/docker-compose.dev.yml restart api

# Shell
docker compose -f infrastructure/docker/docker-compose.dev.yml exec api sh
```

---

**Happy Coding!** 🚀
