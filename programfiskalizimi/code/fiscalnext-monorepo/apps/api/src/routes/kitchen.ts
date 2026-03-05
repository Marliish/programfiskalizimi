// Kitchen Display System Routes
// Built by: Tafa (Backend Developer)

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fiscalnext/database';

// Validation Schemas
const createKitchenStationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  stationType: z.string(), // grill, salads, desserts, bar
  locationId: z.string().optional(),
  color: z.string().default('#3b82f6'),
  displayOrder: z.number().default(0),
});

const updateKitchenOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'served']),
});

const sendOrderToKitchenSchema = z.object({
  orderId: z.string(),
  notes: z.string().optional(),
});

const bumpKitchenOrderSchema = z.object({
  kitchenOrderId: z.string(),
});

export async function kitchenRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // KITCHEN STATIONS
  // ============================================

  // List all kitchen stations
  fastify.get('/kitchen/stations', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const stations = await prisma.kitchenStation.findMany({
        where: {
          tenantId: decoded.tenantId,
          isActive: true,
        },
        include: {
          kitchenOrders: {
            where: {
              status: { in: ['pending', 'preparing'] },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      return { success: true, stations };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch kitchen stations',
      });
    }
  });

  // Create kitchen station
  fastify.post<{ Body: z.infer<typeof createKitchenStationSchema> }>('/kitchen/stations', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = createKitchenStationSchema.parse(request.body);

      const station = await prisma.kitchenStation.create({
        data: {
          ...data,
          tenantId: decoded.tenantId,
        },
      });

      return { success: true, station };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to create kitchen station',
      });
    }
  });

  // Update kitchen station
  fastify.put<{ Params: { id: string }; Body: Partial<z.infer<typeof createKitchenStationSchema>> }>('/kitchen/stations/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const data = request.body;

      const station = await prisma.kitchenStation.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data,
      });

      return { success: true, station };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update kitchen station',
      });
    }
  });

  // Delete kitchen station
  fastify.delete<{ Params: { id: string } }>('/kitchen/stations/:id', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const station = await prisma.kitchenStation.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: { isActive: false },
      });

      return { success: true, station };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to delete kitchen station',
      });
    }
  });

  // ============================================
  // KITCHEN ORDERS
  // ============================================

  // Get all kitchen orders (for kitchen display)
  fastify.get('/kitchen/orders', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { status, stationId } = request.query as any;

      const where: any = {
        tenantId: decoded.tenantId,
      };

      if (status) {
        where.status = status;
      }

      if (stationId) {
        where.stationId = stationId;
      }

      const orders = await prisma.kitchenOrder.findMany({
        where,
        include: {
          order: {
            include: {
              table: true,
              items: {
                include: {
                  product: true,
                  modifiers: true,
                },
              },
            },
          },
          station: true,
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });

      return { success: true, orders };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch kitchen orders',
      });
    }
  });

  // Send order to kitchen (routes items to appropriate stations)
  fastify.post<{ Body: z.infer<typeof sendOrderToKitchenSchema> }>('/kitchen/send-order', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { orderId, notes } = sendOrderToKitchenSchema.parse(request.body);

      // Get order with items
      const order = await prisma.restaurantOrder.findFirst({
        where: {
          id: orderId,
          tenantId: decoded.tenantId,
        },
        include: {
          table: true,
          items: {
            include: {
              product: {
                include: {
                  category: {
                    include: {
                      categoryStations: {
                        include: {
                          station: true,
                        },
                      },
                    },
                  },
                },
              },
              modifiers: true,
            },
          },
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      // Group items by kitchen station
      const itemsByStation = new Map<string, any[]>();

      for (const item of order.items) {
        const category = item.product.category;
        if (!category) continue;

        const stations = category.categoryStations;
        if (stations.length === 0) continue;

        // Use first matching station (in production, you might want more complex routing)
        const stationId = stations[0].stationId;
        
        if (!itemsByStation.has(stationId)) {
          itemsByStation.set(stationId, []);
        }

        itemsByStation.get(stationId)!.push({
          orderItemId: item.id,
          productName: item.productName,
          quantity: item.quantity,
          course: item.course,
          seatNumber: item.seatNumber,
          notes: item.notes,
          modifiers: item.modifiers.map(m => ({
            name: m.modifierName,
            priceAdjustment: m.priceAdjustment,
          })),
        });
      }

      // Create kitchen orders for each station
      const kitchenOrders = await Promise.all(
        Array.from(itemsByStation.entries()).map(([stationId, items]) =>
          prisma.kitchenOrder.create({
            data: {
              tenantId: decoded.tenantId,
              orderId: order.id,
              stationId,
              orderNumber: order.orderNumber,
              tableNumber: order.table?.tableNumber || 'N/A',
              items: items as any,
              notes: notes || null,
              status: 'pending',
              priority: 0,
            },
            include: {
              station: true,
            },
          })
        )
      );

      // Update order status
      await prisma.restaurantOrder.update({
        where: { id: orderId },
        data: {
          status: 'sent_to_kitchen',
          sentToKitchenAt: new Date(),
        },
      });

      // Update order items status
      await prisma.restaurantOrderItem.updateMany({
        where: { orderId },
        data: {
          status: 'preparing',
          sentToKitchenAt: new Date(),
        },
      });

      return {
        success: true,
        kitchenOrders,
        message: `Order sent to ${kitchenOrders.length} station(s)`,
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send order to kitchen',
      });
    }
  });

  // Update kitchen order status
  fastify.patch<{ Params: { id: string }; Body: z.infer<typeof updateKitchenOrderStatusSchema> }>('/kitchen/orders/:id/status', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { status } = updateKitchenOrderStatusSchema.parse(request.body);

      const now = new Date();
      const updateData: any = { status };

      // Set timestamps based on status
      if (status === 'preparing' && !updateData.startedAt) {
        updateData.startedAt = now;
      } else if (status === 'ready' && !updateData.readyAt) {
        updateData.readyAt = now;
      } else if (status === 'served') {
        updateData.servedAt = now;
        updateData.completedAt = now;
      }

      const kitchenOrder = await prisma.kitchenOrder.update({
        where: {
          id: request.params.id,
          tenantId: decoded.tenantId,
        },
        data: updateData,
        include: {
          order: true,
          station: true,
        },
      });

      // If all kitchen orders for this order are completed, update the main order
      if (status === 'ready') {
        const allKitchenOrders = await prisma.kitchenOrder.findMany({
          where: {
            orderId: kitchenOrder.orderId,
          },
        });

        const allReady = allKitchenOrders.every(ko => ko.status === 'ready' || ko.status === 'served');

        if (allReady) {
          await prisma.restaurantOrder.update({
            where: { id: kitchenOrder.orderId },
            data: { status: 'ready' },
          });
        }
      }

      return { success: true, kitchenOrder };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to update kitchen order status',
      });
    }
  });

  // Bump order (mark as completed and remove from display)
  fastify.post<{ Body: z.infer<typeof bumpKitchenOrderSchema> }>('/kitchen/bump', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { kitchenOrderId } = bumpKitchenOrderSchema.parse(request.body);

      const kitchenOrder = await prisma.kitchenOrder.update({
        where: {
          id: kitchenOrderId,
          tenantId: decoded.tenantId,
        },
        data: {
          status: 'served',
          servedAt: new Date(),
          completedAt: new Date(),
        },
        include: {
          order: true,
        },
      });

      // Update order items
      const items = kitchenOrder.items as any[];
      const itemIds = items.map(i => i.orderItemId);

      await prisma.restaurantOrderItem.updateMany({
        where: {
          id: { in: itemIds },
        },
        data: {
          status: 'served',
          servedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Order bumped successfully',
      };
    } catch (error) {
      reply.status(400).send({
        success: false,
        error: 'Failed to bump order',
      });
    }
  });

  // Get kitchen display stats
  fastify.get('/kitchen/stats', async (request, reply) => {
    try {
      const decoded = request.user as any;

      const [pending, preparing, ready, avgPrepTime] = await Promise.all([
        prisma.kitchenOrder.count({
          where: {
            tenantId: decoded.tenantId,
            status: 'pending',
          },
        }),
        prisma.kitchenOrder.count({
          where: {
            tenantId: decoded.tenantId,
            status: 'preparing',
          },
        }),
        prisma.kitchenOrder.count({
          where: {
            tenantId: decoded.tenantId,
            status: 'ready',
          },
        }),
        prisma.kitchenOrder.findMany({
          where: {
            tenantId: decoded.tenantId,
            status: 'served',
            startedAt: { not: null },
            completedAt: { not: null },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        }),
      ]);

      // Calculate average prep time in minutes
      const prepTimes = avgPrepTime
        .filter(o => o.startedAt && o.completedAt)
        .map(o => (o.completedAt!.getTime() - o.startedAt!.getTime()) / 1000 / 60);

      const averagePrepTime = prepTimes.length > 0
        ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
        : 0;

      return {
        success: true,
        stats: {
          pending,
          preparing,
          ready,
          averagePrepTime,
          total: pending + preparing + ready,
        },
      };
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch kitchen stats',
      });
    }
  });

  // Create a demo order (for testing kitchen display)
  const createDemoOrderSchema = z.object({
    tableNumber: z.string(),
    notes: z.string().optional(),
    items: z.array(z.object({
      productName: z.string(),
      quantity: z.number().default(1),
      notes: z.string().optional(),
    })),
  });

  fastify.post<{ Body: z.infer<typeof createDemoOrderSchema> }>('/kitchen/demo-order', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { tableNumber, notes, items } = createDemoOrderSchema.parse(request.body);

      // Get or create a default station
      let station = await prisma.kitchenStation.findFirst({
        where: { tenantId: decoded.tenantId, isActive: true },
      });

      if (!station) {
        station = await prisma.kitchenStation.create({
          data: {
            tenantId: decoded.tenantId,
            name: 'Main Kitchen',
            stationType: 'grill',
            color: '#ef4444',
          },
        });
      }

      // Create or get a table
      let table = await prisma.restaurantTable.findFirst({
        where: { tenantId: decoded.tenantId, tableNumber },
      });

      if (!table) {
        table = await prisma.restaurantTable.create({
          data: {
            tenantId: decoded.tenantId,
            tableNumber,
            capacity: 4,
            status: 'occupied',
          },
        });
      }

      // Create restaurant order
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const order = await prisma.restaurantOrder.create({
        data: {
          tenantId: decoded.tenantId,
          orderNumber,
          tableId: table.id,
          orderType: 'dine_in',
          status: 'sent_to_kitchen',
          subtotal: 0,
          total: 0,
          sentToKitchenAt: new Date(),
        },
      });

      // Create kitchen order
      const kitchenOrder = await prisma.kitchenOrder.create({
        data: {
          tenantId: decoded.tenantId,
          orderId: order.id,
          stationId: station.id,
          orderNumber,
          tableNumber,
          items: items as any,
          notes: notes || null,
          status: 'pending',
          priority: 0,
        },
        include: {
          station: true,
        },
      });

      return {
        success: true,
        kitchenOrder,
        message: `Order ${orderNumber} sent to kitchen!`,
      };
    } catch (error) {
      console.error('Failed to create demo order:', error);
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create demo order',
      });
    }
  });

  // Create a REAL order (integrated with main system)
  const createOrderSchema = z.object({
    tableNumber: z.string(),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number().default(1),
      unitPrice: z.number(),
      notes: z.string().optional(),
    })),
  });

  fastify.post<{ Body: z.infer<typeof createOrderSchema> }>('/kitchen/create-order', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { tableNumber, notes, items } = createOrderSchema.parse(request.body);

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const taxRate = 0.20;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Get or create station
      let station = await prisma.kitchenStation.findFirst({
        where: { tenantId: decoded.tenantId, isActive: true },
      });

      if (!station) {
        station = await prisma.kitchenStation.create({
          data: {
            tenantId: decoded.tenantId,
            name: 'Main Kitchen',
            stationType: 'grill',
            color: '#ef4444',
          },
        });
      }

      // Get or create table
      let table = await prisma.restaurantTable.findFirst({
        where: { tenantId: decoded.tenantId, tableNumber },
      });

      if (!table) {
        table = await prisma.restaurantTable.create({
          data: {
            tenantId: decoded.tenantId,
            tableNumber,
            capacity: 4,
            status: 'occupied',
          },
        });
      } else {
        await prisma.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'occupied' },
        });
      }

      // Create restaurant order
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const order = await prisma.restaurantOrder.create({
        data: {
          tenantId: decoded.tenantId,
          orderNumber,
          tableId: table.id,
          orderType: 'dine_in',
          status: 'sent_to_kitchen',
          subtotal,
          taxAmount,
          total,
          sentToKitchenAt: new Date(),
        },
      });

      // Create restaurant order items
      for (const item of items) {
        await prisma.restaurantOrderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            notes: item.notes || null,
            status: 'pending',
            sentToKitchenAt: new Date(),
          },
        });
      }

      // Create kitchen order
      const kitchenOrder = await prisma.kitchenOrder.create({
        data: {
          tenantId: decoded.tenantId,
          orderId: order.id,
          stationId: station.id,
          orderNumber,
          tableNumber,
          items: items.map(i => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
          })) as any,
          notes: notes || null,
          status: 'pending',
          priority: 0,
        },
        include: {
          station: true,
        },
      });

      return {
        success: true,
        kitchenOrder,
        order: {
          id: order.id,
          orderNumber,
          total,
        },
        message: `Order ${orderNumber} sent to kitchen!`,
      };
    } catch (error) {
      console.error('Failed to create order:', error);
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  });

  // Complete order and create transaction (for dashboard/reports)
  fastify.post<{ Body: { kitchenOrderId: string; paymentMethod?: string } }>('/kitchen/complete-order', async (request, reply) => {
    try {
      const decoded = request.user as any;
      const { kitchenOrderId, paymentMethod = 'cash' } = request.body;

      // Get kitchen order with restaurant order
      const kitchenOrder = await prisma.kitchenOrder.findFirst({
        where: {
          id: kitchenOrderId,
          tenantId: decoded.tenantId,
        },
        include: {
          order: true,
        },
      });

      if (!kitchenOrder || !kitchenOrder.order) {
        return reply.status(404).send({ success: false, error: 'Order not found' });
      }

      const restaurantOrder = kitchenOrder.order;

      // Update kitchen order status
      await prisma.kitchenOrder.update({
        where: { id: kitchenOrderId },
        data: {
          status: 'served',
          servedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Update restaurant order
      await prisma.restaurantOrder.update({
        where: { id: restaurantOrder.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // Update table status
      if (restaurantOrder.tableId) {
        await prisma.restaurantTable.update({
          where: { id: restaurantOrder.tableId },
          data: { status: 'available' },
        });
      }

      // Create a REAL transaction for dashboard/reports
      const transactionNumber = `TXN-${Date.now().toString(36).toUpperCase()}`;
      const items = kitchenOrder.items as any[];
      
      const transaction = await prisma.transaction.create({
        data: {
          tenant: { connect: { id: decoded.tenantId } },
          user: { connect: { id: decoded.userId } },
          transactionNumber,
          status: 'completed',
          subtotal: Number(restaurantOrder.subtotal),
          taxAmount: Number(restaurantOrder.taxAmount),
          total: Number(restaurantOrder.total),
          notes: `Table ${kitchenOrder.tableNumber} - ${restaurantOrder.orderNumber}`,
          items: {
            create: items.map(item => ({
              product: { connect: { id: item.productId } },
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: 20,
              subtotal: item.unitPrice * item.quantity,
              total: item.unitPrice * item.quantity * 1.2,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        success: true,
        transaction,
        message: `Order completed! Transaction ${transactionNumber} created.`,
      };
    } catch (error) {
      console.error('Failed to complete order:', error);
      reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete order',
      });
    }
  });
}
