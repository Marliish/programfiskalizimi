/**
 * Inventory Routes
 * Product and stock management routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../middleware/auth';

export async function inventoryRoutes(fastify: FastifyInstance) {
  // Get all products
  fastify.get(
    '/products',
    {
      preHandler: requirePermission('inventory.read'),
    },
    async (request, reply) => {
      const schema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        search: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        isActive: z.coerce.boolean().optional(),
      });

      const query = schema.parse(request.query);
      const tenantId = request.user!.tenantId;

      // TODO: Implement product listing
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

  // Create product
  fastify.post(
    '/products',
    {
      preHandler: requirePermission('inventory.create'),
    },
    async (request, reply) => {
      const schema = z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        categoryId: z.string().uuid().optional(),
        costPrice: z.number().positive().optional(),
        sellingPrice: z.number().positive(),
        taxRate: z.number().min(0).max(100).default(20),
        unit: z.string().optional(),
        trackInventory: z.boolean().default(true),
      });

      const data = schema.parse(request.body);
      const tenantId = request.user!.tenantId;

      // TODO: Implement product creation
      return reply.status(201).send({ message: 'Product created' });
    }
  );

  // Update product
  fastify.put(
    '/products/:id',
    {
      preHandler: requirePermission('inventory.update'),
    },
    async (request, reply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const bodySchema = z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        sellingPrice: z.number().positive().optional(),
        isActive: z.boolean().optional(),
      });

      const { id } = paramsSchema.parse(request.params);
      const data = bodySchema.parse(request.body);
      const tenantId = request.user!.tenantId;

      // TODO: Implement product update
      return reply.send({ message: 'Product updated' });
    }
  );

  // Delete product (soft delete)
  fastify.delete(
    '/products/:id',
    {
      preHandler: requirePermission('inventory.delete'),
    },
    async (request, reply) => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const { id } = schema.parse(request.params);
      const tenantId = request.user!.tenantId;

      // TODO: Implement product soft delete
      return reply.send({ message: 'Product deleted' });
    }
  );

  // Get stock levels
  fastify.get(
    '/stock',
    {
      preHandler: requirePermission('inventory.read'),
    },
    async (request, reply) => {
      const schema = z.object({
        locationId: z.string().uuid().optional(),
        lowStock: z.coerce.boolean().optional(),
      });

      const query = schema.parse(request.query);
      const tenantId = request.user!.tenantId;

      // TODO: Implement stock listing
      return reply.send({ data: [] });
    }
  );

  // Adjust stock
  fastify.post(
    '/stock/adjust',
    {
      preHandler: requirePermission('inventory.update'),
    },
    async (request, reply) => {
      const schema = z.object({
        productId: z.string().uuid(),
        locationId: z.string().uuid().optional(),
        quantity: z.number(),
        type: z.enum(['in', 'out', 'adjustment']),
        notes: z.string().optional(),
      });

      const data = schema.parse(request.body);
      const tenantId = request.user!.tenantId;
      const userId = request.user!.userId;

      // TODO: Implement stock adjustment
      return reply.send({ message: 'Stock adjusted' });
    }
  );
}
