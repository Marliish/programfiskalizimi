# 🧾 FiscalNext Platform

> Modern fiscalization platform for businesses in Albania and Kosovo

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

---

## 📋 Overview

FiscalNext is a comprehensive point-of-sale and fiscalization platform designed for businesses operating in Albania and Kosovo. It handles:

- 🏪 **Point of Sale (POS)** - Fast, intuitive sales interface
- 📊 **Inventory Management** - Real-time stock tracking
- 🧾 **Fiscal Integration** - Automatic tax authority compliance
- 📈 **Analytics & Reporting** - Business insights
- 👥 **Multi-tenant** - Serve multiple businesses from one platform
- 📱 **Mobile Apps** - iOS & Android support

---

## 🏗️ Architecture

### Technology Stack

- **Frontend:** Next.js 14 + React + TypeScript
- **Backend:** Node.js + Fastify + TypeScript
- **Database:** PostgreSQL 15+ with Prisma ORM
- **Cache:** Redis 7+
- **Queue:** RabbitMQ 3.13+
- **Mobile:** React Native + Expo

### Project Structure

```
fiscalnext/
├── apps/
│   ├── web-admin/        # Admin Dashboard (Next.js)
│   ├── web-pos/          # POS Interface (Next.js)
│   ├── api/              # Backend API (Fastify)
│   └── mobile/           # Mobile App (React Native)
├── packages/
│   ├── database/         # Prisma schema & migrations
│   ├── types/            # Shared TypeScript types
│   ├── ui/               # Shared UI components
│   └── utils/            # Shared utilities
├── infrastructure/
│   ├── docker/           # Docker configurations
│   └── kubernetes/       # K8s manifests
└── docs/                 # Documentation
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/fiscalnext/fiscalnext.git
cd fiscalnext

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL, Redis, RabbitMQ with Docker
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development servers
npm run dev
```

This will start:
- 🌐 Admin Dashboard: http://localhost:3000
- 🛒 POS Interface: http://localhost:3001
- 🔌 API Server: http://localhost:5000
- 📱 Mobile App: Expo DevTools

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start all dev servers
npm run dev:admin        # Start admin dashboard only
npm run dev:pos          # Start POS interface only
npm run dev:api          # Start API server only
npm run dev:mobile       # Start mobile app

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Create and apply migration
npm run db:push          # Push schema changes (dev only)
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with test data

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests

# Build
npm run build            # Build all apps for production
npm run build:admin      # Build admin dashboard
npm run build:pos        # Build POS interface
npm run build:api        # Build API server
npm run build:mobile     # Build mobile app

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run typecheck        # Run TypeScript type checking
```

---

## 🗄️ Database Schema

Key entities:
- **Tenants** - Multi-tenant business accounts
- **Users** - Platform users with role-based access control
- **Products** - Inventory items with variants
- **Transactions** - Sales and POS transactions
- **FiscalReceipts** - Tax authority submissions (Albania & Kosovo)
- **Inventory** - Stock tracking and movements

See [Database Documentation](packages/database/README.md) for full schema.

---

## 🔐 Authentication & Authorization

- **Authentication:** JWT tokens (access + refresh)
- **Authorization:** Role-based access control (RBAC)
- **Multi-tenancy:** Row-level security via `tenantId`

**Default Roles:**
- `owner` - Full access to business
- `manager` - Manage products, users, reports
- `cashier` - POS operations only
- `accountant` - Read-only, reports access

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Testing Stack:**
- **Unit:** Jest
- **Integration:** Supertest
- **E2E:** Playwright
- **Load:** k6

---

## 📚 Documentation

- [Architecture Blueprint](docs/ARCHITECTURE_BLUEPRINT.md) - Complete system architecture
- [Technology Decisions](docs/TECHNOLOGY_DECISIONS.md) - Why we chose our tech stack
- [API Documentation](docs/API.md) - REST API reference
- [Database Schema](packages/database/README.md) - Database design
- [Deployment Guide](docs/DEPLOYMENT.md) - How to deploy
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

---

## 🚢 Deployment

### Development
```bash
docker-compose up
```

### Staging
```bash
# Build and deploy to staging
npm run deploy:staging
```

### Production
```bash
# Build production images
npm run build

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/
```

See [Deployment Documentation](docs/DEPLOYMENT.md) for details.

---

## 🛣️ Roadmap

### Phase 1 (Current) - MVP
- [x] Project setup
- [x] Database schema design
- [ ] Authentication & user management
- [ ] Basic POS functionality
- [ ] Albania fiscal integration
- [ ] Inventory management

### Phase 2 - Enhanced Features
- [ ] Kosovo fiscal integration
- [ ] Advanced reporting
- [ ] Mobile apps (iOS & Android)
- [ ] Customer loyalty program
- [ ] Multi-location support

### Phase 3 - Scale
- [ ] E-commerce integration
- [ ] Advanced analytics with AI
- [ ] Third-party integrations
- [ ] API for external developers

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

**Development Workflow:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Commit Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build/config changes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Alex** - CTO & Lead Architect
- **Jamie** - Product Manager
- **Morgan** - Lead Developer

---

## 📞 Support

- **Email:** support@fiscalnext.com
- **Documentation:** https://docs.fiscalnext.com
- **Issues:** https://github.com/fiscalnext/fiscalnext/issues

---

## 🙏 Acknowledgments

Built with ❤️ for businesses in Albania and Kosovo.

**Technologies Used:**
- [Next.js](https://nextjs.org/)
- [Fastify](https://www.fastify.io/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Made with 🧾 by FiscalNext Team**
