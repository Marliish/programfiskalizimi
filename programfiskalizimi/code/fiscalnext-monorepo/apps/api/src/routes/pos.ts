// POS Routes - Point of Sale operations
import { FastifyInstance } from 'fastify';
import { posService } from '../services/pos.service';
import { createTransactionSchema, listTransactionsQuerySchema, CreateTransactionInput, ListTransactionsQuery } from '../schemas/pos.schema';
import { validate } from '../middleware/validate';

export async function posRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Create new transaction (sale)
  fastify.post<{ Body: CreateTransactionInput }>('/transactions', {
    preHandler: [validate(createTransactionSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = request.body as any;

      const transaction = await posService.createTransaction({
        tenantId: decoded.tenantId,
        userId: decoded.userId,
        locationId: body.locationId,
        customerId: body.customerId,
        items: body.items,
        payments: body.payments,
      });

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction',
      });
    }
  });

  // Get transaction by ID
  fastify.get<{ Params: { id: string } }>('/transactions/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const transaction = await posService.getTransaction(request.params.id, decoded.tenantId);

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: 'Transaction not found',
      });
    }
  });

  // List transactions
  fastify.get<{ Querystring: ListTransactionsQuery }>('/transactions', {
    preHandler: [validate(listTransactionsQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query;

      const result = await posService.listTransactions({
        tenantId: decoded.tenantId,
        page: query.page,
        limit: query.limit,
        status: query.status,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch transactions',
      });
    }
  });

  // Void transaction
  fastify.post<{ Params: { id: string } }>('/transactions/:id/void', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const transaction = await posService.voidTransaction(
        request.params.id,
        decoded.tenantId,
        decoded.userId
      );

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to void transaction',
      });
    }
  });
}
