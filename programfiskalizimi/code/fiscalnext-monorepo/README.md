# FiscalNext Monorepo

Fiscalization Platform for Albania & Kosovo

## Structure

```
fiscalnext-monorepo/
├── apps/
│   ├── api/          → Backend API (Node.js + Fastify)
│   ├── web-admin/    → Admin Dashboard (Next.js)
│   ├── web-pos/      → POS Interface (Next.js)
│   └── mobile/       → Mobile App (React Native)
├── packages/
│   ├── database/     → Prisma schema & migrations
│   ├── ui/           → Shared UI components
│   ├── types/        → TypeScript types
│   └── utils/        → Shared utilities
└── infrastructure/
    ├── docker/       → Docker configs
    └── kubernetes/   → K8s manifests
```

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
cd packages/database
npm run db:migrate

# Start dev servers
npm run dev
```

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Fastify, Prisma
- **Database:** PostgreSQL 15, Redis 7
- **Deployment:** Docker, Kubernetes

## Created

2026-02-23 by FiscalNext Team
