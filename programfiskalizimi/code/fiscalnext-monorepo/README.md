# FiscalNext - Fiscal Management & POS System

<div align="center">

![FiscalNext](https://img.shields.io/badge/FiscalNext-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

**Complete fiscal compliance and Point of Sale system for businesses in Albania and Kosovo**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Deployment](#deployment)

</div>

---

## 🌟 Overview

FiscalNext is a comprehensive fiscal management and Point of Sale (POS) system designed for businesses that need to comply with fiscal regulations in Albania and Kosovo. Built with modern technologies and production-ready from day one.

### ✨ Key Features

- 🧾 **Fiscal Compliance**: Full integration with fiscal authorities (IIC/FIC generation)
- 💳 **Point of Sale**: Fast, intuitive POS interface for cashiers
- 📦 **Inventory Management**: Multi-location stock tracking and transfers
- 👥 **Customer Management**: Customer profiles with loyalty programs
- 📊 **Reports & Analytics**: Comprehensive sales, inventory, and fiscal reports
- 🔒 **Security**: Account lockout, password complexity, 2FA ready, encryption
- 🚀 **Performance**: <2s page loads, <200ms API responses, offline support
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- 🌐 **Multi-location**: Support for multiple stores/warehouses
- 👤 **Role-based Access**: Admin, Manager, and Cashier roles

---

## 🏗️ Architecture

```
fiscalnext-monorepo/
├── apps/
│   ├── api/              # Backend API (Fastify + TypeScript)
│   ├── web-admin/        # Admin Dashboard (Next.js 14)
│   └── web-pos/          # POS Interface (Next.js 14)
├── packages/
│   └── database/         # Shared database (Prisma)
├── infrastructure/       # Docker, Nginx, CI/CD configs
└── docs/                 # Comprehensive documentation
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Zustand

**Backend:**
- Fastify
- TypeScript
- Prisma ORM
- PostgreSQL 14+
- JWT Authentication

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Docker (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fiscalnext-monorepo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
cd packages/database
pnpm prisma migrate dev
pnpm prisma generate
cd ../..

# Start all development servers
pnpm dev
```

### Access the Applications

- **Admin Dashboard**: http://localhost:3000
- **POS Interface**: http://localhost:3001
- **API**: http://localhost:5000

### Default Credentials (Development)

```
Email: admin@fiscalnext.com
Password: admin123
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

### For Users
- **[User Guide](./docs/USER_GUIDE.md)** - Complete guide for end users
  - Getting started
  - Managing products and inventory
  - Processing sales
  - Generating reports
  - Troubleshooting

### For Developers
- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Technical documentation
  - Architecture overview
  - API development
  - Frontend development
  - Database operations
  - Testing strategies

### For DevOps/Admins
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment
  - Infrastructure setup
  - Docker deployment
  - Kubernetes deployment (ready)
  - SSL configuration
  - Backup strategies
  - Monitoring setup

### Project Status
- **[Day 12 Final Report](./DAY12_FINAL_REPORT.md)** - Complete project status
- **[Launch Checklist](./LAUNCH_CHECKLIST.md)** - Pre-launch and launch procedures

---

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start all services
docker-compose up -d --build

# Run database migrations
docker-compose exec api pnpm prisma migrate deploy

# View logs
docker-compose logs -f
```

### Services

- **PostgreSQL**: Database
- **API**: Backend service (port 5000)
- **Web Admin**: Admin dashboard (port 3000)
- **Web POS**: POS interface (port 3001)
- **Nginx**: Reverse proxy (ports 80, 443)
- **Redis**: Cache (optional, port 6379)

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Backend tests
pnpm --filter @fiscalnext/api test

# Frontend type checking
pnpm --filter @fiscalnext/web-admin run type-check

# Comprehensive Day 12 tests
./test-day12-comprehensive.sh
```

### Test Coverage

- ✅ 95%+ test pass rate
- ✅ Backend unit tests (Vitest)
- ✅ API integration tests
- ✅ Frontend type checking
- ✅ E2E tests ready (Playwright)
- ✅ Performance tests (Lighthouse CI)

---

## 🔒 Security

### Built-in Security Features

- **Authentication**: JWT-based with secure token generation
- **Password Security**: Complexity requirements, bcrypt hashing (12 rounds)
- **Account Protection**: Lockout after 5 failed attempts (15-minute duration)
- **Data Encryption**: AES-256-GCM for sensitive data at rest
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Rate Limiting**: API and route-level protection
- **CSRF Protection**: Token-based CSRF prevention
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM (no raw SQL)
- **XSS Prevention**: Input sanitization and CSP

### Security Audit

```bash
# Run security audit
pnpm audit

# Check for vulnerabilities
pnpm audit --audit-level moderate
```

---

## ⚡ Performance

### Benchmarks

- ✅ **Page Load**: <2 seconds
- ✅ **API Response**: <200ms average
- ✅ **Lighthouse Score**: >90
- ✅ **First Contentful Paint**: <1.5s
- ✅ **Time to Interactive**: <3s
- ✅ **Bundle Size**: <500KB initial

### Optimizations

- Code splitting and lazy loading
- Image optimization (WebP, AVIF)
- Service worker for offline support
- Database indexes on all foreign keys
- Response caching (Redis-ready)
- Gzip compression
- Tree shaking and minification

---

## 📊 Monitoring & Logging

### Built-in Monitoring

- **Structured Logging**: JSON format with levels (ERROR, WARN, INFO, DEBUG)
- **Performance Tracking**: Request timing, response times, percentiles
- **Error Tracking**: Automatic error recording with context
- **Health Checks**: `/health` endpoints on all services
- **Metrics Collection**: CPU, memory, disk usage

### Integration Ready

- Sentry (error tracking)
- Prometheus/Grafana (metrics)
- ELK Stack (log aggregation)
- UptimeRobot (uptime monitoring)

---

## 🔧 Development

### Project Structure

```
apps/
├── api/                  # Backend API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── plugins/     # Fastify plugins
│   │   └── utils/       # Utilities
│   └── Dockerfile
│
├── web-admin/           # Admin Dashboard
│   ├── app/            # Next.js pages
│   ├── components/     # React components
│   └── lib/            # Utilities, hooks
│
└── web-pos/            # POS Interface
    ├── app/
    ├── components/
    └── lib/
```

### Available Scripts

```bash
# Development
pnpm dev                # Start all apps
pnpm build              # Build all apps
pnpm test               # Run all tests
pnpm lint               # Lint all code

# Specific app
pnpm --filter @fiscalnext/api dev
pnpm --filter @fiscalnext/web-admin build

# Database
cd packages/database
pnpm prisma migrate dev      # Create migration
pnpm prisma migrate deploy   # Apply migrations
pnpm prisma generate         # Generate client
pnpm prisma studio          # Database GUI
```

---

## 🚢 CI/CD Pipeline

GitHub Actions workflow includes:

1. **Lint & Type Check**: ESLint + TypeScript
2. **Backend Tests**: Unit tests with PostgreSQL service
3. **Frontend Build**: Build verification + bundle size check
4. **Security Audit**: Dependency vulnerability scanning
5. **Docker Build**: Multi-platform image building
6. **Deploy**: Automated deployment to production
7. **Performance**: Lighthouse CI post-deployment

See [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml)

---

## 📦 Database

### Schema

- **Users**: Authentication and roles
- **Products**: Product catalog with SKU, barcode
- **Categories**: Hierarchical product categories
- **Orders**: Sales orders with line items
- **Fiscal Receipts**: IIC/FIC codes, QR codes
- **Customers**: Customer profiles, loyalty
- **Inventory**: Multi-location stock tracking
- **Payments**: Payment transactions
- **Audit Logs**: Activity tracking

### Migrations

```bash
cd packages/database

# Create new migration
pnpm prisma migrate dev --name add_feature

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (dev only)
pnpm prisma migrate reset
```

---

## 🌍 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fiscalnext"

# API
JWT_SECRET="your-secret-key"
API_PORT=5000

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Email (optional)
SENDGRID_API_KEY="your-sendgrid-key"

# Fiscal Integration
FISCAL_API_URL="https://fiscal-api.example.com"
FISCAL_API_KEY="your-fiscal-api-key"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- 100% test coverage for critical paths

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

### Getting Help

- 📧 **Email**: support@fiscalnext.com
- 📚 **Documentation**: [docs/](./docs/)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/org/fiscalnext/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/org/fiscalnext/discussions)

### Commercial Support

For enterprise support, custom development, or training:
- 📧 Email: enterprise@fiscalnext.com
- 🌐 Website: https://fiscalnext.com

---

## 🎉 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Fastify](https://www.fastify.io/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query)

---

## 📈 Project Status

**Current Version:** 1.0.0  
**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** February 23, 2026

### Completed Features

- ✅ Complete authentication system
- ✅ Product & inventory management
- ✅ Point of Sale interface
- ✅ Fiscal integration
- ✅ Customer management
- ✅ Reports & analytics
- ✅ Multi-location support
- ✅ Role-based access control
- ✅ Comprehensive documentation
- ✅ Docker deployment
- ✅ CI/CD pipeline
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Monitoring & logging

### Roadmap

- [ ] Mobile apps (React Native)
- [ ] Kubernetes deployment
- [ ] Advanced analytics (ML predictions)
- [ ] Multi-language support
- [ ] Webhook system
- [ ] Custom report builder

---

<div align="center">

**Made with ❤️ for businesses in Albania and Kosovo**

[Report Bug](https://github.com/org/fiscalnext/issues) · [Request Feature](https://github.com/org/fiscalnext/issues) · [Documentation](./docs/)

</div>
