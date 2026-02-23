// Order Management Routes - Restaurant POS
// Built by: Tafa (Backend Developer)

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma, Prisma } from '@fiscalnext/database';

// Validation Schemas
const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  course: z.enum(['appetizer', 'main', 'dessert', 'beverage']).optional(),
  seatNumber: z.number().optional(),
  notes: z.string().optional(),
  modifiers: z.array(z.object({
    modifierId: z.string(),
  })).optional(),
});

const createOrderSchema = z.object({
  tableId: z.string().optional(),
  orderType: z.enum(['dine_in', 'takeout', 'delivery']).default('dine_in'),
  guestCount: z.number().min(1).default(1),
  customerId: z.string().optional(),
  items: z.array(orderItemSchema),
  notes: z.string().optional(),
});

const updateOrderSchema = z.object({
  guestCount: z.number().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
});

const addItemsSchema = z.object({
  items: z.array(orderItemSchema),
});

const removeItemSchema = z.object({
  itemId: z.string(),
});

const splitOrderSchema = z.object({
  splitType: z.enum(['by_item', 'by_seat', 'by_amount']),
  splits: z.array(z.object({
    itemIds: z.array(z.string()).optional(),
    seatNumber: z.number().optional(),
    amount: z.number().optional(),
    percentage: z.number().optional(),
  })),
});

export async function ordersRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // ORDERS CRUD
  // ============================================

  // List all orders (with filters)
  fastify.get('/orders', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { status, tableId, orderType, fromDate, toDate } = request.query as any;

      const where: any = {
        tenantId: decoded.tenantId,
      };

      if (status) {
        where.status = status;
      }

      if (tableId) {
        where.tableId = tableId;
      }

      if (orderType) {
        where.orderType = orderType;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          table: true,
          customer: true,
          items: {
            include: {
              product: true,
              modifiers: {
                include: {
                  modifier: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, orders };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  });

  // Get single order
  fastify.get<{ Params: { id: string } }>('/orders/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const order = await prisma.order.findFirst({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        include: {
          table: true,
          customer: true,
          location: true,
          items: {
            include: {
              product: true,
              modifiers: {
                include: {
                  modifier: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          tips: true,
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      return { success: true, order };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch order',
      });
    }
  });

  // Create new order
  fastify.post<{ Body: z.infer<typeof createOrderSchema> }>('/orders', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = createOrderSchema.parse(request.body);

      // Generate order number
      const lastOrder = await prisma.order.findFirst({
        where: { tenantId: decoded.tenantId },
        orderBy: { createdAt: 'desc' },
      });

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Calculate totals
      let subtotal = 0;
      const itemsData = [];

      for (const item of data.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return reply.status(400).send({
            success: false,
            error: `Product ${item.productId} not found`,
          });
        }

        let itemTotal = Number(product.sellingPrice) * item.quantity;
        let modifiersTotal = 0;

        // Calculate modifier adjustments
        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            const modifier = await prisma.modifier.findUnique({
              where: { id: mod.modifierId },
            });
            if (modifier) {
              modifiersTotal += Number(modifier.priceAdjustment) * item.quantity;
            }
          }
        }

        itemTotal += modifiersTotal;
        subtotal += itemTotal;

        itemsData.push({
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          taxRate: product.taxRate,
          subtotal: (Number(product.sellingPrice) * item.quantity) + modifiersTotal,
          total: itemTotal,
          course: item.course,
          seatNumber: item.seatNumber,
          notes: item.notes,
          status: 'pending',
          modifiers: item.modifiers || [],
        });
      }

      const taxAmount = subtotal * 0.2; // 20% tax (adjust as needed)
      const total = subtotal + taxAmount;

      // Create order with items
      const order = await prisma.order.create({
        data: {
          tenantId: decoded.tenantId,
          userId: decoded.userId,
          tableId: data.tableId,
          customerId: data.customerId,
          orderNumber,
          orderType: data.orderType,
          guestCount: data.guestCount,
          status: 'open',
          subtotal,
          taxAmount,
          total,
          notes: data.notes,
          items: {
            create: itemsData.map(item => ({
              ...item,
              modifiers: item.modifiers
                ? {
                    create: item.modifiers.map((mod: any) => ({
                      modifierId: mod.modifierId,
                      modifierName: '', // Will be filled by trigger
                      priceAdjustment: 0, // Will be filled by trigger
                    })),
                  }
                : undefined,
            })),
          },
        },
        include: {
          table: true,
          items: {
            include: {
              product: true,
              modifiers: true,
            },
          },
        },
      });

      // Update table status if dine-in
      if (data.tableId) {
        await prisma.table.update({
          where: { id: data.tableId },
          data: {
            status: 'occupied',
            currentOrderId: order.id,
          },
        });
      }

      return { success: true, order };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  });

  // Update order
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof updateOrderSchema> }>('/orders/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = updateOrderSchema.parse(request.body);

      const order = await prisma.order.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data,
        include: {
          table: true,
          items: {
            include: {
              product: true,
              modifiers: true,
            },
          },
        },
      });

      return { success: true, order };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update order',
      });
    }
  });

  // Add items to order
  fastify.post<{ Params: { id: string }; Body: z.infer<typeof addItemsSchema> }>('/orders/:id/items', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { items } = addItemsSchema.parse(request.body);

      const order = await prisma.order.findFirst({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      // Add items
      let additionalSubtotal = 0;

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) continue;

        let itemTotal = Number(product.sellingPrice) * item.quantity;

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice: product.sellingPrice,
            taxRate: product.taxRate,
            subtotal: itemTotal,
            total: itemTotal,
            course: item.course,
            seatNumber: item.seatNumber,
            notes: item.notes,
            status: 'pending',
          },
        });

        additionalSubtotal += itemTotal;
      }

      // Recalculate order totals
      const newSubtotal = Number(order.subtotal) + additionalSubtotal;
      const newTaxAmount = newSubtotal * 0.2;
      const newTotal = newSubtotal + newTaxAmount;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
        },
        include: {
          table: true,
          items: {
            include: {
              product: true,
              modifiers: true,
            },
          },
        },
      });

      return { success: true, order: updatedOrder };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to add items',
      });
    }
  });

  // Remove item from order
  fastify.delete<{ Params: { id: string; itemId: string } }>('/orders/:id/items/:itemId', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const order = await prisma.order.findFirst({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        include: { items: true },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      const item = order.items.find(i => i.id === request.params.itemId);
      if (!item) {
        return reply.status(404).send({
          success: false,
          error: 'Item not found',
        });
      }

      // Delete item
      await prisma.orderItem.delete({
        where: { id: request.params.itemId },
      });

      // Recalculate totals
      const newSubtotal = Number(order.subtotal) - Number(item.subtotal);
      const newTaxAmount = newSubtotal * 0.2;
      const newTotal = newSubtotal + newTaxAmount;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
        },
        include: {
          items: {
            include: {
              product: true,
              modifiers: true,
            },
          },
        },
      });

      return { success: true, order: updatedOrder };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to remove item',
      });
    }
  });

  // Split order
  fastify.post<{ Params: { id: string }; Body: z.infer<typeof splitOrderSchema> }>('/orders/:id/split', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { splitType, splits } = splitOrderSchema.parse(request.body);

      const order = await prisma.order.findFirst({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        include: {
          items: true,
          table: true,
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      // Update order with split type
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { splitType },
      });

      // For now, just return split configuration
      // In production, you'd create separate transactions for each split

      return {
        success: true,
        order: updatedOrder,
        splitType,
        splits,
        message: 'Order split configured. Process payments separately for each split.',
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to split order',
      });
    }
  });

  // Cancel order
  fastify.post<{ Params: { id: string } }>('/orders/:id/cancel', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const order = await prisma.order.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
        include: {
          table: true,
        },
      });

      // Free up table if dine-in
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: {
            status: 'available',
            currentOrderId: null,
          },
        });
      }

      return { success: true, order };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to cancel order',
      });
    }
  });

  // Complete order (mark as paid)
  fastify.post<{ Params: { id: string } }>('/orders/:id/complete', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const order = await prisma.order.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: {
          status: 'completed',
          isPaid: true,
          completedAt: new Date(),
        },
        include: {
          table: true,
        },
      });

      // Free up table if dine-in
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: {
            status: 'available',
            currentOrderId: null,
          },
        });
      }

      return { success: true, order };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to complete order',
      });
    }
  });
}
