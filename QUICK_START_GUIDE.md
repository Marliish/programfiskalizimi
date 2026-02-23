# 🚀 QUICK START GUIDE
## Start Building in 24 Hours

This is your **TL;DR** - Everything you need to start tomorrow.

---

## 📋 **DAY 1: SETUP (8 hours)**

### **Morning (9:00-12:00)**

#### 1. **Team Confirmation** (30 min)
- [ ] Confirm your core team:
  - CTO (or senior architect)
  - 1 Senior Backend Dev
  - 1 Senior Frontend Dev
  - 1 Designer (part-time OK)

#### 2. **Tools Setup** (1 hour)
- [ ] Create accounts:
  - GitHub Organization: `fiscalnext`
  - Slack/Discord workspace
  - Linear or Jira (project management)
  - Figma (design)
  - DigitalOcean or AWS (cloud)

#### 3. **Create Repositories** (30 min)
```bash
# On GitHub, create:
- fiscalnext-monorepo (main repo)
- fiscalnext-docs (documentation)
```

#### 4. **Local Development Setup** (1 hour)
```bash
# Install tools (Mac/Linux)
brew install node@20
brew install postgresql@15
brew install redis
brew install docker

# Or use Docker for everything
docker pull postgres:15
docker pull redis:7
```

### **Afternoon (13:00-17:00)**

#### 5. **Initialize Monorepo** (1 hour)
```bash
# Install Turborepo
npx create-turbo@latest fiscalnext-monorepo

cd fiscalnext-monorepo

# Project structure
mkdir -p apps/{web-admin,web-pos,api,mobile}
mkdir -p packages/{database,ui,types,utils}
mkdir -p infrastructure/{docker,kubernetes}
```

#### 6. **Setup Next.js Apps** (1 hour)
```bash
cd apps/web-admin
npx create-next-app@latest . --typescript --tailwind --app

cd ../web-pos
npx create-next-app@latest . --typescript --tailwind --app
```

#### 7. **Setup Backend** (1 hour)
```bash
cd apps/api
npm init -y
npm install fastify @fastify/jwt @fastify/cors prisma @prisma/client
npm install -D typescript @types/node tsx

# Initialize Prisma
npx prisma init
```

#### 8. **Docker Compose** (30 min)
Create `docker-compose.yml`:
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fiscalnext_dev
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  postgres_data:
```

Run it:
```bash
docker-compose up -d
```

#### 9. **First Commits** (30 min)
```bash
git init
git add .
git commit -m "feat: initial project setup"
git branch -M main
git remote add origin git@github.com:yourorg/fiscalnext-monorepo.git
git push -u origin main
```

---

## 📋 **DAY 2-7: SPRINT 1 - AUTH & BASIC UI**

### **Backend Tasks**

#### **Day 2-3: Database Schema**
```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  email     String
  createdAt DateTime @default(now())
  users     User[]
  products  Product[]
}

model User {
  id            String   @id @default(uuid())
  tenantId      String
  email         String   @unique
  passwordHash  String
  firstName     String?
  lastName      String?
  isActive      Boolean  @default(true)
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
  @@index([email])
}

model Product {
  id           String   @id @default(uuid())
  tenantId     String
  name         String
  sku          String?
  barcode      String?
  sellingPrice Decimal  @db.Decimal(10, 2)
  costPrice    Decimal? @db.Decimal(10, 2)
  taxRate      Decimal  @default(20.00) @db.Decimal(5, 2)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
  @@index([barcode])
}
```

Run migration:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### **Day 4-5: Auth API**
```typescript
// apps/api/src/routes/auth.ts
import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '@fiscalnext/database';

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password, firstName, lastName, tenantName } = request.body;
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantName.toLowerCase().replace(/\s/g, '-'),
        email
      }
    });
    
    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        firstName,
        lastName
      }
    });
    
    // Generate JWT
    const token = fastify.jwt.sign({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email
    });
    
    return { token, user: { id: user.id, email, firstName, lastName } };
  });
  
  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });
    
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    const token = fastify.jwt.sign({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email
    });
    
    return { token, user: { id: user.id, email: user.email } };
  });
  
  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const userId = request.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
    
    return { user };
  });
}
```

#### **Day 6-7: Products API**
```typescript
// apps/api/src/routes/products.ts
export async function productRoutes(fastify: FastifyInstance) {
  // List products
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const tenantId = request.user.tenantId;
    
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' }
    });
    
    return { products };
  });
  
  // Create product
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const tenantId = request.user.tenantId;
    const data = request.body;
    
    const product = await prisma.product.create({
      data: {
        tenantId,
        ...data
      }
    });
    
    return { product };
  });
  
  // Update product
  fastify.put('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const tenantId = request.user.tenantId;
    const data = request.body;
    
    const product = await prisma.product.update({
      where: { id, tenantId },
      data
    });
    
    return { product };
  });
}
```

### **Frontend Tasks**

#### **Day 2-3: Design System**
```typescript
// packages/ui/src/Button.tsx
import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  className = '',
  children,
  ...props 
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### **Day 4-5: Auth Pages**
```typescript
// apps/web-admin/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@fiscalnext/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await res.json();
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Login to FiscalNext</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
```

#### **Day 6-7: Dashboard**
```typescript
// apps/web-admin/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    }
    
    fetchUser();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">FiscalNext</h1>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">
          Welcome, {user?.firstName || user?.email}!
        </h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">Today's Sales</h3>
            <p className="text-3xl font-bold">€0.00</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">Transactions</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">Products</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## 🎯 **WEEK 1 SUCCESS CRITERIA**

By end of Week 1, you should have:

✅ **Infrastructure:**
- [x] GitHub repos created
- [x] Docker Compose running (Postgres, Redis)
- [x] Monorepo initialized

✅ **Backend:**
- [x] Fastify server running
- [x] Database connected
- [x] Auth endpoints working
- [x] JWT authentication

✅ **Frontend:**
- [x] Next.js apps running
- [x] Login page working
- [x] Dashboard page (basic)
- [x] Can register and login

✅ **Team:**
- [x] Daily standups scheduled
- [x] Slack/Discord active
- [x] Tasks in Linear/Jira

---

## 🚀 **RUNNING THE PROJECT**

### **Start Everything:**
```bash
# Terminal 1: Start Docker services
docker-compose up

# Terminal 2: Start API
cd apps/api
npm run dev

# Terminal 3: Start Web Admin
cd apps/web-admin
npm run dev

# Terminal 4: Start Web POS
cd apps/web-pos
npm run dev
```

### **Access:**
- Web Admin: http://localhost:3000
- Web POS: http://localhost:3001
- API: http://localhost:5000
- Postgres: localhost:5432
- Redis: localhost:6379

---

## 📚 **RESOURCES**

### **Documentation:**
- Next.js: https://nextjs.org/docs
- Fastify: https://www.fastify.io/docs/latest/
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs

### **Your Docs:**
- [Startup Plan](./STARTUP_PLAN.md) - Week-by-week plan
- [Architecture Blueprint](./ARCHITECTURE_BLUEPRINT.md) - Full technical details
- [Feature Specification](./FEATURE_SPECIFICATION.md) - What to build
- [Requirements Sheet](./REQUIREMENTS_SHEET.md) - Team & resources

---

## 💡 **TIPS**

### **Do:**
✅ Start simple, add complexity later
✅ Test early and often
✅ Commit frequently
✅ Document as you go
✅ Ask for help when stuck

### **Don't:**
❌ Try to build everything at once
❌ Skip testing
❌ Ignore code quality
❌ Work in isolation
❌ Forget to push your code

---

## 🆘 **COMMON ISSUES**

### **Docker won't start:**
```bash
# Check if ports are in use
lsof -i :5432  # Postgres
lsof -i :6379  # Redis

# Stop existing services
brew services stop postgresql
brew services stop redis
```

### **Prisma migration fails:**
```bash
# Reset database (DEV ONLY!)
npx prisma migrate reset

# Or manually
psql -U admin -h localhost fiscalnext_dev
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### **Module not found:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ **READY TO START?**

1. Read [STARTUP_PLAN.md](./STARTUP_PLAN.md) for the full 90-day roadmap
2. Read [ARCHITECTURE_BLUEPRINT.md](./ARCHITECTURE_BLUEPRINT.md) for technical details
3. Follow this guide to set up in 24 hours
4. Start building! 🚀

**Questions? Issues? Let me know and I'll help! 💪**
