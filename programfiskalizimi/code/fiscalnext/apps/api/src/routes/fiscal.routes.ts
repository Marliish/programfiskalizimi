/**
 * Fiscal Routes
 * Tax authority integration routes (Albania & Kosovo)
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../middleware/auth';

export async function fiscalRoutes(fastify: FastifyInstance) {
  // Submit fiscal receipt
  fastify.post(
    '/submit',
    {
      preHandler: requirePermission('fiscal.create'),
    },
    async (request, reply) => {
      const schema = z.object({
        transactionId: z.string().uuid(),
        country: z.enum(['AL', 'XK']),
      });

      const data = schema.parse(request.body);
      const tenantId = request.user!.tenantId;

      // TODO: Implement fiscal submission
      return reply.status(201).send({
        id: 'temp-fiscal-id',
        fiscalNumber: 'NSLF-12345',
        qrCode: 'base64-qr-code',
        status: 'submitted',
      });
    }
  );

  // Get fiscal receipt status
  fastify.get(
    '/status/:id',
    {
      preHandler: requirePermission('fiscal.read'),
    },
    async (request, reply) => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const { id } = schema.parse(request.params);
      const tenantId = request.user!.tenantId;

      // TODO: Implement get fiscal status
      return reply.send({
        id,
        status: 'submitted',
        fiscalNumber: 'NSLF-12345',
      });
    }
  );

  // Retry failed submission
  fastify.post(
    '/retry/:id',
    {
      preHandler: requirePermission('fiscal.create'),
    },
    async (request, reply) => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const { id } = schema.parse(request.params);
      const tenantId = request.user!.tenantId;

      // TODO: Implement retry logic
      return reply.send({ message: 'Retry queued' });
    }
  );

  // Get all fiscal receipts
  fastify.get(
    '/receipts',
    {
      preHandler: requirePermission('fiscal.read'),
    },
    async (request, reply) => {
      const schema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.enum(['pending', 'submitted', 'failed']).optional(),
        country: z.enum(['AL', 'XK']).optional(),
      });

      const query = schema.parse(request.query);
      const tenantId = request.user!.tenantId;

      // TODO: Implement fiscal receipts listing
      return reply.send({
        data: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
        },
      });
    }
  );
}
