import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  saveCart,
  getCart,
  restoreCart,
  markAbandoned,
  createRecovery,
  sendRecoveryEmail,
  sendRecoverySMS,
  createDiscountIncentive,
  getRecoveryAnalytics,
  processRecoveries,
} from '../services/abandoned-cart.service.js';

const abandonedCartsRoutes: FastifyPluginAsync = async (fastify) => {
  // Save cart
  fastify.post('/carts/save', {
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId || request.body.tenantId;
      const cart = await saveCart(tenantId, request.body);
      return reply.code(201).send(cart);
    },
  });

  // Get saved cart
  fastify.get('/carts/:id', {
    handler: async (request, reply) => {
      const tenantId = request.user?.tenantId;
      const { id } = request.params as { id: string };
      const cart = await getCart(tenantId, id);
      return reply.send(cart);
    },
  });

  // Restore cart by recovery token
  fastify.get('/carts/restore/:token', {
    handler: async (request, reply) => {
      const { token } = request.params as { token: string };
      const cart = await restoreCart(token);
      return reply.send(cart);
    },
  });

  // Mark cart as abandoned (automatic)
  fastify.post('/carts/:id/abandon', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const cart = await markAbandoned(id);
      return reply.send(cart);
    },
  });

  // Create abandoned cart recovery
  fastify.post('/abandoned-carts/recoveries', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const recovery = await createRecovery(tenantId, request.body);
      return reply.code(201).send(recovery);
    },
  });

  // Send recovery email
  fastify.post('/abandoned-carts/recoveries/:id/send-email', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await sendRecoveryEmail(id, request.body.templateId);
      return reply.code(204).send();
    },
  });

  // Send recovery SMS
  fastify.post('/abandoned-carts/recoveries/:id/send-sms', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      await sendRecoverySMS(id, request.body.message);
      return reply.code(204).send();
    },
  });

  // Create discount incentive
  fastify.post('/abandoned-carts/recoveries/:id/discount', {
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const recovery = await createDiscountIncentive(id, request.body);
      return reply.send(recovery);
    },
  });

  // Get recovery analytics
  fastify.get('/abandoned-carts/analytics', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const analytics = await getRecoveryAnalytics(tenantId, request.query);
      return reply.send(analytics);
    },
  });

  // Process recovery sequences (cron job endpoint)
  fastify.post('/abandoned-carts/process-recoveries', {
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId;
      const results = await processRecoveries(tenantId);
      return reply.send(results);
    },
  });
};

export default abandonedCartsRoutes;
