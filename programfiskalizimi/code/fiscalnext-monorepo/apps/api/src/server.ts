// FiscalNext API Server
// Created: 2026-02-23 by Backend Team (David)

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import compress from '@fastify/compress';
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
// Day 10 Mobile & Optimization Routes
import { mobileNotificationRoutes } from './routes/mobile-notifications';
import { authenticateUser } from './middleware/auth';
// Day 9 Advanced Features
import dashboardRoutes from './routes/dashboards.js';
import advancedReportRoutes from './routes/advanced-reports.js';
import automationRoutes from './routes/automations.js';
import forecastRoutes from './routes/forecasts.js';
import syncRoutes from './routes/sync.js';
import batchRoutes from './routes/batch.js';
import apiMetricsRoutes from './routes/api-metrics.js';
import integrationRoutes from './routes/integrations.js';
import { websocketService } from './services/websocket.service.js';
// Day 13 Marketing & Campaigns
import { campaignsRoutes } from './routes/campaigns';
import { surveysRoutes } from './routes/surveys';
import { referralsRoutes } from './routes/referrals';
import { socialMediaRoutes } from './routes/social-media';
// Restaurant POS Features - Built by Tafa, Mela, Gesa
import { tablesRoutes } from './routes/tables';
import { kitchenRoutes } from './routes/kitchen';
import { ordersRoutes } from './routes/orders';
import { tipsRoutes } from './routes/tips';
// Financial & HR Features - Built by Edison & Eroldi
import payrollRoutes from './routes/payroll.js';
import expenseManagementRoutes from './routes/expense-management.js';
import billRoutes from './routes/bills.js';
import bankReconciliationRoutes from './routes/bank-reconciliation.js';
import hrManagementRoutes from './routes/hr-management.js';
// Advanced POS Features - Team: Tafa, Mela, Gesa
import { splitPaymentsRoutes } from './routes/split-payments';
import { customReceiptsRoutes } from './routes/custom-receipts';
import { tillManagementRoutes } from './routes/till-management';
import { giftCardsVouchersRoutes } from './routes/gift-cards-vouchers';
// E-commerce Features (45 features) - Team: Edison, Boli, Gesa
import reviewsRoutes from './routes/reviews.js';
import wishlistsRoutes from './routes/wishlists.js';
import chatRoutes from './routes/chat.js';
import abandonedCartsRoutes from './routes/abandoned-carts.js';
import recommendationsRoutes from './routes/recommendations.js';
import seoRoutes from './routes/seo.js';
import { advancedPricingRoutes } from './routes/advanced-pricing';
import { quickKeysRoutes } from './routes/quick-keys';
// Advanced Inventory Features (50 features) - Built by Klea, Tafa, Mela
import { advancedInventoryRoutes } from './routes/advanced-inventory';
// Manufacturing Features (40 features) - Built by Eroldi (CTO), Boli, Artan
import { manufacturingBOMRoutes } from './routes/manufacturing-bom';
import { manufacturingPlanningRoutes } from './routes/manufacturing-planning';
import { manufacturingWorkOrdersQCCostingRoutes } from './routes/manufacturing-workorders-qc-costing';

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
  origin: (origin, cb) => {
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.includes('localhost')) {
        cb(null, true);
        return;
      }
    }
    // In production, check against allowed origins
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
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

// Response Compression (gzip)
await server.register(compress, {
  global: true,
  threshold: 1024, // Compress responses > 1KB
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
    version: '0.4.0',
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
      // Day 10 Mobile & Optimization
      sync: '/v1/sync',
      batch: '/v1/batch',
      mobileNotifications: '/v1/mobile/notifications',
      apiMetrics: '/v1/api/metrics',
      apiHealth: '/v1/api/health',
      // Day 9 Advanced Features
      dashboards: '/v1/dashboards',
      advancedReports: '/v1/advanced-reports',
      automations: '/v1/automations',
      forecasts: '/v1/forecasts',
      websocket: 'ws://localhost:5000',
      // Day 13 Marketing & Campaigns
      campaigns: '/v1/campaigns',
      surveys: '/v1/surveys',
      referrals: '/v1/referrals',
      socialMedia: '/v1/social-media',
      // Restaurant POS Features
      tables: '/v1/tables',
      kitchen: '/v1/kitchen',
      orders: '/v1/orders',
      tips: '/v1/tips',
      // Financial & HR Features
      payroll: '/v1/payroll',
      expenses: '/v1/expenses',
      bills: '/v1/bills',
      vendors: '/v1/vendors',
      bankReconciliation: '/v1/bank-reconciliation',
      hrManagement: '/v1/hr',
      // Advanced POS Features (50 features)
      splitPayments: '/v1/split-payments',
      customReceipts: '/v1/receipt-templates',
      tillManagement: '/v1/tills',
      tillSessions: '/v1/till-sessions',
      tillReports: '/v1/till-reports',
      giftCards: '/v1/gift-cards',
      vouchers: '/v1/vouchers',
      priceSchedules: '/v1/price-schedules',
      volumePricing: '/v1/volume-pricing-rules',
      customerPricing: '/v1/customer-specific-prices',
      quickKeys: '/v1/quick-key-layouts',
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

// Day 10 Mobile & Optimization Routes
await server.register(mobileNotificationRoutes, { prefix: '/v1/mobile/notifications' });

// Day 9 Advanced Features
await server.register(syncRoutes, { prefix: '/v1/sync' });
await server.register(batchRoutes, { prefix: '/v1/batch' });
await server.register(apiMetricsRoutes, { prefix: '/v1' });
await server.register(integrationRoutes, { prefix: '/v1/integrations' });
await server.register(dashboardRoutes, { prefix: '/v1/dashboards' });
await server.register(advancedReportRoutes, { prefix: '/v1/advanced-reports' });
await server.register(automationRoutes, { prefix: '/v1/automations' });
await server.register(forecastRoutes, { prefix: '/v1/forecasts' });

// Day 13 Marketing & Campaigns
await server.register(campaignsRoutes, { prefix: '/v1/campaigns' });
await server.register(surveysRoutes, { prefix: '/v1/surveys' });
await server.register(referralsRoutes, { prefix: '/v1/referrals' });
await server.register(socialMediaRoutes, { prefix: '/v1/social-media' });

// Restaurant POS Features - Built by Tafa, Mela, Gesa
await server.register(tablesRoutes, { prefix: '/v1' });
await server.register(kitchenRoutes, { prefix: '/v1' });
await server.register(ordersRoutes, { prefix: '/v1' });
await server.register(tipsRoutes, { prefix: '/v1' });

// Financial & HR Features - Built by Edison & Eroldi
await server.register(payrollRoutes, { prefix: '/v1/payroll' });
await server.register(expenseManagementRoutes, { prefix: '/v1' });
await server.register(billRoutes, { prefix: '/v1' });
await server.register(bankReconciliationRoutes, { prefix: '/v1' });
await server.register(hrManagementRoutes, { prefix: '/v1/hr' });

// Advanced POS Features (50 features) - Built by Tafa, Mela, Gesa
await server.register(splitPaymentsRoutes, { prefix: '/v1' });
await server.register(customReceiptsRoutes, { prefix: '/v1' });
await server.register(tillManagementRoutes, { prefix: '/v1' });
await server.register(giftCardsVouchersRoutes, { prefix: '/v1' });
await server.register(advancedPricingRoutes, { prefix: '/v1' });
await server.register(quickKeysRoutes, { prefix: '/v1' });

// Advanced Inventory Features (50 features) - Built by Klea, Tafa, Mela
await server.register(advancedInventoryRoutes, { prefix: '/v1/advanced-inventory' });

// E-commerce Features (45 features) - Built by Edison, Boli, Gesa
await server.register(reviewsRoutes, { prefix: '/v1' });
await server.register(wishlistsRoutes, { prefix: '/v1' });
await server.register(chatRoutes, { prefix: '/v1' });
await server.register(abandonedCartsRoutes, { prefix: '/v1' });
await server.register(recommendationsRoutes, { prefix: '/v1' });
await server.register(seoRoutes, { prefix: '/v1' });

// Manufacturing Features (40 features) - Built by Eroldi (CTO), Boli, Artan
await server.register(manufacturingBOMRoutes, { prefix: '/v1' });
await server.register(manufacturingPlanningRoutes, { prefix: '/v1' });
await server.register(manufacturingWorkOrdersQCCostingRoutes, { prefix: '/v1' });

// Start Server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    
    // Initialize WebSocket server
    websocketService.initialize(server.server);
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
       • Dashboards:    /v1/dashboards/* (Day 9)
       • Adv. Reports:  /v1/advanced-reports/* (Day 9)
       • Automations:   /v1/automations/* (Day 9)
       • Forecasts:     /v1/forecasts/* (Day 9)
       • Campaigns:     /v1/campaigns/* (Day 13)
       • Surveys:       /v1/surveys/* (Day 13)
       • Referrals:     /v1/referrals/* (Day 13)
       • Social Media:  /v1/social-media/* (Day 13)
       • Tables:        /v1/tables/* (Restaurant)
       • Kitchen:       /v1/kitchen/* (Restaurant)
       • Orders:        /v1/orders/* (Restaurant)
       • Tips:          /v1/tips/* (Restaurant)
       • Payroll:       /v1/payroll/* (Financial)
       • Expenses:      /v1/expenses/* (Financial)
       • Bills:         /v1/bills/* (Financial)
       • Vendors:       /v1/vendors/* (Financial)
       • Bank Recon:    /v1/bank-reconciliation/* (Financial)
       • HR:            /v1/hr/* (HR Management)
    
    🔌 WebSocket Server: ws://localhost:${port}
    ✅ Ready to accept requests!
    `);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
