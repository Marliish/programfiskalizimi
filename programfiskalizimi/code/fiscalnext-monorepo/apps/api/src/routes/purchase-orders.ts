import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { purchaseOrderService } from '../services/purchaseOrderService';

const createPOSchema = z.object({
  supplierId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    sku: z.string().optional(),
    quantityOrdered: z.number().positive(),
    unitCost: z.number().positive(),
    taxRate: z.number().min(0).max(100).default(0),
  })).min(1),
});

const receiveInventorySchema = z.object({
  locationId: z.string().uuid().optional(),
  receiptType: z.enum(['partial', 'complete']),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantityReceived: z.number().positive(),
    batchNumber: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});

const purchaseOrdersRoutes: FastifyPluginAsync = async (server) => {
  // Get all purchase orders
  server.get('/', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { status, supplierId, search } = request.query as {
        status?: string;
        supplierId?: string;
        search?: string;
      };

      const purchaseOrders = await purchaseOrderService.getAll(
        request.user.tenantId,
        { status, supplierId, search }
      );

      return { success: true, purchaseOrders };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Get PO by ID
  server.get('/:id', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const purchaseOrder = await purchaseOrderService.getById(id, request.user.tenantId);

      if (!purchaseOrder) {
        reply.code(404);
        return { error: 'Purchase order not found' };
      }

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Create PO
  server.post('/', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const data = createPOSchema.parse(request.body);
      
      const purchaseOrder = await purchaseOrderService.create(
        request.user.tenantId,
        request.user.userId,
        {
          ...data,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        }
      );

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Update PO
  server.put('/:id', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = request.body as any;

      const purchaseOrder = await purchaseOrderService.update(id, request.user.tenantId, data);

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Submit for approval
  server.post('/:id/submit', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const purchaseOrder = await purchaseOrderService.submitForApproval(id, request.user.tenantId);

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Approve PO
  server.post('/:id/approve', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const purchaseOrder = await purchaseOrderService.approve(
        id,
        request.user.tenantId,
        request.user.userId
      );

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Mark as sent
  server.post('/:id/send', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const purchaseOrder = await purchaseOrderService.markAsSent(id, request.user.tenantId);

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Receive inventory
  server.post('/:id/receive', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = receiveInventorySchema.parse(request.body);

      const receipt = await purchaseOrderService.receiveInventory(
        id,
        request.user.tenantId,
        request.user.userId,
        data
      );

      return { success: true, receipt };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Cancel PO
  server.post('/:id/cancel', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const purchaseOrder = await purchaseOrderService.cancel(id, request.user.tenantId);

      return { success: true, purchaseOrder };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Get outstanding orders
  server.get('/outstanding/list', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { supplierId } = request.query as { supplierId?: string };
      const orders = await purchaseOrderService.getOutstanding(request.user.tenantId, supplierId);

      return { success: true, orders };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });
};

export default purchaseOrdersRoutes;
