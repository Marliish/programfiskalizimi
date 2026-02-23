/**
 * POS Routes
 * Point of Sale transaction routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../middleware/auth';

export async function posRoutes(fastify: FastifyInstance) {
  // Create transaction (checkout)
  fastify.post(
    '/checkout',
    {
      preHandler: requirePermission('pos.create'),
    },
    async (request, reply) => {
      const itemSchema = z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).optional(),
      });

      const schema = z.object({
        items: z.array(itemSchema).min(1),
        customerId: z.string().uuid().optional(),
        payments: z.array(
          z.object({
            method: z.enum(['cash', 'card', 'mobile', 'bank_transfer']),
            amount: z.number().positive(),
            referenceNumber: z.string().optional(),
          })
        ),
        notes: z.string().optional(),
      });

      const data = schema.parse(request.body);
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;

      // TODO: Implement checkout logic in POS service
      const transaction = {
        id: 'temp-id',
        transactionNumber: 'TXN-001',
        total: 0,
        status: 'completed',
      };

      return reply.status(201).send(transaction);
    }
  );

  // Get transactions
  fastify.get(
    '/transactions',
    {
      preHandler: requirePermission('pos.read'),
    },
    async (request, reply) => {
      const schema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        status: z.enum(['completed', 'voided', 'refunded']).optional(),
      });

      const query = schema.parse(request.query);
      const tenantId = request.user!.tenantId;

      // TODO: Implement transaction listing
      const transactions = [];

      return reply.send({
        data: transactions,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
        },
      });
    }
  );

  // Get transaction by ID
  fastify.get(
    '/transactions/:id',
    {
      preHandler: requirePermission('pos.read'),
    },
    async (request, reply) => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const { id } = schema.parse(request.params);
      const tenantId = request.user!.tenantId;

      // TODO: Implement get transaction by ID
      return reply.send({ id, message: 'Not implemented yet' });
    }
  );

  // Void transaction
  fastify.post(
    '/transactions/:id/void',
    {
      preHandler: requirePermission('pos.void'),
    },
    async (request, reply) => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const { id } = schema.parse(request.params);
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;

      // TODO: Implement void transaction
      return reply.send({ message: 'Transaction voided' });
    }
  );
}
