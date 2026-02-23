# FiscalNext Developer Guide

## Architecture Overview

FiscalNext is a monorepo-based application using:

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Backend**: Fastify with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Package Manager**: pnpm
- **Build Tool**: Turbo

## Project Structure

```
fiscalnext-monorepo/
├── apps/
│   ├── api/              # Backend API (Fastify)
│   ├── web-admin/        # Admin dashboard (Next.js)
│   └── web-pos/          # POS interface (Next.js)
├── packages/
│   └── database/         # Prisma schema & migrations
├── infrastructure/       # Docker, K8s configs
└── docs/                 # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Git

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

# Start development servers
cd ../..
pnpm dev
```

### Environment Variables

Required environment variables:

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

## Development Workflow

### Running the Stack

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @fiscalnext/api dev
pnpm --filter @fiscalnext/web-admin dev
pnpm --filter @fiscalnext/web-pos dev

# Build all apps
pnpm build

# Run tests
pnpm test
```

### Database Migrations

```bash
# Create a new migration
cd packages/database
pnpm prisma migrate dev --name description_of_changes

# Apply migrations
pnpm prisma migrate deploy

# Reset database (dev only)
pnpm prisma migrate reset

# Generate Prisma client
pnpm prisma generate
```

## Backend API (apps/api)

### Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT
- **Testing**: Vitest

### Project Structure

```
apps/api/src/
├── routes/           # API route handlers
├── plugins/          # Fastify plugins
├── utils/            # Utilities (logger, security, etc.)
├── types/            # TypeScript types
└── server.ts         # Entry point
```

### Creating a New Endpoint

```typescript
// apps/api/src/routes/example.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const ExampleSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export default async function exampleRoutes(fastify: FastifyInstance) {
  // GET endpoint
  fastify.get('/examples', async (request, reply) => {
    const examples = await fastify.prisma.example.findMany();
    return { examples };
  });

  // POST endpoint with validation
  fastify.post('/examples', async (request, reply) => {
    const data = ExampleSchema.parse(request.body);
    
    const example = await fastify.prisma.example.create({
      data,
    });
    
    return { example };
  });

  // Protected route (requires authentication)
  fastify.get('/examples/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const example = await fastify.prisma.example.findUnique({
      where: { id },
    });
    
    if (!example) {
      return reply.code(404).send({ error: 'Not found' });
    }
    
    return { example };
  });
}
```

### Authentication

JWT-based authentication:

```typescript
// Authenticate middleware
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// Usage in routes
fastify.get('/protected', {
  onRequest: [fastify.authenticate],
}, async (request, reply) => {
  const user = request.user; // User from JWT
  // ...
});
```

### Error Handling

```typescript
// Custom error class
class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;
  
  logger.error('Request error', { error: error.message });
  
  reply.status(statusCode).send({
    error: {
      message: error.message,
      statusCode,
    },
  });
});
```

### Testing

```typescript
// apps/api/src/routes/example.test.ts
import { describe, it, expect } from 'vitest';
import { build } from '../app';

describe('Example Routes', () => {
  it('should get all examples', async () => {
    const app = await build();
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/examples',
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('examples');
    
    await app.close();
  });
});
```

## Frontend (apps/web-admin & apps/web-pos)

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **Icons**: React Icons

### Project Structure

```
apps/web-admin/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utilities, API client, hooks
├── public/           # Static assets
└── tailwind.config.ts
```

### Creating a New Page

```typescript
// apps/web-admin/app/example/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function ExamplePage() {
  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['examples'],
    queryFn: () => api.get('/examples'),
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/examples', data),
    onSuccess: () => {
      // Refetch or update cache
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div>
      <h1>Examples</h1>
      {/* Your UI */}
    </div>
  );
}
```

### API Client

```typescript
// apps/web-admin/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### State Management

```typescript
// apps/web-admin/lib/store.ts
import { create } from 'zustand';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  cart: [],
  addToCart: (item) => set((state) => ({
    cart: [...state.cart, item],
  })),
}));
```

### Forms with Validation

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export function ExampleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Database (packages/database)

### Schema Definition

```prisma
// packages/database/schema.prisma
model Example {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
  @@map("examples")
}
```

### Common Queries

```typescript
// Find all
const examples = await prisma.example.findMany();

// Find by ID
const example = await prisma.example.findUnique({
  where: { id: '123' },
});

// Create
const example = await prisma.example.create({
  data: { name: 'Test', email: 'test@example.com' },
});

// Update
const example = await prisma.example.update({
  where: { id: '123' },
  data: { name: 'Updated' },
});

// Delete
await prisma.example.delete({
  where: { id: '123' },
});

// Complex queries
const examples = await prisma.example.findMany({
  where: {
    email: { contains: '@example.com' },
    createdAt: { gte: new Date('2024-01-01') },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
});
```

## Code Style & Standards

### TypeScript

- Use explicit types (avoid `any`)
- Use interfaces for object shapes
- Use enums for constants
- Enable strict mode

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`)
- **Types/Interfaces**: PascalCase (`User`, `UserProfile`)

### Code Organization

- Keep files small (< 300 lines)
- One component per file
- Group related files in folders
- Use index files for exports

## Testing Strategy

### Backend Tests

```bash
cd apps/api
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

### Frontend Tests

```bash
cd apps/web-admin
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## Troubleshooting

### Common Issues

#### "Module not found"
```bash
pnpm install
```

#### "Prisma client out of sync"
```bash
cd packages/database
pnpm prisma generate
```

#### "Port already in use"
```bash
lsof -ti:5000 | xargs kill -9
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Support

- **GitHub Issues**: [Report bugs](https://github.com/org/fiscalnext/issues)
- **Discussions**: [Ask questions](https://github.com/org/fiscalnext/discussions)
- **Email**: dev@fiscalnext.com
