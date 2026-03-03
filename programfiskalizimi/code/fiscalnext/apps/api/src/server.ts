/**
 * FiscalNext API Server
 * Main entry point for the Fastify backend
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import env from '@fastify/env';
import { config } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { posRoutes } from './routes/pos.routes';
import { inventoryRoutes } from './routes/inventory.routes';
import { fiscalRoutes } from './routes/fiscal.routes';
import { reportingRoutes } from './routes/reporting.routes';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { logger } from './utils/logger';

const server = Fastify({
  logger: {
    level: config.logLevel,
    transport: config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  trustProxy: true,
});

// Environment schema
const envSchema = {
  type: 'object',
  required: ['PORT', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    PORT: { type: 'number', default: 5000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    NODE_ENV: { type: 'string', default: 'development' },
    DATABASE_URL: { type: 'string' },
    REDIS_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    JWT_REFRESH_SECRET: { type: 'string' },
    JWT_EXPIRES_IN: { type: 'string', default: '15m' },
    JWT_REFRESH_EXPIRES_IN: { type: 'string', default: '30d' },
  },
};

async function start() {
  try {
    // Register environment variables
    await server.register(env, {
      schema: envSchema,
      dotenv: true,
    });

    // Register CORS
    await server.register(cors, {
      origin: (origin, cb) => {
        const allowedOrigins = config.corsOrigin.split(',');
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
    });

    // Register JWT
    await server.register(jwt, {
      secret: config.jwtSecret,
      sign: {
        expiresIn: config.jwtExpiresIn,
      },
    });

    // Register rate limiting (Redis-based for production)
    await server.register(rateLimit, {
      max: 100, // 100 requests
      timeWindow: '1 minute',
      redis: config.redisUrl ? require('ioredis').createClient(config.redisUrl) : undefined,
    });

    // Health check endpoint (public)
    server.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
      };
    });

    // API versioning prefix
    server.register(
      async (api) => {
        // Public routes (no auth required)
        await api.register(authRoutes, { prefix: '/auth' });

        // Protected routes (require auth + tenant context)
        api.addHook('onRequest', authMiddleware);
        api.addHook('onRequest', tenantMiddleware);

        await api.register(posRoutes, { prefix: '/pos' });
        await api.register(inventoryRoutes, { prefix: '/inventory' });
        await api.register(fiscalRoutes, { prefix: '/fiscal' });
        await api.register(reportingRoutes, { prefix: '/reports' });
      },
      { prefix: '/v1' }
    );

    // Register global error handler
    server.setErrorHandler(errorHandler);

    // Start server
    const address = await server.listen({
      port: config.port,
      host: config.host,
    });

    server.log.info(`🚀 FiscalNext API Server running at ${address}`);
    server.log.info(`📊 Environment: ${config.nodeEnv}`);
    server.log.info(`🔐 CORS Origin: ${config.corsOrigin}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, closing server...`);
    await server.close();
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  server.log.error({ err }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  server.log.error({ err }, 'Unhandled rejection');
  process.exit(1);
});

// Start the server
start();

export { server };
