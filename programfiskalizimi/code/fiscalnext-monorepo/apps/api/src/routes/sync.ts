// Sync API for Mobile Offline Support
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@fiscalnext/database';
import { z } from 'zod';

const syncUploadSchema = z.object({
  sales: z.array(z.object({
    customerId: z.number().nullable().optional(),
    items: z.array(z.object({
      productId: z.number(),
      quantity: z.number(),
      price: z.number(),
    })),
    paymentMethod: z.string(),
    total: z.number(),
    createdAt: z.string(),
  })).optional(),
  products: z.array(z.any()).optional(),
  customers: z.array(z.any()).optional(),
});

export const syncRoutes: FastifyPluginAsync = async (server) => {
  // Upload pending changes from mobile
  server.post('/upload', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const body = syncUploadSchema.parse(request.body);
      const results = {
        sales: 0,
        products: 0,
        customers: 0,
        errors: [] as string[],
      };

      // Process sales
      if (body.sales && body.sales.length > 0) {
        for (const sale of body.sales) {
          try {
            // Create sale
            const saleRecord = await prisma.sale.create({
              data: {
                userId: request.user.userId,
                customerId: sale.customerId || null,
                total: sale.total,
                paymentMethod: sale.paymentMethod,
                status: 'completed',
              },
            });

            // Create sale items
            for (const item of sale.items) {
              await prisma.saleItem.create({
                data: {
                  saleId: saleRecord.id,
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                  subtotal: item.price * item.quantity,
                },
              });

              // Update product stock
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });
            }

            results.sales++;
          } catch (error: any) {
            results.errors.push(`Sale error: ${error.message}`);
          }
        }
      }

      // Process other entities...
      // (products, customers, etc.)

      return {
        success: true,
        synced: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
  });

  // Download updates since last sync
  server.get('/download', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { since } = request.query as { since?: string };
      const sinceDate = since ? new Date(Number(since)) : new Date(0);

      // Get updated products
      const products = await prisma.product.findMany({
        where: {
          updatedAt: {
            gte: sinceDate,
          },
        },
        select: {
          id: true,
          name: true,
          barcode: true,
          price: true,
          stock: true,
          categoryId: true,
          updatedAt: true,
        },
        take: 500, // Limit for performance
      });

      // Get updated categories
      const categories = await prisma.category.findMany({
        where: {
          updatedAt: {
            gte: sinceDate,
          },
        },
        take: 100,
      });

      return {
        success: true,
        data: {
          products,
          categories,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Delta sync (only changed data)
  server.post('/delta', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      const { lastSync, entities } = request.body as {
        lastSync: string;
        entities: string[];
      };
      
      const sinceDate = new Date(lastSync);
      const changes: any = {};

      // Get only requested entities that changed
      if (entities.includes('products')) {
        changes.products = await prisma.product.findMany({
          where: { updatedAt: { gte: sinceDate } },
          take: 200,
        });
      }

      if (entities.includes('categories')) {
        changes.categories = await prisma.category.findMany({
          where: { updatedAt: { gte: sinceDate } },
          take: 50,
        });
      }

      return {
        success: true,
        changes,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });

  // Sync status and metrics
  server.get('/status', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    try {
      // Get sync statistics
      const pendingCount = 0; // Would track pending changes per user
      const lastSync = new Date().toISOString();

      return {
        success: true,
        status: {
          pendingChanges: pendingCount,
          lastSync,
          serverTime: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      reply.code(500);
      return { error: error.message };
    }
  });
};

export default syncRoutes;
