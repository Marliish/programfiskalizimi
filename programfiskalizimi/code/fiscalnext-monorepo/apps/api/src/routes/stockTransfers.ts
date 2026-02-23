// Stock Transfer Routes - Transfer inventory between locations
import { FastifyInstance } from 'fastify';
import { stockTransferService } from '../services/stockTransfer.service';

export async function stockTransferRoutes(fastify: FastifyInstance) {
  // Get all stock transfers
  fastify.get<{ Querystring: { status?: string; fromLocationId?: string; toLocationId?: string; limit?: string } }>('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const filters = {
        status: request.query.status,
        fromLocationId: request.query.fromLocationId,
        toLocationId: request.query.toLocationId,
        limit: request.query.limit ? parseInt(request.query.limit) : undefined,
      };
      
      const transfers = await stockTransferService.getStockTransfers(decoded.tenantId, filters);
      
      return {
        success: true,
        transfers,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock transfers',
      });
    }
  });

  // Get transfer by ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const transfer = await stockTransferService.getStockTransferById(decoded.tenantId, request.params.id);
      
      return {
        success: true,
        transfer,
      };
    } catch (error) {
      reply.status(404).send({
        success: false,
        error: error instanceof Error ? error.message : 'Stock transfer not found',
      });
    }
  });

  // Create stock transfer
  fastify.post<{
    Body: {
      fromLocationId?: string;
      toLocationId: string;
      items: Array<{ productId: string; quantity: number }>;
      notes?: string;
    };
  }>('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const transfer = await stockTransferService.createStockTransfer(
        decoded.tenantId,
        decoded.userId,
        request.body
      );
      
      return {
        success: true,
        transfer,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create stock transfer',
      });
    }
  });

  // Complete stock transfer
  fastify.post<{ Params: { id: string } }>('/:id/complete', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const transfer = await stockTransferService.completeStockTransfer(
        decoded.tenantId,
        request.params.id,
        decoded.userId
      );
      
      return {
        success: true,
        transfer,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete stock transfer',
      });
    }
  });

  // Cancel stock transfer
  fastify.post<{ Params: { id: string } }>('/:id/cancel', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const transfer = await stockTransferService.cancelStockTransfer(
        decoded.tenantId,
        request.params.id
      );
      
      return {
        success: true,
        transfer,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel stock transfer',
      });
    }
  });
}
