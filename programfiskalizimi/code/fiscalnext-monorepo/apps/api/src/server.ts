// FiscalNext API Server
// Created: 2026-02-23 by Backend Team (David)

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import { authRoutes } from './routes/auth';
import { posRoutes } from './routes/pos';
import { productRoutes } from './routes/products';
import { categoryRoutes } from './routes/categories';
import { fiscalRoutes } from './routes/fiscal';
import { fiscalReceiptsRoutes } from './routes/fiscalReceipts';
import { inventoryRoutes } from './routes/inventory';
import { userRoutes } from './routes/users';
import { customerRoutes } from './routes/customers';
import { reportRoutes } from './routes/reports';
import { settingsRoutes } from './routes/settings';
import { locationRoutes } from './routes/locations';
import { stockTransferRoutes } from './routes/stockTransfers';
import { analyticsRoutes } from './routes/analytics';
import { taxIntegrationRoutes } from './routes/taxIntegration';
// Day 7 Integration Routes
import { exportRoutes } from './routes/exports';
import { paymentRoutes } from './routes/payments';
import { emailMarketingRoutes } from './routes/email-marketing';
import { barcodePrinterRoutes } from './routes/barcode-printer';
import { backupRoutes } from './routes/backup';
// Day 6 Advanced Routes
import { employeeRoutes } from './routes/employees';
import { loyaltyRoutes } from './routes/loyalty';
import { promotionRoutes } from './routes/promotions';
import { notificationRoutes } from './routes/notifications';
import { auditRoutes } from './routes/audit';
import { authenticateUser } from './middleware/auth';

// Load environment variables
dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Security & Middleware
await server.register(helmet);
await server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
});

// JWT Authentication
await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
});

// Add authentication decorator
server.decorate('authenticate', authenticateUser);

// Rate Limiting
await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Multipart (file uploads)
await server.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Static file serving (uploads)
await server.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

// Health Check
server.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fiscalnext-api',
    version: '0.1.0',
  };
});

// Root
server.get('/', async () => {
  return {
    name: 'FiscalNext API',
    version: '0.3.0',
    docs: '/docs',
    endpoints: {
      auth: '/v1/auth',
      pos: '/v1/pos',
      products: '/v1/products',
      categories: '/v1/categories',
      fiscal: '/v1/fiscal',
      fiscalReceipts: '/v1/fiscal/receipts',
      inventory: '/v1/inventory',
      users: '/v1/users',
      customers: '/v1/customers',
      reports: '/v1/reports',
      settings: '/v1/settings',
      // Day 6 Advanced Features
      employees: '/v1/employees',
      loyalty: '/v1/loyalty',
      promotions: '/v1/promotions',
      notifications: '/v1/notifications',
      audit: '/v1/audit',
      // Day 7 Integrations
      exports: '/v1/exports',
      payments: '/v1/payments',
      emailMarketing: '/v1/email-marketing',
      barcodePrinter: '/v1/barcode-printer',
      backup: '/v1/backup',
    },
  };
});

// Register API routes (v1)
await server.register(authRoutes, { prefix: '/v1/auth' });
await server.register(posRoutes, { prefix: '/v1/pos' });
await server.register(productRoutes, { prefix: '/v1' });
await server.register(categoryRoutes, { prefix: '/v1' });
await server.register(fiscalRoutes, { prefix: '/v1/fiscal' });
await server.register(fiscalReceiptsRoutes, { prefix: '/v1/fiscal' });
await server.register(inventoryRoutes, { prefix: '/v1/inventory' });
await server.register(userRoutes, { prefix: '/v1/users' });
await server.register(customerRoutes, { prefix: '/v1' });
await server.register(reportRoutes, { prefix: '/v1' });
await server.register(settingsRoutes, { prefix: '/v1/settings' });
await server.register(locationRoutes, { prefix: '/v1/locations' });
await server.register(stockTransferRoutes, { prefix: '/v1/stock-transfers' });
await server.register(analyticsRoutes, { prefix: '/v1/analytics' });
await server.register(taxIntegrationRoutes, { prefix: '/v1/tax-integration' });

// Day 6 Advanced Features
await server.register(employeeRoutes, { prefix: '/v1' });
await server.register(loyaltyRoutes, { prefix: '/v1' });
await server.register(promotionRoutes, { prefix: '/v1' });
await server.register(notificationRoutes, { prefix: '/v1' });
await server.register(auditRoutes, { prefix: '/v1' });

// Day 7 Integration Routes
await server.register(exportRoutes, { prefix: '/v1/exports' });
await server.register(paymentRoutes, { prefix: '/v1/payments' });
await server.register(emailMarketingRoutes, { prefix: '/v1/email-marketing' });
await server.register(barcodePrinterRoutes, { prefix: '/v1/barcode-printer' });
await server.register(backupRoutes, { prefix: '/v1/backup' });

// Start Server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`
    🚀 FiscalNext API Server Started!
    
    📍 URL: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}
    🏥 Health: http://localhost:${port}/health
    📚 Docs: http://localhost:${port}/docs
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    
    🔌 API Endpoints:
       • Auth:          /v1/auth/*
       • POS:           /v1/pos/*
       • Products:      /v1/products/*
       • Categories:    /v1/categories/*
       • Fiscal:        /v1/fiscal/*
       • Inventory:     /v1/inventory/*
       • Users:         /v1/users/*
       • Customers:     /v1/customers/*
       • Reports:       /v1/reports/*
       • Settings:      /v1/settings/*
       • Employees:     /v1/employees/* (Day 6)
       • Loyalty:       /v1/loyalty/* (Day 6)
       • Promotions:    /v1/promotions/* (Day 6)
       • Notifications: /v1/notifications/* (Day 6)
       • Audit Logs:    /v1/audit-logs/* (Day 6)
    
    ✅ Ready to accept requests!
    `);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
