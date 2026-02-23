import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getRecommendations,
  getAIRecommendations,
  getAlsoBought,
  getFrequentlyTogether,
  getRecentlyViewed,
  getTrending,
  getCrossSell,
  getUpsell,
  trackView,
  trackClick,
  trackConversion,
  generatePersonalized,
  refreshRecommendations,
} from '../services/recommendation.service.js';

const recommendationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all recommendations for a product
  fastify.get('/products/:productId/recommendations', {
    schema: {
      querystring: z.object({
        customerId: z.string().uuid().optional(),
        type: z.enum(['ai-based', 'also-bought', 'frequently-together', 'trending', 'cross-sell', 'upsell']).optional(),
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId;
      const { productId } = request.params as { productId: string };
      const recommendations = await getRecommendations(tenantId, productId, request.query);
      return reply.send(recommendations);
    },
  });

  // Get AI-based recommendations
  fastify.get('/recommendations/ai', {
    schema: {
      querystring: z.object({
        customerId: z.string().uuid(),
        context: z.enum(['homepage', 'product', 'cart', 'checkout']).optional(),
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const recommendations = await getAIRecommendations(tenantId, request.query);
      return reply.send(recommendations);
    },
  });

  // Get "Customers also bought"
  fastify.get('/products/:productId/also-bought', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getAlsoBought(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get "Frequently bought together"
  fastify.get('/products/:productId/frequently-together', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(50).optional().default(5),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getFrequentlyTogether(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get recently viewed products
  fastify.get('/customers/:customerId/recently-viewed', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { customerId } = request.params as { customerId: string };
      const products = await getRecentlyViewed(tenantId, customerId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get trending products
  fastify.get('/recommendations/trending', {
    schema: {
      querystring: z.object({
        period: z.enum(['24h', '7d', '30d']).optional().default('7d'),
        limit: z.number().int().min(1).max(50).optional().default(10),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const products = await getTrending(tenantId, request.query);
      return reply.send(products);
    },
  });

  // Get cross-sell suggestions
  fastify.get('/products/:productId/cross-sell', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(50).optional().default(5),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getCrossSell(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get upsell suggestions
  fastify.get('/products/:productId/upsell', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(50).optional().default(5),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getUpsell(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Track product view
  fastify.post('/products/:productId/view', {
    schema: {
      body: z.object({
        customerId: z.string().uuid().optional(),
        sessionId: z.string().optional(),
        viewDuration: z.number().int().optional(),
        referrer: z.string().optional(),
        deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
      }),
    },
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId;
      const { productId } = request.params as { productId: string };
      const view = await trackView(tenantId, productId, request.body);
      return reply.code(201).send(view);
    },
  });

  // Track recommendation click
  fastify.post('/recommendations/:id/click', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await trackClick(id);
      return reply.code(204).send();
    },
  });

  // Track recommendation conversion
  fastify.post('/recommendations/:id/conversion', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await trackConversion(id);
      return reply.code(204).send();
    },
  });

  // Generate personalized recommendations
  fastify.post('/customers/:customerId/personalized', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { customerId } = request.params as { customerId: string };
      const recommendations = await generatePersonalized(tenantId, customerId);
      return reply.send(recommendations);
    },
  });

  // Refresh all recommendations (admin/cron)
  fastify.post('/recommendations/refresh', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const results = await refreshRecommendations(tenantId);
      return reply.send(results);
    },
  });
};

export default recommendationsRoutes;
