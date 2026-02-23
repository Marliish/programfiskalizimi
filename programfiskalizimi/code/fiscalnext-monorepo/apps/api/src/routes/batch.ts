// Batch Operations API for Bulk Actions
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@fiscalnext/database';
import { z } from 'zod';
import { cacheService } from '../services/cacheService';

const batchCreateProductsSchema = z.object({
  products: z.array(z.object({
    name: z.string(),
    barcode: z.string().optional(),
    price: z.number(),
    categoryId: z.number(),
    stock: z.number().default(0),
  })),
});

const batchUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.number(),
    data: z.record(z.any()),
  })),
});

const batchDeleteSchema = z.object({
  ids: z.array(z.number()),
});

const batchRoutes: FastifyPluginAsync = async (server) => {
  // Batch create products
  server.post('/products/create', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { products } = batchCreateProductsSchema.parse(request.body);
      
      const results = await prisma.$transaction(
        products.map(product =>
          prisma.product.create({
            data: {
              ...product,
              userId: request.user.userId,
            },
          })
        )
      );

      // Invalidate product cache
      await cacheService.invalidatePattern('products:*');

      return {
        success: true,
        created: results.length,
        products: results,
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Batch update products
  server.put('/products/update', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { updates } = batchUpdateSchema.parse(request.body);
      
      const results = await prisma.$transaction(
        updates.map(({ id, data }) =>
          prisma.product.update({
            where: { id },
            data,
          })
        )
      );

      // Invalidate cache
      await cacheService.invalidatePattern('products:*');
      updates.forEach(({ id }) => 
        cacheService.del(cacheService.keys.product(id))
      );

      return {
        success: true,
        updated: results.length,
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Batch delete products
  server.delete('/products/delete', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { ids } = batchDeleteSchema.parse(request.body);
      
      const result = await prisma.product.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      // Invalidate cache
      await cacheService.invalidatePattern('products:*');
      ids.forEach(id => cacheService.del(cacheService.keys.product(id)));

      return {
        success: true,
        deleted: result.count,
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Batch stock adjustment
  server.post('/products/adjust-stock', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { adjustments } = request.body as {
        adjustments: Array<{ productId: number; quantity: number; type: 'add' | 'subtract' }>;
      };

      const results = await prisma.$transaction(
        adjustments.map(({ productId, quantity, type }) =>
          prisma.product.update({
            where: { id: productId },
            data: {
              stock: {
                [type === 'add' ? 'increment' : 'decrement']: quantity,
              },
            },
          })
        )
      );

      // Invalidate cache
      await cacheService.invalidatePattern('products:*');

      return {
        success: true,
        adjusted: results.length,
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Batch price update
  server.post('/products/update-prices', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { priceUpdates } = request.body as {
        priceUpdates: Array<{ productId: number; newPrice: number }>;
      };

      const results = await prisma.$transaction(
        priceUpdates.map(({ productId, newPrice }) =>
          prisma.product.update({
            where: { id: productId },
            data: { price: newPrice },
          })
        )
      );

      // Invalidate cache
      await cacheService.invalidatePattern('products:*');

      return {
        success: true,
        updated: results.length,
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });
};

export default batchRoutes;
