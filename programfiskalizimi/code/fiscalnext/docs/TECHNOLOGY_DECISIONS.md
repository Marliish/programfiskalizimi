# 🛠️ Technology Decisions - FiscalNext Platform

**Document Owner:** Alex (CTO)  
**Last Updated:** 2026-02-23  
**Status:** FINAL - Approved for Implementation

---

## 📋 Executive Summary

This document outlines all technology choices for the FiscalNext fiscalization platform, including rationale, alternatives considered, and trade-offs.

**Core Philosophy:**
- ✅ **TypeScript Everywhere** - Type safety across the stack
- ✅ **Modern & Battle-Tested** - Latest stable versions of proven technologies
- ✅ **Developer Experience** - Fast iteration, good tooling, easy hiring
- ✅ **Performance First** - Optimized for speed and scalability
- ✅ **Cost-Effective** - Start lean, scale as needed

---

## 🎯 Technology Stack Overview

| Layer | Technology | Version | Why? |
|-------|-----------|---------|------|
| **Frontend** | Next.js | 14+ | SSR, file-based routing, image optimization |
| **Backend** | Node.js + Fastify | 20 LTS + 5.x | Fastest Node framework, great TypeScript support |
| **Database** | PostgreSQL | 15+ | ACID compliance, critical for financial data |
| **ORM** | Prisma | 5.x | Type-safe, excellent DX, auto-migrations |
| **Cache** | Redis | 7+ | Session storage, rate limiting, pub/sub |
| **Queue** | RabbitMQ | 3.13+ | Reliable message delivery, fiscal queue |
| **Mobile** | React Native + Expo | Latest | One codebase for iOS + Android |
| **Language** | TypeScript | 5.3+ | Type safety, better IDE support |

---

## 🔍 Detailed Technology Decisions

### 1. Frontend: Next.js 14+

**Decision:** Use Next.js with App Router for all web applications (Admin, POS, Customer Portal)

**Why Next.js?**
- ✅ **Server-Side Rendering (SSR)** - Fast initial page load, SEO-friendly
- ✅ **React Ecosystem** - Massive library ecosystem, easy to hire React developers
- ✅ **File-Based Routing** - Intuitive project structure
- ✅ **API Routes** - Backend-for-Frontend (BFF) pattern built-in
- ✅ **Image Optimization** - Automatic image optimization and lazy loading
- ✅ **TypeScript Support** - First-class TypeScript integration
- ✅ **Deployment** - Vercel makes deployment trivial (though we'll self-host)

**Alternatives Considered:**
- ❌ **Vue/Nuxt** - Smaller talent pool in Albania/Kosovo
- ❌ **Angular** - Too heavy, steeper learning curve, slower development
- ❌ **Svelte/SvelteKit** - Too new, risky for production, smaller ecosystem

**Trade-offs:**
- ⚠️ **Bundle Size** - React apps can be large (mitigated by code splitting)
- ⚠️ **Learning Curve** - App Router is new (but well documented)

**Commitment Level:** ✅ FINAL DECISION

---

### 2. Backend: Node.js + Fastify

**Decision:** Use Fastify as our API framework instead of Express or alternatives

**Why Fastify?**
- ✅ **Performance** - 2x faster than Express in benchmarks
- ✅ **TypeScript** - Excellent TypeScript support out of the box
- ✅ **Schema Validation** - Built-in JSON schema validation (vs Express needs middleware)
- ✅ **Async/Await** - Built for async by default
- ✅ **Plugin System** - Clean, modular architecture
- ✅ **Active Development** - Regular updates, great community

**Why Node.js?**
- ✅ **JavaScript Everywhere** - Same language as frontend reduces context switching
- ✅ **Async I/O** - Perfect for I/O-heavy operations (DB queries, API calls)
- ✅ **Ecosystem** - npm has packages for everything
- ✅ **Hiring** - Easy to find JavaScript/TypeScript developers

**Alternatives Considered:**
- ❌ **Go** - Faster, but harder to hire, longer development time, different language
- ❌ **Python/FastAPI** - Slower than Node.js, less synergy with frontend
- ❌ **PHP/Laravel** - Dated technology, not modern
- ❌ **Express.js** - Slower than Fastify, less TypeScript support

**Performance Benchmark:**
```
Fastify:  ~45,000 req/sec
Express:  ~22,000 req/sec
Koa:      ~28,000 req/sec
Hapi:     ~18,000 req/sec
```

**Trade-offs:**
- ⚠️ **Single-threaded** - Need to handle CPU-intensive tasks carefully (use worker threads)
- ⚠️ **Memory** - Can use more memory than compiled languages

**Commitment Level:** ✅ FINAL DECISION

---

### 3. Database: PostgreSQL 15+

**Decision:** Use PostgreSQL as the primary database

**Why PostgreSQL?**
- ✅ **ACID Compliance** - Critical for financial transactions, prevents data corruption
- ✅ **Transactions & Locks** - Prevent race conditions in inventory/sales
- ✅ **JSON Support** - Flexible data when needed (fiscal API responses)
- ✅ **Full-Text Search** - Built-in search capabilities
- ✅ **Mature & Stable** - 30+ years of development
- ✅ **Performance** - Excellent with proper indexes
- ✅ **Row-Level Security** - Perfect for multi-tenancy
- ✅ **Extensions** - PostGIS, pg_cron, etc.

**Critical for Fiscalization:**
```sql
-- Example: Atomic transaction to prevent double-spending
BEGIN;
  UPDATE stock SET quantity = quantity - 5 WHERE product_id = 'X' AND quantity >= 5;
  INSERT INTO transactions (...) VALUES (...);
  INSERT INTO fiscal_receipts (...) VALUES (...);
COMMIT; -- All or nothing
```

**Alternatives Considered:**
- ❌ **MySQL** - Less advanced features, weaker JSON support, less strict
- ❌ **MongoDB** - NO ACID guarantees = dangerous for financial data
- ❌ **SQLite** - Not suitable for multi-user, no network access

**Trade-offs:**
- ⚠️ **Complexity** - More complex than NoSQL (but necessary complexity)
- ⚠️ **Schema Changes** - Requires migrations (but Prisma makes this easy)

**Commitment Level:** ✅ FINAL DECISION - Non-negotiable for financial data

---

### 4. ORM: Prisma

**Decision:** Use Prisma as our database ORM/query builder

**Why Prisma?**
- ✅ **Type Safety** - Auto-generated TypeScript types from schema
- ✅ **Developer Experience** - Best-in-class DX, great error messages
- ✅ **Migrations** - Easy database schema evolution
- ✅ **Query Builder** - Intuitive, prevents SQL injection
- ✅ **Performance** - Generates optimized SQL queries
- ✅ **Prisma Studio** - Beautiful database GUI
- ✅ **Multi-Database** - Can switch databases if needed

**Example:**
```typescript
// Type-safe queries
const products = await prisma.product.findMany({
  where: { 
    tenantId: 'abc',
    isActive: true 
  },
  include: { 
    category: true,
    stock: true 
  }
});
// products has full TypeScript typing!
```

**Alternatives Considered:**
- ❌ **TypeORM** - Less type-safe, more boilerplate, decorators can be confusing
- ❌ **Sequelize** - Outdated, slow, poor TypeScript support
- ❌ **Knex.js** - Too low-level, more code, manual types

**Trade-offs:**
- ⚠️ **Bundle Size** - Prisma Client adds ~2MB (acceptable)
- ⚠️ **Learning Curve** - Different from traditional ORMs (but easier once learned)

**Commitment Level:** ✅ FINAL DECISION

---

### 5. Cache: Redis 7+

**Decision:** Use Redis for caching, sessions, and rate limiting

**Why Redis?**
- ✅ **Speed** - In-memory, microsecond latency
- ✅ **Versatile** - Cache, sessions, pub/sub, queues, rate limiting
- ✅ **Data Structures** - Strings, hashes, sets, sorted sets, streams
- ✅ **Persistence** - Can save to disk (RDB + AOF)
- ✅ **Clustering** - Easy horizontal scaling

**Use Cases:**
```typescript
// 1. Session Storage
await redis.set(`session:${userId}`, JSON.stringify(session), 'EX', 900);

// 2. Cache Product Catalog
await redis.set(`products:${tenantId}`, JSON.stringify(products), 'EX', 3600);

// 3. Rate Limiting
const count = await redis.incr(`rate:${userId}:${endpoint}`);
if (count === 1) await redis.expire(`rate:${userId}:${endpoint}`, 60);
if (count > 100) throw new Error('Rate limit exceeded');

// 4. Real-time Dashboard Stats
await redis.hset(`stats:${tenantId}:today`, 'total_sales', 12500);
```

**Alternatives Considered:**
- ❌ **Memcached** - Less features, no persistence, no data structures
- ❌ **In-memory (Map)** - Doesn't scale across instances

**Commitment Level:** ✅ FINAL DECISION

---

### 6. Message Queue: RabbitMQ

**Decision:** Use RabbitMQ for asynchronous job processing

**Why RabbitMQ?**
- ✅ **Reliability** - Guaranteed message delivery
- ✅ **Flexible Routing** - Topic exchanges, dead letter queues
- ✅ **Management UI** - Built-in web interface
- ✅ **Battle-Tested** - Used by banks, e-commerce giants
- ✅ **Multiple Consumers** - Easy to scale workers

**Use Cases:**
```typescript
// 1. Fiscal Receipt Submission (retry on failure)
await queue.publish('fiscal-queue', {
  transactionId: 'xyz',
  tenantId: 'abc',
  country: 'AL'
});

// 2. Email Notifications
await queue.publish('email-queue', {
  to: 'user@example.com',
  subject: 'Receipt',
  template: 'receipt',
  data: {...}
});

// 3. Report Generation
await queue.publish('reports-queue', {
  type: 'sales',
  tenantId: 'abc',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31'
});
```

**Alternatives Considered:**
- ❌ **Kafka** - Overkill for our scale, complex setup, high resource usage
- ❌ **Redis Pub/Sub** - Less reliable, no built-in persistence
- ❌ **SQS** - AWS lock-in, costs can scale up

**Trade-offs:**
- ⚠️ **Resource Usage** - Needs dedicated server/container
- ⚠️ **Complexity** - More moving parts

**Commitment Level:** ✅ FINAL DECISION

---

### 7. Mobile: React Native + Expo

**Decision:** Use React Native with Expo for mobile apps

**Why React Native + Expo?**
- ✅ **One Codebase** - iOS + Android from single codebase (~95% shared)
- ✅ **React Knowledge** - Same as web, team can work on both
- ✅ **Expo** - Simplifies build, deployment, OTA updates
- ✅ **Performance** - Native components, smooth 60fps
- ✅ **Ecosystem** - Huge library ecosystem
- ✅ **Hot Reload** - Fast development iteration

**Alternatives Considered:**
- ❌ **Flutter** - Different language (Dart), separate team needed, less JS synergy
- ❌ **Native (Swift/Kotlin)** - 2x development time, 2x maintenance cost
- ❌ **Ionic** - WebView-based, worse performance

**Trade-offs:**
- ⚠️ **App Size** - Slightly larger than native
- ⚠️ **Complex Animations** - May need native modules for complex UI

**Commitment Level:** ✅ FINAL DECISION

---

## 🏗️ Architecture Patterns

### 1. Microservices Architecture

**Decision:** Modular microservices (Auth, POS, Fiscal, Inventory, etc.)

**Why?**
- ✅ **Scalability** - Scale services independently
- ✅ **Team Autonomy** - Teams can work on different services
- ✅ **Fault Isolation** - One service down doesn't kill everything
- ✅ **Technology Flexibility** - Can use different tech per service if needed

**Trade-offs:**
- ⚠️ **Complexity** - More services to manage
- ⚠️ **DevOps** - Need proper orchestration (Docker/K8s)

---

### 2. Multi-Tenancy: Row-Level Security

**Decision:** Single database with `tenantId` in every table

**Why?**
- ✅ **Cost-Effective** - One database, lower infrastructure cost
- ✅ **Easy Backups** - Single backup process
- ✅ **Easier Maintenance** - One schema to manage

**How?**
```typescript
// Prisma middleware auto-filters by tenant
prisma.$use(async (params, next) => {
  const tenantId = getCurrentTenantId(); // from JWT
  if (params.model && params.action === 'findMany') {
    params.args.where = { ...params.args.where, tenantId };
  }
  return next(params);
});
```

**Alternative:** Database per tenant (too expensive, harder to maintain)

---

### 3. Authentication: JWT + Refresh Tokens

**Decision:** JWT for access tokens, HTTP-only cookies for refresh tokens

**Flow:**
```
1. User logs in → Get access token (15 min) + refresh token (30 days)
2. Store access token in memory (NOT localStorage!)
3. Store refresh token in HTTP-only cookie (secure)
4. Access token expires → Use refresh token to get new access token
5. Refresh token expires → User must log in again
```

**Why?**
- ✅ **Stateless** - No session storage needed
- ✅ **Scalable** - No shared session state
- ✅ **Secure** - HTTP-only cookies prevent XSS attacks

---

## 📊 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| API Response | < 200ms | Redis cache, optimized queries, indexes |
| Page Load | < 3s | SSR, code splitting, CDN |
| Transaction Processing | < 2s | Async fiscal submission |
| Concurrent Users | 1000+ | Horizontal scaling |
| Database Queries | < 50ms | Proper indexes |
| Uptime | 99.9% | Redundancy, auto-recovery |

---

## 🔐 Security Decisions

### 1. Passwords: bcrypt
- Cost factor: 12 (balance between security and performance)
- Alternative considered: Argon2 (more secure but slower)

### 2. Data Encryption
- **At Rest:** PostgreSQL encryption (LUKS/dm-crypt)
- **In Transit:** TLS 1.3 (HTTPS everywhere)
- **Sensitive Fields:** AES-256-GCM

### 3. Rate Limiting
- Global: 100 req/min per user
- Login: 5 attempts per 5 minutes
- Implemented in Redis

### 4. Input Validation
- All inputs validated with Zod schemas
- SQL injection prevented by Prisma (parameterized queries)
- XSS prevented by React (automatic escaping)

---

## ☁️ Infrastructure Decisions

### Development
- **Local:** Docker Compose (PostgreSQL, Redis, RabbitMQ)
- **IDEs:** VS Code recommended with ESLint + Prettier

### Staging
- **Provider:** DigitalOcean Droplet (4GB RAM, 2 vCPU)
- **Domain:** staging.fiscalnext.com
- **SSL:** Let's Encrypt (free)

### Production (Phase 1)
- **Provider:** DigitalOcean or AWS
- **Setup:** 2x App Servers (8GB each), Managed PostgreSQL, Redis, RabbitMQ
- **Cost:** €300-500/month
- **CDN:** Cloudflare (free tier)

### Production (Phase 2 - Scale)
- **Setup:** Kubernetes cluster when we reach 100+ customers
- **Cost:** €800-1,500/month

---

## 🧪 Testing Strategy

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit Tests | Jest | 80%+ |
| Integration Tests | Supertest | Critical paths |
| E2E Tests | Playwright | User flows |
| Load Tests | k6 | 1000 concurrent users |
| Manual QA | Team | Edge cases |

---

## 📝 Code Quality Tools

- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript strict mode
- **Git Hooks:** Husky (pre-commit checks)
- **CI/CD:** GitHub Actions

---

## 🎯 Non-Negotiables

These decisions are **FINAL** and should NOT be changed without CTO approval:

1. ✅ **PostgreSQL** - Financial data requires ACID compliance
2. ✅ **TypeScript** - Type safety is mandatory
3. ✅ **Prisma** - Our ORM choice
4. ✅ **JWT Authentication** - Our auth strategy
5. ✅ **Multi-tenancy via tenantId** - Our data isolation model

---

## 🔄 Open for Discussion

These can be revisited if needed:

- Frontend state management (currently: React Context, can switch to Zustand/Redux)
- Error tracking service (currently: Sentry, can evaluate alternatives)
- CI/CD platform (currently: GitHub Actions, can switch if needed)

---

## 📅 Technology Review Cadence

- **Quarterly:** Review dependency updates
- **Bi-annually:** Evaluate new technologies
- **Annually:** Major architecture review

---

## ✅ Approval

**CTO Signature:** Alex  
**Date:** 2026-02-23  
**Status:** ✅ APPROVED FOR IMPLEMENTATION

---

**Questions?** Contact Alex (CTO) or refer to `ARCHITECTURE_BLUEPRINT.md` for detailed implementation.
