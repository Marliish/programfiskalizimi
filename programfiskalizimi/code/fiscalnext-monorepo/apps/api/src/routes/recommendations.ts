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
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId;
      const { productId } = request.params as { productId: string };
      const recommendations = await getRecommendations(tenantId, productId, request.query);
      return reply.send(recommendations);
    },
  });

  // Get AI-based recommendations
  fastify.get('/recommendations/ai', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const recommendations = await getAIRecommendations(tenantId, request.query);
      return reply.send(recommendations);
    },
  });

  // Get "Customers also bought"
  fastify.get('/products/:productId/also-bought', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getAlsoBought(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get "Frequently bought together"
  fastify.get('/products/:productId/frequently-together', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getFrequentlyTogether(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get recently viewed products
  fastify.get('/customers/:customerId/recently-viewed', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { customerId } = request.params as { customerId: string };
      const products = await getRecentlyViewed(tenantId, customerId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get trending products
  fastify.get('/recommendations/trending', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const products = await getTrending(tenantId, request.query);
      return reply.send(products);
    },
  });

  // Get cross-sell suggestions
  fastify.get('/products/:productId/cross-sell', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getCrossSell(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Get upsell suggestions
  fastify.get('/products/:productId/upsell', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const { productId } = request.params as { productId: string };
      const products = await getUpsell(tenantId, productId, request.query.limit);
      return reply.send(products);
    },
  });

  // Track product view
  fastify.post('/products/:productId/view', {
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
