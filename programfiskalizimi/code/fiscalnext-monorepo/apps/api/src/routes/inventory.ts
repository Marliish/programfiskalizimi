// Inventory Routes
import { FastifyInstance } from 'fastify';
import { inventoryService } from '../services/inventory.service';
import { adjustStockSchema, inventoryQuerySchema, AdjustStockInput } from '../schemas/inventory.schema';
import { validate } from '../middleware/validate';

export async function inventoryRoutes(fastify: FastifyInstance) {
  // Get inventory levels
  fastify.get('/', {
    preHandler: [fastify.authenticate, validate(inventoryQuerySchema, 'query')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query as any;
      
      const result = await inventoryService.getInventoryLevels({
        tenantId: decoded.tenantId,
        page: query.page || 1,
        limit: query.limit || 20,
        categoryId: query.categoryId,
        lowStock: query.lowStock,
        locationId: query.locationId,
        search: query.search,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get inventory',
      });
    }
  });

  // Adjust stock
  fastify.post<{ Body: AdjustStockInput }>('/adjust', {
    preHandler: [fastify.authenticate, validate(adjustStockSchema, 'body')],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      
      const result = await inventoryService.adjustStock({
        productId: request.body.productId,
        tenantId: decoded.tenantId,
        quantity: request.body.quantity,
        type: request.body.type,
        reason: request.body.reason,
        locationId: request.body.locationId,
        userId: decoded.userId,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to adjust stock',
      });
    }
  });

  // Get stock movements
  fastify.get('/movements', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query as any;
      
      const result = await inventoryService.getStockMovements({
        tenantId: decoded.tenantId,
        productId: query.productId,
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stock movements',
      });
    }
  });

  // Get low stock alerts
  fastify.get('/alerts', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const query = request.query as any;
      
      const result = await inventoryService.getLowStockAlerts(
        decoded.tenantId,
        Number(query.threshold) || 10
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stock alerts',
      });
    }
  });
}
